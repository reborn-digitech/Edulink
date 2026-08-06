"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { generateToken, hashToken } from "@/lib/crypto";
import { parseInviteCsv } from "@/lib/csv";
import { sendTeacherInvite } from "@/lib/email";
import { audit } from "@/lib/audit";
import { INVITE_TTL_DAYS, SCHOOL_ROLES, type SchoolRole } from "@/lib/constants";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { InviteCsvResult } from "@/lib/csv";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type InviteOutcome = {
  email: string;
  name: string;
  status: "sent" | "skipped" | "failed";
  reasonKey?: TranslationKey;
};

/**
 * ⚠ TWO ERROR FIELDS, AND THE SPLIT IS HONEST RATHER THAN UNTIDY.
 *
 * `errorKey` is everything this action decides itself, returned as a key so the
 * form resolves it in the reader's language. `error` is the one case it cannot:
 * an `AccessError` thrown by the tenancy layer, whose `message` is an English
 * string minted app-wide and shared by every route. Collapsing them would mean
 * either pretending the AccessError is translated or dropping it on the floor.
 * When AccessError learns to carry a key, this field goes.
 */
export type CreateInvitesState = {
  ok: boolean;
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
  error?: string;
  outcomes: InviteOutcome[];
  problems: InviteCsvResult["problems"];
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
      return { ok: false, error: (await getT())(error.key, error.vars), outcomes: [], problems: [], sent: 0 };
    }
    throw error;
  }

  if (!SCHOOL_ROLES.includes(input.role as SchoolRole)) {
    return { ok: false, errorKey: "invites.unknownRole", outcomes: [], problems: [], sent: 0 };
  }
  const role = input.role as SchoolRole;

  const text = (input.csv ?? "").trim();
  if (!text) {
    return { ok: false, errorKey: "invites.needOneEmail", outcomes: [], problems: [], sent: 0 };
  }
  if (text.length > 500_000) {
    return { ok: false, errorKey: "invites.listTooLarge", outcomes: [], problems: [], sent: 0 };
  }

  const { valid, problems } = parseInviteCsv(text);
  if (valid.length === 0) {
    return {
      ok: false,
      errorKey: "invites.noUsableRows",
      outcomes: [],
      problems,
      sent: 0,
    };
  }
  if (valid.length > 500) {
    return {
      ok: false,
      errorKey: "invites.tooManyAtOnce",
      errorVars: { count: valid.length },
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
      return { ok: false, errorKey: "invites.classNotYours", outcomes: [], problems, sent: 0 };
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
        reasonKey: "invites.alreadyInSchool",
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
        reasonKey: "invites.alreadyInvited",
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
        reasonKey: "invites.couldNotSendRow",
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

export async function revokeInvite(
  inviteId: string,
): Promise<{ ok: boolean; error?: string; errorKey?: TranslationKey }> {
  try {
    const ctx = await requireApiRole("ADMIN");

    // Scoped update: an invite id from another school matches zero rows.
    const result = await db.invite.updateMany({
      where: { id: inviteId, schoolId: ctx.schoolId, status: "PENDING" },
      data: { status: "REVOKED" },
    });
    if (result.count === 0) return { ok: false, errorKey: "invites.notPending" };

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
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}

/** Issues a fresh token and emails it again. The old link stops working. */
export async function resendInvite(
  inviteId: string,
): Promise<{ ok: boolean; error?: string; errorKey?: TranslationKey }> {
  try {
    const ctx = await requireApiRole("ADMIN");

    const invite = await db.invite.findFirst({
      where: { id: inviteId, schoolId: ctx.schoolId, status: "PENDING" },
      include: { school: { select: { name: true } } },
    });
    if (!invite?.email) return { ok: false, errorKey: "invites.cannotResend" };

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
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}
