import "server-only";
import type { Prisma } from "@prisma/client";
import { gradeBandFor, parseDuties, STUDIO_STAGES, STUDIO_SUBMISSION_STAGES, type ExternalJurorRole, type FacultyJury, type FacultyStudios, type StudentStudios, type StudioDesk, type StudioRow, type StudioStage, type StudioSubmissionStage } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { notify } from "./notify";
import { assertCollege, assertModuleOn } from "./modules";
import { hasStream } from "./streams";
import { todayKey } from "./dates";
import { deskCaller } from "./duty-desks";
import { saveInternalMarks } from "./academics-assessment";
import { scaledMarks } from "./college-homework";
import { discard } from "./uploads";
import { readJson } from "./json";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * THE STUDIO COORDINATOR'S DESK (R-56, the studio half; 10 October 2026).
 * An architecture college (the stream ARCHITECTURE, the Council of
 * Architecture) teaches by the design studio, and its timetable's "lecture"
 * is a studio sitting. The desk keeps, per course offering and term:
 *
 *   - the STUDIO: its brief, its coordinator (a FACULTY or HOD holding
 *     STUDIO_COORDINATOR) and the four stage days — the brief issued, the
 *     interim pin-up, the final submission, the jury; kept by a holder of the
 *     duty or the office (saveStudio);
 *   - a student's SUBMISSION for a pin-up or the final: a note and a file by
 *     upload ticket, DRAFT until sent, SUBMITTED by the day and LATE after it
 *     (saveStudioSubmission; the student's own door);
 *   - a JURY: a sitting on a day with a panel of the college's own teachers
 *     (one the chair) and up to two external jurors named by a coded role and
 *     an institution only, convened by a holder of the duty (saveJury);
 *   - the JURY MARKS, out of the studio's maximum, written by a juror on the
 *     panel (saveJuryMarks, the one writer) and signed by the chair
 *     (signJury); an unsigned mark is the panel's and reaches no student; a
 *     signed sheet changes no more, tells the students, and may be posted
 *     into one of the offering's internal components through the internal
 *     marks' one writer (postJuryToInternal), as homework is.
 *
 * The office and the head read the desk on their own account; a FACULTY or
 * HOD passes it holding the duty (deskCaller). The faculty's own read
 * (facultyStudios) is every teacher's: the studios they teach, coordinate or
 * sit on a jury for, and an HOD's department's. The grade band is read from
 * the marks (contracts gradeBandFor), never stored. A college without
 * ARCHITECTURE is answered `offered: false` and refused every write (409).
 */

type Tx = Prisma.TransactionClient;
const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;
const ARCHITECTURE = "ARCHITECTURE" as const;

async function architectureOffered(schoolId: string): Promise<boolean> {
  return hasStream(schoolId, ARCHITECTURE);
}

/** Every write is refused at a college without ARCHITECTURE (TA-471), the jury's sheet, its signature and its posting included. */
async function assertArchitecture(schoolId: string): Promise<void> {
  if (!(await architectureOffered(schoolId))) throw new RuleRefusal("duties.studio.refuseNotArchitecture", 409);
}

async function schoolToday(schoolId: string): Promise<string> {
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } });
  return todayKey(school.timezone);
}

type Caller = { schoolId: string; userId: string; membershipId: string; role: Role };

/** A college member of one of `roles`, at a college with ACADEMICS on. */
async function collegeCaller(ctx: ActiveContext, roles: readonly Role[]): Promise<Caller> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role) throw new AccessError("access.noActiveSchoolSelected");
  if (!roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertCollege(ctx.schoolId);
  await assertModuleOn(ctx.schoolId, "ACADEMICS");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, membershipId: ctx.membershipId, role: ctx.role };
}

const panelOf = (raw: string): string[] => readJson<string[]>(raw, []).filter((x): x is string => typeof x === "string");
const externalsOf = (raw: string): { role: ExternalJurorRole; institution: string }[] => readJson<{ role: ExternalJurorRole; institution: string }[]>(raw, []).filter((x) => x && typeof x.role === "string" && typeof x.institution === "string");

/* ------------------------------------------------------------- the rows */

const STUDIO_SELECT = {
  id: true,
  offeringId: true,
  termId: true,
  title: true,
  brief: true,
  maxMarks: true,
  coordinatorMembershipId: true,
  briefIssuedOn: true,
  interimOn: true,
  finalOn: true,
  juryOn: true,
  term: { select: { name: true, startsOn: true } },
  offering: { select: { facultyMembershipId: true, course: { select: { code: true, name: true, scheme: { select: { programme: { select: { departmentId: true } } } } } }, registrations: { where: { status: "REGISTERED" }, select: { studentMembershipId: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } } } },
  submissions: { select: { studentMembershipId: true, stage: true, state: true, submittedAt: true, note: true, fileId: true, fileName: true } },
  juries: { orderBy: { on: "asc" as const }, select: { id: true, on: true, title: true, panelJson: true, chairMembershipId: true, externalJson: true, signedAt: true, signedByMembershipId: true, marks: { select: { studentMembershipId: true, marksTenths: true, remark: true } } } },
} satisfies Prisma.StudioSelect;
type StudioRaw = Prisma.StudioGetPayload<{ select: typeof STUDIO_SELECT }>;

