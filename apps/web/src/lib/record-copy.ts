import "server-only";
import { codeFromList, MOTHER_TONGUES, NATIONALITIES, PUPIL_CATEGORIES, PUPIL_RELIGIONS, RECORD_COPY_FIELDS, type RecordCopyField, type RecordCopyPreview, type RecordCopyResult } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { audit } from "./audit";
import { notify } from "./notify";
import { forSchool } from "./tenant-context";
import type { ActiveContext } from "./session";

/**
 * COPY FROM THE PREVIOUS SCHOOL'S RECORD (R-69, the owner's decision of 10
 * October 2026). A pupil admitted on their PEN arrives with a record that
 * holds only what the application carried; the previous school's record
 * holds the category, religion, caste, mother tongue, place of birth,
 * nationality and the parents' names, and printed them on the TC. The
 * office is offered one click to carry those lines — and ONLY those
 * (`RECORD_COPY_FIELDS` in the contracts: never the address, a phone, the
 * household's income, a document, a health or incident row, the note) —
 * into this school's record, filling blanks only; a coded line whose old
 * value does not code (a word typed before the lists) is not copied, since
 * free text where a filing wants a code is refused everywhere else too.
 *
 * WHICH RECORD, AND UNDER WHICH CLAUSE. The previous school is the one whose
 * live leaving certificate names the child (the TC the family holds), read
 * under this school's ORDINARY binding through the roll clause — the child
 * on its roll now as a STUDENT, ACTIVE, not left (MEMBER_READABLE on
 * SchoolRecord). Only once that certificate has opened is the old school's
 * record read, by the server with that school bound (`forSchool`, as
 * applicationView binds a school for the family), and only the eight lines:
 * the previous school's record is not opened at the database to the new
 * school, so nothing else on it is ever within reach. The offer therefore
 * exists only for a pupil who HAS a certificate elsewhere — an admission
 * that minted a new account (no PEN, or a PEN nobody held) has nothing to
 * copy and is offered nothing.
 *
 * AUDITED AT BOTH SCHOOLS: `pupilRecord.copiedFrom` here (the source school
 * and the fields), `pupilRecord.copiedTo` at the old school (written with
 * that school bound), neither carrying a value. The guardians are told the
 * record came across.
 */

const OFFICE = ["ADMIN", "PRINCIPAL"] as const;

type Lines = Partial<Record<RecordCopyField, string | null>>;
const SELECT = Object.fromEntries(RECORD_COPY_FIELDS.map((f) => [f, true])) as Record<RecordCopyField, true>;

/** The value as it would be written here: the coded lists' code, or null for a word that codes to nothing; free lines trimmed. */
function carried(field: RecordCopyField, raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (field === "category") return (PUPIL_CATEGORIES as readonly string[]).includes(v.toUpperCase()) ? v.toUpperCase() : null;
  if (field === "religion") return (PUPIL_RELIGIONS as readonly string[]).includes(v.toUpperCase()) ? v.toUpperCase() : null;
  if (field === "motherTongue") return codeFromList(MOTHER_TONGUES, v);
  if (field === "nationality") return codeFromList(NATIONALITIES, v);
  return v.slice(0, 120);
}

