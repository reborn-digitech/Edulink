/**
 * A STORED 64-BIT TOTAL, ANSWERED AS A NUMBER (TA-114; the owner's decision of 14 November 2026).
 *
 * A month's payroll totals and an export's total are sums of many slips, and a sum of 32-bit figures does not fit
 * 32 bits: about 2.147 crore rupees was the ceiling, and a college of two hundred staff passes it. Those columns are
 * BigInt now (PayrollRun's gross, deductions, employer and net; PayrollExport.totalPaise), and the database client
 * hands a BigInt column back as a JavaScript bigint, which JSON cannot carry and arithmetic with a number refuses.
 *
 * So every reader converts here, at the boundary, and the contracts go on answering numbers. A number holds every
 * whole paise up to Number.MAX_SAFE_INTEGER (about ninety lakh crore rupees) exactly; a value past that, either
 * way, is REFUSED with a RangeError and never rounded, because a rounded total is a wrong total that looks right.
 * The same check guards a sum on its way in, so nothing that could not be read back is written.
 */
export function safePaise(value: bigint | number): number {
  const n = typeof value === "bigint" ? Number(value) : value;
  if (!Number.isSafeInteger(n) || (typeof value === "bigint" && BigInt(n) !== value)) {
    throw new RangeError(`A stored amount of ${String(value)} paise is past what a number holds exactly; it is refused, not rounded.`);
  }
  return n;
}
