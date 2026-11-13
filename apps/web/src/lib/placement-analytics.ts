import "server-only";
import { PLACEMENT_SECTORS, SALARY_BANDS, salaryBandOf, type PlacementTable, type SalaryBand } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { readJson } from "./json";
import { toCsvValue } from "./csv";
import { batchStudents } from "./placement-record";
import { median } from "./placement-rules";
import { cellOf, listDrives, placementOn, placementSettings } from "./placement";
import type { ActiveContext } from "./session";

/**
 * THE PLACEMENT TABLE (4 October 2026): the same rows in the three shapes the
 * filings ask for — NBA's placement index over three years (X placed, Y
 * higher studies, Z entrepreneurs, N the batch's final-year students:
 * (X + Y + Z) / N), NIRF's graduation outcome (the median salary of the
 * placed, with the companies and their counts), and the cell's own rates by
 * programme, category, salary band and sector. Computed on read, always.
 *
 * WHO COUNTS. N is the batch (src/lib/placement-record.ts `batchStudents`).
 * X is a student holding an offer that was made and not declined (whether or
 * not the student pressed "accept" in the app; colleges record offers the
 * day they are made). Y is a student going for higher studies who is not
 * placed, Z one starting up who is neither — each student counts once, so
 * the index never passes 1. A student's package is their best offer.
 *
 * THE SEASON ROW (PlacementSeason) is the table as the cell PUBLISHED it —
 * a stored copy with one writer (`publishSeason`) and a data:audit check
 * (`seasonDrift`).
 *
 * Read by the IQAC builder (`placementTable`, `placementTables`) and the
 * operator (`placementSummary`): plain reads, the caller has bound the person.
 */

export async function placementTable(schoolId: string, batchYear: number): Promise<PlacementTable> {
  const students = await batchStudents(schoolId, batchYear);
  const ids = students.map((s) => s.id);
  const [profiles, offers] = await Promise.all([
    ids.length ? db.placementProfile.findMany({ where: { studentMembershipId: { in: ids } }, select: { studentMembershipId: true, higherStudies: true, entrepreneur: true } }) : [],
    ids.length
      ? db.offer.findMany({ where: { studentMembershipId: { in: ids }, declinedAt: null }, select: { studentMembershipId: true, packageRupees: true, drive: { select: { companyId: true, company: { select: { name: true, sectors: true } } } } } })
      : [],
  ]);
  const best = new Map<string, number>();
  for (const o of offers) best.set(o.studentMembershipId, Math.max(best.get(o.studentMembershipId) ?? 0, o.packageRupees));
  const placedIds = new Set(best.keys());
  const profileOf = new Map(profiles.map((p) => [p.studentMembershipId, p]));
  let higherStudies = 0;
  let entrepreneurs = 0;
  for (const id of ids) {
    if (placedIds.has(id)) continue;
    const p = profileOf.get(id);
    if (p?.higherStudies) higherStudies += 1;
    else if (p?.entrepreneur) entrepreneurs += 1;
  }
  const N = ids.length;
  const X = placedIds.size;

  const byCompanyMap = new Map<string, number[]>();
  for (const o of offers) byCompanyMap.set(o.drive.company.name, [...(byCompanyMap.get(o.drive.company.name) ?? []), o.packageRupees]);
  const byCompany = [...byCompanyMap.entries()].map(([company, pkgs]) => ({ company, offers: pkgs.length, medianRupees: median(pkgs) })).sort((a, b) => b.offers - a.offers || a.company.localeCompare(b.company));

  const progMap = new Map<string, { programmeName: string; finalYear: number; placed: number }>();
  const catMap = new Map<string, { finalYear: number; placed: number }>();
  for (const s of students) {
    const pk = s.programmeId ?? "";
    const p = progMap.get(pk) ?? { programmeName: s.programmeName ?? "", finalYear: 0, placed: 0 };
    p.finalYear += 1;
    if (placedIds.has(s.id)) p.placed += 1;
    progMap.set(pk, p);
    const ck = s.category ?? "";
    const c = catMap.get(ck) ?? { finalYear: 0, placed: 0 };
    c.finalYear += 1;
    if (placedIds.has(s.id)) c.placed += 1;
    catMap.set(ck, c);
  }

  const bandCount = new Map<SalaryBand, number>(SALARY_BANDS.map((b) => [b, 0]));
  for (const pkg of best.values()) bandCount.set(salaryBandOf(pkg), (bandCount.get(salaryBandOf(pkg)) ?? 0) + 1);

  const sectorCompanies = new Map<string, Set<string>>();
  const sectorOffers = new Map<string, number>();
  for (const o of offers) {
    const sectors = readJson<string[]>(o.drive.company.sectors, []).filter((x) => (PLACEMENT_SECTORS as readonly string[]).includes(x));
    for (const sector of sectors.length ? sectors : ["OTHER"]) {
      sectorCompanies.set(sector, (sectorCompanies.get(sector) ?? new Set()).add(o.drive.companyId));
      sectorOffers.set(sector, (sectorOffers.get(sector) ?? 0) + 1);
    }
  }

  return {
    batchYear,
    finalYear: N,
    placed: X,
    higherStudies,
    entrepreneurs,
    placementIndex: N > 0 ? Math.round(((X + higherStudies + entrepreneurs) / N) * 1000) / 1000 : null,
    medianSalaryRupees: median([...best.values()]),
    offers: offers.length,
    byCompany,
    byProgramme: [...progMap.entries()].map(([programmeId, v]) => ({ programmeId, ...v })),
    byCategory: [...catMap.entries()].map(([category, v]) => ({ category, ...v })),
    bands: SALARY_BANDS.map((band) => ({ band, count: bandCount.get(band) ?? 0 })),
    bySector: [...sectorCompanies.entries()].map(([sector, set]) => ({ sector: sector as PlacementTable["bySector"][number]["sector"], companies: set.size, offers: sectorOffers.get(sector) ?? 0 })),
    offersPerStudent: X > 0 ? Math.round((offers.length / X) * 100) / 100 : null,
  };
}