/** What the office would carry over, or null when there is no previous school's record to carry from. */
export async function recordCopyPreview(ctx: ActiveContext, studentMembershipId: string): Promise<RecordCopyPreview | null> {
  if (!ctx.schoolId || !ctx.role || !(OFFICE as readonly string[]).includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  const schoolId = ctx.schoolId;
  const m = await db.membership.findFirst({ where: { id: studentMembershipId, schoolId, role: "STUDENT" }, select: { id: true, userId: true, status: true, leftAt: true } });
  if (!m) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  // The roll clause, spelled out: a pupil who has left reads nothing across.
  if (m.status !== "ACTIVE" || m.leftAt !== null) return null;
  const record = await db.schoolRecord.findFirst({ where: { studentUserId: m.userId, supersededAt: null, schoolId: { not: schoolId }, studentMembershipId: { not: null } }, orderBy: { leftAt: "desc" }, select: { id: true, schoolId: true, schoolName: true, studentMembershipId: true } });
  if (!record) return null;
  const [theirs, ours, copied] = await Promise.all([
    forSchool(record.schoolId, () => db.pupilRecord.findUnique({ where: { studentMembershipId: record.studentMembershipId! }, select: SELECT })) as Promise<Lines | null>,
    db.pupilRecord.findUnique({ where: { studentMembershipId: m.id }, select: SELECT }) as Promise<Lines | null>,
    db.auditLog.findFirst({ where: { schoolId, action: "pupilRecord.copiedFrom", targetType: "Membership", targetId: m.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);
  const lines = RECORD_COPY_FIELDS.flatMap((field) => {
    const value = carried(field, theirs?.[field]);
    if (!value) return [];
    const here = (ours?.[field] ?? "").trim();
    return [{ field, value, blankHere: here === "" }];
  });
  return { studentMembershipId: m.id, fromSchoolName: record.schoolName, fromRecordId: record.id, lines, canCopy: ctx.role === "ADMIN" && lines.some((l) => l.blankHere), copiedAt: copied?.createdAt.toISOString() ?? null };
}

/** The one click: the blank lines filled from the previous school's record, audited at both schools, the guardians told. */
export async function copyPreviousRecord(ctx: ActiveContext, studentMembershipId: string): Promise<RecordCopyResult> {
  if (ctx.role !== "ADMIN") throw new AccessError("access.wrongRoleForThisAction");
  const preview = await recordCopyPreview(ctx, studentMembershipId);
  if (!preview) throw new AccessError("ownerDecisions.refuseNoPreviousRecord", "NOT_FOUND");
  const schoolId = ctx.schoolId!;
  const toCopy = preview.lines.filter((l) => l.blankHere);
  const fields = toCopy.map((l) => l.field);
  if (toCopy.length) {
    const data = Object.fromEntries(toCopy.map((l) => [l.field, l.value])) as Partial<Record<RecordCopyField, string>>;
    await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      await tx.pupilRecord.upsert({ where: { studentMembershipId }, create: { schoolId, studentMembershipId, ...data, updatedByUserId: ctx.user.id }, update: { ...data, updatedByUserId: ctx.user.id } });
    });
  }
  const source = await db.schoolRecord.findUniqueOrThrow({ where: { id: preview.fromRecordId }, select: { schoolId: true, studentMembershipId: true } });
  await audit({ schoolId, actorUserId: ctx.user.id, action: "pupilRecord.copiedFrom", targetType: "Membership", targetId: studentMembershipId, meta: { fromSchoolId: source.schoolId, fromRecordId: preview.fromRecordId, fields } });
  await forSchool(source.schoolId, () => audit({ schoolId: source.schoolId, actorUserId: ctx.user.id, action: "pupilRecord.copiedTo", targetType: "Membership", targetId: source.studentMembershipId ?? preview.fromRecordId, meta: { toSchoolId: schoolId, fields } }));
  // The guardians hear that the record came across — at whichever school they guard the child, as admit() tells
  // them of the admission itself: a parent linked at the old school and not yet claimed at the new one is the
  // usual case on the day of a transfer (R-67). Guardianship rows are unfenced; the sentence names the schools
  // and the lines' kinds, never a value.
  const [schoolName, child, guardians] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true } }),
    db.membership.findUniqueOrThrow({ where: { id: studentMembershipId }, select: { userId: true, user: { select: { name: true, preferredName: true } } } }),
    db.guardianship.findMany({ where: { status: "ACTIVE", student: { role: "STUDENT", userId: (await db.membership.findUniqueOrThrow({ where: { id: studentMembershipId }, select: { userId: true } })).userId } }, select: { parentUserId: true } }),
  ]);
  const childName = child.user.preferredName ?? child.user.name;
  await Promise.all(
    [...new Set(guardians.map((g) => g.parentUserId))].map((userId) =>
      notify({ userId, schoolId, kind: "ADMISSION", titleKey: "ownerDecisions.notifRecordCopiedTitle", titleVars: { child: childName }, bodyKey: "ownerDecisions.notifRecordCopiedBody", bodyVars: { child: childName, from: preview.fromSchoolName, to: schoolName.name, count: fields.length }, url: "/parent/record" }).catch((error) => console.error("[record-copy] guardian not told", error)),
    ),
  );
  return { studentMembershipId, fromSchoolName: preview.fromSchoolName, copied: fields };
}
