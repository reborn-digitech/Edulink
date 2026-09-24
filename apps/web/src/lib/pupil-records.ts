import "server-only";
import { PUPIL_CATEGORIES, type PupilRecordField, type PupilRecordSave, type PupilRecordView } from "@edulink/contracts";
import { db } from "./db";
import { AccessError, assertGuardianAccess, assertStudentAccess } from "./tenancy";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import { REQUIRED_RECORD_FIELDS } from "./certificate-rules";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";
import { assignPen, normalisePen } from "./pen";
import { pendingPenChange } from "./pen-changes";

/**
 * The pupil record: the identity and admission details a certificate names.
 *
 * WHO WRITES IT: the family — a guardian, or the pupil themselves — and the
 * office. A teacher of the pupil's class may read it (a class teacher fills a
 * TC's rows from it) but not write it. Classmates never see it. The date of
 * birth stays on the user, under birthdate.ts's own rules; the record shows
 * it and says whom to ask.
 */
const READER_ROLES: readonly Role[] = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT"];
const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];

type Viewer = { userId: string; schoolId: string; role: Role; canEdit: boolean; family: boolean; studentName: string; studentCode: string | null; birthdateKey: string | null; studentUserId: string; accountPen: string | null };

async function admit(ctx: ActiveContext, studentMembershipId: string): Promise<Viewer> {
  if (ctx.role === "PARENT") {
    const link = await assertGuardianAccess(ctx.user.id, studentMembershipId);
    const acct = await db.membership.findUniqueOrThrow({ where: { id: studentMembershipId }, select: { userId: true, user: { select: { penNumber: true } } } });
    return { userId: ctx.user.id, schoolId: link.student.schoolId, role: "PARENT", canEdit: true, family: true, studentName: link.student.user.preferredName ?? link.student.user.name, studentCode: link.student.studentCode ?? null, birthdateKey: link.student.user.birthdate?.toISOString().slice(0, 10) ?? null, studentUserId: acct.userId, accountPen: acct.user.penNumber };
  }
  if (!ctx.schoolId || !ctx.role || !ctx.membershipId || !READER_ROLES.includes(ctx.role)) throw new AccessError("access.notAllowed");
  if (ctx.role === "STUDENT") {
    if (ctx.membershipId !== studentMembershipId) throw new AccessError("access.notAllowed", "NOT_FOUND");
    const me = await db.membership.findUniqueOrThrow({ where: { id: studentMembershipId }, select: { studentCode: true, userId: true, user: { select: { name: true, preferredName: true, birthdate: true, penNumber: true } } } });
    return { userId: ctx.user.id, schoolId: ctx.schoolId, role: "STUDENT", canEdit: true, family: true, studentName: me.user.preferredName ?? me.user.name, studentCode: me.studentCode, birthdateKey: me.user.birthdate?.toISOString().slice(0, 10) ?? null, studentUserId: me.userId, accountPen: me.user.penNumber };
  }
  const student = await assertStudentAccess({ schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role }, studentMembershipId);
  const row = await db.membership.findUniqueOrThrow({ where: { id: studentMembershipId }, select: { studentCode: true, userId: true, user: { select: { birthdate: true, penNumber: true } } } });
  return { userId: ctx.user.id, schoolId: ctx.schoolId, role: ctx.role, canEdit: OFFICE.includes(ctx.role), family: false, studentName: student.user.preferredName ?? student.user.name, studentCode: row.studentCode, birthdateKey: row.user.birthdate?.toISOString().slice(0, 10) ?? null, studentUserId: row.userId, accountPen: row.user.penNumber };
}

type RecordRow = {
  fatherName: string | null; motherName: string | null; placeOfBirth: string | null; nationality: string | null; religion: string | null; caste: string | null; category: string | null; motherTongue: string | null;
  addressLine: string | null; city: string | null; postalCode: string | null; admissionNumber: string | null; admissionDate: Date | null; admittedToGrade: string | null; previousSchool: string | null; penNumber: string | null;
  gender: string | null; nameLocal: string | null; fatherNameLocal: string | null; motherNameLocal: string | null; bpl: boolean | null; ews: boolean | null; cwsnType: string | null; bloodGroup: string | null;
  previousSchoolTcNumber: string | null; previousSchoolTcDate: Date | null; fatherOccupation: string | null; motherOccupation: string | null; annualIncome: number | null;
  requestedAt: Date | null; familyFilledAt: Date | null; updatedAt: Date;
};