async function loadStudios(schoolId: string, where: Prisma.StudioWhereInput): Promise<StudioRaw[]> {
  return db.studio.findMany({ where: { schoolId, ...where }, orderBy: [{ term: { startsOn: "desc" } }, { briefIssuedOn: "desc" }, { title: "asc" }], take: 200, select: STUDIO_SELECT });
}

/** The names of every membership the studios name: coordinators, teachers, panels, chairs, signers. */
async function namesFor(studios: StudioRaw[]): Promise<Map<string, string>> {
  const ids = new Set<string>();
  for (const s of studios) {
    ids.add(s.coordinatorMembershipId);
    if (s.offering.facultyMembershipId) ids.add(s.offering.facultyMembershipId);
    for (const j of s.juries) {
      for (const id of panelOf(j.panelJson)) ids.add(id);
      ids.add(j.chairMembershipId);
      if (j.signedByMembershipId) ids.add(j.signedByMembershipId);
    }
  }
  if (!ids.size) return new Map();
  const rows = await db.membership.findMany({ where: { id: { in: [...ids] } }, select: { id: true, user: { select: { name: true, preferredName: true } } } });
  return new Map(rows.map((m) => [m.id, nameOf(m.user)]));
}

const stageDay = (s: Pick<StudioRaw, "briefIssuedOn" | "interimOn" | "finalOn" | "juryOn">, stage: StudioStage): string | null =>
  stage === "BRIEF_ISSUED" ? s.briefIssuedOn : stage === "INTERIM_PINUP" ? s.interimOn : stage === "FINAL_SUBMISSION" ? s.finalOn : s.juryOn;

const stageState = (on: string | null, today: string): "UNSET" | "AHEAD" | "TODAY" | "DONE" => (on === null ? "UNSET" : on > today ? "AHEAD" : on === today ? "TODAY" : "DONE");

const sent = (state: string) => state === "SUBMITTED" || state === "LATE";

function toRow(s: StudioRaw, names: Map<string, string>, today: string): StudioRow {
  const students = s.offering.registrations.map((r) => ({ id: r.studentMembershipId, name: nameOf(r.student.user) })).sort((a, b) => a.name.localeCompare(b.name));
  const signedJuries = s.juries.filter((j) => j.signedAt !== null);
  return {
    id: s.id,
    offeringId: s.offeringId,
    courseCode: s.offering.course.code,
    courseName: s.offering.course.name,
    termId: s.termId,
    termName: s.term.name,
    title: s.title,
    brief: s.brief,
    maxMarks: s.maxMarks,
    coordinatorMembershipId: s.coordinatorMembershipId,
    coordinatorName: names.get(s.coordinatorMembershipId) ?? "",
    facultyName: s.offering.facultyMembershipId ? (names.get(s.offering.facultyMembershipId) ?? null) : null,
    briefIssuedOn: s.briefIssuedOn,
    interimOn: s.interimOn,
    finalOn: s.finalOn,
    juryOn: s.juryOn,
    stages: STUDIO_STAGES.map((stage) => {
      const on = stageDay(s, stage);
      const waiting =
        stage === "INTERIM_PINUP" || stage === "FINAL_SUBMISSION"
          ? on === null
            ? 0
            : students.filter((st) => !s.submissions.some((x) => x.studentMembershipId === st.id && x.stage === stage && sent(x.state))).length
          : stage === "JURY"
            ? s.juries.filter((j) => j.signedAt === null).length
            : 0;
      return { stage, on, state: stageState(on, today), waiting };
    }),
    students: students.map((st) => ({
      studentMembershipId: st.id,
      name: st.name,
      submissions: s.submissions
        .filter((x) => x.studentMembershipId === st.id)
        .sort((a, b) => STUDIO_SUBMISSION_STAGES.indexOf(a.stage as StudioSubmissionStage) - STUDIO_SUBMISSION_STAGES.indexOf(b.stage as StudioSubmissionStage))
        .map((x) => ({ stage: x.stage as StudioSubmissionStage, state: x.state as "DRAFT", submittedAt: x.submittedAt?.toISOString() ?? null, note: x.note, fileId: x.fileId, fileName: x.fileName })),
      results: [...signedJuries]
        .reverse()
        .flatMap((j) => {
          const m = j.marks.find((x) => x.studentMembershipId === st.id);
          if (!m) return [];
          const marks = m.marksTenths === null ? null : m.marksTenths / 10;
          return [{ juryId: j.id, on: j.on, marks, band: gradeBandFor(marks, s.maxMarks), remark: m.remark }];
        }),
    })),
    juries: s.juries.map((j) => juryRow(j, s, names, students.length, today)),
  };
}

