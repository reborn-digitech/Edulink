import "server-only";
import type { Benchmarks, BenchmarkStatus } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { RuleRefusal } from "./rule-refusal";
import { getT } from "./i18n/server";
import { noticeDate } from "./notice-dates";
import { iqacActor } from "./iqac";
import { benchmarkList, benchmarkListVersion } from "./iqac-rules";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * THE BENCHMARK LIST'S SIGNATURE (G4-15, risks batch 5 Oct 2026; 08's recommended option, "show 'provisional' on
 * every figure until a coordinator signs the list"). The NAAC benchmarks the predictor scores against and the NIRF
 * band minimums are the platform's own reading (iqac-rules.ts FORMULAS; contracts NIRF_BANDS, whose top-hundred line
 * alone is NIRF's published figure). Every NAAC and NIRF figure the IQAC pages, the insights and the simulator
 * print carries "provisional" until the college's IQAC coordinator — the IQAC role, not the office or the head —
 * reads the list and signs it. The signature is the list's version (iqac-rules.ts `benchmarkListVersion`), kept on
 * the School row with who and when: when the platform changes a number, the version moves and the figures read
 * provisional again until the list is signed anew. One writer (`signBenchmarks`), one audit row
 * (iqac.benchmarks.sign) per signature.
 */

const READERS: readonly Role[] = ["IQAC", "ADMIN", "PRINCIPAL", "HOD"];

/** Where the college stands against today's list: provisional unless the signed version is the current one. */
export async function benchmarkStatus(schoolId: string): Promise<BenchmarkStatus> {
  const version = benchmarkListVersion();
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { benchmarksSignedVersion: true, benchmarksSignedAt: true, benchmarksSignedByUserId: true } });
  const signed = school?.benchmarksSignedVersion === version && school.benchmarksSignedAt !== null;
  const t = await getT();
  if (!signed) return { provisional: true, version, signedAt: null, signedByName: null, sentence: t("riskDecisions.benchmarksProvisional") };
  const by = school.benchmarksSignedByUserId ? await db.user.findUnique({ where: { id: school.benchmarksSignedByUserId }, select: { name: true } }) : null;
  const signedAt = school.benchmarksSignedAt!;
  return { provisional: false, version, signedAt: signedAt.toISOString(), signedByName: by?.name ?? null, sentence: t("riskDecisions.benchmarksSigned", { name: by?.name ?? "—", date: noticeDate(signedAt.toISOString().slice(0, 10), "long") }) };
}

/** GET /api/v1/iqac/benchmarks — the list and where the college stands on it; the IQAC alone may sign. */
export async function benchmarksView(ctx: ActiveContext): Promise<Benchmarks> {
  const desk = await iqacActor(ctx, READERS);
  return { ...(await benchmarkStatus(desk.schoolId)), canSign: desk.role === "IQAC", ...benchmarkList() };
}

/**
 * POST /api/v1/iqac/benchmarks/sign — the coordinator signs the list they read. The version they send must be the
 * list's current one, so a list that changed between their reading and their signing is not signed unread (409).
 * Signing the same version again changes nothing and writes no second row.
 */
export async function signBenchmarks(ctx: ActiveContext, input: { version: string }, now: Date = new Date()): Promise<Benchmarks> {
  const desk = await iqacActor(ctx, ["IQAC"]);
  const version = benchmarkListVersion();
  if (input.version !== version) throw new RuleRefusal("riskDecisions.refuseBenchmarksChanged", 409, undefined, "version");
  const school = await db.school.findUniqueOrThrow({ where: { id: desk.schoolId }, select: { benchmarksSignedVersion: true } });
  if (school.benchmarksSignedVersion !== version) {
    await db.school.update({ where: { id: desk.schoolId }, data: { benchmarksSignedVersion: version, benchmarksSignedAt: now, benchmarksSignedByUserId: desk.userId } });
    await audit({ schoolId: desk.schoolId, actorUserId: desk.userId, action: "iqac.benchmarks.sign", targetType: "School", targetId: desk.schoolId, meta: { version } });
  }
  return benchmarksView(ctx);
}
