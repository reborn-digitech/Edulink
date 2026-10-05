/**
 * G4-18 (5 Oct 2026, risks batch): "admitted with the fee recorded but no
 * payment row". The college's admission fee is written to the ledger AFTER
 * the admission transaction (`admitApplication` in src/lib/college-admissions.ts
 * calls `recordCounterPayment` with clientId `college-admission-<id>` once the
 * seat is minted, and logs rather than undoes the admission if that write
 * fails). The decision of 4 October kept that order; this is the check that
 * says when the second write did not happen.
 *
 * An application is owed a payment row exactly when the writer would have
 * written one: it was admitted (it names its membership), the fee was recorded
 * as received (`admissionFeePaidAt`), the amount is at least a rupee (100
 * paise), and the offer carried a fee structure that still exists (the ledger
 * write needs the structure's year). The payment is the FeePayment at the
 * same school with the writer's clientId, whatever its later status (a
 * reversed or refunded payment is still the row).
 *
 * Read by `npm run data:audit` (tests/data-audit.test.ts) and by
 * tests/data-audit-admission-fee.test.ts, which builds a seat that is wrong
 * on purpose. Not a test file itself.
 */
import type { PrismaClient } from "@prisma/client";

export type AdmissionFeeGap = { applicationId: string; number: number; applicantName: string; feePaise: number };

/** The clientId the admission's ledger write uses (college-admissions.ts). */
export const admissionPaymentClientId = (applicationId: string) => `college-admission-${applicationId}`;

export async function admittedWithoutPayment(db: PrismaClient, schoolId: string): Promise<{ checked: number; gaps: AdmissionFeeGap[] }> {
  const owed = await db.collegeApplication.findMany({
    where: { schoolId, admittedMembershipId: { not: null }, admissionFeePaidAt: { not: null }, admissionFeePaise: { gte: 100 }, feeStructureId: { not: null } },
    select: { id: true, number: true, applicantName: true, admissionFeePaise: true, feeStructureId: true },
    orderBy: { number: "asc" },
  });
  if (!owed.length) return { checked: 0, gaps: [] };
  const structures = new Set((await db.feeStructure.findMany({ where: { schoolId, id: { in: owed.map((a) => a.feeStructureId!) } }, select: { id: true } })).map((s) => s.id));
  const due = owed.filter((a) => structures.has(a.feeStructureId!));
  const paid = new Set(
    (await db.feePayment.findMany({ where: { schoolId, clientId: { in: due.map((a) => admissionPaymentClientId(a.id)) } }, select: { clientId: true } })).map((p) => p.clientId),
  );
  const gaps = due.filter((a) => !paid.has(admissionPaymentClientId(a.id))).map((a) => ({ applicationId: a.id, number: a.number, applicantName: a.applicantName, feePaise: a.admissionFeePaise! }));
  return { checked: due.length, gaps };
}