function juryRow(j: StudioRaw["juries"][number], s: StudioRaw, names: Map<string, string>, students: number, today: string) {
  const panel = panelOf(j.panelJson);
  return {
    id: j.id,
    studioId: s.id,
    on: j.on,
    title: j.title,
    panel: panel.map((id) => ({ membershipId: id, name: names.get(id) ?? "", chair: id === j.chairMembershipId })),
    externalJurors: externalsOf(j.externalJson),
    signedAt: j.signedAt?.toISOString() ?? null,
    signedByName: j.signedByMembershipId ? (names.get(j.signedByMembershipId) ?? null) : null,
    marked: j.marks.length,
    students,
    past: j.on < today,
  };
}

/* ------------------------------------------------------------- the desk */

export async function studioDesk(ctx: ActiveContext): Promise<StudioDesk> {
  const c = await deskCaller(ctx, "STUDIO_COORDINATOR", "ACADEMICS");
  const [offered, today, studios, teachers] = await Promise.all([
    architectureOffered(c.schoolId),
    schoolToday(c.schoolId),
    loadStudios(c.schoolId, {}),
    db.membership.findMany({ where: { schoolId: c.schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE", leftAt: null }, select: { id: true, role: true, dutiesJson: true, user: { select: { name: true, preferredName: true } } } }),
  ]);
  const names = await namesFor(studios);
  // The offerings a studio may be kept on: the terms not yet over, or the latest term when every one is.
  let terms = await db.academicTerm.findMany({ where: { schoolId: c.schoolId, endsOn: { gte: today } }, select: { id: true } });
  if (!terms.length) terms = await db.academicTerm.findMany({ where: { schoolId: c.schoolId }, orderBy: { startsOn: "desc" }, take: 1, select: { id: true } });
  const offerings = terms.length
    ? await db.courseOffering.findMany({ where: { schoolId: c.schoolId, termId: { in: terms.map((t) => t.id) }, ...ARCHITECTURE_OFFERING }, orderBy: [{ term: { startsOn: "desc" } }, { course: { code: "asc" } }], take: 300, select: { id: true, facultyMembershipId: true, term: { select: { name: true } }, course: { select: { code: true, name: true } } } })
    : [];
  const teacherName = new Map(teachers.map((m) => [m.id, nameOf(m.user)]));
  const rows = studios.map((s) => toRow(s, names, today));
  return {
    today,
    offered,
    canManage: c.holder || c.role === "ADMIN",
    canConvene: c.holder,
    studios: rows,
    offerings: offerings.map((o) => ({ id: o.id, courseCode: o.course.code, courseName: o.course.name, termName: o.term.name, facultyName: o.facultyMembershipId ? (teacherName.get(o.facultyMembershipId) ?? null) : null })),
    coordinators: teachers.filter((m) => parseDuties(m.dutiesJson).includes("STUDIO_COORDINATOR")).map((m) => ({ membershipId: m.id, name: nameOf(m.user) })),
    teachers: teachers.map((m) => ({ membershipId: m.id, name: nameOf(m.user), role: m.role as "FACULTY" })),
    toSign: rows.flatMap((s) => s.juries.filter((j) => j.signedAt === null && j.marked > 0).map((j) => ({ juryId: j.id, studioId: s.id, studioTitle: s.title, on: j.on, chairName: j.panel.find((p) => p.chair)?.name ?? "", marked: j.marked, students: j.students }))),
  };
}

/**
 * The offerings a studio may be kept on (TA-473): a course of a programme whose stream is ARCHITECTURE, or of one
 * whose stream is not recorded (a college before its programmes were tagged). A physics course at a college of
 * several streams is not a studio's: its students would read a design studio and a jury sheet could be posted into
 * its internal marks.
 */
const ARCHITECTURE_OFFERING = { course: { scheme: { programme: { OR: [{ stream: ARCHITECTURE }, { stream: null }] } } } } satisfies Prisma.CourseOfferingWhereInput;

/** The office or a holder of the duty, at a college whose streams include ARCHITECTURE. */
async function manager(ctx: ActiveContext, office: readonly Role[]) {
  const c = await deskCaller(ctx, "STUDIO_COORDINATOR", "ACADEMICS", office);
  if (!(await architectureOffered(c.schoolId))) throw new RuleRefusal("duties.studio.refuseNotArchitecture", 409);
  return c;
}

/** The stage days in their order: each set day on or after the one before it. */
export function stagesInOrder(days: { briefIssuedOn: string; interimOn: string | null; finalOn: string | null; juryOn: string | null }): boolean {
  let last = days.briefIssuedOn;
  for (const on of [days.interimOn, days.finalOn, days.juryOn]) {
    if (on === null) continue;
    if (on < last) return false;
    last = on;
  }
  return true;
}

/** A studio and its stages, new or corrected by its id: a holder of the duty (the coordinator themself unless they name another holder) or the office (which must name one). */
export async function saveStudio(ctx: ActiveContext, input: { id?: string; offeringId: string; title: string; brief: string; maxMarks: number; coordinatorMembershipId?: string | null; briefIssuedOn: string; interimOn: string | null; finalOn: string | null; juryOn: string | null }): Promise<{ id: string }> {
  const c = await manager(ctx, ["ADMIN"]);
  const offering = await db.courseOffering.findFirst({ where: { id: input.offeringId, schoolId: c.schoolId }, select: { id: true, termId: true, course: { select: { scheme: { select: { programme: { select: { stream: true } } } } } } } });
  if (!offering) throw new RuleRefusal("duties.studio.refuseUnknownOffering", 422, undefined, "offeringId");
  const stream = offering.course.scheme.programme.stream;
  if (stream !== null && stream !== ARCHITECTURE) throw new RuleRefusal("duties.studio.refuseNotArchitectureCourse", 422, undefined, "offeringId");
  const coordinatorId = input.coordinatorMembershipId ?? (c.holder ? c.membershipId : null);
  if (!coordinatorId) throw new RuleRefusal("duties.studio.refuseNoCoordinator", 422, undefined, "coordinatorMembershipId");
  const coordinator = await db.membership.findFirst({ where: { id: coordinatorId, schoolId: c.schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE", leftAt: null }, select: { id: true, dutiesJson: true } });
  if (!coordinator || !parseDuties(coordinator.dutiesJson).includes("STUDIO_COORDINATOR")) throw new RuleRefusal("duties.studio.refuseCoordinatorNoDuty", 422, undefined, "coordinatorMembershipId");
  if (!stagesInOrder(input)) throw new RuleRefusal("duties.studio.refuseStageOrder", 422, undefined, "interimOn");
  const data = { offeringId: offering.id, termId: offering.termId, title: input.title.trim(), brief: input.brief.trim(), maxMarks: input.maxMarks, coordinatorMembershipId: coordinator.id, briefIssuedOn: input.briefIssuedOn, interimOn: input.interimOn, finalOn: input.finalOn, juryOn: input.juryOn };
  let id = input.id;
  if (id) {
    // A signed sheet changes no more (TA-206): once a jury of the studio has signed, its maximum (the signed marks' bands
    // and their scaling into internal marks read it) and its offering (whose students the sheet is) stay, and a stage the
    // signature closed is not opened again by moving its day after the signed jury.
    const now = await db.studio.findFirst({ where: { id, schoolId: c.schoolId }, select: { offeringId: true, maxMarks: true, interimOn: true, finalOn: true, juries: { where: { signedAt: { not: null } }, select: { on: true, signedAt: true } } } });
    if (!now) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    if (now.juries.length) {
      if (now.maxMarks !== input.maxMarks) throw new RuleRefusal("duties.studio.refuseStudioSigned", 409, undefined, "maxMarks");
      if (now.offeringId !== offering.id) throw new RuleRefusal("duties.studio.refuseStudioSigned", 409, undefined, "offeringId");
      for (const stage of STUDIO_SUBMISSION_STAGES) {
        const before = stage === "INTERIM_PINUP" ? now.interimOn : now.finalOn;
        if (before !== null && !stageOpen(now, stage) && stageOpen({ interimOn: input.interimOn, finalOn: input.finalOn, juries: now.juries }, stage)) throw new RuleRefusal("duties.studio.refuseStudioSigned", 409, undefined, stage === "INTERIM_PINUP" ? "interimOn" : "finalOn");
      }
    }
    const done = await db.studio.updateMany({ where: { id, schoolId: c.schoolId }, data });
    if (!done.count) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  } else id = (await db.studio.create({ data: { schoolId: c.schoolId, createdByUserId: c.userId, ...data }, select: { id: true } })).id;
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "studio.save", targetType: "Studio", targetId: id, meta: { offeringId: offering.id, edit: Boolean(input.id), maxMarks: input.maxMarks, stages: [input.briefIssuedOn, input.interimOn, input.finalOn, input.juryOn] } });
  return { id };
}

/** A jury and its panel, new or corrected by its id while unsigned: a holder of the duty. Every juror is an active FACULTY or HOD of the college, the chair one of them; the panel is told. */
export async function saveJury(ctx: ActiveContext, studioId: string, input: { id?: string; on: string; title: string; jurorMembershipIds: string[]; chairMembershipId: string; externalJurors: { role: ExternalJurorRole; institution: string }[] }): Promise<{ id: string }> {
  const c = await manager(ctx, []);
  const studio = await db.studio.findFirst({ where: { id: studioId, schoolId: c.schoolId }, select: { id: true, title: true } });
  if (!studio) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const ids = [...new Set(input.jurorMembershipIds)];
  if (!ids.includes(input.chairMembershipId)) throw new RuleRefusal("duties.studio.refuseChairNotOnPanel", 422, undefined, "chairMembershipId");
  const jurors = await db.membership.findMany({ where: { id: { in: ids }, schoolId: c.schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE", leftAt: null }, select: { id: true, userId: true } });
  if (jurors.length !== ids.length) throw new RuleRefusal("duties.studio.refuseUnknownJuror", 422, undefined, "jurorMembershipIds");
  const data = { on: input.on, title: input.title.trim(), panelJson: JSON.stringify(ids), chairMembershipId: input.chairMembershipId, externalJson: JSON.stringify(input.externalJurors.map((x) => ({ role: x.role, institution: x.institution.trim() }))) };
  let id = input.id;
  let before: string[] = [];
  if (id) {
    const jury = await db.studioJury.findFirst({ where: { id, studioId: studio.id }, select: { signedAt: true, panelJson: true } });
    if (!jury) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    if (jury.signedAt) throw new RuleRefusal("duties.studio.refuseSigned", 409);
    before = panelOf(jury.panelJson);
    await db.studioJury.update({ where: { id }, data });
  } else id = (await db.studioJury.create({ data: { schoolId: c.schoolId, studioId: studio.id, createdByUserId: c.userId, ...data }, select: { id: true } })).id;
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "studio.jury", targetType: "StudioJury", targetId: id, meta: { studioId: studio.id, on: input.on, panel: ids.length, external: input.externalJurors.length, edit: Boolean(input.id) } });
  // Each juror newly on the panel is told, in their own language; the sitting's day stays a date key.
  // The convener is not told of the sitting they have just made (TA-603), whether or not they sit on it.
  await Promise.all(jurors.filter((j) => !before.includes(j.id) && j.id !== c.membershipId).map((j) => notify({ userId: j.userId, schoolId: c.schoolId, kind: "SYSTEM", titleKey: "duties.studio.notifyJury", titleVars: { studio: studio.title, day: input.on }, url: "/faculty/studios" }).catch(() => undefined)));
  return { id };
}

/* ------------------------------------------------------ the jury's sheet */

const JURY_SELECT = {
  id: true,
  on: true,
  panelJson: true,
  chairMembershipId: true,
  signedAt: true,
  studio: { select: { id: true, title: true, maxMarks: true, offeringId: true, offering: { select: { facultyMembershipId: true, registrations: { where: { status: "REGISTERED" }, select: { studentMembershipId: true, student: { select: { userId: true } } } } } } } },
  marks: { select: { studentMembershipId: true, marksTenths: true } },
} satisfies Prisma.StudioJurySelect;

async function juryFor(c: Caller, juryId: string) {
  const jury = await db.studioJury.findFirst({ where: { id: juryId, schoolId: c.schoolId }, select: JURY_SELECT });
  if (!jury) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  return jury;
}

/** A juror on the panel writes marks (null is absent) and a remark for some of the studio's registered students; refused once the chair has signed. The one writer of StudioJuryMark. */
export async function saveJuryMarks(ctx: ActiveContext, juryId: string, input: { entries: { studentMembershipId: string; marks: number | null; remark: string }[] }): Promise<{ saved: number }> {
  const c = await collegeCaller(ctx, ["FACULTY", "HOD"]);
  const jury = await juryFor(c, juryId);
  if (!panelOf(jury.panelJson).includes(c.membershipId)) throw new AccessError("duties.studio.refuseNotOnPanel");
  await assertArchitecture(c.schoolId);
  if (jury.signedAt) throw new RuleRefusal("duties.studio.refuseSigned", 409);
  const registered = new Set(jury.studio.offering.registrations.map((r) => r.studentMembershipId));
  for (const e of input.entries) {
    if (!registered.has(e.studentMembershipId)) throw new RuleRefusal("duties.studio.refuseNotRegistered", 422, undefined, "entries");
    if (e.marks !== null && e.marks > jury.studio.maxMarks) throw new RuleRefusal("duties.studio.refuseOverMax", 422, { max: jury.studio.maxMarks }, "entries");
  }
  const now = new Date();
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    // The chair's signature may have landed since the read above (TA-208): the jury's row is held and its signature read
    // again, so a signed sheet never takes a mark after it (signJury holds the same row).
    await tx.$queryRaw`SELECT "id" FROM "StudioJury" WHERE "id" = ${jury.id} FOR UPDATE`;
    const still = await tx.studioJury.findUnique({ where: { id: jury.id }, select: { signedAt: true } });
    if (!still || still.signedAt) throw new RuleRefusal("duties.studio.refuseSigned", 409);
    for (const e of input.entries) {
      const marksTenths = e.marks === null ? null : Math.round(e.marks * 10);
      await tx.studioJuryMark.upsert({
        where: { juryId_studentMembershipId: { juryId: jury.id, studentMembershipId: e.studentMembershipId } },
        create: { schoolId: c.schoolId, juryId: jury.id, studentMembershipId: e.studentMembershipId, marksTenths, remark: e.remark.trim(), markedByMembershipId: c.membershipId, markedAt: now },
        update: { marksTenths, remark: e.remark.trim(), markedByMembershipId: c.membershipId, markedAt: now },
      });
    }
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "studio.marks", targetType: "StudioJury", targetId: jury.id, meta: { studioId: jury.studio.id, saved: input.entries.length } });
  return { saved: input.entries.length };
}

/** The chair signs the sheet once every registered student has an entry; a signed sheet answers as it stands. The students are told. */
export async function signJury(ctx: ActiveContext, juryId: string): Promise<{ signed: boolean; changed: boolean }> {
  const c = await collegeCaller(ctx, ["FACULTY", "HOD"]);
  const jury = await juryFor(c, juryId);
  if (jury.chairMembershipId !== c.membershipId) throw new AccessError("duties.studio.refuseNotChair");
  if (jury.signedAt) return { signed: true, changed: false };
  await assertArchitecture(c.schoolId);
  // Under the jury's row (TA-208): a juror's save holds the same row, so the marks signed are the marks that stand, the
  // sheet's completeness is read again there, and a second signature finds the first.
  const outcome = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.$queryRaw`SELECT "id" FROM "StudioJury" WHERE "id" = ${jury.id} FOR UPDATE`;
    const row = await tx.studioJury.findUnique({ where: { id: jury.id }, select: { signedAt: true, marks: { select: { studentMembershipId: true } } } });
    if (!row || row.signedAt) return { changed: false, students: 0 };
    const marked = new Set(row.marks.map((m) => m.studentMembershipId));
    const missing = jury.studio.offering.registrations.filter((r) => !marked.has(r.studentMembershipId));
    if (missing.length) throw new RuleRefusal("duties.studio.refuseIncomplete", 409, { count: missing.length });
    const done = await tx.studioJury.updateMany({ where: { id: jury.id, signedAt: null }, data: { signedAt: new Date(), signedByMembershipId: c.membershipId } });
    return { changed: done.count > 0, students: row.marks.length };
  });
  if (!outcome.changed) return { signed: true, changed: false };
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "studio.sign", targetType: "StudioJury", targetId: jury.id, meta: { studioId: jury.studio.id, students: outcome.students } });
  await Promise.all(jury.studio.offering.registrations.map((r) => notify({ userId: r.student.userId, schoolId: c.schoolId, kind: "SYSTEM", titleKey: "duties.studio.notifyResult", titleVars: { studio: jury.studio.title }, url: "/student/studios" }).catch(() => undefined)));
  return { signed: true, changed: true };
}

