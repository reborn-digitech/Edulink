import type { TranslationKey } from "./i18n/dictionary";
import { codeFromList, MOTHER_TONGUES, NATIONALITIES, PIN_CODE } from "@edulink/contracts";
import { normalisePhone } from "./phone";
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
import { pendingRecordChange } from "./record-changes";

/**
 * The pupil record: the identity and admission details a certificate names.
 *
 * WHO WRITES IT: the office, an admin or the head, and nobody else. The
 * family — a guardian, or the pupil themselves — reads all of it and asks
 * for a change (record-changes.ts), which the office applies or declines.
 * A teacher of the pupil's class may read it (a class teacher fills a
 * TC's rows from it) but not write it. Classmates never see it. The date of
 * birth stays on the user, under birthdate.ts's own rules; the record shows
 * it and says whom to ask.
 */
const READER_ROLES: readonly Role[] = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT"];
const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];

type Viewer = { userId: string; schoolId: string; role: Role; canEdit: boolean; family: boolean; studentName: string; studentCode: string | null; birthdateKey: string | null; studentUserId: string; accountPen: string | null };

/** Who is looking at this pupil's record, or a refusal. The family reads; the office writes. */
export async function recordViewer(ctx: ActiveContext, studentMembershipId: string): Promise<Viewer> {
  if (ctx.role === "PARENT") {
    const link = await assertGuardianAccess(ctx.user.id, studentMembershipId);
    const acct = await db.membership.findUniqueOrThrow({ where: { id: studentMembershipId }, select: { userId: true, user: { select: { penNumber: true } } } });
    return { userId: ctx.user.id, schoolId: link.student.schoolId, role: "PARENT", canEdit: false, family: true, studentName: link.student.user.preferredName ?? link.student.user.name, studentCode: link.student.studentCode ?? null, birthdateKey: link.student.user.birthdate?.toISOString().slice(0, 10) ?? null, studentUserId: acct.userId, accountPen: acct.user.penNumber };
  }
  if (!ctx.schoolId || !ctx.role || !ctx.membershipId || !READER_ROLES.includes(ctx.role)) throw new AccessError("access.notAllowed");
  if (ctx.role === "STUDENT") {
    if (ctx.membershipId !== studentMembershipId) throw new AccessError("access.notAllowed", "NOT_FOUND");
    const me = await db.membership.findUniqueOrThrow({ where: { id: studentMembershipId }, select: { studentCode: true, userId: true, user: { select: { name: true, preferredName: true, birthdate: true, penNumber: true } } } });
    return { userId: ctx.user.id, schoolId: ctx.schoolId, role: "STUDENT", canEdit: false, family: true, studentName: me.user.preferredName ?? me.user.name, studentCode: me.studentCode, birthdateKey: me.user.birthdate?.toISOString().slice(0, 10) ?? null, studentUserId: me.userId, accountPen: me.user.penNumber };
  }
  // The class's own teachers and the office: identity and category data is not a subject teacher's (owner's item 1, 27 Oct 2026).
  const student = await assertStudentAccess({ schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role }, studentMembershipId, { formTeacher: true });
  const row = await db.membership.findUniqueOrThrow({ where: { id: studentMembershipId }, select: { studentCode: true, userId: true, user: { select: { birthdate: true, penNumber: true } } } });
  return { userId: ctx.user.id, schoolId: ctx.schoolId, role: ctx.role, canEdit: OFFICE.includes(ctx.role), family: false, studentName: student.user.preferredName ?? student.user.name, studentCode: row.studentCode, birthdateKey: row.user.birthdate?.toISOString().slice(0, 10) ?? null, studentUserId: row.userId, accountPen: row.user.penNumber };
}

export type RecordRow = {
  fatherName: string | null; motherName: string | null; placeOfBirth: string | null; nationality: string | null; religion: string | null; caste: string | null; category: string | null; motherTongue: string | null;
  addressLine: string | null; city: string | null; postalCode: string | null; admissionNumber: string | null; admissionDate: Date | null; admittedToGrade: string | null; previousSchool: string | null; penNumber: string | null;
  gender: string | null; nameLocal: string | null; fatherNameLocal: string | null; motherNameLocal: string | null; bpl: boolean | null; ews: boolean | null; cwsnType: string | null; bloodGroup: string | null;
  previousSchoolTcNumber: string | null; previousSchoolTcDate: Date | null; fatherOccupation: string | null; motherOccupation: string | null; annualIncome: number | null; guardianPhone: string | null; rte: boolean | null;
  alternatePhone: string | null; freeUniform: boolean | null; freeTextbook: boolean | null; extracurricular: boolean | null; stream: string | null; vocationalCourse: boolean | null; vocationalTradeId: string | null; vocationalJobRoleId: string | null; vocationalExamAppeared: boolean | null;
  requestedAt: Date | null; familyFilledAt: Date | null; updatedAt: Date;
};

