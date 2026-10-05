import "server-only";
import { isCollegeKind } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { assertGuardianAccess } from "./tenancy";
import { audit } from "./audit";
import { currentAcademicYear } from "./academic-year";
import { forSchool } from "./tenant-context";
import { dateToDay } from "./fees";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * THE STUDENT'S IDENTITY CARD (5 October 2026; the campaign's office, student
 * and registrar recommendation: "every school prints them each June"). One
 * card per student as a PDF, drawn on every read from the rows the school
 * already keeps — never stored: the school's name, the student's name and
 * photograph (the account's own uploaded picture, if any), the class (or at a
 * college the programme and year), the college code and, at a college, the
 * university PRN, the academic year it is valid for, and a QR.
 *
 * WHAT THE QR CARRIES. The student's code at the school and the address of
 * the staff check (`/id-check?c=…`), nothing secret and nothing more than is
 * printed beside it: the card is identified, not signed. A member of staff
 * who scans it, signed in at the same school, sees the name, class and photo
 * the school holds now and whether the student is still on the roll
 * (`checkIdCode`), so a card kept after leaving reads "no longer on the roll".
 * No date of birth, no address, no blood group, no guardian's number on the
 * card — decision 0002's minors' data rule keeps the card to what a gate
 * needs. Never Aadhaar.
 *
 * WHO MAY PRINT WHOSE. The student their own; a guardian their child's (an
 * adult at a college: refused, as every family page with no grant is — the
 * card is the student's); the office and the head anyone on the roll.
 */

const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];
const CHECKERS: readonly Role[] = ["ADMIN", "PRINCIPAL", "TEACHER", "FACULTY", "HOD", "WARDEN", "LIBRARIAN", "DRIVER"];

export type IdCard = {
  school: { name: string; brandPrimary: string | null; college: boolean };
  name: string;
  photoFileId: string | null;
  group: string | null;
  studentCode: string | null;
  prn: string | null;
  year: string | null;
  validUntil: string | null;
  checkPath: string | null;
};

async function cardOf(schoolId: string, membershipId: string): Promise<IdCard> {
  const m = await db.membership.findFirst({
    where: { id: membershipId, schoolId, role: "STUDENT" },
    select: {
      studentCode: true,
      user: { select: { name: true, preferredName: true, avatarKey: true } },
      school: { select: { name: true, brandPrimary: true, kind: true } },
      enrollments: { where: { status: "ACTIVE", class: { archivedAt: null } }, select: { class: { select: { name: true } } }, take: 1 },
      academicSeat: { select: { yearOfStudy: true, programme: { select: { name: true } } } },
      pupilRecord: { select: { prn: true } },
    },
  });
  if (!m) throw new AccessError("access.studentNotFoundInYourClasses", "NOT_FOUND");
  const college = isCollegeKind(m.school.kind);
  const year = await currentAcademicYear(schoolId);
  const group = college && m.academicSeat ? `${m.academicSeat.programme.name} · ${m.academicSeat.yearOfStudy}` : (m.enrollments[0]?.class.name ?? null);
  return {
    school: { name: m.school.name, brandPrimary: m.school.brandPrimary, college },
    name: m.user.preferredName ?? m.user.name,
    photoFileId: m.user.avatarKey?.startsWith("upload:") ? m.user.avatarKey.slice(7) : null,
    group,
    studentCode: m.studentCode,
    prn: college ? (m.pupilRecord?.prn ?? null) : null,
    year: year?.name ?? null,
    validUntil: year ? dateToDay(year.endDate) : null,
    checkPath: m.studentCode ? `/id-check?c=${encodeURIComponent(m.studentCode)}` : null,
  };
}

/** The card for `membershipId` (a student's own when they ask without one), for the caller who may print it; each print is audited. */
export async function idCardFor(ctx: ActiveContext, membershipId?: string | null): Promise<IdCard> {
  if (ctx.role === "STUDENT" && ctx.schoolId && ctx.membershipId) {
    if (membershipId && membershipId !== ctx.membershipId) throw new AccessError("access.notYourChild", "NOT_FOUND");
    const card = await cardOf(ctx.schoolId, ctx.membershipId);
    await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "idCard.print", targetType: "Membership", targetId: ctx.membershipId, meta: {} });
    return card;
  }
  if (ctx.role === "PARENT") {
    if (!membershipId) throw new AccessError("access.notYourChild", "NOT_FOUND");
    // No grant names the card: an adult at a college keeps it (default-deny, tenancy.ts).
    const link = await assertGuardianAccess(ctx.user.id, membershipId);
    const card = await forSchool(link.student.school.id, () => cardOf(link.student.school.id, membershipId));
    await audit({ schoolId: link.student.school.id, actorUserId: ctx.user.id, action: "idCard.print", targetType: "Membership", targetId: membershipId, meta: { by: "guardian" } });
    return card;
  }
  if (ctx.schoolId && ctx.role && OFFICE.includes(ctx.role)) {
    if (!membershipId) throw new AccessError("access.studentNotFoundInYourClasses", "NOT_FOUND");
    const card = await cardOf(ctx.schoolId, membershipId);
    await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "idCard.print", targetType: "Membership", targetId: membershipId, meta: {} });
    return card;
  }
  throw new AccessError("access.wrongRoleForThisAction");
}

export type IdCheck = { found: boolean; onRoll: boolean; name: string | null; group: string | null; studentCode: string; photoFileId: string | null; schoolName: string | null };

/**
 * A card scanned at the gate: the student behind a printed code at the checker's own school, as the school holds them
 * now — on the roll or not. Another school's code reads "not found", as a made-up one does.
 */
export async function checkIdCode(ctx: ActiveContext, code: string): Promise<IdCheck> {
  if (!ctx.schoolId || !ctx.role || !CHECKERS.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  const clean = code.trim().slice(0, 40);
  const m = clean ? await db.membership.findFirst({ where: { schoolId: ctx.schoolId, role: "STUDENT", studentCode: clean }, orderBy: { joinedAt: "desc" }, select: { id: true, status: true, leftAt: true } }) : null;
  if (!m) return { found: false, onRoll: false, name: null, group: null, studentCode: clean, photoFileId: null, schoolName: null };
  const card = await cardOf(ctx.schoolId, m.id);
  return { found: true, onRoll: m.status === "ACTIVE" && m.leftAt === null, name: card.name, group: card.group, studentCode: clean, photoFileId: card.photoFileId, schoolName: card.school.name };
}
