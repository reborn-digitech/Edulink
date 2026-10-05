import "server-only";
import { isDutyRole, type DutyCode, type ExamSquadDesk, type LabDesk, type ResearchDesk, type SchoolModuleCode } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { notify } from "./notify";
import { assertCollege, assertModuleOn, isModuleOn } from "./modules";
import { requireDuty } from "./duties";
import { labDivisions } from "./stream-records";
import { writeOffBreakage } from "./inventory";
import { readJson } from "./json";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * THE DUTIES' DESKS (5 October 2026), after the anti-ragging register's model
 * (anti-ragging.ts): each desk lets the office and the head through on their
 * own account and calls `requireDuty` for a FACULTY or HOD; the catalog's
 * `duties:` on each door refuses a teacher without the duty before the
 * handler runs, and this refuses them again for a page or a test.
 *
 *   LAB_INCHARGE   the college's labs (rooms of kind LAB) with what the
 *                  stores hold there and the assets kept there (INVENTORY,
 *                  when on), every division's batch rosters, the practical
 *                  record waiting to be signed (signing is
 *                  stream-records.ts's `signPracticals`), and the breakage
 *                  log — a write-off at the lab, through inventory.ts's one
 *                  writer of the stock.
 *   RESEARCH_DEAN  the college's whole research register (the IQAC's
 *                  ResearchItem) and each teacher's counts — read only. The
 *                  API-score inputs the office keeps on the faculty record
 *                  are appraisal input: the office and the head read them
 *                  here, the duty's holder does not (A3-S-11).
 *   EXAM_SQUAD     the papers being sat and about to be, their halls, the
 *                  squad's visits (ExamSquadVisit, written by a squad member)
 *                  and the cases of unfair means the exam cell has entered;
 *                  a visit that found something tells the exam controllers.
 *
 * The teaching-practice coordinator's desk is teaching-practice.ts; the NSS
 * and NCC officers' is corps.ts.
 */

export type DeskCaller = { schoolId: string; userId: string; membershipId: string; role: Role; holder: boolean };

