/**
 * TA-555 (testing analysis of 13 November 2026; the owner's decision of 14 November 2026, option 1): an adult
 * college student was neither asked nor told when a new guardian was approved, and the new guardian read at once
 * whatever the student had granted, because a grant was one row per student and grant and covered every guardian,
 * present and future; and the student had no way to end a guardian's link.
 *
 * THE DECISION: the adult student decides, and grants are per guardian. Where consent applies (an adult at a
 * college), a claim on the student needs the student's own yes and the student is told when it is filed; a new
 * guardian starts with nothing until the student grants it; the student can end a guardian's link. StudentConsent
 * is keyed to the guardianship (one row per student, guardianship and grant).
 *
 * A scratch ZZ college of this suite's own (tests/ta-consent-fixture.ts): an adult with two family guardians (a
 * PARENT who also guards the minor, and a GUARDIAN of the adult alone), a minor, the office; two more accounts of
 * this suite's own that claim. Removed afterwards by id.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeCollege, type College } from "./ta-consent-fixture";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import * as consent from "@/lib/student-consent";
import * as claims from "@/lib/guardian-claims";
import * as links from "@/lib/guardianship";
import { assertGuardianAccess } from "@/lib/tenancy";
import { notifyGuardians } from "@/lib/notify";
import { familyChildren } from "@/lib/family-child";
import { ENDPOINTS } from "@/lib/api-catalog";
import { actionKey } from "@/lib/safety-labels";
import { STUDENT_CONSENT_GRANTS, studentConsentSchema, studentConsentSetSchema } from "@edulink/contracts";

let c: College;
const g = { parent: "", guardian: "", minor: "", claimant: "" };
const claimant = { userId: "", name: "ZZ TA Consent Claimant" };
const second = { userId: "", name: "ZZ TA Consent Second" };
let claimId = "";

const adult = () => c.ctx(c.adult, "STUDENT");
const minor = () => c.ctx(c.minor, "STUDENT");
const office = () => c.ctx(c.admin, "ADMIN");
const told = (userId: string, titleKey: string) => c.db.notification.count({ where: { userId, titleKey } });
const sees = (grant: (typeof STUDENT_CONSENT_GRANTS)[number], guardianUserId: string) => consent.parentMaySee(c.adult.membershipId, grant, guardianUserId);
const refusal = (run: Promise<unknown>) =>
  run.then(
    () => "allowed",
    (error: { key?: string; code?: string }) => `${error.code ?? ""}:${error.key ?? String(error)}`,
  );
const file = (who: { userId: string; name: string }, studentMembershipId: string) =>
  claims.fileClaim({ claimant: { id: who.userId, name: who.name }, studentMembershipId, schoolId: c.schoolId, childName: "ZZ TA Consent student", schoolName: "ZZ TA Consent College", relation: "PARENT" });
const door = async (userId: string, role: "STUDENT" | "ADMIN") => {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId: c.schoolId, role });
};
const post = (url: string, body: unknown) => new Request(`http://localhost${url}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

beforeAll(async () => {
  c = await makeCollege("mig555");
  const link = async (parentUserId: string, studentMembershipId: string) => (await c.db.guardianship.findFirstOrThrow({ where: { parentUserId, studentMembershipId }, select: { id: true } })).id;
  g.parent = await link(c.guardian.userId, c.adult.membershipId);
  g.guardian = await link(c.guardianOfAdult.userId, c.adult.membershipId);
  g.minor = await link(c.guardian.userId, c.minor.membershipId);
  const mail = (who: string) => `zz-tacons-mig555-${who}-${c.stamp}@test.invalid`;
  claimant.userId = (await c.db.user.create({ data: { name: claimant.name, email: mail("claimant"), prefs: "{}" }, select: { id: true } })).id;
  second.userId = (await c.db.user.create({ data: { name: second.name, email: mail("second"), prefs: "{}" }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await c.cleanup();
});

describe("TA-555: a grant is one guardian's", () => {
  it("TA-555: the guardian a grant was given to reads, and the student's other guardian does not", async () => {
    expect(await consent.setStudentConsent(adult(), "ATTENDANCE", true, g.guardian)).toEqual({ changed: true });
    expect(await consent.setStudentConsent(adult(), "ATTENDANCE", true, g.guardian)).toEqual({ changed: false });
    expect(await sees("ATTENDANCE", c.guardianOfAdult.userId)).toBe(true);
    expect(await sees("ATTENDANCE", c.guardian.userId)).toBe(false);
    expect(await refusal(assertGuardianAccess(c.guardianOfAdult.userId, c.adult.membershipId, "ATTENDANCE"))).toBe("allowed");
    expect(await refusal(assertGuardianAccess(c.guardian.userId, c.adult.membershipId, "ATTENDANCE"))).toBe("FORBIDDEN:consent.refuseNotGranted");
    const rows = await c.db.studentConsent.findMany({ where: { studentMembershipId: c.adult.membershipId }, select: { guardianshipId: true, grant: true, revokedAt: true } });
    expect(rows).toEqual([{ guardianshipId: g.guardian, grant: "ATTENDANCE", revokedAt: null }]);
    const audit = await c.db.auditLog.findFirstOrThrow({ where: { schoolId: c.schoolId, action: "student.consent.grant" }, select: { meta: true } });
    expect(audit.meta).toContain(g.guardian);
  });

  it("TA-555: the family's own list of children shows each guardian only what was granted to them", async () => {
    const of = async (userId: string) => (await familyChildren(userId)).find((child) => child.studentMembershipId === c.adult.membershipId)!;
    expect((await of(c.guardianOfAdult.userId)).grants).toEqual(["ATTENDANCE"]);
    expect(await of(c.guardian.userId)).toMatchObject({ guarded: true, grants: [], readable: false });
  });

  it("TA-555: a notice about the adult goes only to the guardian who holds its grant", async () => {
    const title = `ZZ TA-555 attendance ${c.stamp}`;
    const sent = await notifyGuardians(c.adult.membershipId, () => ({ schoolId: c.schoolId, kind: "SYSTEM" as const, title, url: "/parent" }), "ATTENDANCE");
    expect(sent).toBe(1);
    expect(await c.db.notification.count({ where: { userId: c.guardianOfAdult.userId, title } })).toBe(1);
    expect(await c.db.notification.count({ where: { userId: c.guardian.userId, title } })).toBe(0);
    expect([...(await consent.guardiansToTell([c.adult.membershipId, c.minor.membershipId], "ATTENDANCE")).entries()].sort()).toEqual(
      [
        [c.adult.membershipId, [c.guardianOfAdult.userId]],
        [c.minor.membershipId, [c.guardian.userId]],
      ].sort(),
    );
  });

  it("TA-555: the office's absence alert counts only the guardians it told", async () => {
    // ATTENDANCE is the guardian of the adult's alone (the first case), not the parent's, so the alert tells one.
    const { sendAbsenceAlert } = await import("@/lib/attendance-intel");
    const title = "notifTitle.aboutAttendance";
    const before = { guardian: await told(c.guardianOfAdult.userId, title), parent: await told(c.guardian.userId, title) };
    expect(await sendAbsenceAlert(office(), c.adult.membershipId)).toEqual({ notified: 1, skipped: false });
    expect(await told(c.guardianOfAdult.userId, title)).toBe(before.guardian + 1);
    expect(await told(c.guardian.userId, title)).toBe(before.parent);
  });

  it("TA-555: the student's page lists each guardian with their own grants, and a grant with no guardian named goes to every guardian linked now", async () => {
    const view = await consent.myStudentConsent(adult());
    expect(view.applies).toBe(true);
    expect(view.guardians.map((row) => [row.guardianshipId, row.relation, row.grants.filter((x) => x.on).map((x) => x.grant)])).toEqual([
      [g.parent, "PARENT", []],
      [g.guardian, "GUARDIAN", ["ATTENDANCE"]],
    ]);
    // The whole-list line a screen written before guardians were named reads: on when anybody holds it.
    expect(view.grants.filter((x) => x.on).map((x) => x.grant)).toEqual(["ATTENDANCE"]);
    expect(await consent.setStudentConsent(adult(), "RESULTS", true)).toEqual({ changed: true });
    expect([await sees("RESULTS", c.guardian.userId), await sees("RESULTS", c.guardianOfAdult.userId)]).toEqual([true, true]);
    expect(await consent.setStudentConsent(adult(), "RESULTS", false)).toEqual({ changed: true });
    expect([await sees("RESULTS", c.guardian.userId), await sees("RESULTS", c.guardianOfAdult.userId)]).toEqual([false, false]);
    // Somebody else's guardian is not theirs to grant to.
    expect(await refusal(consent.setStudentConsent(adult(), "MONEY", true, g.minor))).toBe("NOT_FOUND:consent.refuseNotYourGuardian");
    expect(studentConsentSetSchema.safeParse({ grant: "MONEY", on: true, guardianshipId: g.parent }).success).toBe(true);
    expect(studentConsentSetSchema.safeParse({ grant: "MONEY", on: true }).success).toBe(true);
  });
});

describe("TA-555: a claim on an adult at a college needs the student's own yes", () => {
  it("TA-555: the student is told when it is filed, and it is neither the office's nor a guardian's to decide", async () => {
    claimId = (await file(claimant, c.adult.membershipId)).claimId;
    expect(await told(c.adult.userId, "claim.notifAskedYou")).toBe(1);
    expect([await told(c.admin.userId, "claim.notifAsked"), await told(c.guardian.userId, "claim.notifAsked"), await told(c.guardianOfAdult.userId, "claim.notifAsked")]).toEqual([0, 0, 0]);
    expect(await claims.waitingClaimsForOffice(office())).toEqual([]);
    expect(await claims.waitingClaimsForGuardian(c.guardian.userId)).toEqual([]);
    expect(await claims.waitingClaimCount(office())).toBe(0);
    const mine = await claims.waitingClaimsForStudent(adult());
    expect(mine.map((row) => ({ id: row.id, claimantName: row.claimantName, relation: row.relation }))).toEqual([{ id: claimId, claimantName: claimant.name, relation: "PARENT" }]);
    expect(JSON.stringify(mine)).not.toContain("@test.invalid");
    expect(await refusal(claims.decideClaim(office(), claimId, "APPROVE"))).toBe("FORBIDDEN:claim.studentDecides");
    expect(await refusal(claims.decideClaim(c.ctx(c.guardian, "PARENT"), claimId, "APPROVE"))).toBe("FORBIDDEN:claim.studentDecides");
    expect(await refusal(claims.decideClaim(office(), claimId, "DECLINE"))).toBe("FORBIDDEN:claim.studentDecides");
    expect(await c.db.guardianship.count({ where: { parentUserId: claimant.userId } })).toBe(0);
    expect((await c.db.guardianClaim.findUniqueOrThrow({ where: { id: claimId }, select: { status: true } })).status).toBe("PENDING");
  });

  it("TA-555: the student's yes makes the link; the new guardian starts with nothing, the first keeps what was granted, and the office is told", async () => {
    await claims.decideClaim(adult(), claimId, "APPROVE");
    const made = await c.db.guardianship.findFirstOrThrow({ where: { parentUserId: claimant.userId, studentMembershipId: c.adult.membershipId }, select: { id: true, status: true } });
    expect(made.status).toBe("ACTIVE");
    g.claimant = made.id;
    for (const grant of STUDENT_CONSENT_GRANTS) expect([grant, await sees(grant, claimant.userId)]).toEqual([grant, false]);
    expect(await refusal(assertGuardianAccess(claimant.userId, c.adult.membershipId, "ATTENDANCE"))).toBe("FORBIDDEN:consent.refuseNotGranted");
    expect(await sees("ATTENDANCE", c.guardianOfAdult.userId)).toBe(true);
    const audit = await c.db.auditLog.findFirstOrThrow({ where: { schoolId: c.schoolId, action: "parent.claim", targetId: c.adult.membershipId }, select: { meta: true, actorUserId: true } });
    expect(JSON.parse(audit.meta ?? "{}")).toMatchObject({ by: "student", approvedBy: c.adult.userId });
    expect(await told(c.admin.userId, "claim.notifStudentApproved")).toBe(1);
    const news = await c.db.notification.findFirstOrThrow({ where: { userId: claimant.userId, titleKey: "claim.notifApproved" }, select: { bodyKey: true } });
    expect(news.bodyKey).toBe("claim.notifApprovedAdultBody");
    const view = await consent.myStudentConsent(adult());
    expect(view.guardians.map((row) => [row.guardianshipId, row.grants.some((x) => x.on)])).toEqual([
      [g.parent, false],
      [g.guardian, true],
      [g.claimant, false],
    ]);
    expect(await claims.waitingClaimsForStudent(adult())).toEqual([]);
  });

  it("TA-555: a minor's claim is still the office's or the family's to decide, the minor is not asked, and their guardians still see everything", async () => {
    const id = (await file(second, c.minor.membershipId)).claimId;
    expect(await told(c.minor.userId, "claim.notifAskedYou")).toBe(0);
    expect([await told(c.admin.userId, "claim.notifAsked"), await told(c.guardian.userId, "claim.notifAsked")]).toEqual([1, 1]);
    expect(await claims.waitingClaimsForStudent(minor())).toEqual([]);
    expect((await claims.waitingClaimsForOffice(office())).map((row) => row.id)).toEqual([id]);
    expect(await refusal(claims.decideClaim(minor(), id, "APPROVE"))).toBe("NOT_FOUND:access.claimNotFound");
    await claims.decideClaim(office(), id, "APPROVE");
    expect(await consent.parentMaySee(c.minor.membershipId, "RESULTS", second.userId)).toBe(true);
    expect(await refusal(assertGuardianAccess(second.userId, c.minor.membershipId))).toBe("allowed");
    expect(await refusal(consent.setStudentConsent(minor(), "RESULTS", true))).toBe("FORBIDDEN:consent.refuseNotAdult");
    expect(await refusal(links.endGuardianLinkAsStudent(minor(), g.minor))).toBe("FORBIDDEN:consent.refuseEndNotAdult");
    expect((await c.db.guardianship.findUniqueOrThrow({ where: { id: g.minor }, select: { status: true } })).status).toBe("ACTIVE");
  });
});

describe("TA-555: the student can end a guardian's link", () => {
  it("TA-555: the link ends and its grants go with it, the guardian's pages close, both are told, and it is on the record once", async () => {
    await consent.setStudentConsent(adult(), "RESULTS", true, g.claimant);
    expect(await sees("RESULTS", claimant.userId)).toBe(true);
    expect(await links.endGuardianLinkAsStudent(adult(), g.claimant)).toMatchObject({ ok: true, ended: true });
    expect((await c.db.guardianship.findUniqueOrThrow({ where: { id: g.claimant }, select: { status: true } })).status).toBe("REVOKED");
    expect(await c.db.studentConsent.count({ where: { guardianshipId: g.claimant, revokedAt: null } })).toBe(0);
    expect(await c.db.studentConsent.count({ where: { guardianshipId: g.claimant } })).toBe(1);
    expect(await sees("RESULTS", claimant.userId)).toBe(false);
    expect(await refusal(assertGuardianAccess(claimant.userId, c.adult.membershipId, "RESULTS"))).toBe("NOT_FOUND:access.notYourChild");
    // The other guardians keep theirs.
    expect(await sees("ATTENDANCE", c.guardianOfAdult.userId)).toBe(true);
    const audit = await c.db.auditLog.findMany({ where: { schoolId: c.schoolId, action: "guardianship.endedByStudent", targetId: c.adult.membershipId }, select: { meta: true, actorUserId: true } });
    expect(audit).toHaveLength(1);
    expect(audit[0]!.actorUserId).toBe(c.adult.userId);
    expect(JSON.parse(audit[0]!.meta ?? "{}")).toMatchObject({ guardianshipId: g.claimant, guardianUserId: claimant.userId, grantsRevoked: 1 });
    expect(actionKey("guardianship.endedByStudent")).toBe("audit.guardianshipEndedByStudent");
    expect(await told(claimant.userId, "consent.notifLinkEnded")).toBe(1);
    expect(await told(c.admin.userId, "consent.notifStudentEndedLink")).toBe(1);
    // A second press ends nothing and tells nobody again.
    expect(await links.endGuardianLinkAsStudent(adult(), g.claimant)).toMatchObject({ ok: true, ended: false });
    expect(await c.db.auditLog.count({ where: { schoolId: c.schoolId, action: "guardianship.endedByStudent" } })).toBe(1);
    expect(await told(claimant.userId, "consent.notifLinkEnded")).toBe(1);
    // Nobody else's link, and nobody else's student.
    expect(await refusal(links.endGuardianLinkAsStudent(adult(), g.minor))).toBe("NOT_FOUND:consent.refuseNotYourGuardian");
    expect(await refusal(links.endGuardianLinkAsStudent(office(), g.parent))).toBe("FORBIDDEN:access.wrongRoleForThisAction");
  });

  it("TA-555: a link made again by a new claim and a new yes starts with nothing", async () => {
    const again = (await file(claimant, c.adult.membershipId)).claimId;
    await claims.decideClaim(adult(), again, "APPROVE");
    const link = await c.db.guardianship.findUniqueOrThrow({ where: { id: g.claimant }, select: { status: true } });
    expect(link.status).toBe("ACTIVE");
    for (const grant of STUDENT_CONSENT_GRANTS) expect([grant, await sees(grant, claimant.userId)]).toEqual([grant, false]);
  });

  it("TA-555: a guardian who removes the link themself, or whom the office removes, leaves no grant behind", async () => {
    await consent.setStudentConsent(adult(), "MONEY", true, g.guardian);
    await consent.setStudentConsent(adult(), "MONEY", true, g.parent);
    await links.unlinkChild(c.ctx(c.guardianOfAdult, "PARENT"), c.adult.membershipId);
    expect(await c.db.studentConsent.count({ where: { guardianshipId: g.guardian, revokedAt: null } })).toBe(0);
    expect(await sees("MONEY", c.guardianOfAdult.userId)).toBe(false);
    const ended = await links.endFamilyGuardianship(office(), c.adult.membershipId, g.parent, "FAMILY_REQUEST");
    expect(ended).toMatchObject({ ok: true, ended: true });
    expect(await c.db.studentConsent.count({ where: { guardianshipId: g.parent, revokedAt: null } })).toBe(0);
    expect(await sees("MONEY", c.guardian.userId)).toBe(false);
  });
});

describe("TA-555: the doors", () => {
  it("TA-555: the consent read carries each guardian's grants and the claims waiting on the student, and a grant names its guardian", async () => {
    const pending = (await file(second, c.adult.membershipId)).claimId;
    await door(c.adult.userId, "STUDENT");
    const route = await import("@/app/api/v1/student/consent/route");
    const read = await route.GET();
    expect(read.status).toBe(200);
    const body = studentConsentSchema.parse(await read.json());
    expect(body.guardians.map((row) => row.guardianshipId)).toEqual([g.claimant]);
    expect(body.claims.map((row) => ({ id: row.id, claimantName: row.claimantName }))).toEqual([{ id: pending, claimantName: second.name }]);
    const saved = await route.POST(post("/api/v1/student/consent", { grant: "PLACEMENT", on: true, guardianshipId: g.claimant }));
    expect(saved.status).toBe(200);
    const after = studentConsentSchema.parse(await saved.json());
    expect(after.guardians[0]!.grants.filter((x) => x.on).map((x) => x.grant)).toEqual(["PLACEMENT"]);
    expect(await sees("PLACEMENT", claimant.userId)).toBe(true);
    // A guardianship that is not this student's is 404 at the door.
    expect((await route.POST(post("/api/v1/student/consent", { grant: "PLACEMENT", on: true, guardianshipId: g.minor }))).status).toBe(404);
  });

  it("TA-555: the student decides a claim and ends a link through doors of their own, and the office cannot use them", async () => {
    const pending = (await c.db.guardianClaim.findFirstOrThrow({ where: { claimantUserId: second.userId, studentMembershipId: c.adult.membershipId, status: "PENDING" }, select: { id: true } })).id;
    const decide = await import("@/app/api/v1/student/guardian-claims/[claimId]/decide/route");
    const end = await import("@/app/api/v1/student/guardians/[guardianshipId]/end/route");
    await door(c.admin.userId, "ADMIN");
    expect((await decide.POST(post(`/api/v1/student/guardian-claims/${pending}/decide`, { decision: "APPROVE" }), { params: Promise.resolve({ claimId: pending }) })).status).toBe(403);
    expect((await end.POST(post(`/api/v1/student/guardians/${g.claimant}/end`, {}), { params: Promise.resolve({ guardianshipId: g.claimant }) })).status).toBe(403);
    await door(c.adult.userId, "STUDENT");
    const declined = await decide.POST(post(`/api/v1/student/guardian-claims/${pending}/decide`, { decision: "DECLINE", reason: "ZZ I do not know this person." }), { params: Promise.resolve({ claimId: pending }) });
    expect(declined.status).toBe(200);
    expect(studentConsentSchema.parse(await declined.json()).claims).toEqual([]);
    expect(await c.db.guardianClaim.findUniqueOrThrow({ where: { id: pending }, select: { status: true, decidedByUserId: true } })).toEqual({ status: "DECLINED", decidedByUserId: c.adult.userId });
    expect(await c.db.guardianship.count({ where: { parentUserId: second.userId, studentMembershipId: c.adult.membershipId } })).toBe(0);
    const ended = await end.POST(post(`/api/v1/student/guardians/${g.claimant}/end`, {}), { params: Promise.resolve({ guardianshipId: g.claimant }) });
    expect(ended.status).toBe(200);
    expect(studentConsentSchema.parse(await ended.json()).guardians).toEqual([]);
    expect(await sees("PLACEMENT", claimant.userId)).toBe(false);
    expect((await end.POST(post("/api/v1/student/guardians/zz-no-such-link/end", {}), { params: Promise.resolve({ guardianshipId: "zz-no-such-link" }) })).status).toBe(404);
  });

  it("TA-555: the two new doors are in the catalog for the student alone", () => {
    const entry = (path: string) => ENDPOINTS.find((e) => e.method === "POST" && e.path === path);
    expect(entry("/api/v1/student/guardians/{guardianshipId}/end")?.access).toEqual(["STUDENT"]);
    expect(entry("/api/v1/student/guardian-claims/{claimId}/decide")?.access).toEqual(["STUDENT"]);
  });
});

describe("TA-555: the database's own rule", () => {
  it("TA-555: one row per student, guardianship and grant; a row with no guardian is kept once and opens nothing", async () => {
    const row = (guardianshipId: string | null, grant: string) =>
      c.db.studentConsent.create({ data: { schoolId: c.schoolId, studentMembershipId: c.minor.membershipId, guardianshipId, grant } }).then(
        () => "made",
        (error: { code?: string }) => error.code ?? "refused",
      );
    expect(await row(g.minor, "HOSTEL_TRANSPORT")).toBe("made");
    expect(await row(g.minor, "HOSTEL_TRANSPORT")).toBe("P2002");
    // A grant from before guardians were named, with nobody linked when it was given (guardianshipId NULL): NULLS NOT
    // DISTINCT keeps it to one row, and nobody reads under it.
    expect(await row(null, "HOSTEL_TRANSPORT")).toBe("made");
    expect(await row(null, "HOSTEL_TRANSPORT")).toBe("P2002");
    await c.db.studentConsent.create({ data: { schoolId: c.schoolId, studentMembershipId: c.adult.membershipId, guardianshipId: null, grant: "HOSTEL_TRANSPORT" } });
    const reader = (await c.db.guardianship.findFirstOrThrow({ where: { studentMembershipId: c.adult.membershipId, status: "ACTIVE" }, select: { parentUserId: true } })).parentUserId;
    expect(await consent.parentMaySee(c.adult.membershipId, "HOSTEL_TRANSPORT", reader)).toBe(false);
    // The grants go with the guardianship's row.
    await c.db.guardianship.delete({ where: { id: g.minor } });
    expect(await c.db.studentConsent.count({ where: { studentMembershipId: c.minor.membershipId, guardianshipId: { not: null } } })).toBe(0);
  });
});