/** The batch and the ones before it, newest first: NBA's three years. */
export async function placementTables(schoolId: string, lastYears = 3, newest?: number): Promise<PlacementTable[]> {
  const top = newest ?? (await placementSettings(schoolId)).seasonBatchYear;
  const out: PlacementTable[] = [];
  for (let y = top; y > top - lastYears; y -= 1) out.push(await placementTable(schoolId, y));
  return out;
}

/** For the operator: whether the college runs placement, and this season's progress. */
export async function placementSummary(schoolId: string): Promise<{ on: boolean; batchYear: number | null; drivesOpen: number; drivesClosed: number; offers: number; placed: number; finalYear: number; placedPct: number | null }> {
  if (!(await placementOn(schoolId))) return { on: false, batchYear: null, drivesOpen: 0, drivesClosed: 0, offers: 0, placed: 0, finalYear: 0, placedPct: null };
  const { seasonBatchYear } = await placementSettings(schoolId);
  const [open, closed, table] = await Promise.all([
    db.drive.count({ where: { schoolId, status: { in: ["OPEN", "SHORTLISTING", "ROUNDS", "OFFERS"] } } }),
    db.drive.count({ where: { schoolId, status: "CLOSED" } }),
    placementTable(schoolId, seasonBatchYear),
  ]);
  return { on: true, batchYear: seasonBatchYear, drivesOpen: open, drivesClosed: closed, offers: table.offers, placed: table.placed, finalYear: table.finalYear, placedPct: table.finalYear > 0 ? Math.round((table.placed / table.finalYear) * 1000) / 10 : null };
}

const seasonView = (s: { batchYear: number; placed: number; higherStudies: number; entrepreneurs: number; medianSalaryRupees: number | null; computedAt: Date }) => ({ batchYear: s.batchYear, placed: s.placed, higherStudies: s.higherStudies, entrepreneurs: s.entrepreneurs, medianSalaryRupees: s.medianSalaryRupees, computedAt: s.computedAt.toISOString() });

export async function placementAnalytics(ctx: ActiveContext, batchYear?: number) {
  const cell = await cellOf(ctx, "analytics");
  const tables = await placementTables(cell.schoolId, 4, batchYear);
  const seasons = await db.placementSeason.findMany({ where: { schoolId: cell.schoolId }, orderBy: { batchYear: "desc" } });
  return { tables, seasons: seasons.map(seasonView) };
}

/** THE ONE WRITER of PlacementSeason: the cell publishes a batch's table as it stands. Republishing replaces it. */
export async function publishSeason(ctx: ActiveContext, batchYear: number) {
  const cell = await cellOf(ctx);
  const t = await placementTable(cell.schoolId, batchYear);
  const data = { finalYear: t.finalYear, placed: t.placed, higherStudies: t.higherStudies, entrepreneurs: t.entrepreneurs, offers: t.offers, medianSalaryRupees: t.medianSalaryRupees, computedAt: new Date(), computedByUserId: cell.userId };
  const row = await db.placementSeason.upsert({ where: { schoolId_batchYear: { schoolId: cell.schoolId, batchYear } }, update: data, create: { schoolId: cell.schoolId, batchYear, ...data } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "placement.season.publish", targetType: "PlacementSeason", targetId: row.id, meta: { batchYear, placed: t.placed, finalYear: t.finalYear } });
  return seasonView(row);
}

/**
 * THE DATA:AUDIT CHECK of the season rows: each recomputed from today's
 * offers and profiles. A difference is FAIL when nothing changed since it was
 * published (the writer stored the wrong figures), and WARN when an offer or
 * a profile changed afterwards (republish to bring it in step).
 */
