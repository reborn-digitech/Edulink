/**
 * The placement cell's drives, offers and the student's page: findings of the
 * college-placement batch of the testing analysis of 13 November 2026, each
 * held by a case that FAILED on the code of that day and passes once fixed.
 *
 *   TA-086  withdrawing (or applying again) answered the round feedback the
 *           recorder had kept from the student
 *   TA-087  "no live backlogs" passed a student with no exam record at all
 *   TA-088  a mentor the office un-marked, muted or closed kept bookable times
 *   TA-562  a pooled drive could not be closed once a guest switched PLACEMENT off
 *   TA-311  the IQAC could download every offer of a batch by student name
 *   TA-312  recording an offer again cleared the student's decline
 *   TA-313  "joined" on an offer given up, and on a day that is not a day
 *   TA-314  three web forms skipped the doors' schemas
 *   TA-573  two adds of one new company at once: the loser answered 500
 *   TA-315  the student's page read the whole roll once for every drive
 *
 * Scratch ZZ colleges of this suite's own (made through the owner connection,
 * removed after); nothing of any fixture is read or written.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

import { driveSaveSchema, gstinCheckChar, roundResultsSaveSchema } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { db as appDb } from "@/lib/db";
import { addCompany, answerOffer, applyToDrive, cellActor, driveEligibility, openDrive, recordJoined, recordOffer, recordRoundResults, setDreamFlag, studentDrives, updateDrive, withdrawApplication } from "@/lib/placement";
import { mentorSlotsAt } from "@/lib/placement-student";
import { placementExport } from "@/lib/placement-analytics";
import { setAlumnusMentor, setAlumnusMuted } from "@/lib/alumni";
import { bookSeat } from "@/lib/gig-sessions";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { decideInternshipAction, joinedAction, publishSeasonAction } from "@/app/(app)/placement/actions";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tacp-${who.toLowerCase()}-${STAMP}@test.invalid`;
const TODAY = todayKey("Asia/Kolkata");
const ids: Record<string, string> = {};
const OPEN_RULE = { cgpaMin: null, noLiveBacklogs: false, programmeIds: [] as string[], batchYear: null, genders: [] as string[] };

async function as(who: string, role: string, school: "host" | "guest" = "host"): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[`${who}User`]!, { schoolId: ids[school]!, role: role as never });
  const s = await getSession();
  if (!s) throw new Error(`no session for ${who}`);
  return s;
}

async function settle<T>(run: () => Promise<T>): Promise<{ value: T } | { error: { key?: string; status?: number; field?: string; code?: string } }> {
  try {
    return { value: await run() };
  } catch (error) {
    return { error: error as { key?: string; status?: number; field?: string } };
  }
}

/** A drive of the host's, opened by its TPO and moved to OPEN. */
async function openedDrive(title: string, extra: { rule?: typeof OPEN_RULE; min?: number; max?: number; kind?: "ON_CAMPUS" | "POOLED"; pool?: string[] } = {}): Promise<string> {
  const tpo = await as("tpo", "TPO");
  const d = await openDrive(tpo, driveSaveSchema.parse({ companyId: ids.company, kind: extra.kind ?? "ON_CAMPUS", title, packageMinRupees: extra.min ?? 600_000, packageMaxRupees: extra.max ?? 600_000, rounds: [{ n: 1, kind: "TECHNICAL_INTERVIEW" }], rule: extra.rule ?? OPEN_RULE, poolSchoolIds: extra.pool ?? [] }));
  await updateDrive(await as("tpo", "TPO"), d.id, { status: "OPEN" });
  return d.id;
}

