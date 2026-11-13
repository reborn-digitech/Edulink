/**
 * Guardian claims, two findings of the testing analysis of 13 November 2026.
 *
 * TA-558 (Low): claimChildFor checked only the target membership and the
 * birthday, and fileClaim neither the claimant's memberships nor that the
 * claimant was the child, so a pupil's account could file a guardian claim on
 * a classmate (whose code and birthday a classmate may well know) or on
 * itself, and it reached the office's urgent queue as an ordinary claim. Now
 * an account that is on a roll as a pupil is answered the generic mismatch
 * sentence, with the same padding, and nothing is filed: the mirror of a
 * guardian's account being refused as a pupil (join.ts).
 *
 * TA-365 (Low, Privacy): the claim queue gave a deciding family guardian the
 * claimant's sign-in address, which the field's own comment gives the office
 * as its reader. Between separated parents that hands one adult's address to
 * another private person. The office's queue keeps it; a guardian's has none.
 *
 * One ZZ school of this suite's own, made through the owner connection and
 * removed afterwards with everything under it and the people made here.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { claimChildFor } from "@/lib/claim-child";
import { waitingClaimsForGuardian, waitingClaimsForOffice } from "@/lib/guardian-claims";
import { translator } from "@/lib/i18n/dictionary";
import { GET as joinsGet } from "@/app/api/v1/shared/joins/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-tapia-claims-${who}-${STAMP}@test.invalid`;
const BORN = "2015-06-15";
const t = translator("en");
const ids: Record<string, string> = {};
const codes: Record<string, string> = {};

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, role === "PARENT" || role === "NONE" ? { schoolId: null, role: role === "PARENT" ? "PARENT" : null } : { schoolId: ids.school!, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TAPIA Claims ${STAMP}`, slug: `zz-tapia-claims-${STAMP}`, code: `ZPC${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const user = async (who: string, extra: { birthdate?: Date; isMinor?: boolean } = {}) => {
    ids[who] = (await db.user.create({ data: { name: `ZZ TAPIA ${who}`, email: MAIL(who), prefs: "{}", ...extra }, select: { id: true } })).id;
  };
  const pupil = async (who: string) => {
    await user(who, { birthdate: new Date(`${BORN}T00:00:00Z`), isMinor: true });
    codes[who] = `STU-ZZPC-${String(STAMP).slice(-6)}-${who.toUpperCase()}`;
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE", studentCode: codes[who] }, select: { id: true } })).id;
  };
  await user("admin");
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school!, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  await pupil("child");
  await pupil("classmate");
  await user("guardian");
  await db.guardianship.create({ data: { parentUserId: ids.guardian!, studentMembershipId: ids.childM!, studentSchoolId: ids.school!, relation: "PARENT", status: "ACTIVE" } });
  await user("claimant");
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { startsWith: "zz-tapia-claims-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.rateLimit.deleteMany({ where: { OR: [...userIds.map((id) => ({ bucket: `claim:user:${id}` })), ...Object.values(codes).map((code) => ({ bucket: `claim:code:${code}` }))] } });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.guardianClaim.deleteMany({ where: { schoolId: ids.school } });
    await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school } });
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-558: a pupil's account cannot claim to be a guardian", () => {
  it("TA-558: a classmate's right code and birthday are answered the generic sentence, and no claim is filed", async () => {
    const result = await claimChildFor(await as("classmate", "STUDENT"), { studentCode: codes.child, birthdate: BORN, relation: "PARENT" }, t);
    expect(result).toMatchObject({ ok: false, errors: { _form: t("join.claimMismatch") } });
    expect(await db.guardianClaim.count({ where: { claimantUserId: ids.classmate! } })).toBe(0);
  });

  it("TA-558: the pupil's own code and birthday are answered the same, and no claim is filed", async () => {
    const result = await claimChildFor(await as("child", "STUDENT"), { studentCode: codes.child, birthdate: BORN, relation: "PARENT" }, t);
    expect(result).toMatchObject({ ok: false, errors: { _form: t("join.claimMismatch") } });
    expect(await db.guardianClaim.count({ where: { claimantUserId: ids.child! } })).toBe(0);
  });

  it("TA-558: an account with no pupil's place still files its claim (unchanged)", async () => {
    const result = await claimChildFor(await as("claimant", "NONE"), { studentCode: codes.child, birthdate: BORN, relation: "PARENT" }, t);
    expect(result).toMatchObject({ ok: true });
    expect(await db.guardianClaim.count({ where: { claimantUserId: ids.claimant!, status: "PENDING" } })).toBe(1);
  });
});

describe("TA-365: a guardian deciding a claim is not shown the claimant's address", () => {
  it("TA-365: the guardian's queue carries the claimant's name and no address", async () => {
    const mine = await waitingClaimsForGuardian(ids.guardian!);
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ claimantName: "ZZ TAPIA claimant", claimantEmail: null });
  });

  it("TA-365: GET /api/v1/shared/joins in the guardian's session carries no address", async () => {
    await as("guardian", "PARENT");
    __setHeaders({ "x-edulink-route": "GET /api/v1/shared/joins" });
    const res = await joinsGet();
    expect(res.status).toBe(200);
    const body = JSON.stringify(await res.json());
    expect(body).toContain("ZZ TAPIA claimant");
    expect(body).not.toContain(MAIL("claimant"));
  });

  it("TA-365: the office's queue still carries the address it rings the family on", async () => {
    const office = await waitingClaimsForOffice(await as("admin", "ADMIN"));
    expect(office.find((c) => c.claimantName === "ZZ TAPIA claimant")?.claimantEmail).toBe(MAIL("claimant"));
  });
});