/**
 * What the UDISE+ student sheet cannot be filled without, beyond the
 * certificate fields. The impairment and the RTE answer are among them: a
 * blank used to be filed as "No", which is an answer nobody gave. "None" is
 * now said (cwsnType NONE), and until it or a type is, the sheet's cell is
 * blank and the record is not ready.
 */
export const FILING_RECORD_FIELDS = ["gender", "category", "motherTongue", "bpl", "ews", "rte", "cwsnType", "admissionNumber", "admissionDate", "addressLine", "postalCode"] as const;

const yesNo = (v: boolean | null | undefined) => (v === true ? "yes" : v === false ? "no" : null);
/** A yes/no as the form sends it: "yes", "no", "" to clear, or nothing to leave as it stands. */
const flag = (v: "yes" | "no" | "" | undefined) => (v === undefined ? undefined : v === "" ? null : v === "yes");

/** The filing fields still blank on a record; every one of them when there is no record. A category the sheet cannot code counts as blank. */
export function missingFilingFields(record: RecordRow | null): PupilRecordField[] {
  return FILING_RECORD_FIELDS.filter((f) => {
    const v = record?.[f];
    if (f === "category") return typeof v !== "string" || !(PUPIL_CATEGORIES as readonly string[]).includes(v.trim().toUpperCase());
    // A language typed before the list, or a PIN that is not six digits, is a blank to a sheet that reads them.
    if (f === "motherTongue") return typeof v !== "string" || codeFromList(MOTHER_TONGUES, v) === null;
    if (f === "postalCode") return typeof v !== "string" || !PIN_CODE.test(v.trim());
    return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
  }) as PupilRecordField[];
}

export const EMPTY_RECORD: RecordRow = { fatherName: null, motherName: null, placeOfBirth: null, nationality: null, religion: null, caste: null, category: null, motherTongue: null, addressLine: null, city: null, postalCode: null, admissionNumber: null, admissionDate: null, admittedToGrade: null, previousSchool: null, penNumber: null, gender: null, nameLocal: null, fatherNameLocal: null, motherNameLocal: null, bpl: null, ews: null, cwsnType: null, bloodGroup: null, previousSchoolTcNumber: null, previousSchoolTcDate: null, fatherOccupation: null, motherOccupation: null, annualIncome: null, guardianPhone: null, rte: null, alternatePhone: null, freeUniform: null, freeTextbook: null, extracurricular: null, stream: null, vocationalCourse: null, vocationalTradeId: null, vocationalJobRoleId: null, vocationalExamAppeared: null, requestedAt: null, familyFilledAt: null, updatedAt: new Date(0) };

/** The certificate fields still blank on a record; every one of them when there is no record. */
export function missingFields(record: RecordRow | null): PupilRecordField[] {
  return REQUIRED_RECORD_FIELDS.filter((f) => {
    const v = record?.[f];
    return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
  }) as PupilRecordField[];
}

