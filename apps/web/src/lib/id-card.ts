import "server-only";
import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";
import { isCollegeKind } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { assertGuardianAccess } from "./tenancy";
import { audit } from "./audit";
import { currentAcademicYear } from "./academic-year";
import { forSchool } from "./tenant-context";
import { dateToDay } from "./fees";
import { readFeesSecretKey } from "./env";
import { studentCode } from "./codes";
import { CODE_LOOKUPS, consume } from "./rate-limit";
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
 * WHAT THE QR CARRIES (A3-S-6, audit of 5 Oct 2026). The card's own
 * identifier — the membership's id and an HMAC of it under a key derived from
 * the operator's FEES_SECRET_KEY and the school (`cardToken`) — in the address
 * of the staff check, `${NEXT_PUBLIC_APP_URL}/id-check?c=…`. It used to print
 * and encode the student code, which at a school is the first of the two
 * factors a parent claims a child with (codes.ts), on a card shown at the gate
 * and on the bus; the code is on no card now, and the QR led to a page that
 * did not exist. A member of staff who scans it, signed in at the same school,
 * sees the name and class the school holds now and whether the student is
 * still on the roll (`checkIdCode`, the /id-check page), so a card kept after
 * leaving reads "no longer on the roll". A code typed from a card printed
 * before still reads, at the checker's own school.
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
  prn: string | null;
  year: string | null;
  validUntil: string | null;
  checkPath: string | null;
};

/**
 * The card's facts. A card is printed only for a student on the roll
 * (A3-S-15, audit of 5 October 2026): one who has left — paused, gone, a
 * leaving date set — is refused, whoever asks (the student, a guardian, the
 * office), so no live-looking card is made after the student has gone. The
 * gate's look-up (`checkIdCode`) still reads a leaver's card as not on the
 * roll, with nothing more than the name.
 */
async function cardOf(schoolId: string, membershipId: string, opts: { forPrint: boolean } = { forPrint: true }): Promise<IdCard> {
  const m = await db.membership.findFirst({
    where: { id: membershipId, schoolId, role: "STUDENT" },
    select: {
      status: true,
      leftAt: true,
      user: { select: { name: true, preferredName: true, avatarKey: true } },
      school: { select: { name: true, brandPrimary: true, kind: true } },
      enrollments: { where: { status: "ACTIVE", class: { archivedAt: null } }, select: { class: { select: { name: true } } }, take: 1 },
      academicSeat: { select: { yearOfStudy: true, programme: { select: { name: true } } } },
      pupilRecord: { select: { prn: true } },
    },
  });
  if (!m) throw new AccessError("access.studentNotFoundInYourClasses", "NOT_FOUND");
  if (opts.forPrint && (m.status !== "ACTIVE" || m.leftAt !== null)) throw new AccessError("collegeDesks.idCardRefuseLeft");
  const college = isCollegeKind(m.school.kind);
  const year = await currentAcademicYear(schoolId);
  const group = college && m.academicSeat ? `${m.academicSeat.programme.name} · ${m.academicSeat.yearOfStudy}` : (m.enrollments[0]?.class.name ?? null);
  return {
    school: { name: m.school.name, brandPrimary: m.school.brandPrimary, college },
    name: m.user.preferredName ?? m.user.name,
    /**
     * NO PHOTO FROM THE AVATAR KEY (A3-S-1, 5 Oct 2026). An `upload:<fileId>` key was read straight from the blob
     * store (readStoredFile checks no owner and no school), so a pupil's self-join could draw any school's stored image
     * onto their card, and the look-up door handed the file id out. No writer stores an upload avatar (every one is
     * held to AVATAR_PRESETS); when a moderated photo exists it comes through files.ts for the pupil's own record.
     */
    photoFileId: null,
    group,
    prn: college ? (m.pupilRecord?.prn ?? null) : null,
    year: year?.name ?? null,
    validUntil: year ? dateToDay(year.endDate) : null,
    checkPath: idCheckPath(schoolId, membershipId),
  };
}

/* ------------------------------------------------------------ the card's own identifier */

/** The key a school's cards are signed with: from FEES_SECRET_KEY and the school; a development machine without it signs with a fixed one; production without it prints no QR. */
function cardKey(schoolId: string): Buffer | null {
  const read = readFeesSecretKey();
  if (read.ok) return Buffer.from(hkdfSync("sha256", read.key, Buffer.from(schoolId), Buffer.from("id-card"), 32));
  return process.env.NODE_ENV === "production" ? null : Buffer.from(`id-card-dev:${schoolId}`);
}

const cardSig = (key: Buffer, schoolId: string, membershipId: string) => createHmac("sha256", key).update(`${schoolId}.${membershipId}`).digest("base64url").slice(0, 16);
const TOKEN = /^([a-z0-9]{20,40})\.([A-Za-z0-9_-]{16})$/;

/** The identifier a card's QR carries: `<membershipId>.<signature>`; null where no key is configured. */
export function cardToken(schoolId: string, membershipId: string): string | null {
  const key = cardKey(schoolId);
  return key ? `${membershipId}.${cardSig(key, schoolId, membershipId)}` : null;
}