/** A signed sheet's marks into one of the offering's internal components, scaled to its maximum, through the internal marks' one writer (which decides who may: the offering's teacher or its department's HOD). */
export async function postJuryToInternal(ctx: ActiveContext, juryId: string, componentId: string): Promise<{ posted: number; componentId: string }> {
  const c = await collegeCaller(ctx, ["FACULTY", "HOD"]);
  const jury = await juryFor(c, juryId);
  await assertArchitecture(c.schoolId);
  if (!jury.signedAt) throw new RuleRefusal("duties.studio.refuseUnsigned", 409);
  const component = await db.internalComponent.findFirst({ where: { id: componentId, offeringId: jury.studio.offeringId }, select: { id: true, maxMarks: true } });
  if (!component) throw new RuleRefusal("academics.refuseUnknownComponent", 422, undefined, "componentId");
  const registered = new Set(jury.studio.offering.registrations.map((r) => r.studentMembershipId));
  const entries = jury.marks.filter((m) => registered.has(m.studentMembershipId)).map((m) => ({ studentMembershipId: m.studentMembershipId, marks: m.marksTenths === null ? null : scaledMarks(m.marksTenths * 100, jury.studio.maxMarks * 1000, component.maxMarks) }));
  if (!entries.length) throw new RuleRefusal("duties.studio.refuseNothingMarked", 409);
  const saved = await saveInternalMarks(ctx, jury.studio.offeringId, { componentId: component.id, entries });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "studio.postInternal", targetType: "StudioJury", targetId: jury.id, meta: { offeringId: jury.studio.offeringId, componentId: component.id, posted: saved.saved } });
  return { posted: saved.saved, componentId: component.id };
}