/** What the UDISE+ student sheet cannot be filled without, beyond the certificate fields. A blank impairment means none, so it is not asked. */
export const FILING_RECORD_FIELDS = ["gender", "category", "motherTongue", "bpl", "ews", "admissionNumber", "admissionDate", "addressLine", "postalCode"] as const;

const yesNo = (v: boolean | null | undefined) => (v === true ? "yes" : v === false ? "no" : null);

/** The filing fields still blank on a record; every one of them when there is no record. A category the sheet cannot code counts as blank. */
export function missingFilingFields(record: RecordRow | null): PupilRecordField[] {
  return FILING_RECORD_FIELDS.filter((f) => {
    const v = record?.[f];
    if (f === "category") return typeof v !== "string" || !(PUPIL_CATEGORIES as readonly string[]).includes(v.trim().toUpperCase());
    return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
  }) as PupilRecordField[];
}

const EMPTY_RECORD: RecordRow = { fatherName: null, motherName: null, placeOfBirth: null, nationality: null, religion: null, caste: null, category: null, motherTongue: null, addressLine: null, city: null, postalCode: null, admissionNumber: null, admissionDate: null, admittedToGrade: null, previousSchool: null, penNumber: null, gender: null, nameLocal: null, fatherNameLocal: null, motherNameLocal: null, bpl: null, ews: null, cwsnType: null, bloodGroup: null, previousSchoolTcNumber: null, previousSchoolTcDate: null, fatherOccupation: null, motherOccupation: null, annualIncome: null, requestedAt: null, familyFilledAt: null, updatedAt: new Date(0) };

/** The certificate fields still blank on a record; every one of them when there is no record. */
export function missingFields(record: RecordRow | null): PupilRecordField[] {
  return REQUIRED_RECORD_FIELDS.filter((f) => {
    const v = record?.[f];
    return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
  }) as PupilRecordField[];
}

function recordView(record: RecordRow | null, rollNumber: number | null = null) {
  if (!record) return null;
  return {
    previousSchoolTcNumber: record.previousSchoolTcNumber, previousSchoolTcDate: record.previousSchoolTcDate?.toISOString().slice(0, 10) ?? null,
    fatherOccupation: record.fatherOccupation, motherOccupation: record.motherOccupation, annualIncome: record.annualIncome === null ? null : String(record.annualIncome),
    rollNumber: rollNumber === null ? null : String(rollNumber),
    fatherName: record.fatherName, motherName: record.motherName, placeOfBirth: record.placeOfBirth, nationality: record.nationality, religion: record.religion, caste: record.caste, category: record.category, motherTongue: record.motherTongue,
    addressLine: record.addressLine, city: record.city, postalCode: record.postalCode, admissionNumber: record.admissionNumber, admissionDate: record.admissionDate?.toISOString().slice(0, 10) ?? null, admittedToGrade: record.admittedToGrade, previousSchool: record.previousSchool, penNumber: record.penNumber,
    gender: record.gender, nameLocal: record.nameLocal, fatherNameLocal: record.fatherNameLocal, motherNameLocal: record.motherNameLocal, bpl: yesNo(record.bpl), ews: yesNo(record.ews), cwsnType: record.cwsnType, bloodGroup: record.bloodGroup,
    requestedAt: record.requestedAt?.toISOString() ?? null, familyFilledAt: record.familyFilledAt?.toISOString() ?? null, updatedAt: record.updatedAt.toISOString(),
  };
}

export async function pupilRecordFor(ctx: ActiveContext, studentMembershipId: string): Promise<PupilRecordView> {
  const viewer = await admit(ctx, studentMembershipId);
  const [record, enrolment] = await Promise.all([
    db.pupilRecord.findUnique({ where: { studentMembershipId } }),
    db.enrollment.findFirst({ where: { studentMembershipId, status: "ACTIVE" }, select: { rollNumber: true, class: { select: { name: true } } } }),
  ]);
  // The PEN is the account's; a record that has not caught up shows it anyway.
  const merged = record ? { ...record, penNumber: viewer.accountPen ?? record.penNumber } : viewer.accountPen ? ({ ...EMPTY_RECORD, penNumber: viewer.accountPen } as RecordRow) : null;
  const missing = missingFields(merged);
  const penChange = await pendingPenChange(ctx, studentMembershipId);
  return { studentMembershipId, studentName: viewer.studentName, className: enrolment?.class.name ?? null, studentCode: viewer.studentCode, birthdate: viewer.birthdateKey, record: recordView(merged, enrolment?.rollNumber ?? null), missing, missingForFiling: missingFilingFields(merged), complete: missing.length === 0, canEdit: viewer.canEdit, penEditable: ctx.role === "ADMIN" && !viewer.accountPen, penChange };
}