export function recordView(record: RecordRow | null, rollNumber: number | null = null, repeating: boolean | null = null) {
  if (!record) return null;
  return {
    previousSchoolTcNumber: record.previousSchoolTcNumber, previousSchoolTcDate: record.previousSchoolTcDate?.toISOString().slice(0, 10) ?? null,
    fatherOccupation: record.fatherOccupation, motherOccupation: record.motherOccupation, annualIncome: record.annualIncome === null ? null : String(record.annualIncome),
    guardianPhone: record.guardianPhone,
    rte: yesNo(record.rte),
    alternatePhone: record.alternatePhone, freeUniform: yesNo(record.freeUniform), freeTextbook: yesNo(record.freeTextbook), extracurricular: yesNo(record.extracurricular), stream: record.stream, vocationalCourse: yesNo(record.vocationalCourse), vocationalTradeId: record.vocationalTradeId, vocationalJobRoleId: record.vocationalJobRoleId, vocationalExamAppeared: yesNo(record.vocationalExamAppeared),
    repeating: repeating === null ? null : repeating ? "yes" : "no",
    rollNumber: rollNumber === null ? null : String(rollNumber),
    fatherName: record.fatherName, motherName: record.motherName, placeOfBirth: record.placeOfBirth, nationality: record.nationality, religion: record.religion, caste: record.caste, category: record.category, motherTongue: record.motherTongue,
    addressLine: record.addressLine, city: record.city, postalCode: record.postalCode, admissionNumber: record.admissionNumber, admissionDate: record.admissionDate?.toISOString().slice(0, 10) ?? null, admittedToGrade: record.admittedToGrade, previousSchool: record.previousSchool, penNumber: record.penNumber,
    gender: record.gender, nameLocal: record.nameLocal, fatherNameLocal: record.fatherNameLocal, motherNameLocal: record.motherNameLocal, bpl: yesNo(record.bpl), ews: yesNo(record.ews), cwsnType: record.cwsnType, bloodGroup: record.bloodGroup,
    requestedAt: record.requestedAt?.toISOString() ?? null, familyFilledAt: record.familyFilledAt?.toISOString() ?? null, updatedAt: record.updatedAt.toISOString(),
  };
}

export async function pupilRecordFor(ctx: ActiveContext, studentMembershipId: string): Promise<PupilRecordView> {
  const viewer = await recordViewer(ctx, studentMembershipId);
  const [record, enrolment] = await Promise.all([
    db.pupilRecord.findUnique({ where: { studentMembershipId } }),
    db.enrollment.findFirst({ where: { studentMembershipId, status: "ACTIVE" }, select: { rollNumber: true, repeating: true, class: { select: { name: true } } } }),
  ]);
  // The PEN is the account's; a record that has not caught up shows it anyway.
  const merged = record ? { ...record, penNumber: viewer.accountPen ?? record.penNumber } : viewer.accountPen ? ({ ...EMPTY_RECORD, penNumber: viewer.accountPen } as RecordRow) : null;
  const missing = missingFields(merged);
  const penChange = await pendingPenChange(ctx, studentMembershipId);
  return { studentMembershipId, studentName: viewer.studentName, className: enrolment?.class.name ?? null, studentCode: viewer.studentCode, birthdate: viewer.birthdateKey, record: recordView(merged, enrolment?.rollNumber ?? null, enrolment?.repeating ?? null), missing, missingForFiling: missingFilingFields(merged), complete: missing.length === 0, canEdit: viewer.canEdit, canRequest: viewer.family, change: await pendingRecordChange(ctx, studentMembershipId), penEditable: ctx.role === "ADMIN" && !viewer.accountPen, penChange };
}

/**
 * The values a sheet reads, checked and coded, or a refusal — apart from the
 * write, so that a family's ask is refused for a PIN of five digits when it
 * is made and not when the office comes to approve it.
 */
export async function codedValues(studentMembershipId: string, input: PupilRecordSave) {
  // The number the school rings: kept as E.164 or refused, never reduced to whichever digits were typed.
  let contact: string | null | undefined = undefined;
  if (input.guardianPhone !== undefined) {
    contact = input.guardianPhone.trim() === "" ? null : normalisePhone(input.guardianPhone);
    if (input.guardianPhone.trim() !== "" && !contact) throw new AccessError("pupilRecord.phoneNotANumber");
  }
  let alternate: string | null | undefined = undefined;
  if (input.alternatePhone !== undefined) {
    alternate = input.alternatePhone.trim() === "" ? null : normalisePhone(input.alternatePhone);
    if (input.alternatePhone.trim() !== "" && !alternate) throw new AccessError("pupilRecord.phoneNotANumber");
  }
  /**
   * CODED AT THE DOOR. Mother tongue and nationality are names from a list
   * and the PIN is six digits, because a sheet reads them: typed freely they
   * were "Marathi", "marathi" and "मराठी", and an Indian national was
   * whoever's nationality contained "india". A value typed before the lists
   * and sent back untouched is left as it stands, so an old record can still
   * be saved for its other fields; it counts as blank for a filing until it
   * is picked from the list.
   */
  const stored = await db.pupilRecord.findUnique({ where: { studentMembershipId }, select: { motherTongue: true, nationality: true, postalCode: true } });
  const fromList = <T extends string>(list: readonly T[], typed: string | undefined, was: string | null | undefined, refusal: TranslationKey): string | null | undefined => {
    if (typed === undefined) return undefined;
    if (typed.trim() === "") return null;
    const code = codeFromList(list, typed);
    if (code) return code;
    if (was && typed.trim() === was.trim()) return was;
    throw new AccessError(refusal);
  };
  const motherTongue = fromList(MOTHER_TONGUES, input.motherTongue, stored?.motherTongue, "pupilRecord.chooseMotherTongue");
  const nationality = fromList(NATIONALITIES, input.nationality, stored?.nationality, "pupilRecord.chooseNationality");
  const pin = input.postalCode === undefined ? undefined : input.postalCode.replace(/\s+/g, "") || null;
  if (pin && !PIN_CODE.test(pin) && pin !== (stored?.postalCode ?? "").trim()) throw new AccessError("pupilRecord.pinSixDigits");
  return { contact, alternate, motherTongue, nationality, pin };
}

