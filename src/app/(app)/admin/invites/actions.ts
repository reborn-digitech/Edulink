"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { generateToken, hashToken } from "@/lib/crypto";
import { parseInviteCsv } from "@/lib/csv";
import { sendTeacherInvite } from "@/lib/email";
import { audit } from "@/lib/audit";
import { INVITE_TTL_DAYS, SCHOOL_ROLES, type SchoolRole } from "@/lib/constants";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type InviteOutcome = {
  email: string;
  name: string;
  status: "sent" | "skipped" | "failed";
  reason?: string;
};

export type CreateInvitesState = {
  ok: boolean;
  error?: string;
  outcomes: InviteOutcome[];
  problems: { line: number; value: string; reason: string }[];
  sent: number;
};

/**
 * Creates invitations from a pasted list or CSV.
 *
 * Reports every row's fate. A bulk import that says "42 invitations sent" while
 * quietly dropping 3 malformed rows is how a school discovers in September that
 * a teacher was never invited. (§5, §13 silent scope shrink)
 */
export async function createInvites(input: {
  role: string;
  csv: string;
  classId?: string;
}): Promise<CreateInvitesState> {
  let ctx;
  try {
    ctx = await requireApiRole("ADMIN");
  } catch (error) {
    if (error instanceof AccessError) {
      return { ok: false, error: error.message, outcomes: [], problems: [], sent: 0 };
    }
    throw error;
  }

  if (!SCHOOL_ROLES.includes(input.role as SchoolRole)) {
    return { ok: false, error: "Unknown role.", outcomes: [], problems: [], sent: 0 };
  }
  const role = input.role as SchoolRole;

  const text = (input.csv ?? "").trim();
  if (!text) {
    return { ok: false, error: "Add at least one email address.", outcomes: [], problems: [], sent: 0 };
  }
  if (text.length > 500_000) {
    return { ok: false, error: "That list is too large. Split it into smaller batches.", outcomes: [], problems: [], sent: 0 };
  }

  const { valid, problems } = parseInviteCsv(text);
  if (valid.length === 0) {
    return {
      ok: false,
      error: "None of those rows had a usable email address.",
      outcomes: [],
      problems,
      sent: 0,
    };
  }
  if (valid.length > 500) {
    return {
      ok: false,
      error: `That is ${valid.length} invitations at once. Please do 500 or fewer per batch.`,
      outcomes: [],
      problems,
      sent: 0,
    };
  }

  // If a class was chosen, confirm it belongs to this school before storing it
  // on invites — the id came from a form.
  let classId: string | null = null;
  if (input.classId) {
    const klass = await db.class.findFirst({
      where: { id: input.classId, schoolId: ctx.schoolId, archivedAt: null },
      select: { id: true },
    });
    if (!klass) {
      return { ok: false, error: "That class is not in your school.", outcomes: [], problems, sent: 0 };
    }
    classId = klass.id;
  }

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { name: true },
  });
  const inviterName = ctx.user.preferredName ?? ctx.user.name;

  const outcomes: InviteOutcome[] = [];
  let sent = 0;

  for (const row of valid) {
    // Already a member? Skipping is right, but it must be SAID.
    const existingMember = await db.membership.findFirst({
      where: {
        schoolId: ctx.schoolId,
        role,
        status: { in: ["ACTIVE", "PENDING"] },
        user: { email: row.email },
      },
      select: { id: true },
    });
    if (existingMember) {
      outcomes.push({
        email: row.email,
        name: row.name,
        status: "skipped",
        reason: "Already in your school with this role",
      });
      continue;
    }

    const pending = await db.invite.findFirst({
      where: { schoolId: ctx.schoolId, email: row.email, role, status: "PENDING" },
      select: { id: true },
    });
    if (pending) {
      outcomes.push({
        email: row.email,
        name: row.name,
        status: "skipped",
        reason: "An invitation is already waiting for them",
      });
      continue;
    }

    const token = generateToken();
    try {
      await db.invite.create({
        data: {
          schoolId: ctx.schoolId,
          role,
          email: row.email,
          name: row.name || null,
          classId,
          subjects: row.subjects.length > 0 ? JSON.stringify(row.subjects) : null,
          tokenHash: hashToken(token),
          createdByMembershipId: ctx.membershipId,
          expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
        },
      });

      await sendTeacherInvite(
        row.email,
        `${APP_URL}/invite/${token}`,
        school.name,
        inviterName,
      );

      outcomes.push({ email: row.email, name: row.name, status: "sent" });
      sent++;
    } catch (error) {
      // One bad address must not abort the other 199.
      console.error("[createInvites] failed for", row.email, error);
      outcomes.push({
        email: row.email,
        name: row.name,
        status: "failed",
        reason: "We could not send this one. Try again.",
      });
    }
  }

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "invite.create",
    meta: { role, requested: valid.length, sent, skipped: outcomes.length - sent },
  });

  revalidatePath("/admin/invites");
  revalidatePath("/admin");

  return { ok: true, outcomes, problems, sent };
}

export async function revokeInvite(inviteId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN");

    // Scoped update: an invite id from another school matches zero rows.
    const result = await db.invite.updateMany({
      where: { id: inviteId, schoolId: ctx.schoolId, status: "PENDING" },
      data: { status: "REVOKED" },
    });
    if (result.count === 0) return { ok: false, error: "That invitation is no longer pending." };

    await audit({
      schoolId: ctx.schoolId,
      actorUserId: ctx.user.id,
      action: "invite.revoke",
      targetType: "Invite",
      targetId: inviteId,
    });

    revalidatePath("/admin/invites");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    return { ok: false, error: "Something went wrong." };
  }
}

/** Issues a fresh token and emails it again. The old link stops working. */
export async function resendInvite(
  inviteId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN");

    const invite = await db.invite.findFirst({
      where: { id: inviteId, schoolId: ctx.schoolId, status: "PENDING" },
      include: { school: { select: { name: true } } },
    });
    if (!invite?.email) return { ok: false, error: "That invitation cannot be resent." };

    const token = generateToken();
    await db.invite.update({
      where: { id: invite.id },
      data: {
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
      },
    });

    await sendTeacherInvite(
      invite.email,
      `${APP_URL}/invite/${token}`,
      invite.school.name,
      ctx.user.preferredName ?? ctx.user.name,
    );

    await audit({
      schoolId: ctx.schoolId,
      actorUserId: ctx.user.id,
      action: "invite.resend",
      targetType: "Invite",
      targetId: invite.id,
    });

    revalidatePath("/admin/invites");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    return { ok: false, error: "Something went wrong." };
  }
}