/** Writes the whole record. A blank clears the field. The family's write is dated so the office sees who filled it. */
export async function savePupilRecord(ctx: ActiveContext, studentMembershipId: string, input: PupilRecordSave): Promise<PupilRecordView> {
  const viewer = await admit(ctx, studentMembershipId);
  if (!viewer.canEdit) throw new AccessError("access.notAllowed");
  const text = (v: string | undefined) => (v === undefined ? undefined : v.trim() || null);
  // The PEN is the admin's to enter, once: the family's form shows it and never sends it, a
  // principal reads it, and a correction after the first entry goes through a change request
  // the head and a guardian both approve (pen-changes.ts).
  let pen: string | null | undefined = undefined;
  if (input.penNumber !== undefined) {
    const wanted = normalisePen(input.penNumber);
    if (ctx.role !== "ADMIN") {
      if ((wanted ?? null) !== (viewer.accountPen ?? null)) throw new AccessError("pupilRecord.penOnlyAdmin");
    } else if (viewer.accountPen && wanted !== viewer.accountPen) {
      throw new AccessError("pupilRecord.penChangeNeedsApproval");
    } else if (!viewer.accountPen && wanted) {
      await assignPen(viewer.studentUserId, wanted);
      await audit({ schoolId: viewer.schoolId, actorUserId: viewer.userId, action: "pen.set", targetType: "Membership", targetId: studentMembershipId });
      pen = wanted;
    } else {
      pen = viewer.accountPen ?? null;
    }
  }
  const data = {
    fatherName: text(input.fatherName), motherName: text(input.motherName), placeOfBirth: text(input.placeOfBirth), nationality: text(input.nationality), religion: text(input.religion), caste: text(input.caste), category: text(input.category), motherTongue: text(input.motherTongue),
    addressLine: text(input.addressLine), city: text(input.city), postalCode: text(input.postalCode), admissionNumber: text(input.admissionNumber),
    admissionDate: input.admissionDate === undefined ? undefined : input.admissionDate ? new Date(`${input.admissionDate}T00:00:00Z`) : null,
    admittedToGrade: text(input.admittedToGrade), previousSchool: text(input.previousSchool), penNumber: pen,
    gender: text(input.gender), nameLocal: text(input.nameLocal), fatherNameLocal: text(input.fatherNameLocal), motherNameLocal: text(input.motherNameLocal),
    bpl: input.bpl === undefined ? undefined : input.bpl === "" ? null : input.bpl === "yes",
    ews: input.ews === undefined ? undefined : input.ews === "" ? null : input.ews === "yes",
    cwsnType: text(input.cwsnType), bloodGroup: text(input.bloodGroup),
    previousSchoolTcNumber: text(input.previousSchoolTcNumber),
    previousSchoolTcDate: input.previousSchoolTcDate === undefined ? undefined : input.previousSchoolTcDate ? new Date(`${input.previousSchoolTcDate}T00:00:00Z`) : null,
    fatherOccupation: text(input.fatherOccupation), motherOccupation: text(input.motherOccupation),
    annualIncome: input.annualIncome === undefined ? undefined : input.annualIncome === "" ? null : Number(input.annualIncome),
    updatedByUserId: viewer.userId,
    ...(viewer.family ? { familyFilledAt: new Date() } : {}),
  };
  await db.pupilRecord.upsert({ where: { studentMembershipId }, create: { schoolId: viewer.schoolId, studentMembershipId, ...data }, update: data });
  // The roll number lives on the present enrolment and is the office's to set; a family's form never sends it and a family's body is ignored if it does.
  if (input.rollNumber !== undefined && !viewer.family) {
    await db.enrollment.updateMany({ where: { studentMembershipId, status: "ACTIVE" }, data: { rollNumber: input.rollNumber === "" ? null : Number(input.rollNumber) } });
  }
  // Which fields, never their values: a caste or an address is not for the audit log.
  await audit({ schoolId: viewer.schoolId, actorUserId: viewer.userId, action: "pupilRecord.update", targetType: "Membership", targetId: studentMembershipId, meta: { fields: Object.keys(input).filter((k) => (input as Record<string, unknown>)[k] !== undefined), family: viewer.family } });
  return pupilRecordFor(ctx, studentMembershipId);
}

