import type { PrismaClient } from "@prisma/client";

/**
 * THE HARNESS'S OWN EXAM (QA-73, QA campaign of 24 October 2026). global-setup.ts makes a ZZ unit test of the lead
 * teacher's grade with one paper, so the viewport matrix can open a marks sheet on a fresh database. It used to stay
 * behind after the run, and "ZZ Grade 10 · A · Mathematics — ZZ E2E Unit Test, 0 of 6 marked" sat on the fixture
 * teacher's home in every picture taken afterwards: the home depended on whether Playwright had run. The run's
 * teardown and `npm run zz:fixtures` now remove it, so the fixture teacher's home is the fixture's.
 *
 * No side effects at import: zz-fixtures.ts imports it with its own client.
 */
export const HARNESS_EXAM_NAME = "ZZ E2E Unit Test";

/**
 * Removes the harness's exam at one school (ZZ Northgate's id, never a bare delete): its papers' sittings (the
 * Assignment rows the marks sheet made, with any Grade rows on them) and then the series, whose papers go with it.
 * Only the series named HARNESS_EXAM_NAME; the flows' own `ZZ e2e …` series are removed by their afterAll.
 */
export async function removeHarnessExam(db: PrismaClient, schoolId: string): Promise<{ series: number; sittings: number }> {
  const series = await db.examSeries.findMany({ where: { schoolId, name: HARNESS_EXAM_NAME }, select: { id: true } });
  if (series.length === 0) return { series: 0, sittings: 0 };
  const ids = series.map((s) => s.id);
  const sittings = await db.assignment.deleteMany({ where: { schoolId, examSlot: { schoolId, seriesId: { in: ids } } } });
  const gone = await db.examSeries.deleteMany({ where: { schoolId, id: { in: ids } } });
  return { series: gone.count, sittings: sittings.count };
}
