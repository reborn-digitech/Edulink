/**
 * A school may send INVITE_EMAILS_DAILY.limit invitation emails a day. The
 * batch ceiling (500) was the only one, and batches were unlimited; this is
 * the ceiling on the day, counted from the Invite rows the school created in
 * the last twenty-four hours, and a batch that would cross it is refused
 * whole and told how many are left.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { INVITE_EMAILS_DAILY } from "@/lib/rate-limit";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
import { __resetCookies } from "../tests/stubs/next-headers";
import { createInvites } from "@/app/(app)/admin/invites/actions";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";

beforeAll(async () => {
  process.env.EMAIL_TRANSPORT ??= "devbox";
  schoolId = (await db.school.create({ data: { name: `ZZ Invite Cap ${STAMP}`, slug: `zz-invcap-${STAMP}`, code: `ZIC${String(STAMP).slice(-5)}`, contactEmail: `zz-invcap-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  adminUserId = (await db.user.create({ data: { name: "ZZ Invite Cap Admin", email: `zz-invcap-admin-${STAMP}@test.invalid` }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  // The day so far: one short of the cap, sent by rows rather than by mail.
  await db.invite.createMany({
    data: Array.from({ length: INVITE_EMAILS_DAILY.limit - 1 }, (_, i) => ({
      schoolId,
      role: "TEACHER",
      email: `zz-invcap-${i}-${STAMP}@test.invalid`,
      tokenHash: `zz-invcap-${STAMP}-${i}`,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 86_400_000),
    })),
  });
  await createSession(adminUserId, { schoolId, role: "ADMIN" });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: adminUserId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: adminUserId } });
  await db.$disconnect();
});

describe("the daily invitation cap", () => {
  it("refuses a batch that would cross the day's cap, whole, and says how many are left", async () => {
    const two = await createInvites({ role: "TEACHER", csv: `zz-invcap-new-a-${STAMP}@test.invalid\nzz-invcap-new-b-${STAMP}@test.invalid` });
    expect(two.ok).toBe(false);
    expect(two.errorKey).toBe("invites.dailyCapReached");
    expect(two.errorVars).toMatchObject({ cap: INVITE_EMAILS_DAILY.limit, left: 1, count: 2 });
    expect(two.sent).toBe(0);
    expect(await db.invite.count({ where: { schoolId, email: { contains: "invcap-new" } } })).toBe(0);
  });

  it("sends the last one of the day, then refuses the 301st", async () => {
    const one = await createInvites({ role: "TEACHER", csv: `zz-invcap-new-a-${STAMP}@test.invalid` });
    expect(one.ok).toBe(true);
    expect(one.sent).toBe(1);
    const more = await createInvites({ role: "TEACHER", csv: `zz-invcap-new-b-${STAMP}@test.invalid` });
    expect(more.ok).toBe(false);
    expect(more.errorKey).toBe("invites.dailyCapReached");
    expect(more.errorVars).toMatchObject({ left: 0 });
    expect(await db.invite.count({ where: { schoolId } })).toBe(INVITE_EMAILS_DAILY.limit);
  });
});
