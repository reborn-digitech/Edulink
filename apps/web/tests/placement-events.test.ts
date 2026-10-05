/**
 * PRE-PLACEMENT TALKS AND SOFT-SKILLS TRAINING (the risks batch, R-2,
 * package 5B, 5 October 2026), at an engineering college of this suite's own
 * (PLACEMENT on by its stream), through the library and the /api/v1 doors.
 *
 * What is proved: the TPO sets a talk tied to a drive (one talk a drive, never
 * in the past), students answer GOING and NOT_GOING up to the seats, answers
 * close once it starts, attendance opens then and is the TPO's alone (a
 * walk-in too, never someone off the roll), a held talk cannot be moved, a
 * cancellation tells those going; a training's completion is computed from
 * the marks at its share of the sessions not cancelled, the TPO's count and
 * the student's placement profile read the same rule, a marked session cannot
 * be cancelled, a session is marked only once it has started and only for
 * students on its roll, and the wrong role is refused before the body.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { RuleRefusal } from "@/lib/rule-refusal";
import { answerTalk, createTalk, listTalks, markTalkAttendance, studentTalks, talkDetail, talkForDrive, updateTalk } from "@/lib/placement-talks";
import { addTrainingSession, createTraining, enrolSelf, listTrainings, markTrainingSession, setEnrolment, setSessionCancelled, studentTrainings, trainingDetail } from "@/lib/soft-skills";
import { studentPlacement } from "@/lib/placement-student";
import { listPlacementStudents } from "@/lib/placement";
import { softSkillsCompleted } from "@edulink/contracts";
import { POST as talksPost } from "@/app/api/v1/placement/talks/route";
import { POST as rsvpPost } from "@/app/api/v1/student/placement/talks/[talkId]/rsvp/route";
import { GET as myTrainingsGet } from "@/app/api/v1/student/placement/trainings/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ppe-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const HOUR = 3_600_000;
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.college!, role: role as never });
  return (await getSession()) as ActiveContext;
}
async function person(who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ PPE ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role, status: "ACTIVE" }, select: { id: true } })).id;
}
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <K extends string>(p: Record<K, string>) => ({ params: Promise.resolve(p) });
async function refusal(work: Promise<unknown>): Promise<string> {
  try {
    await work;
  } catch (e) {
    return (e as { key?: string }).key ?? String(e);
  }
  return "no refusal";
}

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ PPE Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { name: `ZZ PPE College ${STAMP}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", kind: "COLLEGE", streams: ["ENGINEERING"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.college = made.schoolId;
  await db.school.update({ where: { id: ids.college }, data: { isTestFixture: true } });
  for (const [who, role] of [["tpo", "TPO"], ["admin", "ADMIN"], ["faculty", "FACULTY"], ["s1", "STUDENT"], ["s2", "STUDENT"], ["s3", "STUDENT"]] as const) await person(who, role);
  const company = await db.company.create({ data: { name: `ZZ PPE Co ${STAMP}`, identifier: `U29100MH2015PTC${String(STAMP).slice(-6)}`, pointOfContact: "ZZ", createdByUserId: ids.tpo, verifiedAt: new Date() }, select: { id: true } });
  ids.company = company.id;
  const drive = (title: string, status: string) => db.drive.create({ data: { schoolId: ids.college!, companyId: company.id, kind: "ON_CAMPUS", title, packageMinRupees: 500_000, packageMaxRupees: 600_000, status, createdByUserId: ids.tpo! }, select: { id: true } });
  ids.drive = (await drive("ZZ PPE open drive", "OPEN")).id;
  ids.closedDrive = (await drive("ZZ PPE closed drive", "CLOSED")).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.notification.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  if (ids.college) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.college }, { targetId: ids.college }] } });
    await db.school.deleteMany({ where: { id: ids.college } });
  }
  if (ids.company) await db.company.deleteMany({ where: { id: ids.company } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: users.map((u) => u.id) } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a pre-placement talk", () => {
  it("is set by the TPO for a drive, once, ahead of now, and the drive finds it", async () => {
    const tpo = await as("tpo", "TPO");
    const startsAt = new Date(Date.now() + 48 * HOUR).toISOString();
    expect(await refusal(createTalk(tpo, { title: "ZZ talk", companyName: "ZZ Co", driveId: ids.drive, startsAt: new Date(Date.now() - HOUR).toISOString(), durationMinutes: 60, venue: "", note: "", capacity: 1 }))).toBe("talks.refusePast");
    expect(await refusal(createTalk(tpo, { title: "ZZ talk", companyName: "ZZ Co", driveId: ids.closedDrive, startsAt, durationMinutes: 60, venue: "", note: "", capacity: 1 }))).toBe("talks.refuseDriveClosed");
    const talk = await createTalk(tpo, { title: "ZZ talk", companyName: "ZZ Co", driveId: ids.drive, startsAt, durationMinutes: 60, venue: "ZZ Hall", note: "", capacity: 1 });
    ids.talk = talk.id;
    expect(talk.driveTitle).toBe("ZZ PPE open drive");
    expect(talk.roster.map((r) => r.studentMembershipId).sort()).toEqual([ids.s1M, ids.s2M, ids.s3M].sort());
    expect(await refusal(createTalk(tpo, { title: "ZZ again", companyName: "ZZ Co", driveId: ids.drive, startsAt, durationMinutes: 60, venue: "", note: "", capacity: null }))).toBe("talks.refuseDriveHasTalk");
    expect((await talkForDrive(tpo, ids.drive!))?.id).toBe(talk.id);
    expect((await db.auditLog.count({ where: { schoolId: ids.college, action: "placement.talk.create" } }))).toBe(1);
  });

  it("is answered by students up to the seats, the same answer twice changing nothing", async () => {
    const s1 = await as("s1", "STUDENT");
    expect((await answerTalk(s1, ids.talk!, "GOING")).mine).toEqual({ answer: "GOING", attendance: null });
    expect((await answerTalk(s1, ids.talk!, "GOING")).counts.going).toBe(1);
    const s2 = await as("s2", "STUDENT");
    expect(await refusal(answerTalk(s2, ids.talk!, "GOING"))).toBe("talks.refuseFull");
    expect((await answerTalk(s2, ids.talk!, "NOT_GOING")).counts).toMatchObject({ going: 1, notGoing: 1 });
    const mine = await studentTalks(s2);
    expect(mine.talks[0]).toMatchObject({ id: ids.talk, canAnswer: false, mine: { answer: "NOT_GOING", attendance: null } });
  });

  it("refuses the wrong role at the door before the body, and a student's malformed answer with 422", async () => {
    await as("s1", "STUDENT");
    expect((await talksPost(json("/api/v1/placement/talks", {}))).status).toBe(403);
    await as("tpo", "TPO");
    expect((await rsvpPost(json(`/api/v1/student/placement/talks/${ids.talk}/rsvp`, { answer: "GOING" }), params({ talkId: ids.talk! }))).status).toBe(403);
    await as("s1", "STUDENT");
    expect((await rsvpPost(json(`/api/v1/student/placement/talks/${ids.talk}/rsvp`, { answer: "MAYBE" }), params({ talkId: ids.talk! }))).status).toBe(422);
  });

  it("opens attendance when it starts: the TPO marks walk-ins too, never someone off the roll; answers close; a held talk is fixed", async () => {
    const tpo = await as("tpo", "TPO");
    expect(await refusal(markTalkAttendance(tpo, ids.talk!, { marks: [{ studentMembershipId: ids.s1M!, attendance: "PRESENT" }] }))).toBe("talks.refuseNotStarted");
    // The clock moves past the start.
    const later = new Date(Date.now() + 49 * HOUR);
    const s3 = await as("s3", "STUDENT");
    expect(await refusal(answerTalk(s3, ids.talk!, "GOING", later))).toBe("talks.refuseStarted");
    const tpo2 = await as("tpo", "TPO");
    expect(await refusal(markTalkAttendance(tpo2, ids.talk!, { marks: [{ studentMembershipId: ids.facultyM!, attendance: "PRESENT" }] }, later))).toBe("talks.refuseNotOnRoll");
    const r = await markTalkAttendance(tpo2, ids.talk!, { marks: [{ studentMembershipId: ids.s1M!, attendance: "PRESENT" }, { studentMembershipId: ids.s2M!, attendance: "ABSENT" }, { studentMembershipId: ids.s3M!, attendance: "PRESENT" }] }, later);
    expect(r.saved).toBe(3);
    expect(r.talk.counts).toMatchObject({ going: 1, notGoing: 1, present: 2, absent: 1 });
    expect(r.talk.roster.find((x) => x.studentMembershipId === ids.s3M)).toMatchObject({ answer: null, attendance: "PRESENT" });
    expect(r.talk.heldAt).not.toBeNull();
    expect(await refusal(updateTalk(tpo2, ids.talk!, { status: "CANCELLED" }, later))).toBe("talks.refuseHeld");
    // The faculty member is not the cell.
    const fac = await as("faculty", "FACULTY");
    expect(await refusal(talkDetail(fac, ids.talk!))).toBe("access.wrongRoleForThisAction");
    void tpo;
  });

  it("tells those going when a talk is cancelled", async () => {
    const tpo = await as("tpo", "TPO");
    const t2 = await createTalk(tpo, { title: "ZZ second talk", companyName: "ZZ Co", driveId: null, startsAt: new Date(Date.now() + 72 * HOUR).toISOString(), durationMinutes: 45, venue: "", note: "", capacity: null });
    const s2 = await as("s2", "STUDENT");
    await answerTalk(s2, t2.id, "GOING");
    const tpoAgain = await as("tpo", "TPO");
    const cancelled = await updateTalk(tpoAgain, t2.id, { status: "CANCELLED" });
    expect(cancelled.status).toBe("CANCELLED");
    expect(await db.notification.count({ where: { userId: ids.s2, titleKey: "talks.notifCancelled" } })).toBe(1);
    expect((await listTalks(tpoAgain)).talks.map((x) => x.id)).toContain(t2.id);
  });
});

describe("soft-skills training", () => {
  it("completes at the share of the sessions not cancelled, rounded up", () => {
    expect(softSkillsCompleted(3, 4, 75)).toBe(true);
    expect(softSkillsCompleted(2, 4, 75)).toBe(false);
    expect(softSkillsCompleted(2, 3, 75)).toBe(false);
    expect(softSkillsCompleted(3, 3, 75)).toBe(true);
    expect(softSkillsCompleted(1, 1, 1)).toBe(true);
    expect(softSkillsCompleted(0, 0, 75)).toBe(false);
  });

  it("is made by the TPO; students enrol up to the seats; sessions are marked once started, for the roll only", async () => {
    const tpo = await as("tpo", "TPO");
    const tr = await createTraining(tpo, { title: "ZZ Interviews", skill: "INTERVIEW", trainer: "ZZ Trainer", description: "", capacity: 2, minAttendancePercent: 75 });
    ids.training = tr.id;
    const past = (h: number) => new Date(Date.now() - h * HOUR).toISOString();
    for (const h of [72, 48, 24]) await addTrainingSession(tpo, tr.id, { startsAt: past(h), durationMinutes: 60, topic: "", venue: "" });
    const withFuture = await addTrainingSession(tpo, tr.id, { startsAt: new Date(Date.now() + 24 * HOUR).toISOString(), durationMinutes: 60, topic: "ZZ mock", venue: "" });
    const [a, b, c, future] = withFuture.sessionList.map((x) => x.id) as [string, string, string, string];
    const s1 = await as("s1", "STUDENT");
    expect((await enrolSelf(s1, tr.id, true)).mine).toMatchObject({ enrolled: true, attended: 0, completed: false });
    const tpo2 = await as("tpo", "TPO");
    await setEnrolment(tpo2, tr.id, { studentMembershipIds: [ids.s2M!], remove: false });
    const s3 = await as("s3", "STUDENT");
    expect(await refusal(enrolSelf(s3, tr.id, true))).toBe("softSkills.refuseFull");
    const tpo3 = await as("tpo", "TPO");
    expect(await refusal(markTrainingSession(tpo3, tr.id, a, { marks: [{ studentMembershipId: ids.s3M!, present: true }] }))).toBe("softSkills.refuseNotEnrolled");
    expect(await refusal(markTrainingSession(tpo3, tr.id, future, { marks: [{ studentMembershipId: ids.s1M!, present: true }] }))).toBe("softSkills.refuseNotStarted");
    // s1 at all three held sessions; s2 at one of them.
    await markTrainingSession(tpo3, tr.id, a, { marks: [{ studentMembershipId: ids.s1M!, present: true }, { studentMembershipId: ids.s2M!, present: true }] });
    await markTrainingSession(tpo3, tr.id, b, { marks: [{ studentMembershipId: ids.s1M!, present: true }, { studentMembershipId: ids.s2M!, present: false }] });
    const after = await markTrainingSession(tpo3, tr.id, c, { marks: [{ studentMembershipId: ids.s1M!, present: true }, { studentMembershipId: ids.s2M!, present: false }] });
    // Four sessions not cancelled at 75 %: three needed. s1 has three.
    expect(after.training.roster.find((r) => r.studentMembershipId === ids.s1M)).toMatchObject({ attended: 3, completed: true });
    expect(after.training.roster.find((r) => r.studentMembershipId === ids.s2M)).toMatchObject({ attended: 1, completed: false });
    expect(await refusal(setSessionCancelled(tpo3, tr.id, a, true))).toBe("softSkills.refuseMarkedSession");
    expect((await db.auditLog.count({ where: { schoolId: ids.college, action: "placement.training.attendance" } }))).toBe(3);
  });

  it("counts the same completions for the TPO, the cell's student list and the student's placement profile", async () => {
    const tpo = await as("tpo", "TPO");
    const list = await listTrainings(tpo);
    expect(list.studentsCompleted).toBe(1);
    expect(list.trainings.find((x) => x.id === ids.training)).toMatchObject({ enrolled: 2, completed: 1, sessions: 4, held: 3 });
    const students = await listPlacementStudents(tpo);
    expect(students.students.find((x) => x.studentMembershipId === ids.s1M)?.softSkillsCompleted).toBe(1);
    expect(students.students.find((x) => x.studentMembershipId === ids.s2M)?.softSkillsCompleted).toBe(0);
    const s1 = await as("s1", "STUDENT");
    expect((await studentPlacement(s1)).softSkills).toEqual([{ trainingId: ids.training, title: "ZZ Interviews", skill: "INTERVIEW" }]);
    expect((await studentTrainings(s1)).completed.map((x) => x.trainingId)).toEqual([ids.training]);
    const res = await myTrainingsGet();
    expect(res.status).toBe(200);
  });

  it("drops a completion when a cancelled session is brought back and raises the bar", async () => {
    const tpo = await as("tpo", "TPO");
    const tr = await trainingDetail(tpo, ids.training!);
    // A fifth session, held, that s1 missed: four of five is 80 % ≥ 75 %, still complete; cancel the future one and nothing changes for s1.
    const future = tr.sessionList.find((s) => !s.held)!;
    const cancelled = await setSessionCancelled(tpo, ids.training!, future.id, true);
    expect(cancelled.sessions).toBe(3);
    expect(cancelled.roster.find((r) => r.studentMembershipId === ids.s1M)?.completed).toBe(true);
    const back = await setSessionCancelled(tpo, ids.training!, future.id, false);
    expect(back.sessions).toBe(4);
    // A student is refused a door of the cell's.
    const s2 = await as("s2", "STUDENT");
    expect(await refusal(trainingDetail(s2, ids.training!))).toBe("access.wrongRoleForThisAction");
    expect(RuleRefusal).toBeDefined();
  });
});
