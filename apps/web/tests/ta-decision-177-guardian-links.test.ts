/**
 * The office ends a family guardian's link (TA-177, testing analysis of 13 November 2026; the owner's decision of
 * 14 November 2026, option 1).
 *
 * Every ending of a guardianship was the school's stand-in's, except unlinkChild, which only the guardian may call,
 * so when the school learned a link was wrong, or was handed a court order against a parent, nobody at the school
 * (nor the operator) could end it; and a family guardian's yes to another account's claim made a guardian without
 * the office ever hearing of it. Now the office (an ADMIN) ends a family guardian's link to a pupil on its roll for a
 * coded reason (a court order, the wrong person, the family's request, another reason), audited in the same
 * transaction, the head told each time with the reason, the guardian told only that the link has ended and to
 * contact the office, the other guardians told, and the school's stand-in synced when no family guardian is left;
 * and the office is told whenever a guardian approves another guardian's claim, which still does not wait for it.
 *
 * One ZZ school of this suite's own (and a second for the cross-school case), made through the owner connection and
 * removed afterwards with everything under them and the people made here.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { assertGuardianAccess } from "@/lib/tenancy";
import { endFamilyGuardianship, familyGuardiansOf } from "@/lib/guardianship";
import { decideClaim } from "@/lib/guardian-claims";
import { GET as guardiansGet } from "@/app/api/v1/admin/people/[membershipId]/guardians/route";
import { POST as guardianEndPost } from "@/app/api/v1/admin/people/[membershipId]/guardians/[guardianshipId]/end/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tad177-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

async function as(who: string, role: "ADMIN" | "PRINCIPAL" | "PARENT", school = ids.school!): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, role === "PARENT" ? { schoolId: null, role: "PARENT" } : { schoolId: school, role });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}

async function link(guardian: string, pupilM: string, relation = "PARENT"): Promise<string> {
  return (await db.guardianship.create({ data: { parentUserId: ids[guardian]!, studentMembershipId: ids[pupilM]!, studentSchoolId: ids.school!, relation, status: "ACTIVE" }, select: { id: true } })).id;
}

async function notices(who: string) {
  return db.notification.findMany({ where: { userId: ids[who]! }, select: { titleKey: true, bodyKey: true, title: true, body: true, url: true }, orderBy: { createdAt: "asc" } });
}

async function endDoor(pupilM: string, guardianshipId: string, body: unknown): Promise<Response> {
  const path = `/api/v1/admin/people/${pupilM}/guardians/${guardianshipId}/end`;
  __resetCookies();
  __setHeaders({ "x-edulink-route": `POST ${path}` });
  await createSession(ids.admin!, { schoolId: ids.school!, role: "ADMIN" });
  return guardianEndPost(new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ membershipId: pupilM, guardianshipId }) });
}

beforeAll(async () => {
  process.env.EMAIL_TRANSPORT ??= "devbox";
  const school = async (key: string, n: string) =>
    (ids[key] = (
      await db.school.create({
        data: { name: `ZZ TAD177 ${n} ${STAMP}`, slug: `zz-tad177-${n.toLowerCase()}-${STAMP}`, code: `Z7${n[0]}${SUFFIX}`, contactEmail: MAIL(`contact-${n}`), timezone: "Asia/Kolkata", isTestFixture: true },
        select: { id: true },
      })
    ).id);
  await school("school", "Main");
  await school("other", "Other");
  const user = async (who: string) => {
    ids[who] = (await db.user.create({ data: { name: `ZZ TAD177 ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
  };
  const member = async (who: string, role: string, school = ids.school!) => {
    await user(who);
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: school, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `STU-Z7-${SUFFIX}-${who.toUpperCase()}` } : {}) }, select: { id: true } })).id;
  };
  await member("admin", "ADMIN");
  await member("head", "PRINCIPAL");
  await member("otherAdmin", "ADMIN", ids.other!);
  await member("pupil", "STUDENT");
  await member("lone", "STUDENT");
  await member("claimed", "STUDENT");
  for (const who of ["guardianA", "guardianB", "loneParent", "claimParent", "claimant"]) await user(who);
  ids.linkA = await link("guardianA", "pupilM");
  ids.linkB = await link("guardianB", "pupilM", "GUARDIAN");
  ids.linkLone = await link("loneParent", "loneM");
  await link("claimParent", "claimedM");
  ids.claim = (await db.guardianClaim.create({ data: { schoolId: ids.school!, studentMembershipId: ids.claimedM!, claimantUserId: ids.claimant!, relation: "GUARDIAN" }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { startsWith: "zz-tad177-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  const schools = [ids.school, ids.other].filter((x): x is string => Boolean(x));
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.guardianClaim.deleteMany({ where: { schoolId: { in: schools } } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: { in: schools } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: { in: userIds } }] } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-177: the office ends a family guardian's link", () => {
  it("TA-177: the office reads the pupil's family guardians, and not the school's stand-in", async () => {
    const rows = await familyGuardiansOf(await as("admin", "ADMIN"), ids.pupilM!);
    expect(rows.map((r) => r.guardianshipId).sort()).toEqual([ids.linkA, ids.linkB].sort());
    expect(rows.find((r) => r.guardianshipId === ids.linkB)).toMatchObject({ name: "ZZ TAD177 guardianB", relation: "GUARDIAN" });
  });

  it("TA-177: a reason that is not one of the four codes is refused and the link stands", async () => {
    const result = await endFamilyGuardianship(await as("admin", "ADMIN"), ids.pupilM!, ids.linkB!, "BECAUSE");
    expect(result).toEqual({ ok: false, errorKey: "people.familyLinkChooseReason" });
    expect((await db.guardianship.findUniqueOrThrow({ where: { id: ids.linkB! } })).status).toBe("ACTIVE");
  });

  it("TA-177: the head, another school's admin, and a stand-in row are refused, and nothing changes", async () => {
    await expect(endFamilyGuardianship(await as("head", "PRINCIPAL"), ids.pupilM!, ids.linkB!, "COURT_ORDER")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(endFamilyGuardianship(await as("otherAdmin", "ADMIN", ids.other!), ids.pupilM!, ids.linkB!, "COURT_ORDER")).rejects.toMatchObject({ code: "NOT_FOUND" });
    // A guardianship of another pupil, named under this one, is not this pupil's link.
    await expect(endFamilyGuardianship(await as("admin", "ADMIN"), ids.pupilM!, ids.linkLone!, "COURT_ORDER")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await db.guardianship.count({ where: { id: { in: [ids.linkB!, ids.linkLone!] }, status: "ACTIVE" } })).toBe(2);
  });

  it("TA-177: the admin ends guardian B's link for a court order: B is out, A untouched, the audit row holds the code", async () => {
    const result = await endFamilyGuardianship(await as("admin", "ADMIN"), ids.pupilM!, ids.linkB!, "COURT_ORDER");
    expect(result).toEqual({ ok: true, ended: true, schoolStandsIn: false });
    await expect(assertGuardianAccess(ids.guardianB!, ids.pupilM!)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(assertGuardianAccess(ids.guardianA!, ids.pupilM!)).resolves.toBeTruthy();
    const row = await db.auditLog.findFirstOrThrow({ where: { schoolId: ids.school!, action: "guardianship.end", targetId: ids.pupilM! } });
    expect(row.actorUserId).toBe(ids.admin);
    expect(JSON.parse(String(row.meta))).toEqual({ guardianshipId: ids.linkB, guardianUserId: ids.guardianB, relation: "GUARDIAN", reason: "COURT_ORDER" });
    // No stand-in while guardian A is linked.
    expect(await db.guardianship.count({ where: { studentMembershipId: ids.pupilM!, relation: "SCHOOL", status: "ACTIVE" } })).toBe(0);
  });

  it("TA-177: B is told only that the link ended and to contact the office; A and the head are told, the head with the reason", async () => {
    const toB = await notices("guardianB");
    expect(toB).toHaveLength(1);
    expect(toB[0]).toMatchObject({ titleKey: "notifTitle.guardianLinkEnded", bodyKey: "notifBody.guardianLinkEnded" });
    expect(`${toB[0]!.title} ${toB[0]!.body}`.toLowerCase()).not.toContain("court");
    const toA = await notices("guardianA");
    expect(toA.map((n) => n.titleKey)).toEqual(["notifTitle.coGuardianLinkEnded"]);
    expect(toA[0]!.title).toContain("ZZ TAD177 guardianB");
    const toHead = await notices("head");
    expect(toHead.map((n) => [n.titleKey, n.bodyKey])).toEqual([["notifTitle.headGuardianLinkEnded", "notifBody.headGuardianLinkEndedCourtOrder"]]);
  });

  it("TA-177: ending the link again changes nothing and tells nobody again", async () => {
    const result = await endFamilyGuardianship(await as("admin", "ADMIN"), ids.pupilM!, ids.linkB!, "COURT_ORDER");
    expect(result).toEqual({ ok: true, ended: false, schoolStandsIn: false });
    expect(await db.auditLog.count({ where: { schoolId: ids.school!, action: "guardianship.end", targetId: ids.pupilM! } })).toBe(1);
    expect(await notices("guardianB")).toHaveLength(1);
  });

  it("TA-177: with no family guardian left the school's stand-in is granted", async () => {
    const result = await endFamilyGuardianship(await as("admin", "ADMIN"), ids.loneM!, ids.linkLone!, "WRONG_PERSON");
    expect(result).toEqual({ ok: true, ended: true, schoolStandsIn: true });
    const standin = await db.guardianship.findFirst({ where: { studentMembershipId: ids.loneM!, relation: "SCHOOL", status: "ACTIVE" }, select: { parentUserId: true } });
    expect(standin?.parentUserId).toBe(ids.admin);
    // The stand-in is not a family link, so it cannot be ended here.
    const standinRow = await db.guardianship.findFirstOrThrow({ where: { studentMembershipId: ids.loneM!, relation: "SCHOOL" }, select: { id: true } });
    await expect(endFamilyGuardianship(await as("admin", "ADMIN"), ids.loneM!, standinRow.id, "OTHER")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await notices("head")).map((n) => n.bodyKey)).toContain("notifBody.headGuardianLinkEndedWrongPerson");
  });

  it("TA-177: the doors: GET lists the family's links; POST refuses an empty body 422 and ends a link 200", async () => {
    const path = `/api/v1/admin/people/${ids.pupilM}/guardians`;
    __resetCookies();
    __setHeaders({ "x-edulink-route": `GET ${path}` });
    await createSession(ids.admin!, { schoolId: ids.school!, role: "ADMIN" });
    const listed = await guardiansGet(new Request(`http://localhost${path}`), { params: Promise.resolve({ membershipId: ids.pupilM! }) });
    expect(listed.status).toBe(200);
    const list = (await listed.json()) as { guardians: { guardianshipId: string }[] };
    expect(list.guardians.map((g) => g.guardianshipId)).toEqual([ids.linkA]);

    expect((await endDoor(ids.pupilM!, ids.linkA!, {})).status).toBe(422);
    expect((await db.guardianship.findUniqueOrThrow({ where: { id: ids.linkA! } })).status).toBe("ACTIVE");
    const res = await endDoor(ids.pupilM!, ids.linkA!, { reason: "FAMILY_REQUEST" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ended: true, schoolStandsIn: true });
    expect((await endDoor(ids.pupilM!, "zz-no-such-guardianship", { reason: "OTHER" })).status).toBe(404);
  });
});

describe("TA-177: the office is told when a guardian approves another guardian's claim", () => {
  it("TA-177: the guardian's yes makes the link at once, and the office (admin and head) is told", async () => {
    await decideClaim(await as("claimParent", "PARENT"), ids.claim!, "APPROVE");
    expect((await db.guardianship.findFirst({ where: { parentUserId: ids.claimant!, studentMembershipId: ids.claimedM! }, select: { status: true } }))?.status).toBe("ACTIVE");
    for (const who of ["admin", "head"]) {
      const told = (await notices(who)).filter((n) => n.titleKey === "claim.notifGuardianApproved");
      expect(told, who).toHaveLength(1);
      expect(told[0]!.title).toContain("ZZ TAD177 claimant");
      expect(told[0]!.url).toBe(`/people/${ids.claimedM}`);
    }
  });
});
