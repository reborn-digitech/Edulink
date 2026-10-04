/**
 * The placement module (module PLACEMENT, roles TPO and RECRUITER; the
 * owner's college plan of 4 October 2026), through its /api/v1 doors with
 * primed sessions, at three ZZ colleges of this suite's own: Host and Guest
 * have placement on, Bare keeps it off.
 *
 * What is proved: eligibility names every failed condition (a CGPA floor, a
 * live backlog, the programme, the batch, opting out, already placed); a
 * recruiter sees the eligible count and no name before a student consents by
 * applying, nothing at a college whose drive is not its company's, and
 * nothing once the drive closes — in the library and, as the app role, in the
 * database's policy; the one-offer rule and the dream exception; a pooled
 * drive is read across colleges and written by nobody across them;
 * internship credits stop at the AICTE maximum and only in a window after
 * semester 2, 4 or 6, and the exam cell reads them by term; the season row's
 * data:audit check finds a stored figure the rows do not give; MODULE_OFF;
 * and an alumnus mentor's one-to-one is never priced.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { gateRequest } from "@/lib/role-gate";
import { ModuleOffError } from "@/lib/access-error";
import { AccessError } from "@/lib/tenancy";
import { evaluateEligibility, seasonBatchFor, applicationStatus } from "@/lib/placement-rules";
import { seasonDrift } from "@/lib/placement-analytics";
import { internshipCredits, internshipCreditsForTerm } from "@/lib/placement-internships";
import { bookSeat } from "@/lib/gig-sessions";
import { getSession } from "@/lib/session";
import { twoFactorEligible } from "@/lib/two-factor";
import { POST as companiesPost } from "@/app/api/v1/placement/companies/route";
import { gstinCheckChar, isCin, isGstin } from "@edulink/contracts";
import { GET as drivesGet, POST as drivesPost } from "@/app/api/v1/placement/drives/route";
import { GET as driveGet, POST as drivePost } from "@/app/api/v1/placement/drives/[driveId]/route";
import { GET as eligibilityGet } from "@/app/api/v1/placement/drives/[driveId]/eligibility/route";
import { POST as resultsPost } from "@/app/api/v1/placement/drives/[driveId]/results/route";
import { POST as offersPost } from "@/app/api/v1/placement/drives/[driveId]/offers/route";
import { POST as dreamPost } from "@/app/api/v1/placement/students/[membershipId]/dream/route";
import { POST as seasonPost } from "@/app/api/v1/placement/season/route";
import { POST as applyPost } from "@/app/api/v1/student/placement/drives/[driveId]/apply/route";
import { POST as answerPost } from "@/app/api/v1/student/placement/offers/[offerId]/route";
import { POST as profilePost } from "@/app/api/v1/student/placement/profile/route";
import { GET as myPlacementGet } from "@/app/api/v1/student/placement/route";
import { POST as proposePost } from "@/app/api/v1/student/internships/route";
import { POST as decidePost } from "@/app/api/v1/placement/internships/[internshipId]/decide/route";
import { POST as evaluatePost } from "@/app/api/v1/placement/internships/[internshipId]/evaluate/route";
import { POST as filesPost } from "@/app/api/v1/student/internships/[internshipId]/files/route";
import { GET as recruiterDrivesGet } from "@/app/api/v1/recruiter/drives/route";
import { GET as recruiterDriveGet } from "@/app/api/v1/recruiter/drives/[driveId]/route";
import { GET as recruiterExportGet } from "@/app/api/v1/recruiter/drives/[driveId]/export/route";
import { POST as recruiterCompanyPost } from "@/app/api/v1/recruiter/company/route";
import { POST as mentorSlotPost } from "@/app/api/v1/alumni/college/mentor-slots/route";
import { GET as familyGet } from "@/app/api/v1/family/placement/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-pl-${who.toLowerCase()}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <K extends string>(p: Record<K, string>) => ({ params: Promise.resolve(p) });
async function body<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
type Who = "TPO" | "GUEST_TPO" | "BARE_TPO" | "S1" | "S2" | "S3" | "G1" | "RECRUITER" | "STRANGER_RECRUITER" | "FACULTY" | "HOD" | "ALUMNUS" | "PARENT";
async function as(who: Who) {
  __resetCookies();
  __setHeaders({});
  const at: Record<Who, [string, string | null, string]> = {
    TPO: [ids.tpoUser!, ids.host!, "TPO"],
    GUEST_TPO: [ids.guestTpoUser!, ids.guest!, "TPO"],
    BARE_TPO: [ids.bareTpoUser!, ids.bare!, "TPO"],
    S1: [ids.s1User!, ids.host!, "STUDENT"],
    S2: [ids.s2User!, ids.host!, "STUDENT"],
    S3: [ids.s3User!, ids.host!, "STUDENT"],
    G1: [ids.g1User!, ids.guest!, "STUDENT"],
    RECRUITER: [ids.recruiterUser!, null, "RECRUITER"],
    STRANGER_RECRUITER: [ids.strangerUser!, null, "RECRUITER"],
    FACULTY: [ids.facultyUser!, ids.host!, "FACULTY"],
    HOD: [ids.hodUser!, ids.host!, "HOD"],
    ALUMNUS: [ids.alumnusUser!, ids.host!, "ALUMNUS"],
    PARENT: [ids.parentUser!, null, "PARENT"],
  };
  const [userId, schoolId, role] = at[who];
  await createSession(userId, { schoolId, role: role as never });
}

const RULE = { cgpaMin: 7, noLiveBacklogs: true, programmeIds: [] as string[], batchYear: null, genders: [] };

beforeAll(async () => {
  const mkSchool = (tag: string, slug: string) => db.school.create({ data: { name: `ZZ Placement ${tag} ${STAMP}`, slug: `zz-pl-${slug}-${STAMP}`, code: `ZP${tag[0]}${SUFFIX}`, kind: "COLLEGE", contactEmail: MAIL(`school-${slug}`), timezone: "Asia/Kolkata" }, select: { id: true } });
  ids.host = (await mkSchool("Host", "host")).id;
  ids.guest = (await mkSchool("Guest", "guest")).id;
  ids.bare = (await mkSchool("Bare", "bare")).id;
  await db.schoolModule.createMany({ data: [ids.host, ids.guest].flatMap((schoolId) => ["PLACEMENT", "ALUMNI", "ACADEMICS"].map((module) => ({ schoolId, module }))).concat([{ schoolId: ids.bare, module: "ALUMNI" }, { schoolId: ids.bare, module: "ACADEMICS" }]) });
  const mkUser = (who: string, extra: { isMinor?: boolean } = {}) => db.user.create({ data: { name: `ZZ Pl ${who}`, email: MAIL(who), isMinor: extra.isMinor ?? false }, select: { id: true } });
  const member = (userId: string, schoolId: string, role: string, extra: { leftAt?: Date; joinedAt?: Date } = {}) => db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", ...extra }, select: { id: true } });
  for (const [key, school, role] of [["tpo", "host", "TPO"], ["guestTpo", "guest", "TPO"], ["bareTpo", "bare", "TPO"], ["faculty", "host", "FACULTY"], ["hod", "host", "HOD"], ["admin", "host", "ADMIN"]] as const) {
    const u = await mkUser(key);
    ids[`${key}User`] = u.id;
    ids[key] = (await member(u.id, ids[school]!, role)).id;
  }
  for (const [key, school] of [["s1", "host"], ["s2", "host"], ["s3", "host"], ["g1", "guest"]] as const) {
    const u = await mkUser(key);
    ids[`${key}User`] = u.id;
    ids[key] = (await member(u.id, ids[school]!, "STUDENT")).id;
  }
  // A guardian of S2, an adult at a college: sees nothing of placement until S2 grants it.
  ids.parentUser = (await mkUser("parent")).id;
  await db.guardianship.create({ data: { parentUserId: ids.parentUser, studentMembershipId: ids.s2!, studentSchoolId: ids.host!, status: "ACTIVE" } });
  // The record: a programme with a seat for each host student (batch = entry + duration), results for CGPA, a live backlog for S3.
  const dept = await db.department.create({ data: { schoolId: ids.host!, code: `ZPD${SUFFIX}`, name: "ZZ Placement dept" }, select: { id: true } });
  const prog = await db.programme.create({ data: { schoolId: ids.host!, departmentId: dept.id, code: `ZPP${SUFFIX}`, name: "ZZ BTech Computer", level: "UG", durationYears: 4, regulator: "AICTE" }, select: { id: true } });
  ids.programme = prog.id;
  const scheme = await db.scheme.create({ data: { schoolId: ids.host!, programmeId: prog.id, name: "ZZ 2023 scheme", effectiveYear: 2023 }, select: { id: true } });
  for (const s of ["s1", "s2", "s3"]) await db.studentProgramme.create({ data: { schoolId: ids.host!, studentMembershipId: ids[s]!, programmeId: prog.id, schemeId: scheme.id, entryYear: 2023 } });
  const session = await db.examSession.create({ data: { schoolId: ids.host!, name: "ZZ Winter 2025", kind: "REGULAR", termId: `zz-term-${STAMP}`, status: "PUBLISHED" }, select: { id: true } });
  const run = await db.resultRun.create({ data: { schoolId: ids.host!, sessionId: session.id, number: 1, status: "PUBLISHED", computedByUserId: ids.adminUser!, publishedAt: new Date() }, select: { id: true } });
  // S1 at 8.0, S2 at 7.5, S3 at 6.5 on one ten-credit course.
  for (const [s, pts] of [["s1", 80], ["s2", 75], ["s3", 65]] as const) {
    await db.courseResult.create({ data: { schoolId: ids.host!, runId: run.id, studentMembershipId: ids[s]!, courseId: `zz-course-${STAMP}`, creditsTenths: 100, totalMilli: 70_000, maxMilli: 100_000, grade: "A", pointsTenths: pts, status: "PASS" } });
  }
  await db.backlog.create({ data: { schoolId: ids.host!, studentMembershipId: ids.s3!, courseId: `zz-course-b-${STAMP}`, firstFailedSessionId: session.id, firstFailedAt: new Date("2025-01-10T00:00:00Z") } });
  // The recruiters: one bound to the company, one bound to none.
  ids.recruiterUser = (await mkUser("recruiter")).id;
  ids.strangerUser = (await mkUser("stranger")).id;
  await db.recruiterProfile.createMany({ data: [{ userId: ids.recruiterUser, companyName: "ZZ Pl Co" }, { userId: ids.strangerUser, companyName: "ZZ Other" }] });
  const first14 = `27AAZPL${SUFFIX.slice(0, 4)}Z1Z`;
  ids.gstin = `${first14}${gstinCheckChar(first14)}`;
  const company = await db.company.create({ data: { name: `ZZ Pl Co ${STAMP}`, identifier: ids.gstin, sectors: JSON.stringify(["IT_SOFTWARE"]), pointOfContact: "ZZ", verifiedAt: new Date() }, select: { id: true } });
  ids.company = company.id;
  await db.companyRecruiter.create({ data: { companyId: company.id, userId: ids.recruiterUser } });
  // An alumnus mentor at the host.
  const alum = await mkUser("alumnus");
  ids.alumnusUser = alum.id;
  ids.alumnus = (await member(alum.id, ids.host!, "ALUMNUS", { joinedAt: new Date("2024-05-31T00:00:00Z") })).id;
  await db.alumniProfile.create({ data: { schoolId: ids.host!, membershipId: ids.alumnus, userId: alum.id, mentor: true, mentorAt: new Date() } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.gigSlot.deleteMany({ where: { provider: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { schoolId: { in: [ids.host!, ids.guest!, ids.bare!] } } });
  await db.company.deleteMany({ where: { name: { contains: String(STAMP) } } });
  await db.school.deleteMany({ where: { id: { in: [ids.host!, ids.guest!, ids.bare!] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("eligibility is computed and every failed condition is named", () => {
  it("as a rule over a record", () => {
    const record = { cgpa: 6.8, liveBacklogs: 2, attendancePct: 70, programmeId: "p1", programmeName: "ZZ", batchYear: 2026, gender: "M" as const, category: null };
    const failed = evaluateEligibility({ rule: { cgpaMin: 7, noLiveBacklogs: true, programmeIds: ["p2"], batchYear: 2027, genders: ["F"] }, record, optedOut: true, dreamFlag: false, acceptedRupees: 500_000, drivePackageMaxRupees: 600_000, dreamRatio: 1.5, allowGenderRule: true });
    expect(failed.map((f) => f.code)).toEqual(["OPTED_OUT", "CGPA", "BACKLOGS", "PROGRAMME", "BATCH", "GENDER", "PLACED"]);
    expect(failed.find((f) => f.code === "CGPA")).toEqual({ code: "CGPA", need: "7.00", have: "6.80" });
    expect(failed.find((f) => f.code === "PLACED")!.need).toBe("750000");
    // Unknown is not a pass; a gender rule the college does not allow is not applied.
    const unknown = evaluateEligibility({ rule: { cgpaMin: 6, noLiveBacklogs: true, programmeIds: [], batchYear: null, genders: ["F"] }, record: { ...record, cgpa: null, liveBacklogs: null }, optedOut: false, dreamFlag: false, acceptedRupees: null, drivePackageMaxRupees: 0, dreamRatio: 1.5, allowGenderRule: false });
    expect(unknown.map((f) => f.code)).toEqual(["CGPA_UNKNOWN", "BACKLOGS_UNKNOWN"]);
    expect(seasonBatchFor("2026-10-04")).toBe(2027);
    expect(seasonBatchFor("2027-03-31")).toBe(2027);
    expect(applicationStatus({ withdrawnAt: null }, [{ round: 0, outcome: "PASSED" }, { round: 1, outcome: "PASSED" }], false)).toEqual({ status: "ROUND", round: 2 });
  });

  it("through the cell's door, from the exam cell's CGPA and backlogs and the academics seat", async () => {
    await as("TPO");
    const made = await drivesPost(json("/api/v1/placement/drives", { companyId: ids.company, kind: "ON_CAMPUS", title: "ZZ Analyst", packageMinRupees: 600_000, packageMaxRupees: 800_000, rounds: [{ n: 1, kind: "TECHNICAL_INTERVIEW" }], rule: { ...RULE, programmeIds: [ids.programme], batchYear: 2027 } }));
    expect(made.status).toBe(200);
    ids.drive = (await body<{ id: string }>(made)).id;
    const res = await eligibilityGet(get(`/api/v1/placement/drives/${ids.drive}/eligibility`), params({ driveId: ids.drive }));
    const e = await body<{ eligible: number; rows: { studentMembershipId: string; eligible: boolean; failed: { code: string; need: string; have: string }[] }[] }>(res);
    const of = (id: string) => e.rows.find((r) => r.studentMembershipId === id)!;
    expect(of(ids.s1!).eligible).toBe(true);
    expect(of(ids.s2!).eligible).toBe(true);
    expect(of(ids.s3!).failed.map((f) => f.code)).toEqual(["CGPA", "BACKLOGS"]);
    expect(of(ids.s3!).failed[0]).toMatchObject({ need: "7.00", have: "6.50" });
    // The guest college's students are not the host's to list.
    expect(e.rows.some((r) => r.studentMembershipId === ids.g1)).toBe(false);
    // The wrong role is refused before the body; a student cannot open a drive.
    await as("S1");
    expect((await drivesPost(json("/api/v1/placement/drives", {}))).status).toBe(403);
  });
});

describe("consent, the recruiter and the closed drive", () => {
  it("shows the bound recruiter the count and no name until a student applies", async () => {
    await as("TPO");
    expect((await drivePost(json(`/api/v1/placement/drives/${ids.drive}`, { status: "OPEN" }), params({ driveId: ids.drive! }))).status).toBe(200);
    await as("RECRUITER");
    const before = await body<{ eligibleCount: number; applicants: unknown[] }>(await recruiterDriveGet(get(`/api/v1/recruiter/drives/${ids.drive}`), params({ driveId: ids.drive! })));
    expect(before.eligibleCount).toBe(2);
    expect(before.applicants).toEqual([]);
    // Applying without the consent is refused for the body; S3, not eligible, is refused naming why.
    await as("S1");
    expect((await applyPost(json("/x", {}), params({ driveId: ids.drive! }))).status).toBe(422);
    expect((await applyPost(json("/x", { consent: true }), params({ driveId: ids.drive! }))).status).toBe(200);
    await as("S3");
    const refused = await applyPost(json("/x", { consent: true }), params({ driveId: ids.drive! }));
    expect(refused.status).toBe(409);
    expect((await body(refused)).error).toContain("CGPA");
    await as("RECRUITER");
    const after = await body<{ applicants: { studentName: string; record: { cgpa: number } }[] }>(await recruiterDriveGet(get(`/api/v1/recruiter/drives/${ids.drive}`), params({ driveId: ids.drive! })));
    expect(after.applicants.map((a) => a.studentName)).toEqual(["ZZ Pl s1"]);
    expect(after.applicants[0]!.record.cgpa).toBe(8);
    // The download carries the recruiter's name, and the college's log has it.
    const sheet = await recruiterExportGet(get(`/api/v1/recruiter/drives/${ids.drive}/export`), params({ driveId: ids.drive! }));
    const text = await sheet.text();
    expect(text.split("\n")[0]).toContain("ZZ Pl recruiter");
    expect(text).toContain("ZZ Pl s1");
    expect(text).not.toContain("ZZ Pl s2");
    expect(await db.auditLog.count({ where: { schoolId: ids.host, action: "placement.recruiter.export" } })).toBe(1);
  });

  it("refuses a recruiter whose company the drive is not, and a recruiter with no drive at all", async () => {
    await as("STRANGER_RECRUITER");
    expect((await recruiterDriveGet(get(`/api/v1/recruiter/drives/${ids.drive}`), params({ driveId: ids.drive! }))).status).toBe(404);
    expect((await body<{ drives: unknown[] }>(await recruiterDrivesGet())).drives).toEqual([]);
    // A recruiter's company registration refuses a company already on the platform.
    const taken = await recruiterCompanyPost(json("/api/v1/recruiter/company", { name: "ZZ Copy", identifier: ids.gstin, sectors: ["IT_SOFTWARE"], pointOfContact: "ZZ" }));
    expect(taken.status).toBe(409);
    expect((await recruiterCompanyPost(json("/api/v1/recruiter/company", { name: "ZZ Copy", identifier: "27AAAAA0000A1Z0", sectors: ["IT_SOFTWARE"], pointOfContact: "ZZ" }))).status).toBe(422);
    expect(isGstin("27AAPFU0939F1ZV")).toBe(true);
    expect(isGstin("27AAPFU0939F1ZW")).toBe(false);
    expect(isCin("U29100MH2015PTC000001")).toBe(true);
    // A recruiter may turn two-step sign-in on, as the office may; a guardian may not.
    expect(await twoFactorEligible(ids.recruiterUser!)).toBe(true);
    expect(await twoFactorEligible(ids.parentUser!)).toBe(false);
    // The cell adding a company already on the platform links it rather than making a second.
    await as("GUEST_TPO");
    const linked = await companiesPost(json("/x", { name: "ZZ Second name", identifier: ids.gstin, sectors: ["BFSI"], pointOfContact: "ZZ" }));
    expect((await body<{ id: string }>(linked)).id).toBe(ids.company);
    expect(await db.company.count({ where: { identifier: ids.gstin } })).toBe(1);
  });

  it("records rounds and offers for the bound recruiter, and keeps the one-offer rule with its dream exception", async () => {
    await as("S2");
    expect((await applyPost(json("/x", { consent: true }), params({ driveId: ids.drive! }))).status).toBe(200);
    await as("RECRUITER");
    // Round 1 before the shortlist is refused; the shortlist, then round 1.
    expect((await resultsPost(json("/x", { round: 1, results: [{ studentMembershipId: ids.s1, outcome: "PASSED" }] }), params({ driveId: ids.drive! }))).status).toBe(409);
    expect((await resultsPost(json("/x", { round: 0, results: [{ studentMembershipId: ids.s1, outcome: "PASSED" }, { studentMembershipId: ids.s2, outcome: "PASSED" }] }), params({ driveId: ids.drive! }))).status).toBe(200);
    expect((await resultsPost(json("/x", { round: 1, results: [{ studentMembershipId: ids.s1, outcome: "PASSED" }, { studentMembershipId: ids.s2, outcome: "PASSED" }] }), params({ driveId: ids.drive! }))).status).toBe(200);
    // A student who did not apply cannot be named.
    expect((await resultsPost(json("/x", { round: 0, results: [{ studentMembershipId: ids.s3, outcome: "PASSED" }] }), params({ driveId: ids.drive! }))).status).toBe(422);
    const offered = await offersPost(json("/x", { studentMembershipId: ids.s1, packageRupees: 600_000 }), params({ driveId: ids.drive! }));
    expect(offered.status).toBe(200);
    const offer = await body<{ id: string; dreamException: boolean }>(offered);
    expect(offer.dreamException).toBe(false);
    await as("S1");
    expect((await answerPost(json("/x", { accept: true }), params({ offerId: offer.id }))).status).toBe(200);
    // A second drive: S1 is placed, so not eligible — until the dream flag and a package of at least 1.5 × 6 lakh.
    await as("TPO");
    const second = await body<{ id: string }>(await drivesPost(json("/api/v1/placement/drives", { companyId: ids.company, kind: "ON_CAMPUS", title: "ZZ Dream", packageMinRupees: 900_000, packageMaxRupees: 1_000_000, rule: { cgpaMin: null, noLiveBacklogs: false, programmeIds: [], batchYear: null, genders: [] } })));
    ids.dreamDrive = second.id;
    await drivePost(json("/x", { status: "OPEN" }), params({ driveId: second.id }));
    let rows = await body<{ rows: { studentMembershipId: string; failed: { code: string }[] }[] }>(await eligibilityGet(get("/x"), params({ driveId: second.id })));
    expect(rows.rows.find((r) => r.studentMembershipId === ids.s1)!.failed.map((f) => f.code)).toEqual(["PLACED"]);
    expect((await dreamPost(json("/x", { on: true }), params({ membershipId: ids.s1! }))).status).toBe(200);
    rows = await body(await eligibilityGet(get("/x"), params({ driveId: second.id })));
    expect(rows.rows.find((r) => r.studentMembershipId === ids.s1)!.failed).toEqual([]);
    await as("S1");
    expect((await applyPost(json("/x", { consent: true }), params({ driveId: second.id }))).status).toBe(200);
    await as("RECRUITER");
    await resultsPost(json("/x", { round: 0, results: [{ studentMembershipId: ids.s1, outcome: "PASSED" }] }), params({ driveId: second.id }));
    // Below the ratio the offer is refused by the one-offer rule; at it, it is made under the dream exception.
    expect((await offersPost(json("/x", { studentMembershipId: ids.s1, packageRupees: 850_000 }), params({ driveId: second.id }))).status).toBe(409);
    const dream = await body<{ id: string; dreamException: boolean }>(await offersPost(json("/x", { studentMembershipId: ids.s1, packageRupees: 950_000 }), params({ driveId: second.id })));
    expect(dream.dreamException).toBe(true);
    await as("S1");
    expect((await answerPost(json("/x", { accept: true }), params({ offerId: dream.id }))).status).toBe(200);
    const first = await db.offer.findUniqueOrThrow({ where: { id: offer.id }, select: { declinedAt: true } });
    expect(first.declinedAt).not.toBeNull();
  });

  it("shows the recruiter nothing once the drive closes", async () => {
    await as("TPO");
    expect((await drivePost(json("/x", { status: "CLOSED" }), params({ driveId: ids.dreamDrive! }))).status).toBe(200);
    // A status never goes back, and a closed drive changes no more.
    expect((await drivePost(json("/x", { status: "OPEN" }), params({ driveId: ids.dreamDrive! }))).status).toBe(409);
    await as("RECRUITER");
    expect((await recruiterDriveGet(get("/x"), params({ driveId: ids.dreamDrive! }))).status).toBe(404);
    expect((await recruiterExportGet(get("/x"), params({ driveId: ids.dreamDrive! }))).status).toBe(404);
    expect((await offersPost(json("/x", { studentMembershipId: ids.s1, packageRupees: 1 }), params({ driveId: ids.dreamDrive! }))).status).toBe(404);
    const list = await body<{ drives: { id: string }[] }>(await recruiterDrivesGet());
    expect(list.drives.map((d) => d.id)).toEqual([ids.drive]);
  });
});

describe("pooled drives", () => {
  it("are read by the guest college and its students, who apply from their own college", async () => {
    await as("TPO");
    const pooled = await drivesPost(json("/x", { companyId: ids.company, kind: "POOLED", title: "ZZ Pooled", packageMinRupees: 500_000, packageMaxRupees: 500_000, rule: { cgpaMin: null, noLiveBacklogs: false, programmeIds: [], batchYear: null, genders: [] }, poolSchoolIds: [ids.guest] }));
    expect(pooled.status).toBe(200);
    ids.pooled = (await body<{ id: string }>(pooled)).id;
    // A pooled drive must name a college with placement on.
    expect((await drivesPost(json("/x", { companyId: ids.company, kind: "POOLED", title: "ZZ Bad pool", packageMinRupees: 1, packageMaxRupees: 1, poolSchoolIds: [ids.bare] }))).status).toBe(422);
    await as("GUEST_TPO");
    expect((await body<{ drives: { id: string }[] }>(await drivesGet())).drives.map((d) => d.id)).not.toContain(ids.pooled);
    await as("TPO");
    await drivePost(json("/x", { status: "OPEN" }), params({ driveId: ids.pooled }));
    await as("GUEST_TPO");
    const listed = await body<{ drives: { id: string; hosted: boolean }[] }>(await drivesGet());
    expect(listed.drives.find((d) => d.id === ids.pooled)?.hosted).toBe(false);
    // The guest reads it and cannot change it.
    expect((await driveGet(get("/x"), params({ driveId: ids.pooled! }))).status).toBe(200);
    expect((await drivePost(json("/x", { status: "CLOSED" }), params({ driveId: ids.pooled! }))).status).toBe(404);
    await as("G1");
    expect((await applyPost(json("/x", { consent: true }), params({ driveId: ids.pooled! }))).status).toBe(200);
    const app = await db.driveApplication.findFirstOrThrow({ where: { driveId: ids.pooled, studentMembershipId: ids.g1 }, select: { schoolId: true } });
    expect(app.schoolId).toBe(ids.guest);
    // The host reads its guest's consented applicant, by the guest college's name.
    await as("TPO");
    const view = await body<{ applications: { studentName: string; schoolName: string }[] }>(await driveGet(get("/x"), params({ driveId: ids.pooled! })));
    expect(view.applications).toEqual([expect.objectContaining({ studentName: "ZZ Pl g1", schoolName: expect.stringContaining("Guest") })]);
  });
});

describe("internships under the AICTE policy", () => {
  it("are proposed in a window, approved with a supervisor, credited last and never past 20", async () => {
    await as("S2");
    expect((await proposePost(json("/x", { companyName: "ZZ Co", kind: "INDUSTRY", from: "2026-05-01", to: "2026-06-30", hours: 300, windowSemester: 3, supervisorName: "ZZ Sup" }))).status).toBe(422);
    const made = await body<{ id: string }>(await proposePost(json("/x", { companyName: "ZZ Co", kind: "INDUSTRY", from: "2026-05-01", to: "2026-06-30", hours: 300, windowSemester: 4, supervisorName: "ZZ Sup" })));
    await as("FACULTY");
    expect((await decidePost(json("/x", { approve: true, facultyMembershipId: ids.faculty }), params({ internshipId: made.id }))).status).toBe(403);
    await as("HOD");
    expect((await decidePost(json("/x", { approve: true, facultyMembershipId: ids.faculty }), params({ internshipId: made.id }))).status).toBe(200);
    // The report through an upload ticket of the student's own.
    await db.uploadTicket.create({ data: { userId: ids.s2User!, fileId: `zz-pl-report-${STAMP}.pdf`, mime: "application/pdf", size: 10 } });
    await as("S2");
    expect((await filesPost(json("/x", { kind: "REPORT", fileId: `zz-pl-report-${STAMP}.pdf` }), params({ internshipId: made.id }))).status).toBe(200);
    // The supervisor grades; the credits are not theirs to give.
    await as("FACULTY");
    expect((await evaluatePost(json("/x", { industryGrade: "A", vivaMarks: 40, facultyVisitOn: "2026-06-15" }), params({ internshipId: made.id }))).status).toBe(200);
    expect((await evaluatePost(json("/x", { credits: 4 }), params({ internshipId: made.id }))).status).toBe(403);
    // Credits past the policy's 20 are refused; within it, the internship is CREDITED.
    await db.internship.create({ data: { schoolId: ids.host!, studentMembershipId: ids.s2!, companyName: "ZZ Old", kind: "INDUSTRY", fromKey: "2025-05-01", toKey: "2025-06-30", hours: 500, windowSemester: 2, supervisorName: "ZZ", status: "CREDITED", credits: 18, creditedAt: new Date("2025-07-01T00:00:00Z") } });
    await as("TPO");
    const over = await evaluatePost(json("/x", { credits: 4 }), params({ internshipId: made.id }));
    expect(over.status).toBe(409);
    const ok = await evaluatePost(json("/x", { credits: 2 }), params({ internshipId: made.id }));
    expect((await body<{ status: string; credits: number }>(ok))).toMatchObject({ status: "CREDITED", credits: 2 });
    // The exam cell reads them, all and by term.
    expect((await internshipCredits(ids.s2!)).map((c) => c.credits).sort()).toEqual([18, 2].sort());
    const term = await db.academicTerm.create({ data: { schoolId: ids.host!, name: `ZZ Term ${STAMP}`, academicYear: "2025-26", startsOn: "2025-06-01", endsOn: "2025-11-30", registrationOpensOn: "2025-06-01", registrationClosesOn: "2025-06-15" }, select: { id: true } });
    expect(await internshipCreditsForTerm(ids.s2!, term.id)).toBe(18);
  });

  it("keeps an HOD who heads a department to its students", async () => {
    await as("S2");
    const made = await body<{ id: string }>(await proposePost(json("/x", { companyName: "ZZ Co 2", kind: "RESEARCH", from: "2026-11-01", to: "2026-12-15", hours: 120, windowSemester: 6, supervisorName: "ZZ Sup" })));
    await db.department.create({ data: { schoolId: ids.host!, code: `ZPO${SUFFIX}`, name: "ZZ Other dept", hodMembershipId: ids.hod! } });
    await as("HOD");
    expect((await decidePost(json("/x", { approve: true, facultyMembershipId: ids.faculty }), params({ internshipId: made.id }))).status).toBe(404);
    await as("TPO");
    expect((await decidePost(json("/x", { approve: false, reason: "ZZ Dates clash with the exams" }), params({ internshipId: made.id }))).status).toBe(200);
  });

  it("shows a guardian the internships only with the PLACEMENT grant", async () => {
    await as("PARENT");
    expect((await familyGet(get(`/api/v1/family/placement?childId=${ids.s2}`))).status).toBe(403);
    await db.studentConsent.create({ data: { schoolId: ids.host!, studentMembershipId: ids.s2!, grant: "PLACEMENT" } });
    const seen = await body<{ internships: unknown[] }>(await familyGet(get(`/api/v1/family/placement?childId=${ids.s2}`)));
    expect(seen.internships.length).toBe(3);
  });
});

describe("the season's stored copy", () => {
  it("is what the rows give when published, and data:audit finds a figure they do not", async () => {
    await as("TPO");
    const res = await seasonPost(json("/x", { batchYear: 2027 }));
    expect(res.status).toBe(200);
    // 2023 + 4 years: S1, S2, S3 are the batch of 2027; S1 is placed (an offer not declined).
    expect(await body(res)).toMatchObject({ batchYear: 2027, placed: 1 });
    expect(await seasonDrift(ids.host!)).toEqual([]);
    await db.placementSeason.update({ where: { schoolId_batchYear: { schoolId: ids.host!, batchYear: 2027 } }, data: { placed: 3, computedAt: new Date() } });
    const drift = await seasonDrift(ids.host!);
    expect(drift).toEqual([expect.objectContaining({ batchYear: 2027, level: "FAIL" })]);
  });
});

describe("the module switch", () => {
  it("answers MODULE_OFF at a college with placement off, and the gate keeps the TPO to its doors", async () => {
    await as("BARE_TPO");
    const res = await drivesGet();
    expect(res.status).toBe(403);
    expect((await body(res)).code).toBe("MODULE_OFF");
    await expect(gateRequest("GET /api/v1/placement/drives", { role: "ADMIN", schoolId: ids.bare! })).rejects.toBeInstanceOf(ModuleOffError);
    await expect(gateRequest("GET /api/v1/placement/drives", { role: "TPO", schoolId: ids.host! })).resolves.toBe("pass");
    await expect(gateRequest("GET /api/v1/library/titles", { role: "TPO", schoolId: ids.host! })).rejects.toBeInstanceOf(AccessError);
    await expect(gateRequest("GET /api/v1/recruiter/drives", { role: "RECRUITER", schoolId: null })).resolves.toBe("pass");
    await expect(gateRequest("GET /api/v1/placement/drives", { role: "RECRUITER", schoolId: null })).rejects.toBeInstanceOf(AccessError);
    // A student's page and the profile door are the student's.
    await as("S1");
    expect((await myPlacementGet()).status).toBe(200);
    expect((await profilePost(json("/x", {}))).status).toBe(422);
  });
});

describe("alumni mentors", () => {
  it("offer one-to-ones that are never priced, booked free by a student", async () => {
    await as("ALUMNUS");
    const at = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const res = await mentorSlotPost(json("/x", { title: "ZZ Mock interview", startsAt: at, minutes: 30, meetingUrl: "https://meet.zz.test/x" }));
    expect(res.status).toBe(200);
    const slot = await db.gigSlot.findFirstOrThrow({ where: { providerUserId: ids.alumnusUser }, select: { id: true, pricePaise: true, kind: true, providerKind: true, teacherSchoolId: true } });
    expect(slot).toMatchObject({ pricePaise: 0, kind: "ONE_TO_ONE", providerKind: "ALUMNUS", teacherSchoolId: ids.host });
    // The student's placement page lists it, and booking it is free.
    await as("S2");
    const page = await body<{ mentorSlots: { id: string }[] }>(await myPlacementGet());
    expect(page.mentorSlots.map((s) => s.id)).toContain(slot.id);
    const ctx = (await getSession())!;
    const booked = await bookSeat(ctx, { slotId: slot.id, purpose: "ZZ Practice for the analyst interview" });
    expect(booked.ok).toBe(true);
    const seat = await db.gigBooking.findFirstOrThrow({ where: { slotId: slot.id }, select: { paid: true, status: true } });
    expect(seat).toEqual({ paid: false, status: "CONFIRMED" });
    // A guest college's student does not see the host's alumni mentors.
    await as("G1");
    const guest = await body<{ mentorSlots: { id: string }[] }>(await myPlacementGet());
    expect(guest.mentorSlots.map((s) => s.id)).not.toContain(slot.id);
  });
});

// ---------------------------------------------------------------- the policies

const owner = db;
function appRoleUrl(): string | null {
  const app = process.env.DATABASE_APP_URL;
  const admin = process.env.DATABASE_ADMIN_URL ?? app;
  if (!app || !admin) return null;
  try {
    if (new URL(app).username === new URL(admin).username) return null;
  } catch {
    return null;
  }
  return app;
}
const APP_URL = appRoleUrl();
const app = APP_URL ? new PrismaClient({ datasourceUrl: APP_URL }) : null;
type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
async function asApp<T>(settings: { schoolIds?: string[]; userId?: string }, work: (tx: Tx) => Promise<T>): Promise<T> {
  return app!.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.school_ids', ${(settings.schoolIds ?? []).join(",")}, true)`;
    await tx.$executeRaw`SELECT set_config('app.user_id', ${settings.userId ?? ""}, true)`;
    await tx.$executeRaw`SELECT set_config('app.is_superuser', '', true)`;
    return work(tx as unknown as Tx);
  });
}

describe.skipIf(!APP_URL)("as the app role, PLACEMENT_READABLE holds in the database", () => {
  afterAll(async () => {
    await app?.$disconnect();
  });

  it("gives a recruiter a live drive of its company and its consented applicants, and nothing of a closed one", async () => {
    const r = ids.recruiterUser!;
    const seen = await asApp({ userId: r }, (tx) => tx.drive.findMany({ where: { companyId: ids.company }, select: { id: true } }));
    expect(seen.map((d) => d.id).sort()).toEqual([ids.drive, ids.pooled].sort());
    const apps = await asApp({ userId: r }, (tx) => tx.driveApplication.findMany({ where: { driveId: ids.drive }, select: { studentMembershipId: true } }));
    expect(apps.map((a) => a.studentMembershipId).sort()).toEqual([ids.s1, ids.s2].sort());
    expect(await asApp({ userId: r }, (tx) => tx.offer.count({ where: { driveId: ids.dreamDrive } }))).toBe(0);
    expect(await asApp({ userId: r }, (tx) => tx.driveApplication.count({ where: { driveId: ids.dreamDrive } }))).toBe(0);
    // A recruiter bound to no company sees no drive and no applicant anywhere.
    expect(await asApp({ userId: ids.strangerUser! }, (tx) => tx.drive.count({ where: { schoolId: ids.host } }))).toBe(0);
    expect(await asApp({ userId: ids.strangerUser! }, (tx) => tx.placementProfile.count())).toBe(0);
    // And it writes nothing: an update through the read clause changes no row.
    const wrote = await asApp({ userId: r }, (tx) => tx.drive.updateMany({ where: { id: ids.drive }, data: { title: "ZZ Hijack" } }));
    expect(wrote.count).toBe(0);
    void owner;
  });

  it("lets a pooled drive be read across colleges and written across none", async () => {
    const guestReads = await asApp({ schoolIds: [ids.guest!] }, (tx) => tx.drive.findMany({ where: { schoolId: ids.host }, select: { id: true } }));
    expect(guestReads.map((d) => d.id)).toEqual([ids.pooled]);
    const guestWrites = await asApp({ schoolIds: [ids.guest!] }, (tx) => tx.drive.updateMany({ where: { id: ids.pooled }, data: { status: "CLOSED" } }));
    expect(guestWrites.count).toBe(0);
    // The host reads the guest's consented application; it cannot change it.
    const hostReads = await asApp({ schoolIds: [ids.host!] }, (tx) => tx.driveApplication.findMany({ where: { driveId: ids.pooled }, select: { schoolId: true } }));
    expect(hostReads).toEqual([{ schoolId: ids.guest }]);
    const hostWrites = await asApp({ schoolIds: [ids.host!] }, (tx) => tx.driveApplication.updateMany({ where: { driveId: ids.pooled }, data: { withdrawnAt: new Date() } }));
    expect(hostWrites.count).toBe(0);
    // A college that is neither reads nothing of it.
    expect(await asApp({ schoolIds: [ids.bare!] }, (tx) => tx.drive.count({ where: { id: ids.pooled } }))).toBe(0);
  });
});
