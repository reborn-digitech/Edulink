import "server-only";
import { RECORD_CHANGE_FIELDS, type PupilRecordField, type PupilRecordSave, type RecordChangeStatus, type RecordChangeView } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import { readJsonArray, writeJson } from "./json";
import { codedValues, EMPTY_RECORD, recordView, recordViewer, savePupilRecord } from "./pupil-records";
import type { ActiveContext } from "./session";

/**
 * A family's ask to change the pupil record.
 *
 * The record is the office's to write. A guardian or the pupil reads it and
 * proposes new values on the record's own form, with a reason; an admin or
 * the head applies them or declines, with a sentence for the family if they
 * choose. Filling a blank the office asked about is an ask like any other.
 *
 * WHAT MAY BE ASKED: every field but the PEN, which has a correction of its
 * own (pen-changes.ts), and the roll number and "repeating", which are the
 * enrolment's. Only the fields that differ from the record are kept, each
 * with what the record held when it was asked, so the office reads a change
 * and not a form.
 *
 * ONE WAITS PER PUPIL. Asking again while one waits replaces it, whoever in
 * the family asks: the office decides one paper and not a pile.
 *
 * THE VALUES ARE CHECKED WHEN ASKED, by the checks the office's own save
 * runs, and again when applied, because approval goes through that save.
 * The audit log carries which fields and never their values; the reason and
 * the decline's sentence are free text and stay out of it.
 */

type Change = { field: PupilRecordField; from: string | null; to: string | null };
const OFFICE = ["ADMIN", "PRINCIPAL"] as const;
const isOffice = (ctx: ActiveContext, schoolId: string) => ctx.schoolId === schoolId && ctx.role !== null && (OFFICE as readonly string[]).includes(ctx.role);

const INCLUDE = { student: { select: { userId: true, status: true, leftAt: true, user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } } } as const;
type Row = { id: string; schoolId: string; studentMembershipId: string; requestedByUserId: string; byPupil: boolean; changesJson: string; reason: string; status: string; decidedAt: Date | null; decidedByUserId: string | null; declineReason: string | null; createdAt: Date; student: { userId: string; status: string; leftAt: Date | null; user: { name: string; preferredName: string | null }; enrollments: { class: { name: string } }[] } };

async function names(ids: (string | null)[]): Promise<Map<string, string>> {
  const wanted = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (wanted.length === 0) return new Map();
  const users = await db.user.findMany({ where: { id: { in: wanted } }, select: { id: true, name: true, preferredName: true } });
  return new Map(users.map((u) => [u.id, u.preferredName ?? u.name]));
}

async function isFamilyOf(ctx: ActiveContext, row: { studentMembershipId: string }): Promise<boolean> {
  if (ctx.role === "STUDENT") return ctx.membershipId === row.studentMembershipId;
  if (ctx.role !== "PARENT") return false;
  return Boolean(await db.guardianship.findFirst({ where: { parentUserId: ctx.user.id, studentMembershipId: row.studentMembershipId, status: "ACTIVE" }, select: { id: true } }));
}

async function view(ctx: ActiveContext, rows: Row[]): Promise<RecordChangeView[]> {
  const who = await names(rows.flatMap((r) => [r.requestedByUserId, r.decidedByUserId]));
  const out: RecordChangeView[] = [];
  for (const r of rows) {
    const pending = r.status === "PENDING";
    out.push({
      id: r.id,
      studentMembershipId: r.studentMembershipId,
      studentName: r.student.user.preferredName ?? r.student.user.name,
      className: r.student.enrollments[0]?.class.name ?? null,
      requestedByName: who.get(r.requestedByUserId) ?? "",
      byPupil: r.byPupil,
      reason: r.reason,
      status: r.status as RecordChangeStatus,
      changes: readJsonArray<Change>(r.changesJson),
      declineReason: r.declineReason,
      decidedByName: r.decidedByUserId ? (who.get(r.decidedByUserId) ?? null) : null,
      decidedAt: r.decidedAt?.toISOString() ?? null,
      can: { decide: pending && isOffice(ctx, r.schoolId), withdraw: pending && (await isFamilyOf(ctx, r)) },
      createdAt: r.createdAt.toISOString(),
    });
  }
  return out;
}

