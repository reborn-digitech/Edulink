import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { acceptInvite } from "@/app/invite/[token]/actions";
import { generateToken, hashToken } from "@/lib/crypto";
import { expireInvites } from "@/lib/invites";

/**
 * What an invitation stops being able to do.
 *
 * Sending one is the covered half — the CSV import path is tested hard. The
 * revoking and resending half was written, wired to buttons, and never once
 * executed, which in this codebase has meant "quietly broken" four times now.
 *
 * The claims under test are the ones a school actually relies on:
 *
 *   * an invitation an admin withdrew cannot be used;
 *   * resending REPLACES the link, so the one in the first email — the one that
 *     might have gone to the wrong address, which is usually WHY it is being
 *     resent — stops working;
 *   * an expired link is refused and recorded as expired, not left PENDING.
 *
 * `acceptInvite` takes a raw token rather than a session, so it can be driven
 * directly. The admin actions that revoke and resend cannot: they call
 * `requireApiRole`, and the vitest stub for `next/headers` has no cookie jar to
 * put a session in. So the state changes are made here the way those actions
 * make them, and what is verified is the thing that matters — what the accept
 * path does when it meets that state.
 */

const db = new PrismaClient();
const PASSWORD = "sundial-copper-14-mist";

let schoolId: string;
const createdUserEmails: string[] = [];

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

async function cleanup() {
  await db.invite.deleteMany({ where: { email: { startsWith: "test-invite-" } } });
  const users = await db.user.findMany({
    where: { email: { startsWith: "test-invite-" } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length > 0) {
    await db.membership.deleteMany({ where: { userId: { in: ids } } });
    await db.session.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
  createdUserEmails.length = 0;
}

/** Creates a PENDING invite and returns the raw token the email would carry. */
async function invite(
  label: string,
  overrides: { status?: string; expiresAt?: Date } = {},
): Promise<{ id: string; token: string; email: string }> {
  const token = generateToken();
  const email = `test-invite-${label}@riverside.school`;
  const row = await db.invite.create({
    data: {
      schoolId,
      role: "TEACHER",
      email,
      tokenHash: hashToken(token),
      status: overrides.status ?? "PENDING",
      expiresAt: overrides.expiresAt ?? new Date(Date.now() + 14 * 86_400_000),
    },
  });
  createdUserEmails.push(email);
  return { id: row.id, token, email };
}

function accept(token: string, name = "Test Invitee") {
  return acceptInvite({ token, name, password: PASSWORD });
}

describe("an invitation that was withdrawn", () => {
  it("⚠ cannot be accepted after it is revoked", async () => {
    const { id, token } = await invite("revoked");

    // What revokeInvite does: PENDING -> REVOKED.
    await db.invite.updateMany({
      where: { id, schoolId, status: "PENDING" },
      data: { status: "REVOKED" },
    });

    const result = await accept(token);
    expect(result.ok).toBe(false);
    expect(result.errors._form).toMatch(/no longer valid/i);

    // And nothing was created for them.
    const user = await db.user.findUnique({ where: { email: `test-invite-revoked@riverside.school` } });
    expect(user).toBeNull();
  });

  it("says the same thing as a forged token, so neither confirms the other exists", async () => {
    const { id, token } = await invite("revoked-wording");
    await db.invite.updateMany({ where: { id }, data: { status: "REVOKED" } });

    const revoked = await accept(token);
    const forged = await accept(generateToken());

    expect(revoked.errors._form).toBe(forged.errors._form);
  });
});

describe("resending", () => {
  it("⚠ kills the previous link", async () => {
    const first = await invite("resent");

    // What resendInvite does: same row, brand new token.
    const second = generateToken();
    await db.invite.update({
      where: { id: first.id },
      data: { tokenHash: hashToken(second), expiresAt: new Date(Date.now() + 14 * 86_400_000) },
    });

    // The first email is usually resent BECAUSE it went somewhere wrong. If the
    // old link still worked, resending would widen the hole instead of closing it.
    const old = await accept(first.token);
    expect(old.ok).toBe(false);
    expect(old.errors._form).toMatch(/no longer valid/i);
  });

  it("the new link works, once", async () => {
    const first = await invite("resent-twice");
    const second = generateToken();
    await db.invite.update({
      where: { id: first.id },
      data: { tokenHash: hashToken(second) },
    });

    const accepted = await accept(second, "Resent Teacher");
    expect(accepted.ok).toBe(true);

    // Single use: the same link again is refused.
    const again = await accept(second, "Resent Teacher");
    expect(again.ok).toBe(false);

    const row = await db.invite.findUniqueOrThrow({ where: { id: first.id } });
    expect(row.status).toBe("ACCEPTED");
    expect(row.acceptedAt).not.toBeNull();
  });
});

describe("expiry", () => {
  it("⚠ refuses an expired link and records it as expired", async () => {
    const { id, token } = await invite("expired", {
      expiresAt: new Date(Date.now() - 60_000),
    });

    const result = await accept(token);
    expect(result.ok).toBe(false);
    expect(result.errors._form).toMatch(/expired/i);

    // Left PENDING, it would keep showing in the admin list as outstanding.
    const row = await db.invite.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe("EXPIRED");
  });

  it("⚠ the nightly job marks every lapsed invitation nobody followed, counts it per school, and leaves the live ones alone", async () => {
    const lapsed = await invite("lapsed-nightly", { expiresAt: new Date(Date.now() - 3_600_000) });
    const live = await invite("live-nightly");
    const out = await expireInvites();
    expect(out.expired).toBeGreaterThanOrEqual(1);
    expect(out.perSchool[schoolId]?.invitesExpired).toBeGreaterThanOrEqual(1);
    expect((await db.invite.findUniqueOrThrow({ where: { id: lapsed.id } })).status).toBe("EXPIRED");
    expect((await db.invite.findUniqueOrThrow({ where: { id: live.id } })).status).toBe("PENDING");
    // Nothing left to do: the second run reports nothing for this school.
    expect((await expireInvites()).perSchool[schoolId]).toBeUndefined();
  });
});
