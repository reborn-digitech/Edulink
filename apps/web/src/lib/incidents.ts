import "server-only";
import type { IncidentCreate, IncidentRow, IncidentView } from "@edulink/contracts";
import { db } from "./db";
import { AccessError, assertGuardianAccess, assertStudentAccess } from "./tenancy";
import { audit } from "./audit";
import { notifyGuardians } from "./notify";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * The sick-room and incident log.
 *
 * WHO RECORDS: the teacher who was there, for a pupil of a class they teach
 * (assertStudentAccess), and the office or the head for any pupil. The
 * record is written once and never edited — what the office reads a year
 * later is what was written on the day — and follow-up goes in notes below
 * it, which any staff member who may see the incident can add. WHO CLOSES:
 * the office and the head. WHO READS: the same staff, and the child's
 * active guardians, read-only, because a family that hears about a fall
 * from the child three days later has been failed by the school. Telling
 * them is the default at the moment of recording — a push and, where the
 * school has the channel on, a text — and the record says when it went.
 * The child does not see it. (Decision 0002, row 27.)
 */

const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];
const STAFF: readonly Role[] = ["ADMIN", "PRINCIPAL", "TEACHER"];
const PAGE_SIZE = 25;

type StaffCtx = ActiveContext & { schoolId: string; membershipId: string; role: Role };

function staffOf(ctx: ActiveContext): StaffCtx {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !STAFF.includes(ctx.role)) throw new AccessError("access.notAllowed");
  return ctx as StaffCtx;
}