/** The ask waiting on a pupil's record, for the record view: the family's and the office's to read, nobody else's. */
export async function pendingRecordChange(ctx: ActiveContext, studentMembershipId: string): Promise<RecordChangeView | null> {
  if (ctx.role !== "PARENT" && ctx.role !== "STUDENT" && ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") return null;
  const row = await db.recordChangeRequest.findFirst({ where: { studentMembershipId, status: "PENDING" }, include: INCLUDE });
  return row ? (await view(ctx, [row]))[0]! : null;
}

/** The record's present values as the form's strings, a blank as null. */
async function presentValues(studentMembershipId: string): Promise<Record<string, string | null>> {
  const record = await db.pupilRecord.findUnique({ where: { studentMembershipId } });
  return (recordView(record ?? EMPTY_RECORD) ?? {}) as Record<string, string | null>;
}

/** A guardian or the pupil asks. Asking again while one waits replaces it. */
export async function fileRecordChange(ctx: ActiveContext, studentMembershipId: string, input: { changes: PupilRecordSave; reason: string }): Promise<RecordChangeView> {
  const viewer = await recordViewer(ctx, studentMembershipId);
  if (!viewer.family) throw new AccessError("recordChanges.officeEditsItself");
  const pupil = await db.membership.findUnique({ where: { id: studentMembershipId }, select: { status: true, leftAt: true } });
  if (!pupil || pupil.status !== "ACTIVE" || pupil.leftAt) throw new AccessError("recordChanges.pupilHasLeft");

  const coded = await codedValues(studentMembershipId, input.changes);
  const present = await presentValues(studentMembershipId);
  const changes: Change[] = [];
  for (const field of RECORD_CHANGE_FIELDS) {
    const typed = (input.changes as Record<string, string | null | undefined>)[field];
    if (typed === undefined) continue;
    let to: string | null = typeof typed === "string" ? typed.trim() || null : null;
    if (field === "motherTongue") to = coded.motherTongue ?? null;
    else if (field === "nationality") to = coded.nationality ?? null;
    else if (field === "postalCode") to = coded.pin ?? null;
    else if (field === "guardianPhone") to = coded.contact ?? null;
    else if (field === "alternatePhone") to = coded.alternate ?? null;
    else if (field === "annualIncome" && to !== null) to = String(Number(to));
    const from = present[field] ?? null;
    if (to !== from) changes.push({ field, from, to });
  }
  if (changes.length === 0) throw new AccessError("recordChanges.nothingChanges");

  const reason = input.reason.trim();
  const open = await db.recordChangeRequest.findFirst({ where: { studentMembershipId, status: "PENDING" }, include: INCLUDE });
  const data = { requestedByUserId: ctx.user.id, byPupil: viewer.role === "STUDENT", changesJson: writeJson(changes), reason };
  const same = open && open.changesJson === data.changesJson && open.reason === reason;
  const row = open
    ? await db.recordChangeRequest.update({ where: { id: open.id }, data, include: INCLUDE })
    : await db.recordChangeRequest.create({ data: { schoolId: viewer.schoolId, studentMembershipId, ...data }, include: INCLUDE });
  if (same) return (await view(ctx, [row]))[0]!;

  await audit({ schoolId: viewer.schoolId, actorUserId: ctx.user.id, action: "pupilRecord.change.request", targetType: "Membership", targetId: studentMembershipId, meta: { requestId: row.id, fields: changes.map((c) => c.field), byPupil: data.byPupil, replaced: Boolean(open) } });
  // The office is told once per ask, not once per correction to it.
  if (!open) {
    const office = await db.membership.findMany({ where: { schoolId: viewer.schoolId, role: { in: [...OFFICE] }, status: "ACTIVE", leftAt: null }, select: { userId: true } });
    await Promise.all(
      [...new Set(office.map((m) => m.userId))].map((userId) =>
        notify({ userId, schoolId: viewer.schoolId, kind: "SYSTEM", titleKey: "recordChanges.notifAsked", titleVars: { name: viewer.studentName }, bodyKey: "recordChanges.notifAskedBody", url: `/admin/records/${studentMembershipId}` }).catch((error) => console.error("[fileRecordChange] notice failed", error)),
      ),
    );
  }
  return (await view(ctx, [row]))[0]!;
}

/** The office applies the ask or declines it. Deciding a settled one answers it as it stands. */
export async function decideRecordChange(ctx: ActiveContext, requestId: string, input: { approve: boolean; reason?: string }): Promise<RecordChangeView> {
  const row = await db.recordChangeRequest.findFirst({ where: { id: requestId }, include: INCLUDE });
  if (!row || !isOffice(ctx, row.schoolId)) throw new AccessError("recordChanges.notFound", "NOT_FOUND");
  if (row.status !== "PENDING") return (await view(ctx, [row]))[0]!;
  const changes = readJsonArray<Change>(row.changesJson);
  const declineReason = input.approve ? null : input.reason?.trim() || null;
  // The status first, and only from PENDING: two people pressing together decide once.
  const won = await db.recordChangeRequest.updateMany({ where: { id: requestId, status: "PENDING" }, data: { status: input.approve ? "APPLIED" : "DECLINED", decidedAt: new Date(), decidedByUserId: ctx.user.id, declineReason } });
  if (won.count === 0) {
    const now = await db.recordChangeRequest.findFirstOrThrow({ where: { id: requestId }, include: INCLUDE });
    return (await view(ctx, [now]))[0]!;
  }
  if (input.approve) {
    const body = Object.fromEntries(changes.map((c) => [c.field, c.field === "admissionDate" || c.field === "previousSchoolTcDate" ? c.to : (c.to ?? "")])) as PupilRecordSave;
    try {
      await savePupilRecord(ctx, row.studentMembershipId, body, { fromFamily: true });
    } catch (error) {
      // A value the save now refuses: the ask goes back to waiting, for the office to decline or the family to correct.
      await db.recordChangeRequest.update({ where: { id: requestId }, data: { status: "PENDING", decidedAt: null, decidedByUserId: null } });
      throw error;
    }
  }
  await audit({ schoolId: row.schoolId, actorUserId: ctx.user.id, action: input.approve ? "pupilRecord.change.apply" : "pupilRecord.change.decline", targetType: "Membership", targetId: row.studentMembershipId, meta: { requestId, fields: changes.map((c) => c.field), reasonGiven: declineReason !== null } });

  const name = row.student.user.preferredName ?? row.student.user.name;
  const titleKey = input.approve ? ("recordChanges.notifApplied" as const) : ("recordChanges.notifDeclined" as const);
  const told = { schoolId: row.schoolId, kind: "SYSTEM" as const, titleKey, titleVars: { name }, ...(declineReason ? { body: declineReason } : { bodyKey: input.approve ? ("recordChanges.notifAppliedBody" as const) : ("recordChanges.notifDeclinedBody" as const) }) };
  await notifyGuardians(row.studentMembershipId, () => ({ ...told, url: `/parent/record?child=${row.studentMembershipId}` })).catch((error) => console.error("[decideRecordChange] notice failed", error));
  if (row.byPupil) await notify({ ...told, userId: row.student.userId, url: "/student/record" }).catch((error) => console.error("[decideRecordChange] notice failed", error));

  const now = await db.recordChangeRequest.findFirstOrThrow({ where: { id: requestId }, include: INCLUDE });
  return (await view(ctx, [now]))[0]!;
}

/** The family takes a waiting ask back. A settled one is answered as it stands. */
export async function withdrawRecordChange(ctx: ActiveContext, requestId: string): Promise<RecordChangeView> {
  const row = await db.recordChangeRequest.findFirst({ where: { id: requestId }, include: INCLUDE });
  if (!row || !(await isFamilyOf(ctx, row))) throw new AccessError("recordChanges.notFound", "NOT_FOUND");
  if (row.status !== "PENDING") return (await view(ctx, [row]))[0]!;
  await db.recordChangeRequest.updateMany({ where: { id: requestId, status: "PENDING" }, data: { status: "WITHDRAWN", decidedAt: new Date() } });
  await audit({ schoolId: row.schoolId, actorUserId: ctx.user.id, action: "pupilRecord.change.withdraw", targetType: "Membership", targetId: row.studentMembershipId, meta: { requestId } });
  const now = await db.recordChangeRequest.findFirstOrThrow({ where: { id: requestId }, include: INCLUDE });
  return (await view(ctx, [now]))[0]!;
}

/** The family's list for one pupil: what waits first, then what was decided, newest first. */
export async function familyRecordChanges(ctx: ActiveContext, studentMembershipId: string): Promise<{ items: RecordChangeView[]; pending: number }> {
  const viewer = await recordViewer(ctx, studentMembershipId);
  if (!viewer.family) throw new AccessError("access.wrongRoleForThisAction");
  const rows = await db.recordChangeRequest.findMany({ where: { studentMembershipId }, orderBy: { createdAt: "desc" }, include: INCLUDE, take: 20 });
  rows.sort((a, b) => (a.status === "PENDING" ? 0 : 1) - (b.status === "PENDING" ? 0 : 1) || b.createdAt.getTime() - a.createdAt.getTime());
  return { items: await view(ctx, rows), pending: rows.filter((r) => r.status === "PENDING").length };
}

/** The office's list: what waits first, oldest of those first so nobody waits longest unseen. */
export async function officeRecordChanges(ctx: ActiveContext, status?: RecordChangeStatus): Promise<{ items: RecordChangeView[]; pending: number }> {
  if (!ctx.schoolId || !isOffice(ctx, ctx.schoolId)) throw new AccessError("access.notAllowed");
  const [rows, pending] = await Promise.all([
    db.recordChangeRequest.findMany({ where: { schoolId: ctx.schoolId, ...(status ? { status } : {}) }, orderBy: { createdAt: "desc" }, include: INCLUDE, take: 200 }),
    db.recordChangeRequest.count({ where: { schoolId: ctx.schoolId, status: "PENDING" } }),
  ]);
  rows.sort((a, b) => (a.status === "PENDING" ? 0 : 1) - (b.status === "PENDING" ? 0 : 1) || (a.status === "PENDING" ? a.createdAt.getTime() - b.createdAt.getTime() : b.createdAt.getTime() - a.createdAt.getTime()));
  return { items: await view(ctx, rows), pending };
}