export async function seasonDrift(schoolId: string): Promise<{ batchYear: number; level: "FAIL" | "WARN"; detail: string }[]> {
  const rows = await db.placementSeason.findMany({ where: { schoolId } });
  const out: { batchYear: number; level: "FAIL" | "WARN"; detail: string }[] = [];
  for (const r of rows) {
    const t = await placementTable(schoolId, r.batchYear);
    const diffs = (["finalYear", "placed", "higherStudies", "entrepreneurs", "offers", "medianSalaryRupees"] as const).filter((k) => (t[k] ?? null) !== (r[k] ?? null)).map((k) => [k, "stored", String(r[k]), "· rows give", String(t[k])].join(" ")); // data:audit detail, read by the developer (English by design)
    if (diffs.length === 0) continue;
    const ids = (await batchStudents(schoolId, r.batchYear)).map((s) => s.id);
    const later =
      (await db.offer.count({ where: { studentMembershipId: { in: ids }, updatedAt: { gt: r.computedAt } } })) +
      (await db.placementProfile.count({ where: { studentMembershipId: { in: ids }, updatedAt: { gt: r.computedAt } } }));
    out.push({ batchYear: r.batchYear, level: later > 0 ? "WARN" : "FAIL", detail: diffs.join("; ") });
  }
  return out;
}

const csv = (rows: (string | number | null)[][]) => `${rows.map((r) => r.map((c) => toCsvValue(c === null ? "" : String(c))).join(",")).join("\n")}\n`;

/**
 * The sheets the cell files: NBA (three years of N, X, Y, Z and the index),
 * NIRF (per year: N, placed, the median salary, higher studies; and the
 * companies with their offers), and every offer of a batch.
 */
export async function placementExport(ctx: ActiveContext, kind: "NBA" | "NIRF" | "OFFERS", batchYear?: number): Promise<{ filename: string; csv: string }> {
  // The offers sheet names every student: the cell, the office and the principal read it; the IQAC, which files from
  // the table and "never a student's row" (placement.ts CELL_ANALYTICS), takes NBA and NIRF alone (TA-311).
  const cell = await cellOf(ctx, kind === "OFFERS" ? "read" : "analytics");
  const tables = await placementTables(cell.schoolId, 3, batchYear);
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "placement.export", targetType: "School", targetId: cell.schoolId, meta: { kind, batchYear: tables[0]?.batchYear } });
  if (kind === "NBA") {
    return { filename: "placement-nba.csv", csv: csv([["batch_year", "final_year_students_N", "placed_X", "higher_studies_Y", "entrepreneurs_Z", "placement_index"], ...tables.map((t) => [t.batchYear, t.finalYear, t.placed, t.higherStudies, t.entrepreneurs, t.placementIndex])]) };
  }
  if (kind === "NIRF") {
    const rows: (string | number | null)[][] = [["batch_year", "graduating_students", "placed", "median_salary_rupees", "higher_studies"], ...tables.map((t) => [t.batchYear, t.finalYear, t.placed, t.medianSalaryRupees, t.higherStudies])];
    rows.push([], ["batch_year", "company", "offers", "median_package_rupees"]);
    for (const t of tables) for (const c of t.byCompany) rows.push([t.batchYear, c.company, c.offers, c.medianRupees]);
    return { filename: "placement-nirf.csv", csv: csv(rows) };
  }
  const top = tables[0]!.batchYear;
  const ids = (await batchStudents(cell.schoolId, top)).map((s) => s.id);
  const offers = ids.length ? await db.offer.findMany({ where: { studentMembershipId: { in: ids } }, include: { drive: { select: { title: true, company: { select: { name: true } } } }, student: { select: { user: { select: { name: true } } } } }, orderBy: { createdAt: "asc" } }) : [];
  return {
    filename: `placement-offers-${top}.csv`,
    csv: csv([["student", "company", "drive", "package_rupees", "made_on", "accepted", "declined", "joined", "dream"], ...offers.map((o) => [o.student.user.name, o.drive.company.name, o.drive.title, o.packageRupees, o.createdAt.toISOString().slice(0, 10), o.acceptedAt ? "yes" : "", o.declinedAt ? "yes" : "", o.joinedAt ? o.joinedAt.toISOString().slice(0, 10) : "", o.dreamException ? "yes" : ""])]),
  };
}

/** The cell's home: the season's table, the drives, and what is waiting. */
export async function placementHome(ctx: ActiveContext) {
  const cell = await cellOf(ctx, "read");
  const { seasonBatchYear } = await placementSettings(cell.schoolId);
  const [table, drives, requirements, internshipsWaiting, unverified] = await Promise.all([
    placementTable(cell.schoolId, seasonBatchYear),
    listDrives(ctx),
    db.requirement.findMany({ where: { withdrawnAt: null, targetSchoolIds: { contains: `"${cell.schoolId}"` } }, select: { id: true } }),
    db.internship.count({ where: { schoolId: cell.schoolId, status: "PROPOSED" } }),
    db.company.count({ where: { verifiedAt: null, tenantLinks: { some: { schoolId: cell.schoolId } } } }),
  ]);
  const taken = new Set((await db.drive.findMany({ where: { schoolId: cell.schoolId, requirementId: { in: requirements.map((r) => r.id) } }, select: { requirementId: true } })).map((d) => d.requirementId));
  return { batchYear: seasonBatchYear, table, drives: drives.drives, requirementsWaiting: requirements.filter((r) => !taken.has(r.id)).length, internshipsWaiting, unverifiedCompanies: unverified, canEdit: cell.canEdit };
}
