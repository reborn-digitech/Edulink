import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { inviteAdmin } from "@/lib/superuser";
import type { ActiveContext } from "@/lib/session";

/**
 * The operator's invitation, two things it must not do and one it must.
 *
 * An invitation is the one door into a school's admin seat the operator holds
 * the key to — `superuser.ts` refuses to mint a membership precisely so the
 * operator cannot give themselves one. Addressing the invitation to their own
 * account was the same thing in two clicks, so it is refused by address. And
 * the row that records the invitation was written with no school, so the
 * school being handed a new administrator could not see it in its own Safety
 * Centre; it is now written there as well.
 */

const db = new PrismaClient();
const SUFFIX = "@zzsuinvite.test";
const SLUG = "zz-superuser-invite-school";
const OPERATOR_EMAIL = `operator${SUFFIX}`;

let schoolId: string;
let operator: ActiveContext;

beforeAll(async () => {
  await db.school.deleteMany({ where: { slug: SLUG } });
  await db.user.deleteMany({ where: { email: { endsWith: SUFFIX } } });
  schoolId = (
    await db.school.create({
      data: { name: "ZZ Invite School", slug: SLUG, code: "ZZSUIN", contactEmail: `office${SUFFIX}` },
      select: { id: true },
    })
  ).id;
  const op = await db.user.create({
    data: { email: OPERATOR_EMAIL, name: "The Operator", isSuperuser: true, prefs: "{}" },
    select: { id: true },
  });
  operator = {
    sessionId: "test-session",
    membershipId: null,
    schoolId: null,
    role: null,
    user: {
      id: op.id,
      name: "The Operator",
      preferredName: null,
      email: OPERATOR_EMAIL,
      avatarKey: null,
      isMinor: false,
      isSuperuser: true,
      isAppAdmin: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
});

beforeEach(async () => {
  await db.invite.deleteMany({ where: { schoolId } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId }, { actorUserId: operator.user.id }] } });
});

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { actorUserId: operator.user.id } });
  await db.school.deleteMany({ where: { slug: SLUG } });
  await db.user.deleteMany({ where: { email: { endsWith: SUFFIX } } });
  await db.$disconnect();
});

describe("inviteAdmin", () => {
  it("⚠ refuses an invitation addressed to the operator's own account, however it is spelled", async () => {
    for (const email of [OPERATOR_EMAIL, `  ${OPERATOR_EMAIL.toUpperCase()} `]) {
      const result = await inviteAdmin(operator, schoolId, { email });
      expect(result.ok, email).toBe(false);
    }
    expect(await db.invite.count({ where: { schoolId } })).toBe(0);
    expect(await db.auditLog.count({ where: { action: "superuser.invite.admin", actorUserId: operator.user.id } })).toBe(0);
  });

  it("⚠ audits an invitation against the school as well as unattributed", async () => {
    const result = await inviteAdmin(operator, schoolId, { email: `head${SUFFIX}`, role: "PRINCIPAL" });
    expect(result.ok).toBe(true);

    const rows = await db.auditLog.findMany({
      where: { action: "superuser.invite.admin", actorUserId: operator.user.id },
      select: { schoolId: true, meta: true },
    });
    expect(rows.map((r) => r.schoolId).sort()).toEqual([null, schoolId].sort());
    const bound = rows.find((r) => r.schoolId === schoolId)!;
    expect(JSON.parse(bound.meta)).toEqual({ email: `head${SUFFIX}`, role: "PRINCIPAL" });
  });
});
