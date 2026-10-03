import "server-only";
import { healthContactSchema, type HealthCardSave, type HealthCardView, type HealthContact } from "@edulink/contracts";

type HealthCardBloodGroup = NonNullable<HealthCardView["card"]>["bloodGroup"];
import { db } from "./db";
import { AccessError, assertGuardianAccess, assertStudentAccess } from "./tenancy";
import { readJsonArray, writeJson } from "./json";
import { audit } from "./audit";
import { forSchool } from "./tenant-context";
import { assertSelfRead } from "./self-read";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * The pupil's health and emergency card.
 *
 * WHO READS IT: the office and the head for any pupil of the school, a
 * teacher for the pupils of their own classes (assertStudentAccess), and a
 * guardian for their own child (assertGuardianAccess). Classmates never; the
 * child only from the age the school sets (self-read.ts) — a nine-year-old's
 * screen is a classroom screen, a sixteen-year-old reads their own card as
 * their family does, and never writes it. WHO WRITES IT: the office, the head and the guardians, because the
 * family knows the allergies and the office holds the doctor's number; a
 * teacher reads. A check-up (height, weight, sight) is the school's own
 * measurement and only the office records it. Every write is audited under
 * the school, and the card is a whole: what the form sends is what the card
 * becomes, so a cleared field stays cleared (decision 0002, row 26).
 *
 * EVERY STAFF READ IS A ROW. A health card is the one page a family should
 * be able to ask "who has looked at this" about, so `healthCardFor` writes a
 * HealthCardRead for the office, the head and a teacher, and the guardian
 * reads the last ninety days of them (`healthCardReadsFor`). The family's
 * own reads and the pupil's are not rows: the list is for them. A write's
 * read-back is not a row either — the audit log has the write.
 */

const WRITER_ROLES: readonly Role[] = ["ADMIN", "PRINCIPAL"];
const READER_ROLES: readonly Role[] = ["ADMIN", "PRINCIPAL", "TEACHER"];

type Viewer = { userId: string; schoolId: string; role: Role; membershipId: string | null; canEdit: boolean; canRecordCheck: boolean; studentName: string };

/** How long the guardian's "who has read this" looks back. */
export const HEALTH_READS_DAYS = 90;

/** Resolves who is asking and whether they may see this pupil's card at all. */
async function admit(ctx: ActiveContext, studentMembershipId: string): Promise<Viewer> {
  if (ctx.role === "PARENT") {
    const link = await assertGuardianAccess(ctx.user.id, studentMembershipId);
    return { userId: ctx.user.id, schoolId: link.student.schoolId, role: "PARENT", membershipId: null, canEdit: true, canRecordCheck: false, studentName: link.student.user.preferredName ?? link.student.user.name };
  }
  if (ctx.role === "STUDENT") {
    // Their own card, from the school's age, read-only: the write side never widens.
    const self = await assertSelfRead(ctx, studentMembershipId);
    return { userId: ctx.user.id, schoolId: self.schoolId, role: "STUDENT", membershipId: self.membershipId, canEdit: false, canRecordCheck: false, studentName: self.studentName };
  }
  if (!ctx.schoolId || !ctx.role || !ctx.membershipId || !READER_ROLES.includes(ctx.role)) throw new AccessError("access.notAllowed");
  const student = await assertStudentAccess({ schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role }, studentMembershipId);
  const writer = WRITER_ROLES.includes(ctx.role);
  return { userId: ctx.user.id, schoolId: ctx.schoolId, role: ctx.role, membershipId: ctx.membershipId, canEdit: writer, canRecordCheck: writer, studentName: student.user.preferredName ?? student.user.name };
}

export function readContacts(raw: string | null | undefined): HealthContact[] {
  return readJsonArray<unknown>(raw)
    .map((c) => healthContactSchema.safeParse(c))
    .flatMap((r) => (r.success ? [r.data] : []));
}

