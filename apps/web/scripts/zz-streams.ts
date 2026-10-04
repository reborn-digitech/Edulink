import type { PrismaClient } from "@prisma/client";

/**
 * THE STREAMS' FIXTURE (5 October 2026), run after the college builders have
 * made their programmes: each of ZZ Vidya College's programmes is given the
 * stream it belongs to — a BSc science, a BCom commerce, a BA arts — so a new
 * programme's form, the filings and the duties read a college whose
 * programmes say their stream. ZZ Shastri's one programme is the exam
 * builder's BCom, which an engineering college's streams do not cover, so it
 * stays without a stream (the migration leaves it the same way) until the
 * registrar picks. The colleges' own streams and the faculty's duties are set
 * in zz-college.ts. Re-run safe.
 */
export async function buildStreamFixtures(db: PrismaClient): Promise<{ programmes: number } | null> {
  const vidya = await db.school.findUnique({ where: { slug: "zz-vidya-college" }, select: { id: true } });
  if (!vidya) return null;
  const programmes = await db.programme.findMany({ where: { schoolId: vidya.id }, select: { id: true, code: true, regulator: true } });
  let set = 0;
  for (const p of programmes) {
    const stream = p.code.startsWith("BSC") || p.code.startsWith("MSC") ? "SCIENCE" : p.code.startsWith("BCOM") || p.code.startsWith("MCOM") ? "COMMERCE" : p.code.startsWith("BA") || p.code.startsWith("MA") ? "ARTS" : null;
    if (!stream || p.regulator !== "UGC") continue;
    await db.programme.update({ where: { id: p.id }, data: { stream } });
    set++;
  }
  return { programmes: set };
}