/** The office roles named pass on their own account; a FACULTY or HOD must hold `duty`; anyone else is refused. Then the college and the module. */
export async function deskCaller(ctx: ActiveContext, duty: DutyCode, module: SchoolModuleCode, officeRoles: readonly Role[] = ["ADMIN", "PRINCIPAL"]): Promise<DeskCaller> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role) throw new AccessError("access.noActiveSchoolSelected");
  const office = officeRoles.includes(ctx.role);
  if (!office) {
    if (!isDutyRole(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
    await requireDuty(ctx, duty);
  }
  await assertCollege(ctx.schoolId);
  await assertModuleOn(ctx.schoolId, module);
  return { schoolId: ctx.schoolId, userId: ctx.user.id, membershipId: ctx.membershipId, role: ctx.role, holder: !office };
}

const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;

/* ------------------------------------------------------------- the labs */

export async function labDesk(ctx: ActiveContext): Promise<LabDesk> {
  const c = await deskCaller(ctx, "LAB_INCHARGE", "ACADEMICS");
  const [inventoryOn, rooms] = await Promise.all([isModuleOn(c.schoolId, "INVENTORY"), db.room.findMany({ where: { schoolId: c.schoolId, kind: "LAB" }, orderBy: { name: "asc" }, select: { id: true, name: true, capacity: true } })]);
  const places = rooms.map((r) => r.name);
  const [stock, assets, breakages] = await Promise.all([
    inventoryOn && places.length ? db.inventoryStock.findMany({ where: { schoolId: c.schoolId, location: { in: places }, quantity: { not: 0 } }, select: { location: true, quantity: true, item: { select: { code: true, name: true, unit: true } } }, orderBy: { item: { code: "asc" } } }) : Promise.resolve([]),
    inventoryOn && places.length ? db.asset.findMany({ where: { schoolId: c.schoolId, location: { in: places }, status: { not: "DISPOSED" } }, select: { location: true, tagNumber: true, name: true, status: true, condition: true }, orderBy: { tagNumber: "asc" } }) : Promise.resolve([]),
    inventoryOn ? db.stockMovement.findMany({ where: { schoolId: c.schoolId, kind: "WRITE_OFF", reference: "BREAKAGE" }, orderBy: { at: "desc" }, take: 50, select: { id: true, at: true, delta: true, location: true, note: true, byUserId: true, item: { select: { code: true, name: true } } } }) : Promise.resolve([]),
  ]);
  const toSign = await db.practicalRecord.findMany({ where: { schoolId: c.schoolId, signedAt: null }, orderBy: [{ performedOn: "desc" }, { experimentNo: "asc" }], take: 200, select: { id: true, offeringId: true, studentMembershipId: true, experimentNo: true, title: true, performedOn: true, marks: true, offering: { select: { course: { select: { code: true } } } }, student: { select: { user: { select: { name: true, preferredName: true } } } } } });
  const users = breakages.length ? await db.user.findMany({ where: { id: { in: [...new Set(breakages.map((b) => b.byUserId).filter((x): x is string => Boolean(x)))] } }, select: { id: true, name: true, preferredName: true } }) : [];
  const userName = new Map(users.map((u) => [u.id, nameOf(u)]));
  const divisions = (await labDivisions(c.schoolId)).filter((d) => d.batches.length > 0);
  return {
    inventoryOn,
    labs: rooms.map((r) => ({
      roomId: r.id,
      name: r.name,
      capacity: r.capacity,
      stock: stock.filter((s) => s.location === r.name).map((s) => ({ itemCode: s.item.code, itemName: s.item.name, unit: s.item.unit, quantity: s.quantity })),
      assets: assets.filter((a) => a.location === r.name).map((a) => ({ tagNumber: a.tagNumber, name: a.name, status: a.status, condition: a.condition })),
    })),
    divisions,
    toSign: toSign.map((r) => ({ id: r.id, offeringId: r.offeringId, courseCode: r.offering.course.code, studentMembershipId: r.studentMembershipId, studentName: nameOf(r.student.user), experimentNo: r.experimentNo, title: r.title, performedOn: r.performedOn, marks: r.marks, signed: false, signedByName: null, signedAt: null })),
    breakages: breakages.map((b) => ({ id: b.id, at: b.at.toISOString(), itemCode: b.item.code, itemName: b.item.name, quantity: Math.abs(b.delta), location: b.location, note: b.note, byName: b.byUserId ? (userName.get(b.byUserId) ?? "") : "" })),
  };
}

/** A breakage in a lab: a member holding LAB_INCHARGE or the office writes it off the lab's stock (module INVENTORY). */
export async function recordLabBreakage(ctx: ActiveContext, input: { roomId: string; itemCode: string; quantity: number; note: string }) {
  const c = await deskCaller(ctx, "LAB_INCHARGE", "INVENTORY", ["ADMIN"]);
  const room = await db.room.findFirst({ where: { id: input.roomId, schoolId: c.schoolId, kind: "LAB" }, select: { id: true, name: true } });
  if (!room) throw new RuleRefusal("duties.lab.refuseNotLab", 422, undefined, "roomId");
  const movement = await writeOffBreakage({ schoolId: c.schoolId, itemCode: input.itemCode.trim(), location: room.name, quantity: input.quantity, note: input.note.trim(), byUserId: c.userId });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "duties.lab.breakage", targetType: "StockMovement", targetId: movement.id, meta: { code: movement.itemCode, quantity: input.quantity, roomId: room.id } });
  return movement;
}

/* --------------------------------------------------------- the research dean */

const apiInputsOf = (raw: string | null | undefined) => {
  const v = readJson<{ teaching?: number; research?: number; service?: number }>(raw, {});
  return { teaching: Number(v.teaching ?? 0) || 0, research: Number(v.research ?? 0) || 0, service: Number(v.service ?? 0) || 0 };
};
const round2 = (n: number) => Math.round(n * 100) / 100;