/** Every pupil on the roll with what is still blank, for the office. */
export async function officeRecords(ctx: ActiveContext, missingOnly: boolean) {
  if (!ctx.schoolId || !ctx.role || !OFFICE.includes(ctx.role)) throw new AccessError("access.notAllowed");
  const pupils = await db.membership.findMany({
    where: { schoolId: ctx.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null },
    select: { id: true, user: { select: { name: true, preferredName: true } }, pupilRecord: true, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } },
    orderBy: [{ user: { name: "asc" } }],
    take: 2000,
  });
  const rows = pupils.map((p) => ({
    studentMembershipId: p.id,
    studentName: p.user.preferredName ?? p.user.name,
    className: p.enrollments[0]?.class.name ?? null,
    missing: missingFields(p.pupilRecord),
    missingForFiling: missingFilingFields(p.pupilRecord),
    requestedAt: p.pupilRecord?.requestedAt?.toISOString() ?? null,
    familyFilledAt: p.pupilRecord?.familyFilledAt?.toISOString() ?? null,
  }));
  const incomplete = rows.filter((r) => r.missing.length > 0).length;
  return { rows: missingOnly ? rows.filter((r) => r.missing.length > 0) : rows, total: rows.length, complete: rows.length - incomplete, incomplete };
}

/**
 * Ask the families to fill what is blank: every incomplete pupil, or the
 * ones named. Each guardian and the pupil get a notification that opens the
 * form; the record remembers when it was asked so the office can see who
 * has not answered.
 */
export async function requestRecords(ctx: ActiveContext, membershipIds?: string[]): Promise<{ asked: number; families: number }> {
  if (!ctx.schoolId || !ctx.role || !OFFICE.includes(ctx.role)) throw new AccessError("access.notAllowed");
  // Unnamed: every pupil a certificate cannot be issued for. Named: those of
  // them with anything blank at all, so the filings page can ask for a gender
  // or a ration-card answer from a family whose certificate details are done.
  const all = await officeRecords(ctx, false);
  const wanted = membershipIds && membershipIds.length > 0 ? new Set(membershipIds) : null;
  const targets = all.rows.filter((r) => (wanted ? wanted.has(r.studentMembershipId) && (r.missing.length > 0 || r.missingForFiling.length > 0) : r.missing.length > 0));
  const now = new Date();
  const families = new Set<string>();
  for (const t of targets) {
    await db.pupilRecord.upsert({ where: { studentMembershipId: t.studentMembershipId }, create: { schoolId: ctx.schoolId, studentMembershipId: t.studentMembershipId, requestedAt: now }, update: { requestedAt: now } });
    const guardians = await db.guardianship.findMany({ where: { studentMembershipId: t.studentMembershipId, status: "ACTIVE" }, select: { parentUserId: true } });
    for (const g of guardians) families.add(g.parentUserId);
    await notifyGuardians(t.studentMembershipId, (childName) => ({
      schoolId: ctx.schoolId,
      kind: "SYSTEM",
      titleKey: "pupilRecord.requestTitle",
      titleVars: { name: childName },
      bodyKey: "pupilRecord.requestBody",
      url: `/parent/record?child=${t.studentMembershipId}`,
      meta: { studentMembershipId: t.studentMembershipId },
    }));
    const pupil = await db.membership.findUnique({ where: { id: t.studentMembershipId }, select: { userId: true } });
    if (pupil) {
      await notify({ userId: pupil.userId, schoolId: ctx.schoolId, kind: "SYSTEM", titleKey: "pupilRecord.requestTitle", titleVars: { name: t.studentName }, bodyKey: "pupilRecord.requestBody", url: "/student/record", meta: { studentMembershipId: t.studentMembershipId } });
    }
  }
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "pupilRecord.request", targetType: "School", targetId: ctx.schoolId, meta: { asked: targets.length, families: families.size } });
  return { asked: targets.length, families: families.size };
}
