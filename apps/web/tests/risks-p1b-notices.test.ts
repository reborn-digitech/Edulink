/**
 * The risks batch's package 1B, the notices and the desks' smaller decisions (5 Oct 2026; docs/audit-2026-10-05/
 * 08-remaining-risks.md):
 *   - G4-33: a text to a guardian phone the office typed carries an opt-out line in the guardian's language, and a
 *     number that answered STOP, or a guardian who switched texts off, is not texted again;
 *   - G4-30: the exam cell, the IQAC, placement and accounts have the messaging doors and converse as staff;
 *   - G4-26: an alumni mentor's session is booked free and draws on none of the student's free allowance;
 *   - G4-13: an approved grace and a published result reach the student and the family (under the RESULTS grant);
 *   - G4-21: a periodical gains and loses volumes and keeps a subscription; a book refuses both.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { deliverToUser, saveMessagingSettings } from "@/lib/messaging";
import { MESSAGE_TEMPLATES, OPT_OUT_FORM } from "@/lib/message-templates";
import { ENDPOINTS } from "@/lib/api-catalog";
import { permits } from "@/lib/api-catalog/types";
import { openConversation, peopleToMessage } from "@/lib/conversations";
import { gigSettings } from "@/lib/gig-questions";
import { bookSeat, familySessions } from "@/lib/gig-sessions";
import { decideGrace, publishRun } from "@/lib/exam-cell-marks";
import { addVolume, periodicalView, removeVolume, savePeriodicalSubscription } from "@/lib/library-periodicals";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-p1b-note-${who.toLowerCase()}-${STAMP}@test.invalid`;
const HOUR = 3_600_000;
const ids: Record<string, string> = {};
const users: string[] = [];
let savedGigs: Awaited<ReturnType<typeof gigSettings>> | null = null;

async function as(who: string, role: string | null, schoolId: string | null = ids.college!): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId, role: role as never });
  return (await getSession())!;
}

async function person(who: string, role: string | null, extra: Record<string, unknown> = {}): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ P1B ${who}`, email: MAIL(who), ...extra }, select: { id: true } })).id;
  users.push(ids[who]!);
  if (role) ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role, status: "ACTIVE" }, select: { id: true } })).id;
}

beforeAll(async () => {
  process.env.SMS_TRANSPORT = "devbox";
  process.env.WHATSAPP_TRANSPORT = "devbox";
  ids.college = (await db.school.create({ data: { name: `ZZ P1B Notices College ${STAMP}`, slug: `zz-p1b-note-${STAMP}`, code: `ZN${SUFFIX}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: ["ACADEMICS", "EXAMS", "LIBRARY", "ALUMNI"].map((module) => ({ schoolId: ids.college!, module })) });
  await db.academicYear.create({ data: { schoolId: ids.college!, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true } });
  await person("admin", "ADMIN");
  await person("principal", "PRINCIPAL");
  await person("controller", "EXAM_CONTROLLER");
  await person("tpo", "TPO");
  await person("accounts", "ACCOUNTS");
  await person("librarian", "LIBRARIAN");
  await person("minor", "STUDENT", { isMinor: true, birthdate: new Date("2010-01-01T00:00:00Z") });
  await person("adult", "STUDENT", { isMinor: false, birthdate: new Date("2004-01-01T00:00:00Z") });
  await person("alumnus", "ALUMNUS");
  // A mentor the office has marked, as offerMentorSlot requires: only such an alumnus's times are listed or booked (TA-088).
  await db.alumniProfile.create({ data: { schoolId: ids.college!, membershipId: ids.alumnusM!, userId: ids.alumnus!, mentor: true, mentorAt: new Date() } });
  await person("guardian", null, { prefs: JSON.stringify({ theme: "system", locale: "hi" }) });
  await person("guardianAdult", null);
  await db.guardianship.create({ data: { parentUserId: ids.guardian!, studentMembershipId: ids.minorM!, studentSchoolId: ids.college!, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: ids.guardianAdult!, studentMembershipId: ids.adultM!, studentSchoolId: ids.college!, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  if (savedGigs) await db.gigSettings.update({ where: { id: "gigs" }, data: savedGigs });
  await db.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.college } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("G4-33: texts to an office-entered number", () => {
  it("carry the opt-out line in the guardian's language, and stop for a number that answered STOP or a guardian who switched texts off", async () => {
    const number = `+9198711${SUFFIX}`;
    await db.pupilRecord.create({ data: { schoolId: ids.college!, studentMembershipId: ids.minorM!, guardianPhone: number } });
    await saveMessagingSettings(await as("admin", "ADMIN"), { smsEnabled: true, textOfficePhones: true });
    const send = () => deliverToUser({ schoolId: ids.college!, userId: ids.guardian!, templateKey: "absence", vars: { child: "ZZ Minor" }, purpose: "absence" });
    const out = await send();
    expect(out).toMatchObject({ status: "SENT", skipReason: null });
    const row = await db.outboundMessage.findUniqueOrThrow({ where: { id: out.id } });
    expect([row.to, row.templateKey]).toEqual([number, "absenceOptOut"]);
    expect(row.body).toContain("ये संदेश रोकने के लिए STOP लिखकर भेजें।");
    // Each office-route event has its opt-out form, in all three languages, with the line and the signature.
    for (const [base, form] of Object.entries(OPT_OUT_FORM)) {
      const t = MESSAGE_TEMPLATES[form!];
      expect(t.event, base).toBe(MESSAGE_TEMPLATES[base as keyof typeof MESSAGE_TEMPLATES].event);
      expect([t.text.en, t.text.hi, t.text.mr].map((x) => x.includes("STOP"))).toEqual([true, true, true]);
    }
    // The number answered STOP (the provider's 21610): no more texts to it.
    await db.outboundMessage.update({ where: { id: out.id }, data: { status: "FAILED", error: "21610: Attempt to send to unsubscribed recipient" } });
    expect(await send()).toMatchObject({ status: "SKIPPED", skipReason: "opted-out" });
    // A guardian who switched texts off is not texted at the office's number either.
    await db.outboundMessage.update({ where: { id: out.id }, data: { error: null } });
    await db.user.update({ where: { id: ids.guardian! }, data: { prefs: JSON.stringify({ theme: "system", locale: "hi", channels: { sms: false, whatsapp: false } }) } });
    expect(await send()).toMatchObject({ status: "SKIPPED", skipReason: "opted-out" });
  });
});

describe("G4-30: the college desks have Messages", () => {
  it("opens the messaging doors to the four desks and lets them converse as staff; a module role still has none", async () => {
    const door = (method: string, path: string) => ENDPOINTS.find((e) => e.method === method && e.path === path)!;
    for (const role of ["EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"] as const) {
      for (const [method, path] of [["POST", "/api/v1/messages"], ["GET", "/api/v1/shared/conversations/{conversationId}"], ["POST", "/api/v1/shared/conversations"], ["GET", "/api/v1/shared/people"], ["GET", "/api/v1/shared/inbox"]] as const) {
        expect(permits(door(method, path), role), `${role} ${method} ${path}`).toBe(true);
      }
    }
    expect(permits(door("POST", "/api/v1/messages"), "LIBRARIAN")).toBe(false);
    const tpo = await as("tpo", "TPO");
    const people = (await peopleToMessage(tpo, ids.college!)).map((p) => p.role);
    expect(people).toContain("STUDENT");
    expect(people).not.toContain("LIBRARIAN");
    expect((await openConversation(tpo, ids.college!, ids.adult!)).created).toBe(true);
    expect((await peopleToMessage(await as("adult", "STUDENT"), ids.college!)).map((p) => p.role)).toEqual(expect.arrayContaining(["ACCOUNTS", "EXAM_CONTROLLER", "TPO"]));
  });
});

describe("G4-26: an alumni mentor's session is outside the free allowance", () => {
  it("books an alumnus with the allowance used up, counts nothing for it, and still refuses an expert's", async () => {
    savedGigs = await gigSettings();
    await db.gigSettings.update({ where: { id: "gigs" }, data: { pupilFreeOneToOnes: 1 } });
    await person("expert", null);
    await db.expertProfile.create({ data: { userId: ids.expert!, headline: "ZZ P1B Expert", publishedAt: new Date() } });
    const slot = (provider: string, kind: string, extra: Record<string, unknown> = {}) => db.gigSlot.create({ data: { providerUserId: ids[provider]!, providerKind: kind, kind: "ONE_TO_ONE", title: `ZZ P1B ${provider} ${STAMP}`, startsAt: new Date(Date.now() + 48 * HOUR + Math.random() * HOUR), endsAt: new Date(Date.now() + 49 * HOUR + Math.random() * HOUR), meetingUrl: `https://meet.example.test/zz-${provider}-${STAMP}`, seats: 1, ...extra }, select: { id: true } });
    const used = await slot("expert", "EXPERT");
    const year = await db.academicYear.findFirstOrThrow({ where: { schoolId: ids.college! }, select: { id: true } });
    await db.gigBooking.create({ data: { schoolId: ids.college!, slotId: used.id, studentMembershipId: ids.adultM!, providerUserId: ids.expert!, kind: "ONE_TO_ONE", bookedByUserId: ids.adult!, purpose: "ZZ the one free session", status: "CONFIRMED", academicYearId: year.id } });
    const student = await as("adult", "STUDENT");
    expect((await familySessions(student)).children[0]!.allowance.ONE_TO_ONE).toMatchObject({ allowed: 1, used: 1, left: 0 });
    const mentor = await slot("alumnus", "ALUMNUS", { teacherSchoolId: ids.college! });
    const open = (await familySessions(student)).children[0]!.open.find((o) => o.id === mentor.id);
    expect(open?.freeSeat).toBe(true);
    expect(await bookSeat(student, { slotId: mentor.id, purpose: "ZZ a mock interview before the drive" })).toMatchObject({ ok: true, status: "CONFIRMED" });
    expect((await familySessions(student)).children[0]!.allowance.ONE_TO_ONE).toMatchObject({ used: 1, left: 0 });
    const second = await slot("expert", "EXPERT");
    expect(await bookSeat(student, { slotId: second.id, purpose: "ZZ another expert session please" })).toMatchObject({ ok: false, errorKey: "gigs.refuseAllowanceOneToOne" });
  });
});

describe("G4-13: grace and results reach the student and the family", () => {
  it("tells the student and the minor's guardian of an approved grace and of the published result; an adult's guardian only with the grant", async () => {
    const dept = await db.department.create({ data: { schoolId: ids.college!, code: `ZG${SUFFIX}`, name: "ZZ P1B Dept" }, select: { id: true } });
    const programme = await db.programme.create({ data: { schoolId: ids.college!, departmentId: dept.id, code: "ZZP1BEX", name: "ZZ P1B BSc", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } });
    const scheme = await db.scheme.create({ data: { schoolId: ids.college!, programmeId: programme.id, name: "ZZ scheme", effectiveYear: 2025 }, select: { id: true } });
    const course = await db.course.create({ data: { schoolId: ids.college!, schemeId: scheme.id, code: "ZZP1B201", name: "ZZ Chemistry", semester: 1, creditsL: 4 }, select: { id: true } });
    const term = await db.academicTerm.create({ data: { schoolId: ids.college!, name: "ZZ P1B term", academicYear: "2026–27", startsOn: "2026-06-15", endsOn: "2026-11-30", registrationOpensOn: "2026-06-01", registrationClosesOn: "2026-06-10" }, select: { id: true } });
    const session = await db.examSession.create({ data: { schoolId: ids.college!, name: "ZZ P1B Oct 2026", termId: term.id, status: "ASSESSMENT" }, select: { id: true } });
    for (const who of ["minor", "adult"]) await db.examMark.create({ data: { schoolId: ids.college!, sessionId: session.id, courseId: course.id, studentMembershipId: ids[`${who}M`]!, internalMilli: 20_000, externalMilli: 30_000, matched: true, source: "ENTRY", enteredByUserId: ids.controller! } });
    const grace = (who: string) => db.examGrace.create({ data: { schoolId: ids.college!, sessionId: session.id, courseId: course.id, studentMembershipId: ids[`${who}M`]!, graceMilli: 3_000, rule: "TO_PASS", reason: "ZZ borderline", proposedByUserId: ids.controller! }, select: { id: true } });
    const g1 = await grace("minor");
    const g2 = await grace("adult");
    const principal = await as("principal", "PRINCIPAL");
    await decideGrace(principal, g1.id, { approve: true });
    await decideGrace(principal, g2.id, { approve: true });
    const told = (who: string, key: string) => db.notification.count({ where: { userId: ids[who]!, titleKey: key } });
    expect(await told("minor", "riskDecisions.notifGraceStudent")).toBe(1);
    expect(await told("adult", "riskDecisions.notifGraceStudent")).toBe(1);
    expect(await told("guardian", "riskDecisions.notifGraceFamily")).toBe(1);
    expect(await told("guardianAdult", "riskDecisions.notifGraceFamily")).toBe(0);
    const note = await db.notification.findFirstOrThrow({ where: { userId: ids.guardian!, titleKey: "riskDecisions.notifGraceFamily" }, select: { url: true, kind: true } });
    expect(note).toEqual({ url: "/parent/results", kind: "GRADE" });

    // The adult grants RESULTS to their guardian; then the published result reaches both families.
    await db.studentConsent.create({ data: { schoolId: ids.college!, studentMembershipId: ids.adultM!, grant: "RESULTS" } });
    const run = await db.resultRun.create({ data: { schoolId: ids.college!, sessionId: session.id, number: 1, computedByUserId: ids.controller! }, select: { id: true } });
    for (const who of ["minor", "adult"]) await db.termResult.create({ data: { schoolId: ids.college!, runId: run.id, termId: term.id, studentMembershipId: ids[`${who}M`]!, creditsAttemptedTenths: 40, creditsEarnedTenths: 40, status: "PASS" } });
    await publishRun(await as("controller", "EXAM_CONTROLLER"), session.id, run.id);
    expect(await told("guardian", "riskDecisions.notifResultFamily")).toBe(1);
    expect(await told("guardianAdult", "riskDecisions.notifResultFamily")).toBe(1);
    expect(await told("minor", "examCell.notifyResult")).toBe(1);
  });
});

describe("G4-21: a periodical's subscription and volumes", () => {
  it("records volumes and a subscription on a periodical, refuses both on a book, and removes a volume", async () => {
    const journal = await db.libraryTitle.create({ data: { schoolId: ids.college!, title: "ZZ P1B Journal of Chemistry", category: "PERIODICAL" }, select: { id: true } });
    const book = await db.libraryTitle.create({ data: { schoolId: ids.college!, title: "ZZ P1B Textbook", category: "TEXTBOOK" }, select: { id: true } });
    const desk = await as("librarian", "LIBRARIAN");
    const sub = await savePeriodicalSubscription(desk, journal.id, { frequency: "MONTHLY", subscriptionFrom: "2026-01-01", subscriptionUntil: "2099-12-31" });
    expect(sub).toMatchObject({ frequency: "MONTHLY", active: true, canEdit: true, volumes: [] });
    await expect(savePeriodicalSubscription(desk, journal.id, { frequency: "MONTHLY", subscriptionFrom: "2026-02-01", subscriptionUntil: "2026-01-01" })).rejects.toMatchObject({ key: "riskDecisions.refuseSubscriptionWindow", status: 422 });
    const one = await addVolume(desk, journal.id, { volume: "12", issue: "3", receivedOn: "2026-09-15" });
    await addVolume(desk, journal.id, { volume: "12", issue: "4", receivedOn: "2026-10-01" });
    expect(one.volumes.map((v) => `${v.volume}/${v.issue}`)).toEqual(["12/3"]);
    await expect(addVolume(desk, journal.id, { volume: "12", issue: "3", receivedOn: "2026-09-16" })).rejects.toMatchObject({ key: "riskDecisions.refuseVolumeTaken", status: 409 });
    await expect(addVolume(desk, book.id, { volume: "1", issue: "", receivedOn: "2026-09-15" })).rejects.toMatchObject({ key: "riskDecisions.refuseVolumeNotPeriodical", status: 409 });
    await expect(savePeriodicalSubscription(desk, book.id, { frequency: "ANNUAL", subscriptionFrom: null, subscriptionUntil: null })).rejects.toMatchObject({ key: "riskDecisions.refuseSubscriptionOnBook" });
    const read = await periodicalView(await as("principal", "PRINCIPAL"), journal.id);
    expect(read.volumes.map((v) => `${v.volume}/${v.issue}`)).toEqual(["12/4", "12/3"]);
    expect(read.canEdit).toBe(false);
    await expect(addVolume(await as("principal", "PRINCIPAL"), journal.id, { volume: "13", issue: "1", receivedOn: "2026-10-02" })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    const after = await removeVolume(await as("librarian", "LIBRARIAN"), journal.id, read.volumes[0]!.id);
    expect(after.volumes.map((v) => `${v.volume}/${v.issue}`)).toEqual(["12/3"]);
    expect(await db.auditLog.count({ where: { schoolId: ids.college!, action: { in: ["library.volume.add", "library.volume.remove", "library.subscription.save"] } } })).toBe(4);
  });
});
