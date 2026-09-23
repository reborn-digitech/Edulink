import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { forJoinCode } from "./tenant-context";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * The UDISE+ Permanent Education Number.
 *
 * Eleven digits the portal assigns once to a pupil, for life. It is the one
 * identifier a child carries from school to school, which is why it lives
 * on the ACCOUNT (User.penNumber, unique across the platform) and the pupil
 * record only mirrors it for the certificate and the filing that print it.
 *
 * WHAT IT OPENS. Bound the way a student code is — `forJoinCode(pen)` — the
 * PEN lets the office see whether a pupil is known on Relay before they are
 * on the roll here: on the roll elsewhere, left elsewhere with a leaving
 * certificate waiting, or unknown. Nothing else crosses: the other school's
 * name, the class, the record stay behind the fence. To bring a pupil over,
 * the intake list or an admission carries the PEN and the date of birth,
 * and the two together link the child's existing account, as a transfer by
 * student code does.
 */

export const PEN_RE = /^\d{11}$/;

/** The digits the office typed, or null when it is blank; throws on a wrong shape. */
export function normalisePen(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/[\s-]/g, "");
  if (!digits) return null;
  if (!PEN_RE.test(digits)) throw new AccessError("pupilRecord.penFormat");
  return digits;
}

/** Same, answering null instead of throwing — for a CSV cell. */
export function penOrNull(raw: string | null | undefined): string | null | false {
  const digits = (raw ?? "").replace(/[\s-]/g, "");
  if (!digits) return null;
  return PEN_RE.test(digits) ? digits : false;
}

export type PenHolder = { userId: string; name: string; birthdate: Date | null; memberships: { id: string; schoolId: string; leftAt: Date | null; status: string }[] };

/** The account behind a PEN and its pupil memberships everywhere — read under the code binding, so the caller needs no school in common. */
export async function holderOf(pen: string): Promise<PenHolder | null> {
  const user = await db.user.findUnique({ where: { penNumber: pen }, select: { id: true, name: true, preferredName: true, birthdate: true } });
  if (!user) return null;
  const memberships = await forJoinCode(pen, () => db.membership.findMany({ where: { userId: user.id, role: "STUDENT" }, select: { id: true, schoolId: true, leftAt: true, status: true } }));
  return { userId: user.id, name: user.preferredName ?? user.name, birthdate: user.birthdate, memberships };
}

/**
 * Put a PEN on an account. Another account already holding it is refused
 * by name of the rule, never by the other pupil's name.
 */
export async function assignPen(userId: string, pen: string | null): Promise<void> {
  if (pen) {
    const other = await db.user.findUnique({ where: { penNumber: pen }, select: { id: true } });
    if (other && other.id !== userId) throw new AccessError("pupilRecord.penTaken");
  }
  await db.user.update({ where: { id: userId }, data: { penNumber: pen } });
}

/** The first entry only: an account already carrying a number keeps it. */
export async function assignPenIfBlank(userId: string, pen: string): Promise<boolean> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { penNumber: true } });
  if (user.penNumber) return false;
  await assignPen(userId, pen);
  return true;
}

const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];

export type PenLookup =
  | { pen: string; found: "HERE"; pupil: { membershipId: string; name: string; className: string | null; studentCode: string | null } }
  | { pen: string; found: "ELSEWHERE_ACTIVE" | "ELSEWHERE_LEFT" | "NONE"; pupil: null };

/** The office asks who holds a PEN: a pupil here in full, a pupil elsewhere by state alone, or nobody. */
export async function lookupPen(ctx: ActiveContext, raw: string): Promise<PenLookup> {
  if (!ctx.schoolId || !ctx.role || !OFFICE.includes(ctx.role)) throw new AccessError("access.notAllowed");
  const pen = normalisePen(raw);
  if (!pen) throw new AccessError("pupilRecord.penFormat");
  const holder = await holderOf(pen);
  if (!holder) return { pen, found: "NONE", pupil: null };
  const here = holder.memberships.find((m) => m.schoolId === ctx.schoolId && !m.leftAt && m.status === "ACTIVE");
  if (here) {
    const row = await db.membership.findUniqueOrThrow({ where: { id: here.id }, select: { studentCode: true, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } });
    return { pen, found: "HERE", pupil: { membershipId: here.id, name: holder.name, className: row.enrollments[0]?.class.name ?? null, studentCode: row.studentCode } };
  }
  const activeElsewhere = holder.memberships.some((m) => !m.leftAt && m.status === "ACTIVE");
  return { pen, found: activeElsewhere ? "ELSEWHERE_ACTIVE" : "ELSEWHERE_LEFT", pupil: null };
}

/**
 * For intake and admissions: the account a PEN and a date of birth together
 * name, or a reason they do not. `null` means no account holds the PEN and
 * a new one may carry it.
 */
export async function matchPen(pen: string, birthdate: Date | null): Promise<{ userId: string } | { reasonKey: "intake.penNeedsBirthdate" | "intake.penMismatch" } | null> {
  const holder = await holderOf(pen);
  if (!holder) return null;
  if (!birthdate) return { reasonKey: "intake.penNeedsBirthdate" };
  const known = holder.birthdate?.toISOString().slice(0, 10);
  if (!known || known !== birthdate.toISOString().slice(0, 10)) return { reasonKey: "intake.penMismatch" };
  return { userId: holder.userId };
}