function form(fields: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

beforeAll(async () => {
  const mkSchool = (tag: string) => db.school.create({ data: { name: `ZZ TACP ${tag} ${STAMP}`, slug: `zz-tacp-${tag.toLowerCase()}-${STAMP}`, code: `ZQ${tag[0]}${SUFFIX}`, kind: "COLLEGE", contactEmail: MAIL(`school-${tag}`), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } });
  ids.host = (await mkSchool("Host")).id;
  ids.guest = (await mkSchool("Guest")).id;
  await db.schoolModule.createMany({ data: [ids.host, ids.guest].flatMap((schoolId) => ["PLACEMENT", "ALUMNI", "ACADEMICS"].map((module) => ({ schoolId, module }))) });
  const person = async (who: string, school: "host" | "guest", role: string, extra: { joinedAt?: Date } = {}) => {
    const u = await db.user.create({ data: { name: `ZZ TACP ${who}`, email: MAIL(who) }, select: { id: true } });
    ids[`${who}User`] = u.id;
    ids[who] = (await db.membership.create({ data: { userId: u.id, schoolId: ids[school]!, role, status: "ACTIVE", ...extra }, select: { id: true } })).id;
  };
  await person("tpo", "host", "TPO");
  await person("admin", "host", "ADMIN");
  await person("iqac", "host", "IQAC");
  await person("hod", "host", "HOD");
  for (const s of ["s1", "s2", "s3", "s4"]) await person(s, "host", "STUDENT");
  await person("mentor", "host", "ALUMNUS", { joinedAt: new Date("2024-05-31T00:00:00Z") });
  await db.alumniProfile.create({ data: { schoolId: ids.host!, membershipId: ids.mentor!, userId: ids.mentorUser!, mentor: true, mentorAt: new Date() } });

  // A published result for S1, S3 and S4 (no backlog); S2 has a seat and no exam record at all.
  const dept = await db.department.create({ data: { schoolId: ids.host!, code: `ZQD${SUFFIX}`, name: "ZZ TACP dept" }, select: { id: true } });
  const prog = await db.programme.create({ data: { schoolId: ids.host!, departmentId: dept.id, code: `ZQP${SUFFIX}`, name: "ZZ TACP BTech", level: "UG", durationYears: 4, regulator: "AICTE" }, select: { id: true } });
  const scheme = await db.scheme.create({ data: { schoolId: ids.host!, programmeId: prog.id, name: "ZZ TACP scheme", effectiveYear: 2023 }, select: { id: true } });
  for (const s of ["s1", "s2", "s3", "s4"]) await db.studentProgramme.create({ data: { schoolId: ids.host!, studentMembershipId: ids[s]!, programmeId: prog.id, schemeId: scheme.id, entryYear: 2023 } });
  const session = await db.examSession.create({ data: { schoolId: ids.host!, name: "ZZ TACP Winter", kind: "REGULAR", termId: `zz-tacp-term-${STAMP}`, status: "PUBLISHED" }, select: { id: true } });
  const run = await db.resultRun.create({ data: { schoolId: ids.host!, sessionId: session.id, number: 1, status: "PUBLISHED", computedByUserId: ids.adminUser!, publishedAt: new Date() }, select: { id: true } });
  for (const s of ["s1", "s3", "s4"]) await db.courseResult.create({ data: { schoolId: ids.host!, runId: run.id, studentMembershipId: ids[s]!, courseId: `zz-tacp-course-${STAMP}`, creditsTenths: 100, totalMilli: 70_000, maxMilli: 100_000, grade: "A", pointsTenths: 80, status: "PASS" } });

  const first14 = `27AAZQC${SUFFIX.slice(0, 4)}Z1Z`;
  ids.company = (await db.company.create({ data: { name: `ZZ TACP Co ${STAMP}`, identifier: `${first14}${gstinCheckChar(first14)}`, sectors: JSON.stringify(["IT_SOFTWARE"]), pointOfContact: "ZZ", verifiedAt: new Date() }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  vi.restoreAllMocks();
  const schools = [ids.host, ids.guest].filter((x): x is string => Boolean(x));
  const users = (await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } })).map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.gigBooking.deleteMany({ where: { slot: { providerUserId: { in: users } } } });
  await db.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: { in: users } }] } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.company.deleteMany({ where: { name: { contains: String(STAMP) } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("TA-086: the student is never answered feedback the recorder kept from them", () => {
  it("TA-086: withdrawing, and applying again, answer the round with its unshared feedback as null", async () => {
    const driveId = await openedDrive("ZZ TACP feedback");
    await applyToDrive(await as("s1", "STUDENT"), driveId);
    const tpo = await as("tpo", "TPO");
    await recordRoundResults(await cellActor(tpo, driveId), roundResultsSaveSchema.parse({ round: 0, results: [{ studentMembershipId: ids.s1, outcome: "REJECTED", feedback: "ZZ private note for the panel", feedbackShared: false }] }));
    const withdrawn = await withdrawApplication(await as("s1", "STUDENT"), driveId);
    expect(withdrawn.results.map((r) => r.feedback)).toEqual([null]);
    // The same view again, for a withdrawal already made.
    expect((await withdrawApplication(await as("s1", "STUDENT"), driveId)).results.map((r) => r.feedback)).toEqual([null]);
    // Applying again keeps the old round rows; the answer holds the note back too.
    await db.drive.update({ where: { id: driveId }, data: { status: "OPEN" } });
    const again = await applyToDrive(await as("s1", "STUDENT"), driveId);
    expect(again.results.map((r) => r.feedback)).toEqual([null]);
  });
});

describe("TA-087: no exam record is not 'no live backlogs'", () => {
  it("TA-087: a student with no published result fails BACKLOGS_UNKNOWN and cannot apply; one with results and none open passes", async () => {
    const driveId = await openedDrive("ZZ TACP backlogs", { rule: { ...OPEN_RULE, noLiveBacklogs: true } });
    const rows = (await driveEligibility(await as("tpo", "TPO"), driveId)).rows;
    const s2 = rows.find((r) => r.studentMembershipId === ids.s2)!;
    expect(s2.failed.map((f) => f.code)).toEqual(["BACKLOGS_UNKNOWN"]);
    expect(s2.record.liveBacklogs).toBeNull();
    expect(rows.find((r) => r.studentMembershipId === ids.s1)!.record.liveBacklogs).toBe(0);
    const applied = await settle(async () => applyToDrive(await as("s2", "STUDENT"), driveId));
    expect("error" in applied ? { key: applied.error.key, status: applied.error.status } : "applied").toEqual({ key: "placement.refuseNotEligible", status: 409 });
  });
});

describe("TA-088: a mentor the office has stood down offers nothing a student can book", () => {
  async function slot(days: number): Promise<string> {
    const startsAt = new Date(Date.now() + days * 86_400_000);
    return (await db.gigSlot.create({ data: { providerUserId: ids.mentorUser!, providerKind: "ALUMNUS", teacherSchoolId: ids.host!, kind: "ONE_TO_ONE", title: `ZZ TACP mock ${days}`, startsAt, endsAt: new Date(startsAt.getTime() + 1_800_000), meetingUrl: "https://meet.jit.si/zz-tacp", seats: 1, pricePaise: 0 }, select: { id: true } })).id;
  }
  async function bookable(slotId: string): Promise<boolean> {
    await as("s3", "STUDENT");
    const listed = (await mentorSlotsAt(ids.host!)).some((s) => s.id === slotId);
    const booked = await settle(async () => bookSeat(await as("s3", "STUDENT"), { slotId, purpose: "ZZ practice for the interview round" }));
    if ("value" in booked && booked.value.ok) throw new Error("booked a stood-down mentor's time");
    return listed || ("error" in booked ? booked.error.key !== "gigs.noSuchSlot" : true);
  }

  it("TA-088: un-marked as a mentor, the time leaves the student's page and cannot be booked", async () => {
    const id = await slot(3);
    await setAlumnusMentor(await as("admin", "ADMIN"), ids.mentor!, false);
    expect(await bookable(id)).toBe(false);
    await setAlumnusMentor(await as("admin", "ADMIN"), ids.mentor!, true);
  });

  it("TA-088: muted by the office, the same", async () => {
    const id = await slot(4);
    await setAlumnusMuted(await as("admin", "ADMIN"), ids.mentor!, true, "ZZ TACP reason");
    expect(await bookable(id)).toBe(false);
    await setAlumnusMuted(await as("admin", "ADMIN"), ids.mentor!, false);
  });

  it("TA-088: the alumnus row closed, the same; a mentor in standing is still listed", async () => {
    const standing = await slot(5);
    await as("s3", "STUDENT");
    expect((await mentorSlotsAt(ids.host!)).map((s) => s.id)).toContain(standing);
    await db.membership.update({ where: { id: ids.mentor! }, data: { leftAt: new Date() } });
    expect(await bookable(standing)).toBe(false);
    await db.membership.update({ where: { id: ids.mentor! }, data: { leftAt: null } });
  });
});

describe("TA-312: a declined offer is answered", () => {
  it("TA-312: recording the offer again after the student declined is refused, and the decline stands", async () => {
    const driveId = await openedDrive("ZZ TACP decline");
    await applyToDrive(await as("s3", "STUDENT"), driveId);
    const offer = await recordOffer(await cellActor(await as("tpo", "TPO"), driveId), { studentMembershipId: ids.s3!, packageRupees: 600_000, letterFileId: null });
    await answerOffer(await as("s3", "STUDENT"), offer.id, false);
    const again = await settle(async () => recordOffer(await cellActor(await as("tpo", "TPO"), driveId), { studentMembershipId: ids.s3!, packageRupees: 600_000, letterFileId: null }));
    expect("error" in again ? again.error.key : "recorded again").toBe("placement.refuseOfferAnswered");
    expect((await db.offer.findUniqueOrThrow({ where: { id: offer.id }, select: { declinedAt: true } })).declinedAt).not.toBeNull();
  });
});

describe("TA-313 and TA-314: the joining day", () => {
  it("TA-313: an accepted offer the student later gave up for a dream offer takes no joining; a day that is no day, or one after today, is a 422", async () => {
    const a = await openedDrive("ZZ TACP first", { min: 600_000, max: 600_000 });
    const b = await openedDrive("ZZ TACP dream", { min: 1_000_000, max: 1_000_000 });
    await applyToDrive(await as("s4", "STUDENT"), a);
    await applyToDrive(await as("s4", "STUDENT"), b);
    const first = await recordOffer(await cellActor(await as("tpo", "TPO"), a), { studentMembershipId: ids.s4!, packageRupees: 600_000, letterFileId: null });
    await answerOffer(await as("s4", "STUDENT"), first.id, true);
    await setDreamFlag(await as("tpo", "TPO"), ids.s4!, true);
    const dream = await recordOffer(await cellActor(await as("tpo", "TPO"), b), { studentMembershipId: ids.s4!, packageRupees: 1_000_000, letterFileId: null });
    await answerOffer(await as("s4", "STUDENT"), dream.id, true);
    ids.dreamOffer = dream.id;
    expect((await db.offer.findUniqueOrThrow({ where: { id: first.id }, select: { declinedAt: true } })).declinedAt).not.toBeNull();

    const onGivenUp = await settle(async () => recordJoined(await cellActor(await as("tpo", "TPO"), a), first.id, TODAY));
    expect("error" in onGivenUp ? { key: onGivenUp.error.key, status: onGivenUp.error.status } : "joined").toEqual({ key: "placement.refuseJoinNotAccepted", status: 409 });
    const noDay = await settle(async () => recordJoined(await cellActor(await as("tpo", "TPO"), b), dream.id, "2026-13-45"));
    expect("error" in noDay ? { status: noDay.error.status, field: noDay.error.field } : "joined").toEqual({ status: 422, field: "joinedOn" });
    const ahead = await settle(async () => recordJoined(await cellActor(await as("tpo", "TPO"), b), dream.id, addDaysToKey(TODAY, 400)));
    expect("error" in ahead ? { status: ahead.error.status, field: ahead.error.field } : "joined").toEqual({ status: 422, field: "joinedOn" });
    expect((await db.offer.findUniqueOrThrow({ where: { id: dream.id }, select: { joinedAt: true } })).joinedAt).toBeNull();
    // Today, on the offer that stands, is recorded.
    const joined = await recordJoined(await cellActor(await as("tpo", "TPO"), b), dream.id, TODAY);
    expect(joined.joinedAt?.slice(0, 10)).toBe(TODAY);
  });

  it("TA-314: the joined form refuses a day that is no day under its box, through the door's schema", async () => {
    await as("tpo", "TPO");
    const state = await joinedAction({ ok: false }, form({ offerId: ids.dreamOffer!, joinedOn: "2026-13-45", back: "/placement" }));
    expect({ ok: state.ok, field: state.field }).toEqual({ ok: false, field: "joinedOn" });
  });

  it("TA-314: the season form refuses a batch year the door refuses, and stores no row", async () => {
    await as("tpo", "TPO");
    const state = await publishSeasonAction({ ok: false }, form({ batchYear: "5", back: "/placement/analytics" }));
    expect(state.ok).toBe(false);
    expect(await db.placementSeason.count({ where: { schoolId: ids.host!, batchYear: 5 } })).toBe(0);
  });

  it("TA-314: the internship refusal's reason is held to the door's 500 characters", async () => {
    const row = await db.internship.create({ data: { schoolId: ids.host!, studentMembershipId: ids.s1!, companyName: "ZZ TACP Intern Co", kind: "INDUSTRY", fromKey: "2026-06-01", toKey: "2026-06-30", hours: 600, windowSemester: 6, supervisorName: "ZZ" }, select: { id: true } });
    await as("tpo", "TPO");
    const state = await decideInternshipAction({ ok: false }, form({ internshipId: row.id, approve: "0", reason: "ZZ ".repeat(300), back: "/placement/internships" }));
    expect(state.ok).toBe(false);
    expect((await db.internship.findUniqueOrThrow({ where: { id: row.id }, select: { status: true } })).status).toBe("PROPOSED");
  });
});

describe("TA-311: the IQAC files from the table, never a student's row", () => {
  it("TA-311: the IQAC reads the NBA and NIRF sheets, and is refused the named offers sheet the cell keeps", async () => {
    const iqac = await as("iqac", "IQAC");
    expect((await placementExport(iqac, "NBA")).filename).toBe("placement-nba.csv");
    expect((await placementExport(await as("iqac", "IQAC"), "NIRF")).filename).toBe("placement-nirf.csv");
    const offers = await settle(async () => placementExport(await as("iqac", "IQAC"), "OFFERS"));
    expect("error" in offers ? offers.error.key : "downloaded").toBe("access.wrongRoleForThisAction");
    // The cell itself still downloads it.
    expect((await placementExport(await as("tpo", "TPO"), "OFFERS")).filename).toMatch(/^placement-offers-/);
  });
});

describe("TA-573: two adds of one new company at once", () => {
  it("TA-573: every press is answered with the one company, linked once", async () => {
    const first14 = `27AAZQR${SUFFIX.slice(0, 4)}Z1Z`;
    const input = { name: `ZZ TACP Race ${STAMP}`, identifier: `${first14}${gstinCheckChar(first14)}`, sectors: ["IT_SOFTWARE" as const], pointOfContact: "ZZ desk" };
    const tpo = await as("tpo", "TPO");
    const answers = await Promise.all([1, 2, 3].map(() => settle(() => addCompany(tpo, input))));
    const said = answers.map((a) => ("error" in a ? `refused ${a.error.key ?? a.error.code ?? String(a.error)}` : a.value.id));
    const made = await db.company.findMany({ where: { identifier: input.identifier }, select: { id: true } });
    expect(made).toHaveLength(1);
    expect(said).toEqual([made[0]!.id, made[0]!.id, made[0]!.id]);
    expect(await db.companyTenantLink.count({ where: { companyId: made[0]!.id } })).toBe(1);
  });
});

describe("TA-562: a pooled drive whose guest switched placement off", () => {
  it("TA-562: the host still closes it", async () => {
    const driveId = await openedDrive("ZZ TACP pooled", { kind: "POOLED", pool: [ids.guest!] });
    await db.schoolModule.deleteMany({ where: { schoolId: ids.guest!, module: "PLACEMENT" } });
    const closed = await settle(async () => updateDrive(await as("tpo", "TPO"), driveId, { status: "CLOSED" }));
    expect("error" in closed ? `refused ${closed.error.key}` : closed.value.status).toBe("CLOSED");
    // A guest named now is still checked against the directory.
    const named = await settle(async () => openDrive(await as("tpo", "TPO"), driveSaveSchema.parse({ companyId: ids.company, kind: "POOLED", title: "ZZ TACP pooled two", packageMinRupees: 1, packageMaxRupees: 1, rule: OPEN_RULE, poolSchoolIds: [ids.guest] })));
    expect("error" in named ? named.error.key : "opened").toBe("placement.refusePoolSchool");
  });
});

describe("TA-315: the student's page reads the roll once, not once per drive", () => {
  it("TA-315: with six drives in view, the student's drives are read with a fixed number of roll reads", async () => {
    for (let i = 0; i < 6; i += 1) await openedDrive(`ZZ TACP many ${i}`);
    const me = await as("s1", "STUDENT");
    const visible = await studentDrives({ schoolId: me.schoolId!, membershipId: me.membershipId! });
    expect(visible.length).toBeGreaterThanOrEqual(6);
    const original = appDb.membership.findMany.bind(appDb.membership);
    const spy = vi.spyOn(appDb.membership, "findMany").mockImplementation(((args: never) => original(args)) as never);
    await as("s1", "STUDENT");
    const again = await studentDrives({ schoolId: me.schoolId!, membershipId: me.membershipId! });
    const reads = spy.mock.calls.length;
    spy.mockRestore();
    expect(again.map((d) => [d.drive.id, d.eligible, d.application?.id ?? null])).toEqual(visible.map((d) => [d.drive.id, d.eligible, d.application?.id ?? null]));
    // The spy sees the reads (the roll's among them), and there are no more of them than one student's page needs.
    expect(reads).toBeGreaterThan(0);
    expect(reads).toBeLessThanOrEqual(2);
  });
});
