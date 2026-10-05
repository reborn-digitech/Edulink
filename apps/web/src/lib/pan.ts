import "server-only";
import { db } from "./db";
import { open, seal } from "./secret-box";

/**
 * THE ONE WRITER OF A PAN (G4-14, the risks batch of 5 October 2026).
 *
 * A college teacher's PAN was sealed in two places by two writers: the
 * office's faculty record (iqac.ts) and payroll's salary revisions
 * (payroll.ts), and the expert's payee row a third way (gig-payments.ts).
 * Typed into one, the other kept the old number, and only a data:audit WARN
 * ("faculty record …: PAN ending X, payroll's ends Y") said so. Now every
 * path calls `writePan`: a member of staff's PAN is written to their faculty
 * record AND every salary revision of theirs in one transaction, each copy
 * sealed with its own binding and the same last four; an expert's to their
 * payee row. The bindings live here only, so a reader opens with `openPan`.
 * A direct `seal(…pan…)` anywhere else is refused by a source rule
 * (tests/pan-one-writer.test.ts); the data:audit WARN stays as the check on
 * rows written before.
 */
export type PanTarget = { kind: "STAFF"; schoolId: string; membershipId: string } | { kind: "EXPERT"; userId: string };
type PanCopy = "FACULTY_RECORD" | "SALARY" | "PAYEE";

/** The sealing binding of one copy; unchanged from the writers it replaces, so rows already sealed still open. */
function binding(target: PanTarget, copy: PanCopy): string {
  if (target.kind === "EXPERT") return `gig:payee:${target.userId}:pan`;
  return copy === "FACULTY_RECORD" ? `${target.schoolId}:FacultyRecord.pan:${target.membershipId}` : `payroll:${target.schoolId}:${target.membershipId}:pan`;
}

/** The PAN as stored: upper case, no spaces. */
export function normalisePan(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

type PanClient = Pick<typeof db, "facultyRecord" | "staffSalary" | "expertPayoutAccount">;

/**
 * Writes one person's PAN to every copy the platform keeps of it. The rows
 * must exist (a faculty record or a salary revision for staff, whichever
 * they have; the payee row for an expert): this seals, it does not create.
 * Answers how many rows now carry it.
 */
export async function writePan(target: PanTarget, value: string, client?: PanClient): Promise<number> {
  const pan = normalisePan(value);
  const last4 = pan.slice(-4);
  if (target.kind === "EXPERT") {
    const c = client ?? db;
    const done = await c.expertPayoutAccount.updateMany({ where: { expertUserId: target.userId }, data: { panEnc: seal(pan, binding(target, "PAYEE")), panLast4: last4 } });
    return done.count;
  }
  const work = async (c: PanClient) => {
    const record = await c.facultyRecord.updateMany({ where: { schoolId: target.schoolId, membershipId: target.membershipId }, data: { panSealed: seal(pan, binding(target, "FACULTY_RECORD")), panLast4: last4 } });
    const salary = await c.staffSalary.updateMany({ where: { schoolId: target.schoolId, membershipId: target.membershipId }, data: { panSealed: seal(pan, binding(target, "SALARY")), panLast4: last4 } });
    return record.count + salary.count;
  };
  if (client) return work(client);
  return db.$tenantTransaction((raw) => work(raw as PanClient));
}

/** A sealed copy opened with its own binding; null when there is none. */
export function openPan(target: PanTarget, copy: PanCopy, sealed: string | null | undefined): string | null {
  return sealed ? open(sealed, binding(target, copy)) : null;
}
