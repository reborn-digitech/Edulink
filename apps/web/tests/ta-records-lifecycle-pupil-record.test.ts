/**
 * The pupil record's save and its refusals: findings TA-378 and TA-602 of the
 * testing analysis of 13 November 2026, held by cases that FAIL while the
 * defect stands and pass once it is fixed.
 *
 *   TA-378  savePupilRecord put the first PEN on the account, audited, before
 *           it checked the rest of the record, so a save refused for a
 *           five-digit PIN still kept the number, which only the head and a
 *           guardian could change afterwards.
 *   TA-602  The pupil record, the family's ask and the PEN doors answered a
 *           refused VALUE (a five-digit PIN, a language off the list, a PEN of
 *           four digits, the same PEN proposed again) 403 FORBIDDEN, where a
 *           refused value is a 422 naming its field; 403 stays for a role.
 *
 * Two scratch ZZ schools of this suite's own (its stamp in every name and
 * address), made through the owner connection and removed in afterAll; the
 * doors are called with sessions minted for this suite's own people.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { savePupilRecord } from "@/lib/pupil-records";
import { POST as recordPost } from "@/app/api/v1/office/pupil-records/[membershipId]/route";
import { POST as penChangePost } from "@/app/api/v1/office/pupil-records/[membershipId]/pen-change/route";
import { GET as lookupGet } from "@/app/api/v1/office/pupils/by-pen/[pen]/route";
import { POST as familyChangePost } from "@/app/api/v1/family/record/changes/route";
import { ENDPOINTS } from "@/lib/api-catalog";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta-rl-record-${who}-${STAMP}@test.invalid`;
const PEN_NEW = `6${String(STAMP).slice(-10)}`;
const PEN_HELD = `5${String(STAMP).slice(-10)}`;
const ids: Record<string, string> = {};

const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });

async function as(who: "admin" | "principal" | "parent") {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, who === "parent" ? { schoolId: null, role: "PARENT" } : { schoolId: ids.school!, role: who === "admin" ? "ADMIN" : "PRINCIPAL" });
  const session = await getSession();
  if (!session) throw new Error(`no session for ${who}`);
  return session;
}

async function refusal(res: Response): Promise<{ status: number; issues: string[] }> {
  const body = (await res.json()) as { issues?: Record<string, string> };
  return { status: res.status, issues: Object.keys(body.issues ?? {}) };
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA-RL Record ${STAMP}`, slug: `zz-ta-rl-record-${STAMP}`, code: `ZZRLD${STAMP}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  for (const who of ["admin", "principal", "parent", "fresh", "held"]) {
    ids[who] = (await db.user.create({ data: { name: `ZZ RL ${who}`, email: MAIL(who), prefs: "{}", ...(who === "held" ? { penNumber: PEN_HELD } : {}) }, select: { id: true } })).id;
  }
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: ids.principal!, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" } });
  ids.freshM = (await db.membership.create({ data: { userId: ids.fresh!, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZRLF${STAMP}` }, select: { id: true } })).id;
  ids.heldM = (await db.membership.create({ data: { userId: ids.held!, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZRLH${STAMP}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: ids.parent!, studentMembershipId: ids.freshM, studentSchoolId: ids.school, relation: "PARENT", status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-378: nothing of a refused save is written", () => {
  it("TA-378: a first PEN with a five-digit PIN is refused for the PIN, and the account carries no PEN and no pen.set", async () => {
    const admin = await as("admin");
    let refused: unknown = null;
    try {
      await savePupilRecord(admin, ids.freshM!, { penNumber: PEN_NEW, postalCode: "41100" });
    } catch (error) {
      refused = error;
    }
    expect((refused as { key?: string } | null)?.key).toBe("pupilRecord.pinSixDigits");
    expect((await db.user.findUniqueOrThrow({ where: { id: ids.fresh }, select: { penNumber: true } })).penNumber).toBeNull();
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "pen.set", targetId: ids.freshM } })).toBe(0);
  });
});

describe("TA-602: a refused value is a 422 naming its field; a role is still a 403", () => {
  it("TA-602: the office's save answers a five-digit PIN and a language off the list 422 with the field", async () => {
    await as("admin");
    expect(await refusal(await recordPost(json(`/api/v1/office/pupil-records/${ids.freshM}`, { postalCode: "41100" }), params({ membershipId: ids.freshM! })))).toEqual({ status: 422, issues: ["postalCode"] });
    expect(await refusal(await recordPost(json(`/api/v1/office/pupil-records/${ids.freshM}`, { motherTongue: "Klingon" }), params({ membershipId: ids.freshM! })))).toEqual({ status: 422, issues: ["motherTongue"] });
    expect(await refusal(await recordPost(json(`/api/v1/office/pupil-records/${ids.freshM}`, { guardianPhone: "12" }), params({ membershipId: ids.freshM! })))).toEqual({ status: 422, issues: ["guardianPhone"] });
    expect(await refusal(await recordPost(json(`/api/v1/office/pupil-records/${ids.freshM}`, { penNumber: "1234" }), params({ membershipId: ids.freshM! })))).toEqual({ status: 422, issues: ["penNumber"] });
  });

  it("TA-602: the family's ask answers a five-digit PIN 422 with the field", async () => {
    await as("parent");
    expect(await refusal(await familyChangePost(json(`/api/v1/family/record/changes?childId=${ids.freshM}`, { changes: { postalCode: "41100" }, reason: "ZZ we moved" })))).toEqual({ status: 422, issues: ["postalCode"] });
  });

  it("TA-602: the PEN look-up and the PEN proposal answer a wrong value 422 with the field", async () => {
    await as("admin");
    expect(await refusal(await lookupGet(new Request("http://localhost/api/v1/office/pupils/by-pen/1234"), params({ pen: "1234" })))).toEqual({ status: 422, issues: ["pen"] });
    expect(await refusal(await penChangePost(json(`/api/v1/office/pupil-records/${ids.heldM}/pen-change`, { toPen: PEN_HELD, reason: "ZZ same" }), params({ membershipId: ids.heldM! })))).toEqual({ status: 422, issues: ["toPen"] });
  });

  it("TA-602: the catalog says the look-up answers a wrong PEN 422, not 403", () => {
    const door = ENDPOINTS.find((e) => e.method === "GET" && e.path === "/api/v1/office/pupils/by-pen/{pen}");
    expect(door?.summary).not.toMatch(/403/);
    expect(door?.summary).toMatch(/422/);
  });

  it("TA-602: the head writing a PEN is still refused 403: that is a role, not a value", async () => {
    await as("principal");
    expect((await recordPost(json(`/api/v1/office/pupil-records/${ids.freshM}`, { penNumber: PEN_NEW }), params({ membershipId: ids.freshM! }))).status).toBe(403);
  });
});
