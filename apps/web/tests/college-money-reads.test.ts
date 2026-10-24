/**
 * A COLLEGE'S MONEY, READ BY THE FAMILY AND RAISED BY THE DESK (QA campaign of 24 October 2026, unit layer).
 *
 * The campaign's coverage run found these at 0 hits: the student's and the guardian's own ledger
 * (college-fees.ts `myLedger`) and scholarships (scholarships.ts `myScholarships`), where an ADULT student's
 * guardian sees money only while the student grants MONEY; the scheme's share of the eligible fee (`expectedShare`);
 * the mess bill and the route fee (`billMess`, `raiseRouteFees`), each meant to be raised once; a document added to
 * the student's own claim (`addClaimDocument`, which spends the student's own upload ticket); the reconciliation
 * sheet; and the receivable's ageing buckets.
 *
 * As the owner (tests/setup.ts), so the rules and not the policies. One ZZ college and one ZZ school of this
 * file's own, removed after by id with everything under them.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { billMess, eligibleGrossPaise, expectedShare, myLedger, raiseRouteFees } from "@/lib/college-fees";
import { addClaimDocument, ageingBucket, myScholarships, reconciliationSheet } from "@/lib/scholarships";
import { translator } from "@/lib/i18n/dictionary";
import type { ActiveContext } from "@/lib/session";
import { __resetCookies, __setCookie } from "./stubs/next-headers";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids: Record<string, string> = {};
const member: Record<string, string> = {};
const school: Record<string, string> = {};

const ctx = (key: string, role: ActiveContext["role"], schoolKey: string | null): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: schoolKey ? school[schoolKey]! : null, role, user: { id: ids[key]!, name: `ZZ ${key}`, preferredName: null, email: `zz-cmoney-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } }) as ActiveContext;
const accounts = () => ctx("accounts", "ACCOUNTS", "college");
const principal = () => ctx("principal", "PRINCIPAL", "college");
const librarian = () => ctx("librarian", "LIBRARIAN", "college");
const guardian = () => ctx("guardian", "PARENT", null);
const stranger = () => ctx("strangerParent", "PARENT", null);
const adultStudent = () => ctx("adult", "STUDENT", "college");
const minorStudent = () => ctx("minor", "STUDENT", "college");
const t = translator("en");

beforeAll(async () => {
  const mk = (tag: string, kind: string) => db.school.create({ data: { name: `ZZ CMoney ${tag} ${STAMP}`, slug: `zz-cmoney-${tag.toLowerCase()}-${STAMP}`, code: `ZM${tag[0]}${SUFFIX}`, contactEmail: `zz-cmoney-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind, isTestFixture: true }, select: { id: true } });
  school.college = (await mk("College", "COLLEGE")).id;
  school.school = (await mk("School", "SCHOOL")).id;
  await db.schoolModule.createMany({ data: ["ACADEMICS", "SCHOLARSHIPS", "HOSTEL", "TRANSPORT"].map((module) => ({ schoolId: school.college!, module })) });
  const person = async (key: string, extra: Record<string, unknown> = {}) => (ids[key] = (await db.user.create({ data: { name: `ZZ CMoney ${key} ${STAMP}`, email: `zz-cmoney-${key}-${STAMP}@test.invalid`, isTestFixture: true, ...extra }, select: { id: true } })).id);
  const join = async (key: string, schoolKey: string, role: string, extra: Record<string, unknown> = {}) => (member[key] = (await db.membership.create({ data: { userId: ids[key]!, schoolId: school[schoolKey]!, role, status: "ACTIVE", ...extra }, select: { id: true } })).id);
  for (const [key, role] of [["admin", "ADMIN"], ["accounts", "ACCOUNTS"], ["principal", "PRINCIPAL"], ["librarian", "LIBRARIAN"]] as const) {
    await person(key);
    await join(key, "college", role);
  }
  await person("adult", { birthdate: new Date("2004-03-01T00:00:00Z"), isMinor: false });
  await person("minor", { birthdate: new Date("2010-03-01T00:00:00Z"), isMinor: true });
  await person("rider2", { birthdate: new Date("2004-04-01T00:00:00Z"), isMinor: false });
  await person("leaver", { birthdate: new Date("2004-05-01T00:00:00Z"), isMinor: false });
  await person("pupil", { birthdate: new Date("2014-03-01T00:00:00Z"), isMinor: true });
  await join("adult", "college", "STUDENT", { studentCode: `ZMA${STAMP}` });
  await join("minor", "college", "STUDENT", { studentCode: `ZMM${STAMP}` });
  await join("rider2", "college", "STUDENT", { studentCode: `ZMR${STAMP}` });
  await join("leaver", "college", "STUDENT", { studentCode: `ZML${STAMP}`, leftAt: new Date("2026-08-01T00:00:00Z") });
  await join("pupil", "school", "STUDENT", { studentCode: `ZMP${STAMP}` });
  await person("guardian");
  await person("strangerParent");
  for (const child of ["adult", "minor"]) await db.guardianship.create({ data: { parentUserId: ids.guardian!, studentMembershipId: member[child]!, studentSchoolId: school.college!, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: ids.guardian!, studentMembershipId: member.pupil!, studentSchoolId: school.school!, status: "ACTIVE" } });

  ids.year = (await db.academicYear.create({ data: { schoolId: school.college!, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  const dept = await db.department.create({ data: { schoolId: school.college!, code: `ZM${SUFFIX}`, name: "ZZ CMoney Commerce" }, select: { id: true } });
  const programme = await db.programme.create({ data: { schoolId: school.college!, departmentId: dept.id, code: "BCOM", name: "ZZ BCom", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } });
  await db.programmeEnrolment.createMany({ data: [{ schoolId: school.college!, studentMembershipId: member.adult!, programmeId: programme.id, yearOfEntry: 2026, category: "OBC", quota: "CAP" }, { schoolId: school.college!, studentMembershipId: member.minor!, programmeId: programme.id, yearOfEntry: 2026, category: "SC", quota: "CAP" }] });
  await db.pupilRecord.create({ data: { schoolId: school.college!, studentMembershipId: member.adult!, annualIncome: 90_000 } });

  const head = async (code: string, kind: string) => (ids[`head${code}`] = (await db.feeHead.create({ data: { schoolId: school.college!, name: `ZZ ${code}`, code, kind }, select: { id: true } })).id);
  for (const [code, kind] of [["TUI", "TUITION"], ["DEV", "DEVELOPMENT"], ["EXM", "EXAM"], ["LIB", "LIBRARY"], ["MES", "MESS"], ["BUS", "TRANSPORT"]] as const) await head(code, kind);
  const line = (code: string, gross: number, concession = 0) => ({ headId: ids[`head${code}`], code, name: `ZZ ${code}`, grossPaise: gross, concessionPaise: concession });
  const demand = (label: string, status: string, lines: ReturnType<typeof line>[], due = "2026-07-15") => {
    const gross = lines.reduce((a, l) => a + l.grossPaise, 0);
    const conc = lines.reduce((a, l) => a + l.concessionPaise, 0);
    return db.feeDemand.create({ data: { schoolId: school.college!, studentMembershipId: member.adult!, academicYearId: ids.year!, label, dueDate: new Date(`${due}T00:00:00Z`), grossPaise: gross, concessionPaise: conc, netPaise: gross - conc, status, linesJson: JSON.stringify(lines) } });
  };
  await demand("ZZ Term 1", "OPEN", [line("TUI", 40_000_00, 4_000_00), line("DEV", 5_000_00), line("LIB", 2_000_00)]);
  await demand("ZZ Term 2", "OPEN", [line("TUI", 40_000_00, 4_000_00), line("EXM", 1_500_00)], "2026-12-15");
  // Not part of the year's fee: a cancelled demand and one carried to the next year.
  await demand("ZZ Cancelled", "CANCELLED", [line("TUI", 99_999_00)]);
  await demand("ZZ Carried", "CARRIED", [line("TUI", 11_111_00)]);

  // Two hostels: one with a mess charge, one without; and the boarders.
  const hostel = async (key: string, mess: number) => (ids[key] = (await db.hostel.create({ data: { schoolId: school.college!, name: `ZZ CMoney ${key} ${STAMP}`, kind: "MIXED", messMonthlyPaise: mess }, select: { id: true } })).id);
  await hostel("hostelPaid", 3_500_00);
  await hostel("hostelFree", 0);
  const room = async (key: string, hostelKey: string) => (ids[key] = (await db.hostelRoom.create({ data: { schoolId: school.college!, hostelId: ids[hostelKey]!, number: key, beds: 4 }, select: { id: true } })).id);
  await room("roomPaid", "hostelPaid");
  await room("roomFree", "hostelFree");
  const allot = (who: string, roomKey: string, bed: number, fromDate: string, toDate: string | null) =>
    db.hostelAllotment.create({ data: { schoolId: school.college!, membershipId: member[who]!, roomId: ids[roomKey]!, bed, fromDate, toDate, status: toDate ? "ENDED" : "ACTIVE", activePupilKey: toDate ? null : member[who]!, activeBedKey: toDate ? null : `${ids[roomKey]}:${bed}`, allottedByUserId: ids.admin! }, select: { id: true } });
  await allot("adult", "roomPaid", 1, "2026-07-01", null);
  // Left the hostel before October: not a boarder of October.
  await allot("rider2", "roomPaid", 2, "2026-07-01", "2026-09-20");
  // An approved expulsion effective before October: not a boarder of October either.
  const expelled = await allot("leaver", "roomPaid", 3, "2026-07-01", null);
  await db.hostelExpulsion.create({ data: { schoolId: school.college!, allotmentId: expelled.id, membershipId: member.leaver!, reason: "ZZ", effectiveOn: "2026-09-15", status: "APPROVED", proposedByUserId: ids.admin! } });
  await allot("minor", "roomFree", 1, "2026-07-01", null);

  // Routes: a fixed route with a fee, a loop shuttle, a fixed route charging nothing.
  const route = async (key: string, kind: string, fee: number) => {
    ids[key] = (await db.transportRoute.create({ data: { schoolId: school.college!, name: `ZZ ${key}`, kind, feePerTermPaise: fee }, select: { id: true } })).id;
    ids[`${key}Stop`] = (await db.transportStop.create({ data: { schoolId: school.college!, routeId: ids[key]!, order: 1, name: "ZZ Gate", lat: 18.5, lng: 73.8 }, select: { id: true } })).id;
  };
  await route("routePaid", "FIXED", 2_400_00);
  await route("routeLoop", "LOOP", 1_000_00);
  await route("routeFree", "FIXED", 0);
  const ride = (who: string, routeKey: string, fromDateKey: string, toDateKey: string | null) => db.transportAllotment.create({ data: { schoolId: school.college!, studentMembershipId: member[who]!, routeId: ids[routeKey]!, stopId: ids[`${routeKey}Stop`]!, fromDateKey, toDateKey } });
  await ride("adult", "routePaid", "2026-07-01", null);
  // Riding until before the term's due date: not charged for the term.
  await ride("rider2", "routePaid", "2026-07-01", "2026-09-30");
  // Has left the college: not charged.
  await ride("leaver", "routePaid", "2026-07-01", null);
  await ride("minor", "routeLoop", "2026-07-01", null);
  await ride("minor", "routeFree", "2026-07-01", null);

  // Claims for the reconciliation sheet.
  ids.claimAdult = (await db.scholarshipClaim.create({ data: { schoolId: school.college!, studentMembershipId: member.adult!, scheme: "OBC_POST_MATRIC", academicYear: "2026-27", portalApplicationId: "ZZMAHADBT1", expectedPaise: 43_500_00, sanctionedPaise: 40_000_00, sanctionedAt: new Date("2026-09-01T00:00:00Z"), disbursedPaise: 25_000_00, disbursedAt: new Date("2026-10-01T00:00:00Z"), disbursementRef: "ZZUTR1", status: "SANCTIONED" }, select: { id: true } })).id;
  ids.claimMinor = (await db.scholarshipClaim.create({ data: { schoolId: school.college!, studentMembershipId: member.minor!, scheme: "OBC_POST_MATRIC", academicYear: "2026-27", expectedPaise: 10_000_00, status: "LAPSED", lapsedAt: new Date("2026-10-02T00:00:00Z") }, select: { id: true } })).id;
});

afterEach(() => __resetCookies());

afterAll(async () => {
  const people = Object.keys(ids).filter((k) => !k.startsWith("head") && !k.startsWith("hostel") && !k.startsWith("room") && !k.startsWith("route") && !k.startsWith("claim") && k !== "year").map((k) => ids[k]!);
  await db.uploadTicket.deleteMany({ where: { userId: { in: people } } });
  await db.guardianship.deleteMany({ where: { parentUserId: ids.guardian } });
  await db.school.deleteMany({ where: { id: { in: Object.values(school) } } });
  await db.notification.deleteMany({ where: { userId: { in: people } } });
  await db.user.deleteMany({ where: { id: { in: people } } });
  await db.$disconnect();
});

describe("the family's own ledger at a college", () => {
  it("the student reads their own; the office's roles are not the student's door", async () => {
    const own = await myLedger(adultStudent());
    expect(own.student.studentMembershipId).toBe(member.adult);
    expect(own.terms.map((x) => x.label)).toEqual(["ZZ Term 1", "ZZ Term 2"]);
    await expect(myLedger(accounts())).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
  });

  it("⚠ an ADULT student's guardian reads it only while the student grants MONEY, and not after it is revoked", async () => {
    await expect(myLedger(guardian(), member.adult)).rejects.toMatchObject({ key: "consent.refuseNotGranted" });
    await db.studentConsent.create({ data: { schoolId: school.college!, studentMembershipId: member.adult!, grant: "MONEY" } });
    expect((await myLedger(guardian(), member.adult)).student.studentMembershipId).toBe(member.adult);
    await db.studentConsent.update({ where: { studentMembershipId_grant: { studentMembershipId: member.adult!, grant: "MONEY" } }, data: { revokedAt: new Date() } });
    await expect(myLedger(guardian(), member.adult)).rejects.toMatchObject({ key: "consent.refuseNotGranted" });
  });

  it("a minor's guardian reads it with no grant; a parent who is nobody's guardian here is told the child is not theirs", async () => {
    expect((await myLedger(guardian(), member.minor)).student.studentMembershipId).toBe(member.minor);
    await expect(myLedger(stranger(), member.minor)).rejects.toMatchObject({ key: "access.notYourChild", code: "NOT_FOUND" });
    await expect(myLedger(stranger())).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("a guardian asking for their child at a school (not a college) is refused: this ledger is a college's", async () => {
    await expect(myLedger(guardian(), member.pupil)).rejects.toThrow();
  });

  it("the guardian's scholarships follow the same consent: refused for the adult without MONEY, open for the minor", async () => {
    await expect(myScholarships(guardian(), member.adult)).rejects.toMatchObject({ key: "consent.refuseNotGranted" });
    const minor = await myScholarships(guardian(), member.minor);
    expect(minor.claims.map((c) => c.id)).toEqual([ids.claimMinor]);
    // SC with no income on record: the SC scheme is shown open (an unknown income is not taken as over the ceiling).
    expect(minor.schemes.find((s) => s.scheme === "GOI_POST_MATRIC_SC")?.eligible).toBe(true);
    expect(minor.schemes.find((s) => s.scheme === "OBC_POST_MATRIC")?.eligible).toBe(false);
    const own = await myScholarships(adultStudent());
    expect(own.category).toBe("OBC");
    expect(own.claims.map((c) => c.id)).toEqual([ids.claimAdult]);
  });
});

describe("a scheme's share of the fee", () => {
  it("is worked out on tuition, development and exam heads net of their concessions, never on a cancelled or carried demand", async () => {
    // Term 1: TUI 40,000 − 4,000 + DEV 5,000 (LIB is not eligible); Term 2: TUI 40,000 − 4,000 + EXM 1,500.
    expect(await eligibleGrossPaise(school.college!, member.adult!, ids.year!)).toBe(36_000_00 + 5_000_00 + 36_000_00 + 1_500_00);
    expect(await expectedShare(school.college!, member.adult!, ids.year!, "OBC_POST_MATRIC")).toBe(78_500_00);
    expect(await expectedShare(school.college!, member.adult!, ids.year!, "EBC")).toBe(39_250_00);
    expect(await expectedShare(school.college!, member.adult!, ids.year!, "PM_USP")).toBe(0);
    expect(await expectedShare(school.college!, member.minor!, ids.year!, "GOI_POST_MATRIC_SC")).toBe(0);
  });
});

describe("the mess bill", () => {
  it("bills each boarder of the month once, at their hostel's charge, due on the tenth of the next month; nobody twice", async () => {
    await expect(billMess(librarian(), { month: "2026-10" })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    await expect(billMess(accounts(), { month: "October" })).rejects.toMatchObject({ key: "collegeOffice.refuseDates" });
    const first = await billMess(accounts(), { month: "2026-10" });
    // The adult boards in the paid hostel; the minor in the free one (skipped); the one who left in September and
    // the one expelled from the 15th of September are not boarders of October.
    expect(first).toEqual({ billed: 1, already: 0, skipped: 1 });
    const bills = await db.feeDemand.findMany({ where: { schoolId: school.college, label: { contains: "2026-10" } } });
    expect(bills.map((b) => [b.studentMembershipId, b.netPaise, b.dueDate.toISOString().slice(0, 10), b.status])).toEqual([[member.adult, 3_500_00, "2026-11-10", "OPEN"]]);
    expect(JSON.parse(bills[0]!.linesJson)).toMatchObject([{ headId: ids.headMES, code: "MES", grossPaise: 3_500_00 }]);
    expect(await billMess(accounts(), { month: "2026-10" })).toEqual({ billed: 0, already: 1, skipped: 1 });
    // A boarder of September who left on the 20th still had a bed that month.
    expect(await billMess(accounts(), { month: "2026-09" })).toEqual({ billed: 3, already: 0, skipped: 1 });
  });

  it("December is due on the tenth of January of the next year", async () => {
    await billMess(accounts(), { month: "2026-12", hostelId: ids.hostelPaid });
    const bill = await db.feeDemand.findFirstOrThrow({ where: { schoolId: school.college, studentMembershipId: member.adult, label: { contains: "2026-12" } } });
    expect(bill.dueDate.toISOString().slice(0, 10)).toBe("2027-01-10");
  });

  // U-4, QA-07 (fixed): "raised once" was decided by the demand's LABEL, written in the language of whoever pressed
  // the button, so a desk working in Hindi billed every boarder of an English-billed month again. Now the charge's
  // key (FeeDemand.raisedKey) decides, and the label is in the institution's own language whoever presses.
  it("⚠ a month already billed is not billed again by a desk working in another language, and the label stays the school's", async () => {
    __setCookie("edulink_locale", "hi");
    expect(await billMess(accounts(), { month: "2026-10" })).toEqual({ billed: 0, already: 1, skipped: 1 });
    expect(await billMess(accounts(), { month: "2026-11" })).toEqual({ billed: 1, already: 0, skipped: 1 });
    const nov = await db.feeDemand.findFirstOrThrow({ where: { schoolId: school.college, studentMembershipId: member.adult, raisedKey: "MESS:2026-11" } });
    expect(nov.label).toBe(t("collegeOffice.messLabel", { month: "2026-11" }));
  });

  it("⚠ a month billed before the key existed (its label in any language) is not billed again", async () => {
    // A Marathi-labelled bill from before the migration: no key, the label in the language it was pressed in.
    await db.feeDemand.create({ data: { schoolId: school.college!, studentMembershipId: member.adult!, academicYearId: ids.year!, label: translator("mr")("collegeOffice.messLabel", { month: "2027-01" }), dueDate: new Date("2027-02-10T00:00:00Z"), grossPaise: 3_500_00, netPaise: 3_500_00, status: "OPEN" } });
    expect(await billMess(accounts(), { month: "2027-01", hostelId: ids.hostelPaid })).toEqual({ billed: 0, already: 1, skipped: 0 });
  });

  it("⚠ two presses of one month at the same moment bill each boarder once", async () => {
    const both = await Promise.all([billMess(accounts(), { month: "2027-02", hostelId: ids.hostelPaid }), billMess(accounts(), { month: "2027-02", hostelId: ids.hostelPaid })]);
    expect(both.map((r) => r.billed).sort()).toEqual([0, 1]);
    expect(await db.feeDemand.count({ where: { schoolId: school.college, raisedKey: "MESS:2027-02" } })).toBe(1);
  });

  it("a cancelled month gives its key up: billed again, it is a new demand", async () => {
    const dec = await db.feeDemand.findFirstOrThrow({ where: { schoolId: school.college, studentMembershipId: member.adult, raisedKey: "MESS:2026-12" } });
    await db.feeDemand.update({ where: { id: dec.id }, data: { status: "CANCELLED" } });
    expect(await billMess(accounts(), { month: "2026-12", hostelId: ids.hostelPaid })).toEqual({ billed: 1, already: 0, skipped: 0 });
    expect((await db.feeDemand.findUniqueOrThrow({ where: { id: dec.id } })).raisedKey).toBeNull();
    expect(await db.feeDemand.count({ where: { schoolId: school.college, studentMembershipId: member.adult, raisedKey: "MESS:2026-12", status: "OPEN" } })).toBe(1);
  });
});

describe("the route fee", () => {
  it("charges each rider of a fixed, priced route once a term; never a loop shuttle, a free route, a rider gone before the due date, or a student who has left", async () => {
    await expect(raiseRouteFees(principal(), { termLabel: "Term 1", dueDateKey: "2026-10-15" })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    expect(await raiseRouteFees(accounts(), { termLabel: " Term 1 ", dueDateKey: "2026-10-15" })).toEqual({ raised: 1, already: 0 });
    const fees = await db.feeDemand.findMany({ where: { schoolId: school.college, label: t("collegeOffice.routeFeeLabel", { term: "Term 1", route: "ZZ routePaid" }) } });
    expect(fees.map((f) => [f.studentMembershipId, f.netPaise, f.dueDate.toISOString().slice(0, 10)])).toEqual([[member.adult, 2_400_00, "2026-10-15"]]);
    expect(await raiseRouteFees(accounts(), { termLabel: "Term 1", dueDateKey: "2026-10-15" })).toEqual({ raised: 0, already: 1 });
    // An earlier due date still finds the rider whose allotment ran to the end of September.
    expect(await raiseRouteFees(accounts(), { termLabel: "Term 0", dueDateKey: "2026-09-01" })).toEqual({ raised: 2, already: 0 });
  });

  // U-4, QA-07 (fixed), the same as the mess bill's: the key, not the presser's language, makes it "once".
  it("⚠ a term already raised is not raised again by a desk working in Marathi, nor by the same term typed in other case", async () => {
    __setCookie("edulink_locale", "mr");
    expect(await raiseRouteFees(accounts(), { termLabel: "Term 1", dueDateKey: "2026-10-15" })).toEqual({ raised: 0, already: 1 });
    expect(await raiseRouteFees(accounts(), { termLabel: "term  1", dueDateKey: "2026-10-15" })).toEqual({ raised: 0, already: 1 });
  });
});

describe("a document on the student's own claim", () => {
  it("⚠ spends the student's own upload ticket once; another person's ticket, a spent one, or another's claim is refused", async () => {
    const ticket = async (userId: string, fileId: string) => db.uploadTicket.create({ data: { userId, fileId, mime: "application/pdf", size: 1000 } });
    await ticket(ids.adult!, `zz-cmoney-own-${STAMP}.pdf`);
    await ticket(ids.minor!, `zz-cmoney-other-${STAMP}.pdf`);
    const added = await addClaimDocument(adultStudent(), ids.claimAdult!, { key: "INCOME", fileId: `zz-cmoney-own-${STAMP}.pdf`, name: "  Income certificate  " });
    expect(added.documents.map((d) => [d.key, d.name])).toEqual([["INCOME", "Income certificate"]]);
    expect((await db.uploadTicket.findUniqueOrThrow({ where: { fileId: `zz-cmoney-own-${STAMP}.pdf` } })).consumedAt).not.toBeNull();
    // The same file again is listed once and spends nothing.
    expect((await addClaimDocument(adultStudent(), ids.claimAdult!, { key: "INCOME", fileId: `zz-cmoney-own-${STAMP}.pdf`, name: "again" })).documents).toHaveLength(1);
    await expect(addClaimDocument(adultStudent(), ids.claimAdult!, { key: "CASTE", fileId: `zz-cmoney-other-${STAMP}.pdf`, name: "x" })).rejects.toMatchObject({ key: "collegeOffice.refuseFile" });
    await expect(addClaimDocument(adultStudent(), ids.claimAdult!, { key: "CASTE", fileId: `zz-cmoney-never-${STAMP}.pdf`, name: "x" })).rejects.toMatchObject({ key: "collegeOffice.refuseFile" });
    await expect(addClaimDocument(adultStudent(), ids.claimMinor!, { key: "CASTE", fileId: `zz-cmoney-own-${STAMP}.pdf`, name: "x" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    // The other student's ticket is still unspent.
    expect((await db.uploadTicket.findUniqueOrThrow({ where: { fileId: `zz-cmoney-other-${STAMP}.pdf` } })).consumedAt).toBeNull();
  });

  it("a lapsed claim takes no new document, and only a student adds one", async () => {
    await db.uploadTicket.create({ data: { userId: ids.minor!, fileId: `zz-cmoney-lapsed-${STAMP}.pdf`, mime: "application/pdf", size: 10 } });
    await expect(addClaimDocument(minorStudent(), ids.claimMinor!, { key: "CASTE", fileId: `zz-cmoney-lapsed-${STAMP}.pdf`, name: "x" })).rejects.toMatchObject({ key: "collegeOffice.refuseClaimStep" });
    await expect(addClaimDocument(accounts(), ids.claimAdult!, { key: "CASTE", fileId: "x", name: "x" })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
  });
});

describe("the reconciliation sheet and the ageing", () => {
  it("lists every claim of the scheme and year in order with what is still to come; the desk's readers only", async () => {
    await expect(reconciliationSheet(librarian(), "OBC_POST_MATRIC", "2026-27", t)).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    const sheet = await reconciliationSheet(principal(), "OBC_POST_MATRIC", "2026-27", t);
    expect(sheet.filename).toBe("scholarship-obc_post_matric-2026-27.csv");
    const rows = sheet.csv.trim().split(/\r?\n/);
    expect(rows).toHaveLength(3);
    const adultRow = rows.find((r) => r.includes("ZZMAHADBT1"))!;
    const minorRow = rows.find((r) => r.includes("LAPSED"))!;
    expect(rows.slice(1).map((r) => r.split(",")[0]).sort()).toEqual(["1", "2"]);
    // QA-39: two claims made in the same millisecond come out in id order, the same serials on every download.
    const stamp = new Date("2026-09-01T04:30:00.000Z");
    await db.scholarshipClaim.updateMany({ where: { id: { in: [ids.claimAdult!, ids.claimMinor!] } }, data: { createdAt: stamp } });
    const [first] = [ids.claimAdult!, ids.claimMinor!].sort();
    for (let read = 0; read < 3; read += 1) {
      const again = (await reconciliationSheet(principal(), "OBC_POST_MATRIC", "2026-27", t)).csv.trim().split(/\r?\n/);
      expect(again[1]!.startsWith("1,")).toBe(true);
      expect(again[1]!.includes("ZZMAHADBT1")).toBe(first === ids.claimAdult);
    }
    expect(adultRow).toContain(",43500.00,40000.00,2026-09-01,25000.00,2026-10-01,ZZUTR1,SANCTIONED,");
    // The difference: sanctioned 40,000 less disbursed 25,000.
    expect(adultRow.endsWith(",15000.00")).toBe(true);
    expect(minorRow.endsWith(",0.00")).toBe(true);
    expect((await reconciliationSheet(accounts(), "EBC", "2026-27", t)).csv.trim().split(/\r?\n/)).toHaveLength(1);
  });

  it("buckets a receivable's age at 30, 90 and 180 days", () => {
    expect([0, 30, 31, 90, 91, 180, 181, 10_000].map(ageingBucket)).toEqual(["0_30", "0_30", "31_90", "31_90", "91_180", "91_180", "OVER_180", "OVER_180"]);
  });
});