/* -------------------------------------------------------- the faculty's */

async function hodDepartmentIds(c: Caller): Promise<string[]> {
  if (c.role !== "HOD") return [];
  return (await db.department.findMany({ where: { schoolId: c.schoolId, hodMembershipId: c.membershipId }, select: { id: true } })).map((d) => d.id);
}

export async function facultyStudios(ctx: ActiveContext): Promise<FacultyStudios> {
  const c = await collegeCaller(ctx, ["FACULTY", "HOD"]);
  const [offered, today, headed] = await Promise.all([architectureOffered(c.schoolId), schoolToday(c.schoolId), hodDepartmentIds(c)]);
  const me = c.membershipId;
  const studios = await loadStudios(c.schoolId, {
    OR: [{ offering: { facultyMembershipId: me } }, { coordinatorMembershipId: me }, { juries: { some: { panelJson: { contains: `"${me}"` } } } }, ...(headed.length ? [{ offering: { course: { scheme: { programme: { departmentId: { in: headed } } } } } }] : [])],
  });
  const names = await namesFor(studios);
  const juries: FacultyJury[] = [];
  for (const s of studios) {
    const teaches = s.offering.facultyMembershipId === me;
    const heads = headed.includes(s.offering.course.scheme.programme.departmentId);
    const registered = s.offering.registrations.map((r) => ({ id: r.studentMembershipId, name: nameOf(r.student.user) })).sort((a, b) => a.name.localeCompare(b.name));
    for (const j of s.juries) {
      const onPanel = panelOf(j.panelJson).includes(me);
      const signed = j.signedAt !== null;
      const canPost = offered && signed && (teaches || heads);
      const components = canPost && !(await db.internalLock.findUnique({ where: { offeringId: s.offeringId }, select: { id: true } })) ? await db.internalComponent.findMany({ where: { offeringId: s.offeringId, releasedAt: null }, orderBy: { position: "asc" }, select: { id: true, name: true, maxMarks: true } }) : [];
      juries.push({
        ...juryRow(j, s, names, registered.length, today),
        studioTitle: s.title,
        courseCode: s.offering.course.code,
        maxMarks: s.maxMarks,
        canMark: offered && onPanel && !signed,
        canSign: offered && j.chairMembershipId === me && !signed,
        canPost,
        sheet: registered.map((st) => {
          const m = j.marks.find((x) => x.studentMembershipId === st.id);
          const marks = !m || m.marksTenths === null ? null : m.marksTenths / 10;
          return { studentMembershipId: st.id, name: st.name, marks, band: gradeBandFor(marks, s.maxMarks), remark: m?.remark ?? "", entered: Boolean(m) };
        }),
        components,
      });
    }
  }
  return {
    offered,
    studios: studios.map((s) => ({ ...toRow(s, names, today), mine: { teaches: s.offering.facultyMembershipId === me, coordinates: s.coordinatorMembershipId === me, juror: s.juries.some((j) => panelOf(j.panelJson).includes(me)), heads: headed.includes(s.offering.course.scheme.programme.departmentId) } })),
    juries: juries.sort((a, b) => a.on.localeCompare(b.on)),
  };
}