const include = {
  student: { select: { user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" as const }, select: { class: { select: { name: true } } }, take: 1 } } },
  reportedBy: { select: { user: { select: { name: true } } } },
  notes: { orderBy: { createdAt: "asc" as const } },
};
type Loaded = NonNullable<Awaited<ReturnType<typeof loadOne>>>;

/** Only a type source: the row shape with the include above, which Prisma cannot name any other way. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadOne(id: string) {
  return db.incident.findUnique({ where: { id }, include });
}

async function namesOf(userIds: (string | null)[]): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter((x): x is string => Boolean(x)))];
  if (ids.length === 0) return new Map();
  const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
  return new Map(users.map((u) => [u.id, u.name]));
}

function rowOf(i: Loaded, names: Map<string, string>): IncidentRow {
  return {
    id: i.id,
    studentMembershipId: i.studentMembershipId,
    studentName: i.student.user.preferredName ?? i.student.user.name,
    className: i.student.enrollments[0]?.class.name ?? null,
    reportedByName: i.reportedBy.user.name,
    kind: i.kind as IncidentRow["kind"],
    severity: i.severity as IncidentRow["severity"],
    occurredAt: i.occurredAt.toISOString(),
    place: i.place ?? "",
    title: i.title,
    guardiansNotifiedAt: i.guardiansNotifiedAt?.toISOString() ?? null,
    status: i.status as IncidentRow["status"],
    closedAt: i.closedAt?.toISOString() ?? null,
    closedByName: i.closedByUserId ? (names.get(i.closedByUserId) ?? null) : null,
    noteCount: i.notes.length,
  };
}

async function viewOf(i: Loaded, viewer: { canNote: boolean; canClose: boolean }): Promise<IncidentView> {
  const names = await namesOf([i.closedByUserId, ...i.notes.map((n) => n.authorUserId)]);
  const row = rowOf(i, names);
  return {
    id: row.id,
    studentMembershipId: row.studentMembershipId,
    studentName: row.studentName,
    className: row.className,
    reportedByName: row.reportedByName,
    kind: row.kind,
    severity: row.severity,
    occurredAt: row.occurredAt,
    place: row.place,
    title: row.title,
    guardiansNotifiedAt: row.guardiansNotifiedAt,
    status: row.status,
    closedAt: row.closedAt,
    closedByName: row.closedByName,
    body: i.body,
    actionTaken: i.actionTaken,
    notes: i.notes.map((n) => ({ id: n.id, authorName: names.get(n.authorUserId) ?? "", body: n.body, createdAt: n.createdAt.toISOString() })),
    canNote: viewer.canNote,
    canClose: viewer.canClose,
  };
}

/** A staff member may see an incident when they may see the pupil (own classes for a teacher). */
async function admitStaff(ctx: ActiveContext, studentMembershipId: string): Promise<StaffCtx> {
  const staff = staffOf(ctx);
  await assertStudentAccess({ schoolId: staff.schoolId, membershipId: staff.membershipId, role: staff.role }, studentMembershipId);
  return staff;
}

/** Records an incident, tells the family unless told not to, audits it. */
export async function recordIncident(ctx: ActiveContext, input: IncidentCreate): Promise<IncidentView> {
  const staff = await admitStaff(ctx, input.studentMembershipId);
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  if (occurredAt.getTime() > Date.now() + 5 * 60_000) throw new AccessError("incidents.refuseFuture");
  const created = await db.incident.create({
    data: {
      schoolId: staff.schoolId,
      studentMembershipId: input.studentMembershipId,
      reportedByMembershipId: staff.membershipId,
      kind: input.kind,
      severity: input.severity,
      occurredAt,
      place: input.place || null,
      title: input.title,
      body: input.body,
      actionTaken: input.actionTaken,
    },
    select: { id: true },
  });
  let notifiedAt: Date | null = null;
  if (input.notifyGuardians) {
    const school = await db.school.findUniqueOrThrow({ where: { id: staff.schoolId }, select: { name: true } });
    await notifyGuardians(input.studentMembershipId, (childName) => ({
      schoolId: staff.schoolId,
      kind: "INCIDENT",
      titleKey: input.kind === "ILLNESS" ? "notifTitle.incidentIllness" : "notifTitle.incident",
      titleVars: { name: childName },
      body: input.title,
      url: `/parent/incidents?child=${input.studentMembershipId}&incident=${created.id}`,
      text: { templateKey: "incident", vars: { child: childName, summary: input.title.slice(0, 80), school: school.name }, purpose: `incident:${created.id}` },
    }));
    notifiedAt = new Date();
    await db.incident.update({ where: { id: created.id }, data: { guardiansNotifiedAt: notifiedAt } });
  }
  await audit({
    schoolId: staff.schoolId,
    actorUserId: staff.user.id,
    action: "incident.record",
    targetType: "Incident",
    targetId: created.id,
    // The kind and the severity, never the words: the audit log is the whole office's.
    meta: { studentMembershipId: input.studentMembershipId, kind: input.kind, severity: input.severity, notified: Boolean(notifiedAt) },
  });
  return incidentFor(ctx, created.id);
}

/** One incident, for a staff member who may see the pupil. */
export async function incidentFor(ctx: ActiveContext, incidentId: string): Promise<IncidentView> {
  const staff = staffOf(ctx);
  const i = await db.incident.findFirst({ where: { id: incidentId, schoolId: staff.schoolId }, include });
  if (!i) throw new AccessError("incidents.notFound", "NOT_FOUND");
  await assertStudentAccess({ schoolId: staff.schoolId, membershipId: staff.membershipId, role: staff.role }, i.studentMembershipId);
  return viewOf(i, { canNote: i.status === "OPEN", canClose: OFFICE.includes(staff.role) && i.status === "OPEN" });
}

/** The school's incidents for the office and the head; a teacher's own pupils' for a teacher. */
export async function listIncidents(ctx: ActiveContext, query: { status: "OPEN" | "CLOSED" | "ALL"; studentMembershipId?: string; page: number }) {
  const staff = staffOf(ctx);
  const where = {
    schoolId: staff.schoolId,
    ...(query.status === "ALL" ? {} : { status: query.status }),
    ...(query.studentMembershipId ? { studentMembershipId: query.studentMembershipId } : {}),
    ...(staff.role === "TEACHER"
      ? { student: { enrollments: { some: { status: "ACTIVE" as const, class: { teachers: { some: { teacherMembershipId: staff.membershipId } } } } } } }
      : {}),
  };
  const [rows, total, openCount] = await Promise.all([
    db.incident.findMany({ where, include, orderBy: { occurredAt: "desc" }, skip: (query.page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.incident.count({ where }),
    db.incident.count({ where: { ...where, status: "OPEN" } }),
  ]);
  const names = await namesOf(rows.map((r) => r.closedByUserId));
  return { rows: rows.map((r) => rowOf(r, names)), total, page: query.page, pageSize: PAGE_SIZE, openCount };
}

/** A follow-up note: any staff member who may see the incident, while it is open. */
export async function addIncidentNote(ctx: ActiveContext, incidentId: string, body: string): Promise<IncidentView> {
  const view = await incidentFor(ctx, incidentId);
  if (!view.canNote) throw new AccessError("incidents.refuseClosed");
  const staff = staffOf(ctx);
  await db.incidentNote.create({ data: { schoolId: staff.schoolId, incidentId, authorUserId: staff.user.id, body } });
  await audit({ schoolId: staff.schoolId, actorUserId: staff.user.id, action: "incident.note", targetType: "Incident", targetId: incidentId, meta: { studentMembershipId: view.studentMembershipId } });
  return incidentFor(ctx, incidentId);
}

/** Closing: the office and the head, once follow-up is done. */
export async function closeIncident(ctx: ActiveContext, incidentId: string): Promise<IncidentView> {
  const view = await incidentFor(ctx, incidentId);
  const staff = staffOf(ctx);
  // Closing what is already closed is a no-op for the office, not a refusal:
  // two people at the desk, or a double tap, should not see an error.
  if (view.status === "CLOSED" && OFFICE.includes(staff.role)) return view;
  if (!view.canClose) throw new AccessError("access.notAllowed");
  await db.incident.update({ where: { id: incidentId }, data: { status: "CLOSED", closedAt: new Date(), closedByUserId: staff.user.id } });
  await audit({ schoolId: staff.schoolId, actorUserId: staff.user.id, action: "incident.close", targetType: "Incident", targetId: incidentId, meta: { studentMembershipId: view.studentMembershipId } });
  return incidentFor(ctx, incidentId);
}

/** A guardian's read of their child's incidents, newest first, with the follow-up notes. */
export async function familyIncidents(ctx: ActiveContext, studentMembershipId: string): Promise<{ childName: string; incidents: IncidentView[] }> {
  const link = await assertGuardianAccess(ctx.user.id, studentMembershipId);
  const rows = await db.incident.findMany({ where: { studentMembershipId }, include, orderBy: { occurredAt: "desc" } });
  const incidents = await Promise.all(rows.map((r) => viewOf(r, { canNote: false, canClose: false })));
  return { childName: link.student.user.preferredName ?? link.student.user.name, incidents };
}

/** How many open incidents a pupil has: the chip on a roster. */
export async function openIncidentCounts(schoolId: string, studentMembershipIds: string[]): Promise<Map<string, number>> {
  if (studentMembershipIds.length === 0) return new Map();
  const grouped = await db.incident.groupBy({ by: ["studentMembershipId"], where: { schoolId, status: "OPEN", studentMembershipId: { in: studentMembershipIds } }, _count: { _all: true } });
  return new Map(grouped.map((g) => [g.studentMembershipId, g._count._all]));
}