/**
 * Writes the whole record. A blank clears the field. THE OFFICE'S ALONE:
 * until 2026-09-29 a guardian or the pupil wrote the family's fields here,
 * and a name or an address on a certificate could change with nobody at the
 * school having looked. The family now reads the record and asks
 * (record-changes.ts); the office applies the ask through this same
 * function, so a value a family proposed passes every check a value the
 * office typed does.
 */
export async function savePupilRecord(ctx: ActiveContext, studentMembershipId: string, raw: PupilRecordSave, opts: { fromFamily?: boolean } = {}): Promise<PupilRecordView> {
  const viewer = await recordViewer(ctx, studentMembershipId);
  if (!viewer.canEdit) throw new AccessError(viewer.family ? "pupilRecord.askTheOffice" : "access.notAllowed");
  const input: PupilRecordSave = raw;
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
  const { contact, alternate, motherTongue, nationality, pin } = await codedValues(studentMembershipId, input);
  const data = {
    fatherName: text(input.fatherName), motherName: text(input.motherName), placeOfBirth: text(input.placeOfBirth), nationality, religion: text(input.religion), caste: text(input.caste), category: text(input.category), motherTongue,
    addressLine: text(input.addressLine), city: text(input.city), postalCode: pin, admissionNumber: text(input.admissionNumber),
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
    guardianPhone: contact,
    rte: input.rte === undefined ? undefined : input.rte === "" ? null : input.rte === "yes",
    alternatePhone: alternate,
    freeUniform: flag(input.freeUniform), freeTextbook: flag(input.freeTextbook), extracurricular: flag(input.extracurricular), vocationalCourse: flag(input.vocationalCourse), vocationalExamAppeared: flag(input.vocationalExamAppeared),
    stream: text(input.stream), vocationalTradeId: text(input.vocationalTradeId), vocationalJobRoleId: text(input.vocationalJobRoleId),
    updatedByUserId: viewer.userId,
    ...(opts.fromFamily ? { familyFilledAt: new Date() } : {}),
  };
  await db.pupilRecord.upsert({ where: { studentMembershipId }, create: { schoolId: viewer.schoolId, studentMembershipId, ...data }, update: data });
  // The roll number lives on the present enrolment and is the office's to set; a family's form never sends it and a family's body is ignored if it does.
  if (input.rollNumber !== undefined) {
    await db.enrollment.updateMany({ where: { studentMembershipId, status: "ACTIVE" }, data: { rollNumber: input.rollNumber === "" ? null : Number(input.rollNumber) } });
  }
  // Repeating the class is the enrolment's too, and the office's: a blank is "no".
  if (input.repeating !== undefined) {
    await db.enrollment.updateMany({ where: { studentMembershipId, status: "ACTIVE" }, data: { repeating: input.repeating === "yes" } });
  }
  // Which fields, never their values: a caste or an address is not for the audit log.
  await audit({ schoolId: viewer.schoolId, actorUserId: viewer.userId, action: "pupilRecord.update", targetType: "Membership", targetId: studentMembershipId, meta: { fields: Object.keys(input).filter((k) => (input as Record<string, unknown>)[k] !== undefined), family: opts.fromFamily === true } });
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
  // Every named pupil must be one of this school's: an id from another school (or
  // none at all) is refused, not quietly skipped (the cross-school probe of 6 Oct 2026).
  if (wanted) {
    const own = new Set(all.rows.map((r) => r.studentMembershipId));
    for (const id of wanted) if (!own.has(id)) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  }
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