/** The card as the viewer may see it, with the check-ups newest first. A staff read is recorded for the family. */
export async function healthCardFor(ctx: ActiveContext, studentMembershipId: string): Promise<HealthCardView> {
  const viewer = await admit(ctx, studentMembershipId);
  const view = await loadCard(viewer, studentMembershipId);
  if (READER_ROLES.includes(viewer.role)) {
    const cardId = await db.healthCard.findUnique({ where: { studentMembershipId }, select: { id: true } });
    // Bound to the pupil's school, which `admit` has already established is the reader's own.
    await forSchool(viewer.schoolId, () =>
      db.healthCardRead.create({ data: { schoolId: viewer.schoolId, studentMembershipId, healthCardId: cardId?.id ?? null, readerUserId: viewer.userId, readerRole: viewer.role }, select: { id: true } }),
    );
  }
  return view;
}

/**
 * The guardian's list of who at the school opened the card, last ninety
 * days, newest first. Names are read at list time, so a teacher who has
 * since left still has a name; the role is the one they read with.
 */
export async function healthCardReadsFor(ctx: ActiveContext, studentMembershipId: string, now: Date = new Date()) {
  if (ctx.role !== "PARENT") throw new AccessError("access.notAllowed");
  const link = await assertGuardianAccess(ctx.user.id, studentMembershipId);
  const since = new Date(now.getTime() - HEALTH_READS_DAYS * 86_400_000);
  const rows = await db.healthCardRead.findMany({
    where: { schoolId: link.student.schoolId, studentMembershipId, readAt: { gte: since } },
    orderBy: { readAt: "desc" },
    take: 500,
    select: { id: true, readerUserId: true, readerRole: true, readAt: true },
  });
  const ids = [...new Set(rows.map((r) => r.readerUserId))];
  const users = ids.length ? await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }) : [];
  const names = new Map(users.map((u) => [u.id, u.name]));
  return {
    studentMembershipId,
    childName: link.student.user.preferredName ?? link.student.user.name,
    days: HEALTH_READS_DAYS,
    reads: rows.map((r) => ({ id: r.id, readerName: names.get(r.readerUserId) ?? "", readerRole: r.readerRole as "ADMIN" | "PRINCIPAL" | "TEACHER" | "WARDEN", readAt: r.readAt.toISOString() })),
  };
}

/** The card itself, for a viewer `admit` has already let in. */
async function loadCard(viewer: Viewer, studentMembershipId: string): Promise<HealthCardView> {
  const [card, enrolment] = await Promise.all([
    db.healthCard.findUnique({ where: { studentMembershipId }, include: { checks: { orderBy: [{ dateKey: "desc" }, { createdAt: "desc" }] } } }),
    db.enrollment.findFirst({ where: { studentMembershipId, status: "ACTIVE" }, select: { class: { select: { name: true } } } }),
  ]);
  const updatedBy = card?.updatedByUserId ? await db.user.findUnique({ where: { id: card.updatedByUserId }, select: { name: true } }) : null;
  return {
    studentMembershipId,
    studentName: viewer.studentName,
    className: enrolment?.class.name ?? null,
    card: card
      ? {
          bloodGroup: (card.bloodGroup as HealthCardBloodGroup | null) ?? null,
          allergies: card.allergies,
          conditions: card.conditions,
          medications: card.medications,
          dietary: card.dietary,
          notes: card.notes,
          doctorName: card.doctorName ?? "",
          doctorPhone: card.doctorPhone ?? "",
          contacts: readContacts(card.contactsJson),
          updatedAt: card.updatedAt.toISOString(),
          updatedByName: updatedBy?.name ?? null,
        }
      : null,
    checks: (card?.checks ?? []).map((c) => ({ id: c.id, dateKey: c.dateKey, heightCm: c.heightCm, weightGrams: c.weightGrams, visionLeft: c.visionLeft, visionRight: c.visionRight, notes: c.notes })),
    canEdit: viewer.canEdit,
    canRecordCheck: viewer.canRecordCheck,
  };
}