/* --------------------------------------------------------- the student's */

/** Whether a submission stage is still open to the student: its day is set and no jury held on or after it is signed. */
function stageOpen(s: Pick<StudioRaw, "interimOn" | "finalOn"> & { juries: { on: string; signedAt: Date | null }[] }, stage: StudioSubmissionStage): boolean {
  const on = stage === "INTERIM_PINUP" ? s.interimOn : s.finalOn;
  if (on === null) return false;
  return !s.juries.some((j) => j.signedAt !== null && j.on >= on);
}

export async function studentStudios(ctx: ActiveContext): Promise<StudentStudios> {
  const c = await collegeCaller(ctx, ["STUDENT"]);
  const [offered, today, regs] = await Promise.all([architectureOffered(c.schoolId), schoolToday(c.schoolId), db.courseRegistration.findMany({ where: { schoolId: c.schoolId, studentMembershipId: c.membershipId, status: "REGISTERED" }, select: { offeringId: true } })]);
  const studios = regs.length ? await loadStudios(c.schoolId, { offeringId: { in: regs.map((r) => r.offeringId) } }) : [];
  const names = await namesFor(studios);
  return {
    today,
    offered,
    studios: studios.map((s) => {
      const row = toRow(s, names, today);
      const mine = row.students.find((st) => st.studentMembershipId === c.membershipId);
      return {
        id: s.id,
        title: s.title,
        courseCode: row.courseCode,
        courseName: row.courseName,
        termName: row.termName,
        brief: s.brief,
        maxMarks: s.maxMarks,
        coordinatorName: row.coordinatorName,
        stages: row.stages.map(({ stage, on, state }) => ({ stage, on, state })),
        submissions: mine?.submissions ?? [],
        canSubmit: STUDIO_SUBMISSION_STAGES.some((stage) => stageOpen(s, stage)),
        openStages: STUDIO_SUBMISSION_STAGES.filter((stage) => stageOpen(s, stage)),
        results: (mine?.results ?? []).map((r) => ({ ...r, title: s.juries.find((j) => j.id === r.juryId)?.title ?? "" })),
      };
    }),
  };
}

