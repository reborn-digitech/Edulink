import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { pendingInvitesFor } from "@/lib/my-invites";

/**
 * The invitations /join offers a signed-in person: their own VERIFIED
 * address's PENDING, unexpired ones — nothing for the unverified, the
 * handle-only, or the expired. (The row policy itself is proven under the
 * app role in rls:verify; this covers the helper's own filters.)
 */

const db = new PrismaClient();
const EMAILS = ["zz.myinv.v@riverside.test", "zz.myinv.unv@riverside.test"];
let schoolId: string;
let verified: string;
let unverified: string;

beforeAll(async () => {
  schoolId = (await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } })).id;
  await db.invite.deleteMany({ where: { email: { in: EMAILS } } });
  await db.user.deleteMany({ where: { email: { in: EMAILS } } });
  verified = (await db.user.create({ data: { email: EMAILS[0]!, name: "ZZ MyInv V", prefs: "{}", emailVerifiedAt: new Date() } })).id;
  unverified = (await db.user.create({ data: { email: EMAILS[1]!, name: "ZZ MyInv U", prefs: "{}" } })).id;
  await db.invite.createMany({
    data: [
      { schoolId, role: "TEACHER", email: EMAILS[0]!, tokenHash: "zz-myinv-1", expiresAt: new Date(Date.now() + 86_400_000) },
      { schoolId, role: "TEACHER", email: EMAILS[0]!, tokenHash: "zz-myinv-2", expiresAt: new Date(Date.now() - 86_400_000) }, // expired
      { schoolId, role: "TEACHER", email: EMAILS[1]!, tokenHash: "zz-myinv-3", expiresAt: new Date(Date.now() + 86_400_000) },
    ],
  });
});

afterAll(async () => {
  await db.invite.deleteMany({ where: { email: { in: EMAILS } } });
  await db.user.deleteMany({ where: { email: { in: EMAILS } } });
  await db.$disconnect();
});

describe("pendingInvitesFor", () => {
  it("⚠ lists the verified address's pending, unexpired invitations with the school's name — and nothing else", async () => {
    const mine = await pendingInvitesFor(verified);
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ role: "TEACHER", schoolName: "Riverside Primary School" });
    expect(await pendingInvitesFor(unverified)).toEqual([]);
    expect(await pendingInvitesFor("no-such-user")).toEqual([]);
  });
});