export async function researchDesk(ctx: ActiveContext): Promise<ResearchDesk> {
  const c = await deskCaller(ctx, "RESEARCH_DEAN", "IQAC");
  const [items, teachers, records] = await Promise.all([
    db.researchItem.findMany({ where: { schoolId: c.schoolId }, orderBy: [{ year: "desc" }, { createdAt: "desc" }], take: 1000, select: { id: true, kind: true, title: true, indexing: true, year: true, amountLakhs: true, facultyMembershipId: true, faculty: { select: { user: { select: { name: true, preferredName: true } } } } } }),
    db.membership.findMany({ where: { schoolId: c.schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE", leftAt: null }, select: { id: true, user: { select: { name: true, preferredName: true } } } }),
    db.facultyRecord.findMany({ where: { schoolId: c.schoolId }, select: { membershipId: true, apiScoreJson: true } }),
  ]);
  const apiBy = new Map(records.map((r) => [r.membershipId, apiInputsOf(r.apiScoreJson)]));
  // A teacher's API score is appraisal input (A3-S-11): the office and the head read it; a member holding the duty
  // reads the counts and the register only.
  const detail = !c.holder;
  const perFaculty = teachers
    .map((t) => {
      const mine = items.filter((i) => i.facultyMembershipId === t.id);
      const inputs = apiBy.get(t.id) ?? { teaching: 0, research: 0, service: 0 };
      return {
        membershipId: t.id,
        name: nameOf(t.user),
        publications: mine.filter((i) => i.kind === "PUBLICATION").length,
        books: mine.filter((i) => i.kind === "BOOK" || i.kind === "CONFERENCE").length,
        projects: mine.filter((i) => i.kind === "PROJECT" || i.kind === "CONSULTANCY" || i.kind === "SEED_MONEY").length,
        amountLakhs: round2(mine.reduce((a, i) => a + (i.amountLakhs ?? 0), 0)),
        apiScoreInputs: detail ? inputs : null,
        apiScore: detail ? round2(inputs.teaching + inputs.research + inputs.service) : null,
      };
    })
    .sort((a, b) => (b.apiScore ?? 0) - (a.apiScore ?? 0) || b.publications + b.projects - (a.publications + a.projects) || a.name.localeCompare(b.name));
  const years = [...new Set(items.map((i) => i.year))].sort((a, b) => b - a);
  return {
    items: items.map((i) => ({ id: i.id, kind: i.kind, title: i.title, indexing: i.indexing, year: i.year, amountLakhs: i.amountLakhs, facultyName: i.faculty ? nameOf(i.faculty.user) : null })),
    perFaculty,
    byYear: years.map((y) => {
      const of = items.filter((i) => i.year === y);
      return { year: y, publications: of.filter((i) => i.kind === "PUBLICATION").length, projects: of.filter((i) => i.kind === "PROJECT" || i.kind === "CONSULTANCY" || i.kind === "SEED_MONEY").length, amountLakhs: round2(of.reduce((a, i) => a + (i.amountLakhs ?? 0), 0)) };
    }),
  };
}

/* ------------------------------------------------------- the flying squad */

const DAY_MS = 86_400_000;

export async function examSquadDesk(ctx: ActiveContext, now: Date = new Date()): Promise<ExamSquadDesk> {
  const c = await deskCaller(ctx, "EXAM_SQUAD", "EXAMS", ["ADMIN", "PRINCIPAL", "EXAM_CONTROLLER"]);
  const [papers, visits, cases] = await Promise.all([
    db.examSchedule.findMany({ where: { schoolId: c.schoolId, at: { gte: new Date(now.getTime() - 2 * DAY_MS), lte: new Date(now.getTime() + 60 * DAY_MS) } }, orderBy: { at: "asc" }, take: 100, select: { id: true, courseCode: true, courseName: true, at: true, durationMin: true, session: { select: { name: true } }, rooms: { orderBy: { name: "asc" }, select: { id: true, name: true } }, _count: { select: { squadVisits: true } } } }),
    db.examSquadVisit.findMany({ where: { schoolId: c.schoolId }, orderBy: { at: "desc" }, take: 100, select: { id: true, scheduleId: true, examRoomId: true, at: true, byMembershipId: true, members: true, flagged: true, note: true, schedule: { select: { courseCode: true, rooms: { select: { id: true, name: true } } } } } }),
    db.malpractice.findMany({ where: { schoolId: c.schoolId }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, createdAt: true, decision: true, schedule: { select: { courseCode: true } }, session: { select: { name: true } }, student: { select: { user: { select: { name: true, preferredName: true } } } } } }),
  ]);
  const by = visits.length ? await db.membership.findMany({ where: { id: { in: [...new Set(visits.map((v) => v.byMembershipId))] } }, select: { id: true, user: { select: { name: true, preferredName: true } } } }) : [];
  const byName = new Map(by.map((m) => [m.id, nameOf(m.user)]));
  return {
    papers: papers.map((p) => ({ scheduleId: p.id, sessionName: p.session.name, courseCode: p.courseCode, courseName: p.courseName, at: p.at.toISOString(), durationMin: p.durationMin, halls: p.rooms, visits: p._count.squadVisits })),
    visits: visits.map((v) => ({ id: v.id, scheduleId: v.scheduleId, courseCode: v.schedule.courseCode, hallName: v.examRoomId ? (v.schedule.rooms.find((r) => r.id === v.examRoomId)?.name ?? null) : null, at: v.at.toISOString(), byName: byName.get(v.byMembershipId) ?? "", members: v.members, flagged: v.flagged, note: v.note })),
    cases: cases.map((m) => ({ id: m.id, courseCode: m.schedule.courseCode, sessionName: m.session.name, reportedOn: m.createdAt.toISOString().slice(0, 10), studentName: nameOf(m.student.user), decided: m.decision !== null, decision: m.decision })),
  };
}

/** A squad member's visit to a paper's halls, logged now; one that found something is told to the exam controllers, who enter any case. */
export async function recordSquadVisit(ctx: ActiveContext, input: { scheduleId: string; examRoomId: string | null; members: string; flagged: boolean; note: string }, now: Date = new Date()): Promise<{ id: string }> {
  const c = await deskCaller(ctx, "EXAM_SQUAD", "EXAMS", []);
  const schedule = await db.examSchedule.findFirst({ where: { id: input.scheduleId, schoolId: c.schoolId }, select: { id: true, courseCode: true, rooms: { select: { id: true } } } });
  if (!schedule) throw new RuleRefusal("duties.examSquad.refuseUnknownPaper", 422, undefined, "scheduleId");
  if (input.examRoomId && !schedule.rooms.some((r) => r.id === input.examRoomId)) throw new RuleRefusal("duties.examSquad.refuseUnknownHall", 422, undefined, "examRoomId");
  if (input.flagged && input.note.trim().length < 3) throw new RuleRefusal("duties.examSquad.refuseNeedNote", 422, undefined, "note");
  const row = await db.examSquadVisit.create({ data: { schoolId: c.schoolId, scheduleId: schedule.id, examRoomId: input.examRoomId, at: now, byMembershipId: c.membershipId, members: input.members.trim(), flagged: input.flagged, note: input.note.trim() }, select: { id: true } });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "duties.examSquad.visit", targetType: "ExamSquadVisit", targetId: row.id, meta: { scheduleId: schedule.id, flagged: input.flagged } });
  if (input.flagged) {
    const controllers = await db.membership.findMany({ where: { schoolId: c.schoolId, role: "EXAM_CONTROLLER", status: "ACTIVE", leftAt: null }, select: { userId: true } });
    await Promise.all(controllers.map((m) => notify({ userId: m.userId, schoolId: c.schoolId, kind: "SYSTEM", titleKey: "duties.examSquad.notifyFlagged", titleVars: { course: schedule.courseCode }, url: "/exam-cell" }).catch(() => undefined)));
  }
  return row;
}
