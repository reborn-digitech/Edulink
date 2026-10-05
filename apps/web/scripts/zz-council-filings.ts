import type { PrismaClient } from "@prisma/client";
import { STREAM_RECORDS_FIXTURE as SR } from "../src/lib/api-catalog/stream-records-fixture";
import { buildFiling } from "../src/lib/iqac-filings";
import { iqacHash } from "../src/lib/iqac";
import { defaultFilingYear } from "../src/lib/council-filings";

/**
 * THE COUNCILS' RETURNS' FIXTURE (5 October 2026), run after the stream
 * records (zz-stream-records.ts gives ZZ Shastri, an engineering college, its
 * mechanical department and BTech programme): ZZ Shastri's IQAC module is
 * switched on so its desk can read the filing, the department's NBA SAR
 * worksheet carries three qualitative criteria the department wrote
 * (self-assessed, "ZZ" notes), and the current academic year's SAR is generated
 * as a draft with a fixed id, rebuilt in place on every run while it is a draft.
 * The other three councils' returns have no ZZ college of their stream
 * (Vidya is arts, science and commerce): tests/streams-filings.test.ts makes
 * and removes its own law, pharmacy and education colleges. Re-run safe; only
 * ZZ rows.
 */
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;
export const COUNCIL_FILINGS_FIXTURE = { sar: pad("zzcfsar", 1) } as const;

const NOTES: Record<string, { score: number; note: string }> = {
  "1": { score: 45, note: "ZZ The department's vision and mission are published on its notice board and the PEOs were reviewed by the advisory board this year." },
  "6": { score: 55, note: "ZZ Two laboratories with batches of twenty; the workshop's machines are on the asset register." },
  "9": { score: 35, note: "ZZ A mentor for every twenty students; the anti-ragging squad and the grievance committee meet each term." },
};

export async function buildCouncilFilings(db: PrismaClient): Promise<{ sar: string; computed: number; self: number } | null> {
  const shastri = await db.school.findUnique({ where: { slug: "zz-shastri-college" }, select: { id: true } });
  if (!shastri) return null;
  const department = await db.department.findFirst({ where: { id: SR.shastri.department, schoolId: shastri.id }, select: { id: true } });
  if (!department) return null;
  const admin = await db.membership.findFirst({ where: { schoolId: shastri.id, role: "ADMIN", status: "ACTIVE" }, select: { userId: true } });
  await db.schoolModule.createMany({ data: [{ schoolId: shastri.id, module: "IQAC" }], skipDuplicates: true });
  // The academic year under way (the documents page opens on the last finished one; the desk switches): Shastri's
  // department, its first years and its term are this year's, so this is the SAR with figures in it.
  const year = defaultFilingYear() + 1;
  const items = Object.fromEntries(Object.entries(NOTES).map(([code, v]) => [code, { answer: null, score: v.score, note: v.note }]));
  const key = { schoolId: shastri.id, kind: "NBA_SAR", year, departmentId: department.id };
  await db.filingWorksheet.upsert({ where: { schoolId_kind_year_departmentId: key }, create: { ...key, itemsJson: JSON.stringify(items), updatedByUserId: admin?.userId ?? null }, update: { itemsJson: JSON.stringify(items) } });
  const built = await buildFiling(shastri.id, "NBA_SAR", year, null, department.id);
  const data = { format: built.format, body: built.body, hash: iqacHash(built.body), figuresJson: JSON.stringify(built.figures) };
  const existing = await db.collegeFiling.findUnique({ where: { id: COUNCIL_FILINGS_FIXTURE.sar }, select: { status: true } });
  if (!existing) await db.collegeFiling.create({ data: { id: COUNCIL_FILINGS_FIXTURE.sar, schoolId: shastri.id, kind: "NBA_SAR", year, departmentId: department.id, generatedByUserId: admin?.userId ?? null, ...data } });
  else if (existing.status === "DRAFT") await db.collegeFiling.update({ where: { id: COUNCIL_FILINGS_FIXTURE.sar }, data: { ...data, year, departmentId: department.id, generatedAt: new Date() } });
  return { sar: COUNCIL_FILINGS_FIXTURE.sar, computed: built.figures.computedMarks ?? 0, self: built.figures.selfMarks ?? 0 };
}