/**
 * A student's work for a stage: the note, a file (an upload ticket of theirs spent here, or one the web form just
 * stored), sent or kept as a draft. Sent by the stage's day is SUBMITTED, after it LATE; once sent, a later save keeps
 * the state and may still change the note and the file until a jury on or after the stage is signed.
 */
export async function saveStudioSubmission(ctx: ActiveContext, studioId: string, input: { stage: StudioSubmissionStage; note: string; fileId: string | null; submit: boolean }, stored: { fileId: string; name: string; mime: string; size: number } | null = null): Promise<{ id: string; state: "DRAFT" | "SUBMITTED" | "LATE" }> {
  const c = await collegeCaller(ctx, ["STUDENT"]);
  if (!(await architectureOffered(c.schoolId))) throw new RuleRefusal("duties.studio.refuseNotArchitecture", 409);
  const studio = await db.studio.findFirst({ where: { id: studioId, schoolId: c.schoolId }, select: { id: true, offeringId: true, interimOn: true, finalOn: true, juries: { select: { on: true, signedAt: true } } } });
  if (!studio) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const registered = await db.courseRegistration.findFirst({ where: { offeringId: studio.offeringId, studentMembershipId: c.membershipId, status: "REGISTERED" }, select: { id: true } });
  if (!registered) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const on = input.stage === "INTERIM_PINUP" ? studio.interimOn : studio.finalOn;
  if (on === null) throw new RuleRefusal("duties.studio.refuseStageUnset", 422, undefined, "stage");
  if (!stageOpen(studio, input.stage)) throw new RuleRefusal("duties.studio.refuseClosed", 409);
  const today = await schoolToday(c.schoolId);
  const existing = await db.studioSubmission.findUnique({ where: { studioId_studentMembershipId_stage: { studioId: studio.id, studentMembershipId: c.membershipId, stage: input.stage } }, select: { id: true, state: true, submittedAt: true, fileId: true } });
  // The file: one the web form stored, or a ticket of the caller's spent here; otherwise the one already there stays.
  let file: { fileId: string; fileName: string | null; fileMime: string | null; fileSize: number | null } | null = null;
  if (stored) file = { fileId: stored.fileId, fileName: stored.name, fileMime: stored.mime, fileSize: stored.size };
  else if (input.fileId) {
    const ticket = await db.uploadTicket.findFirst({ where: { fileId: input.fileId, userId: c.userId, consumedAt: null }, select: { mime: true, size: true } });
    if (!ticket) throw new RuleRefusal("academics.refuseTicket", 422, undefined, "fileId");
    // The spend must happen here (TA-384): of two saves sent at once with one ticket, the second finds it spent.
    const spent = await db.uploadTicket.updateMany({ where: { fileId: input.fileId, userId: c.userId, consumedAt: null }, data: { consumedAt: new Date() } });
    if (!spent.count) throw new RuleRefusal("academics.refuseTicket", 422, undefined, "fileId");
    file = { fileId: input.fileId, fileName: input.fileId, fileMime: ticket.mime, fileSize: ticket.size };
  }
  const wasSent = existing ? sent(existing.state) : false;
  const state = wasSent ? (existing!.state as "SUBMITTED") : input.submit ? (today > on ? "LATE" : "SUBMITTED") : "DRAFT";
  const submittedAt = wasSent ? existing!.submittedAt : input.submit ? new Date() : null;
  const data = { state, note: input.note.trim(), submittedAt, ...(file ?? {}) };
  const row = existing
    ? await db.studioSubmission.update({ where: { id: existing.id }, data, select: { id: true } })
    : await db.studioSubmission.create({ data: { schoolId: c.schoolId, studioId: studio.id, studentMembershipId: c.membershipId, stage: input.stage, ...data }, select: { id: true } });
  // A replaced file is not left on disk for nobody (uploads.ts discard).
  if (file && existing?.fileId && existing.fileId !== file.fileId) await discard([existing.fileId]).catch(() => undefined);
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "studio.submit", targetType: "StudioSubmission", targetId: row.id, meta: { studioId: studio.id, stage: input.stage, state, file: Boolean(file ?? existing?.fileId) } });
  return { id: row.id, state };
}