/** The membership a scanned token names at this school, if its signature holds; null otherwise. */
export function readCardToken(schoolId: string, token: string): string | null {
  const m = TOKEN.exec(token);
  const key = cardKey(schoolId);
  if (!m || !key) return null;
  const want = Buffer.from(cardSig(key, schoolId, m[1]!));
  const got = Buffer.from(m[2]!);
  return want.length === got.length && timingSafeEqual(want, got) ? m[1]! : null;
}

function idCheckPath(schoolId: string, membershipId: string): string | null {
  const token = cardToken(schoolId, membershipId);
  return token ? `/id-check?c=${encodeURIComponent(token)}` : null;
}

/** Where a card's QR points: the configured app address (NEXT_PUBLIC_APP_URL), not whatever host the request named. */
export function cardOrigin(requestUrl: string): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || new URL(requestUrl).origin;
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
  const clean = code.trim().slice(0, 80);
  // The card's signed identifier (A3-S-6); a code typed from a card printed before it, at this school.
  const byToken = clean ? readCardToken(ctx.schoolId, clean) : null;
  const m = byToken
    ? await db.membership.findFirst({ where: { id: byToken, schoolId: ctx.schoolId, role: "STUDENT" }, select: { id: true, status: true, leftAt: true } })
    : clean && !TOKEN.test(clean)
      ? await db.membership.findFirst({ where: { schoolId: ctx.schoolId, role: "STUDENT", studentCode: clean.slice(0, 40) }, orderBy: { joinedAt: "desc" }, select: { id: true, status: true, leftAt: true } })
      : null;
  if (!m) return { found: false, onRoll: false, name: null, group: null, studentCode: clean, photoFileId: null, schoolName: null };
  const onRoll = m.status === "ACTIVE" && m.leftAt === null;
  const card = await cardOf(ctx.schoolId, m.id, { forPrint: false });
  // A leaver's card vouches for nothing (A3-S-15): the name, so the gate knows whose card it was, and "not on the roll".
  return { found: true, onRoll, name: card.name, group: onRoll ? card.group : null, studentCode: clean, photoFileId: onRoll ? card.photoFileId : null, schoolName: card.school.name };
}

export type IdCheckView =
  | { state: "signIn" | "staffOnly" | "noCode" | "busy" }
  | { state: "result"; check: IdCheck };

/**
 * What the /id-check page shows for a scanned code (A3-S-6): a signed-out
 * reader is asked to sign in as the school's staff, another role is told the
 * check is the staff's, and a member of staff gets `checkIdCode` — counted per
 * person like the other look-ups (CODE_LOOKUPS), as the check door is.
 */
export async function idCheckView(ctx: ActiveContext | null, code: string | null | undefined): Promise<IdCheckView> {
  if (!ctx) return { state: "signIn" };
  if (!ctx.schoolId || !ctx.role || !CHECKERS.includes(ctx.role)) return { state: "staffOnly" };
  const clean = (code ?? "").trim();
  if (!clean) return { state: "noCode" };
  if (!(await consume(`idcheck:${ctx.user.id}`, CODE_LOOKUPS.limit, CODE_LOOKUPS.windowMs)).allowed) return { state: "busy" };
  return { state: "result", check: await checkIdCode(ctx, clean) };
}

/**
 * A NEW CLAIM CODE FOR ONE STUDENT (R-52, risks batch 5 Oct 2026; 08's recommended option). Cards printed before
 * 5 October carry the student code — the first of the two factors a guardian claims a child with (codes.ts) — so a
 * lost or copied card is half a claim. The office (ADMIN) rotates it: a fresh code is written in place of the old,
 * which then claims nothing (claim-child.ts looks the code up); the claim still needs the birthdate as before. Audited
 * idcard.claimCode.rotate, the codes themselves kept out of the log. The new code is answered once, for the office
 * to hand to the family.
 */
export async function rotateClaimCode(ctx: ActiveContext, studentMembershipId: string): Promise<{ studentMembershipId: string; studentCode: string }> {
  if (!ctx.schoolId || ctx.role !== "ADMIN") throw new AccessError("access.wrongRoleForThisAction");
  const m = await db.membership.findFirst({ where: { id: studentMembershipId, schoolId: ctx.schoolId, role: "STUDENT" }, select: { id: true } });
  if (!m) throw new AccessError("access.studentNotFoundInYourClasses", "NOT_FOUND");
  for (let attempt = 0; ; attempt++) {
    const code = studentCode();
    try {
      await db.membership.update({ where: { id: m.id }, data: { studentCode: code } });
      await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "idcard.claimCode.rotate", targetType: "Membership", targetId: m.id, meta: {} });
      return { studentMembershipId: m.id, studentCode: code };
    } catch (error) {
      // The unique index on the code decides a collision (one in a billion); draw again, three times at most.
      if ((error as { code?: string }).code !== "P2002" || attempt >= 2) throw error;
    }
  }
}