/** Writes the whole card. The office, the head or a guardian; a teacher is refused. */
export async function saveHealthCard(ctx: ActiveContext, studentMembershipId: string, input: HealthCardSave): Promise<HealthCardView> {
  const viewer = await admit(ctx, studentMembershipId);
  if (!viewer.canEdit) throw new AccessError("access.notAllowed");
  const data = {
    bloodGroup: input.bloodGroup,
    allergies: input.allergies,
    conditions: input.conditions,
    medications: input.medications,
    dietary: input.dietary,
    notes: input.notes,
    doctorName: input.doctorName || null,
    doctorPhone: input.doctorPhone || null,
    contactsJson: writeJson(input.contacts),
    updatedByUserId: viewer.userId,
  };
  const card = await db.healthCard.upsert({
    where: { studentMembershipId },
    create: { schoolId: viewer.schoolId, studentMembershipId, ...data },
    update: data,
    select: { id: true },
  });
  await audit({
    schoolId: viewer.schoolId,
    actorUserId: viewer.userId,
    action: "health.update",
    targetType: "Membership",
    targetId: studentMembershipId,
    // What kind of thing changed, never the text: the audit log is read by the whole office.
    meta: { cardId: card.id, by: viewer.role, allergies: input.allergies.length > 0, conditions: input.conditions.length > 0, contacts: input.contacts.length },
  });
  return loadCard(viewer, studentMembershipId);
}

/** Records one check-up. The office and the head only. */
export async function recordHealthCheck(
  ctx: ActiveContext,
  studentMembershipId: string,
  input: { dateKey: string; heightCm: number | null; weightGrams: number | null; visionLeft: string; visionRight: string; notes: string },
): Promise<HealthCardView> {
  const viewer = await admit(ctx, studentMembershipId);
  if (!viewer.canRecordCheck) throw new AccessError("access.notAllowed");
  // A check-up on a pupil with no card yet gets an empty card to hang on: the measurements are the school's regardless.
  const card = await db.healthCard.upsert({ where: { studentMembershipId }, create: { schoolId: viewer.schoolId, studentMembershipId }, update: {}, select: { id: true } });
  const check = await db.healthCheck.create({
    data: {
      schoolId: viewer.schoolId,
      cardId: card.id,
      studentMembershipId,
      dateKey: input.dateKey,
      heightCm: input.heightCm,
      weightGrams: input.weightGrams,
      visionLeft: input.visionLeft || null,
      visionRight: input.visionRight || null,
      notes: input.notes,
      recordedByUserId: viewer.userId,
    },
    select: { id: true },
  });
  await audit({ schoolId: viewer.schoolId, actorUserId: viewer.userId, action: "health.check", targetType: "Membership", targetId: studentMembershipId, meta: { checkId: check.id, dateKey: input.dateKey } });
  return loadCard(viewer, studentMembershipId);
}

export type HealthFlag = { allergies: boolean; conditions: boolean; medications: boolean };

/**
 * The one-glance flags for a roster: which pupils have an allergy, a
 * condition or a medication on their card. For the class page and the
 * register, where a teacher should see the warning before the name is
 * called; the card itself is a tap away. Scoped to the school; the caller
 * has already established the class is theirs.
 */
export async function healthFlagsFor(schoolId: string, studentMembershipIds: string[]): Promise<Map<string, HealthFlag>> {
  if (studentMembershipIds.length === 0) return new Map();
  const cards = await db.healthCard.findMany({
    where: { schoolId, studentMembershipId: { in: studentMembershipIds } },
    select: { studentMembershipId: true, allergies: true, conditions: true, medications: true },
  });
  return new Map(cards.map((c) => [c.studentMembershipId, { allergies: c.allergies.length > 0, conditions: c.conditions.length > 0, medications: c.medications.length > 0 }]));
}
