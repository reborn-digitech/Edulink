import "server-only";
import {
  DRIVE_STATUSES,
  RECRUITER_LIVE_STATUSES,
  eligibilityRuleSchema,
  type CompanySave,
  type DriveApplicationView,
  type DriveRound,
  type DriveSave,
  type DriveStatus,
  type DriveSummary,
  type DriveUpdate,
  type DriveView,
  type EligibilityRule,
  type OfferView,
  type PlacementProfileSave,
  type PlacementRecord,
  type SharedPlacementRecord,
  type PlacementSettings,
  type RoundResultsSave,
  type RequirementView,
} from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import { isMinorToday } from "./student-consent";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { assertModuleOn, institutionKindOf, isModuleOn } from "./modules";
import { isCollegeKind } from "./institution";
import { forPlacementDirectory, forSchool } from "./tenant-context";
import { readJson, writeJson } from "./json";
import { todayKey } from "./dates";
import { EMPTY_RECORD, placementRecords } from "./placement-record";
import { applicationStatus, evaluateEligibility, seasonBatchFor } from "./placement-rules";

export { applicationStatus, evaluateEligibility, seasonBatchFor };
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * THE PLACEMENT CELL (module PLACEMENT, role TPO; the owner's college plan of
 * 4 October 2026).
 *
 * WHO. The TPO runs the cell: companies, drives, the eligibility rule,
 * shortlists, rounds, offers, the season's table. The office (ADMIN) and the
 * principal read it. A student keeps a profile, applies to the drives they
 * are eligible for (applying IS the consent to share their profile and
 * record with that drive's company) and answers offers. A RECRUITER reaches a
 * drive only through the company it is bound to (placement-recruiter.ts).
 *
 * ELIGIBILITY IS COMPUTED, NEVER TYPED (`evaluateEligibility`): the CGPA and
 * the live backlogs from the exam cell, the programme and the batch from the
 * academics module's seat, gender from the office's record — every failed
 * condition named. The ONE-OFFER RULE: a student holding an accepted offer
 * is not eligible again unless the cell has granted them the dream flag and
 * the drive's best package is at least the college's dream ratio times the
 * accepted one; an offer made under that rule is marked `dreamException`.
 *
 * WHERE AN APPLICATION STANDS is computed on read from the round results
 * (round 0 is the shortlist) and the offers, the host's rows — never stored
 * on the application, which for a pooled drive's guest is another college's
 * row the host could not write.
 *
 * POOLED DRIVES. A drive of kind POOLED is the host's row; the colleges in
 * `poolSchoolIds` read it (POOLED_READABLE in scripts/gen-rls.ts), their
 * students apply from their own college (their application is their
 * college's row), and the host reads the consented applications and records
 * the rounds and offers. A guest's cell reads its own students' results.
 *
 * MONEY NEVER TOUCHES THE PLATFORM (decision 0003): a package is the CTC a
 * year in rupees as the company states it.
 */

type Tx = typeof db;
export type Cell = { schoolId: string; userId: string; role: Role; membershipId: string; canEdit: boolean };

const CELL_WRITE: readonly Role[] = ["TPO"];
const CELL_READ: readonly Role[] = ["TPO", "ADMIN", "PRINCIPAL"];
/** The placement table and its exports, which the IQAC files from (NAAC criterion 5, NBA, NIRF): never a student's row. */
const CELL_ANALYTICS: readonly Role[] = [...CELL_READ, "IQAC"];

/** The cell at the session's college, with PLACEMENT on. `read` lets the office and the principal in; `analytics` the IQAC too (campaign B-01). */
export async function cellOf(ctx: ActiveContext, mode: "write" | "read" | "analytics" = "write"): Promise<Cell> {
  const roles = mode === "write" ? CELL_WRITE : mode === "analytics" ? CELL_ANALYTICS : CELL_READ;
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "PLACEMENT");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role, membershipId: ctx.membershipId, canEdit: CELL_WRITE.includes(ctx.role) };
}

/** A student of a college with PLACEMENT on. */
export async function studentOf(ctx: ActiveContext): Promise<{ schoolId: string; membershipId: string; userId: string }> {
  if (ctx.role !== "STUDENT" || !ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "PLACEMENT");
  return { schoolId: ctx.schoolId, membershipId: ctx.membershipId, userId: ctx.user.id };
}

async function zoneOf(schoolId: string): Promise<string> {
  return (await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
}

export const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

export const PLACEMENT_DEFAULTS = { dreamRatio: 1.5, allowGenderRule: false };

/** The cell's settings, kept in the PLACEMENT module's own settings (SchoolModule.settingsJson). */
export async function placementSettings(schoolId: string, today?: string): Promise<PlacementSettings> {
  const row = await db.schoolModule.findUnique({ where: { schoolId_module: { schoolId, module: "PLACEMENT" } }, select: { settingsJson: true } });
  const raw = readJson<Partial<PlacementSettings>>(row?.settingsJson, {});
  const day = today ?? todayKey(await zoneOf(schoolId));
  return {
    seasonBatchYear: typeof raw.seasonBatchYear === "number" ? raw.seasonBatchYear : seasonBatchFor(day),
    dreamRatio: typeof raw.dreamRatio === "number" && raw.dreamRatio >= 1 ? raw.dreamRatio : PLACEMENT_DEFAULTS.dreamRatio,
    allowGenderRule: typeof raw.allowGenderRule === "boolean" ? raw.allowGenderRule : PLACEMENT_DEFAULTS.allowGenderRule,
  };
}

export async function placementSettingsFor(ctx: ActiveContext): Promise<PlacementSettings & { canEdit: boolean }> {
  const cell = await cellOf(ctx, "read");
  return { ...(await placementSettings(cell.schoolId)), canEdit: cell.canEdit };
}

export async function savePlacementSettings(ctx: ActiveContext, input: PlacementSettings): Promise<PlacementSettings & { canEdit: boolean }> {
  const cell = await cellOf(ctx);
  await db.schoolModule.update({ where: { schoolId_module: { schoolId: cell.schoolId, module: "PLACEMENT" } }, data: { settingsJson: writeJson(input) } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "placement.settings", targetType: "School", targetId: cell.schoolId, meta: { ...input } });
  return { ...(await placementSettings(cell.schoolId)), canEdit: true };
}

/* -------------------------------------------------------------------------- */
/* Eligibility                                                                 */
/* -------------------------------------------------------------------------- */

export function readRule(raw: string | null | undefined): EligibilityRule {
  const parsed = eligibilityRuleSchema.safeParse(readJson<unknown>(raw, {}));
  return parsed.success ? parsed.data : eligibilityRuleSchema.parse({});
}

/** The students on a college's roll now. */
export async function rollOf(schoolId: string): Promise<{ id: string; userId: string; name: string }[]> {
  const rows = await db.membership.findMany({
    where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null },
    select: { id: true, userId: true, user: { select: { name: true, preferredName: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return rows.map((r) => ({ id: r.id, userId: r.userId, name: nameOf(r.user) }));
}

/** Each student's best accepted offer, from every college's rows the reader may see (a pooled drive's host's too). */
async function acceptedOffers(studentIds: readonly string[]): Promise<Map<string, number>> {
  if (studentIds.length === 0) return new Map();
  const rows = await db.offer.findMany({ where: { studentMembershipId: { in: [...studentIds] }, acceptedAt: { not: null }, declinedAt: null }, select: { studentMembershipId: true, packageRupees: true } });
  const best = new Map<string, number>();
  for (const r of rows) best.set(r.studentMembershipId, Math.max(best.get(r.studentMembershipId) ?? 0, r.packageRupees));
  return best;
}

type DriveRow = Awaited<ReturnType<typeof loadDrive>>;
async function loadDrive(driveId: string) {
  return db.drive.findUnique({ where: { id: driveId }, include: { company: { select: { name: true, verifiedAt: true, sectors: true } } } });
}

export const poolIdsOf = (d: { poolSchoolIds: string }) => readJson<string[]>(d.poolSchoolIds, []).filter((x) => typeof x === "string");

/** Whether `schoolId` may see this drive: its host, or a guest of a pooled drive past its draft. */
function seesDrive(d: { schoolId: string; kind: string; status: string; poolSchoolIds: string }, schoolId: string): "HOST" | "GUEST" | null {
  if (d.schoolId === schoolId) return "HOST";
  if (d.kind === "POOLED" && d.status !== "DRAFT" && poolIdsOf(d).includes(schoolId)) return "GUEST";
  return null;
}

/**
 * Who of `schoolId`'s students qualifies for a drive, and why not. For a
 * pooled drive, each college computes its own students against the host's
 * rule. Exported for the recruiter's count, which runs under the host's
 * binding and returns a number.
 */
export async function eligibilityAt(drive: { id: string; eligibilityRule: string; packageMaxRupees: number }, schoolId: string, onlyIds?: readonly string[]) {
  const [roll, settings] = await Promise.all([rollOf(schoolId), placementSettings(schoolId)]);
  const students = onlyIds ? roll.filter((r) => onlyIds.includes(r.id)) : roll;
  const ids = students.map((s) => s.id);
  const [records, profiles, accepted] = await Promise.all([
    placementRecords(schoolId, ids, todayKey(await zoneOf(schoolId))),
    db.placementProfile.findMany({ where: { schoolId, studentMembershipId: { in: ids } }, select: { studentMembershipId: true, optedOut: true, dreamFlag: true } }),
    acceptedOffers(ids),
  ]);
  const profileOf = new Map(profiles.map((p) => [p.studentMembershipId, p]));
  const rule = readRule(drive.eligibilityRule);
  return students.map((s) => {
    const record = records.get(s.id) ?? EMPTY_RECORD;
    const p = profileOf.get(s.id);
    const failed = evaluateEligibility({ rule, record, optedOut: p?.optedOut ?? false, dreamFlag: p?.dreamFlag ?? false, acceptedRupees: accepted.get(s.id) ?? null, drivePackageMaxRupees: drive.packageMaxRupees, dreamRatio: settings.dreamRatio, allowGenderRule: settings.allowGenderRule });
    return { studentMembershipId: s.id, userId: s.userId, name: s.name, eligible: failed.length === 0, failed, record };
  });
}

export async function driveEligibility(ctx: ActiveContext, driveId: string) {
  const cell = await cellOf(ctx, "read");
  const d = await loadDrive(driveId);
  if (!d || !seesDrive(d, cell.schoolId)) throw new AccessError("placement.noSuchDrive", "NOT_FOUND");
  const rows = await eligibilityAt(d, cell.schoolId);
  return { driveId, eligible: rows.filter((r) => r.eligible).length, total: rows.length, rows: rows.map((r) => ({ studentMembershipId: r.studentMembershipId, name: r.name, eligible: r.eligible, failed: r.failed, record: r.record })) };
}

/* -------------------------------------------------------------------------- */
/* Application status, views                                                   */
/* -------------------------------------------------------------------------- */

export const readRounds = (raw: string): DriveRound[] => readJson<DriveRound[]>(raw, []).filter((r) => r && typeof r.n === "number");
export const readSchedule = (raw: string): { label: string; at: string }[] => readJson<{ label: string; at: string }[]>(raw, []).filter((r) => r && typeof r.label === "string");
export const readRecord = (raw: string): PlacementRecord => ({ ...EMPTY_RECORD, ...readJson<Partial<PlacementRecord>>(raw, {}) });
/** What an application shares: the record without gender and category (campaign S-3). Applied when freezing and again when reading, for rows frozen before. */
export function sharedRecord(record: PlacementRecord): SharedPlacementRecord {
  return { cgpa: record.cgpa, liveBacklogs: record.liveBacklogs, attendancePct: record.attendancePct, programmeId: record.programmeId, programmeName: record.programmeName, batchYear: record.batchYear };
}

/** The next dated thing in a drive: a round or a schedule line still ahead. */
function nextAtOf(rounds: DriveRound[], schedule: { at: string }[], now: Date): string | null {
  const times = [...rounds.map((r) => r.at), ...schedule.map((s) => s.at)].filter((x): x is string => Boolean(x)).filter((x) => new Date(x) > now).sort();
  return times[0] ?? null;
}

type OfferRow = { id: string; driveId: string; studentMembershipId: string; packageRupees: number; letterFileId: string | null; acceptedAt: Date | null; declinedAt: Date | null; joinedAt: Date | null; dreamException: boolean; createdAt: Date };
/** Offers as views. `names` (membership id → name) when the reader cannot read the memberships — a recruiter reads names off the applications. */
export async function offerViews(rows: readonly OfferRow[], names?: ReadonlyMap<string, string>): Promise<OfferView[]> {
  if (rows.length === 0) return [];
  const [drives, members] = await Promise.all([
    db.drive.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.driveId))] } }, select: { id: true, title: true, company: { select: { name: true } } } }),
    names ? Promise.resolve([]) : db.membership.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.studentMembershipId))] } }, select: { id: true, user: { select: { name: true, preferredName: true } } } }),
  ]);
  const driveOf = new Map(drives.map((d) => [d.id, d]));
  const nameOfMember = names ?? new Map(members.map((m) => [m.id, nameOf(m.user)]));
  return rows.map((o) => ({
    id: o.id,
    driveId: o.driveId,
    driveTitle: driveOf.get(o.driveId)?.title ?? "",
    companyName: driveOf.get(o.driveId)?.company.name ?? "",
    studentMembershipId: o.studentMembershipId,
    studentName: nameOfMember.get(o.studentMembershipId) ?? "",
    packageRupees: o.packageRupees,
    hasLetter: Boolean(o.letterFileId),
    letterFileId: o.letterFileId,
    acceptedAt: o.acceptedAt?.toISOString() ?? null,
    declinedAt: o.declinedAt?.toISOString() ?? null,
    joinedAt: o.joinedAt?.toISOString() ?? null,
    dreamException: o.dreamException,
    createdAt: o.createdAt.toISOString(),
  }));
}

const OFFER_SELECT = { id: true, driveId: true, studentMembershipId: true, packageRupees: true, letterFileId: true, acceptedAt: true, declinedAt: true, joinedAt: true, dreamException: true, createdAt: true } as const;

/**
 * The applications to a drive a reader may see, as views: `filter` narrows
 * them (a guest's own students; a recruiter's consented ones). Names come
 * from the account (`studentUserId`), the record from the frozen snapshot.
 */
export async function applicationViews(driveId: string, filter: { schoolId?: string; consentedOnly?: boolean; sharedFeedbackOnly?: boolean } = {}): Promise<DriveApplicationView[]> {
  const apps = await db.driveApplication.findMany({
    where: { driveId, ...(filter.schoolId ? { schoolId: filter.schoolId } : {}), ...(filter.consentedOnly ? { consentAt: { not: null }, withdrawnAt: null } : {}) },
    orderBy: { appliedAt: "asc" },
  });
  if (apps.length === 0) return [];
  const ids = apps.map((a) => a.studentMembershipId);
  const [users, profiles, results, offers] = await Promise.all([
    db.user.findMany({ where: { id: { in: apps.map((a) => a.studentUserId) } }, select: { id: true, name: true, preferredName: true } }),
    db.placementProfile.findMany({ where: { studentMembershipId: { in: ids } }, select: { studentMembershipId: true, skills: true } }),
    db.roundResult.findMany({ where: { driveId, studentMembershipId: { in: ids } }, orderBy: { round: "asc" } }),
    db.offer.findMany({ where: { driveId, studentMembershipId: { in: ids } }, select: OFFER_SELECT }),
  ]);
  const userName = new Map(users.map((u) => [u.id, nameOf(u)]));
  const skillsOf = new Map(profiles.map((p) => [p.studentMembershipId, readJson<string[]>(p.skills, [])]));
  const offerViewsList = await offerViews(offers, new Map(apps.map((a) => [a.studentMembershipId, userName.get(a.studentUserId) ?? ""])));
  const offerOf = new Map(offerViewsList.map((o) => [o.studentMembershipId, o]));
  return apps.map((a) => {
    const mine = results.filter((r) => r.studentMembershipId === a.studentMembershipId);
    const offer = offerOf.get(a.studentMembershipId) ?? null;
    const { status, round } = applicationStatus(a, mine, Boolean(offer));
    return {
      id: a.id,
      driveId: a.driveId,
      studentMembershipId: a.studentMembershipId,
      studentName: userName.get(a.studentUserId) ?? "",
      schoolName: a.schoolName,
      appliedAt: a.appliedAt.toISOString(),
      consentAt: a.consentAt?.toISOString() ?? null,
      status,
      round,
      record: sharedRecord(readRecord(a.recordJson)),
      skills: skillsOf.get(a.studentMembershipId) ?? [],
      results: mine.map((r) => ({ round: r.round, outcome: r.outcome as "PASSED", feedback: filter.sharedFeedbackOnly && !r.feedbackShared ? null : r.feedback, feedbackShared: r.feedbackShared, at: r.updatedAt.toISOString() })),
      offer,
    };
  });
}

async function schoolNames(ids: readonly string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  // A pooled drive's host and guests, a requirement's colleges: the directory's names (campaign S-13).
  const rows = await forPlacementDirectory(() => db.school.findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, name: true } }));
  return new Map(rows.map((r) => [r.id, r.name]));
}

async function summaries(rows: NonNullable<DriveRow>[], readerSchoolId: string): Promise<DriveSummary[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((d) => d.id);
  const [apps, offers, hosts] = await Promise.all([
    db.driveApplication.groupBy({ by: ["driveId"], where: { driveId: { in: ids }, withdrawnAt: null }, _count: { _all: true } }),
    db.offer.groupBy({ by: ["driveId"], where: { driveId: { in: ids } }, _count: { _all: true } }),
    schoolNames(rows.map((d) => d.schoolId)),
  ]);
  const appCount = new Map(apps.map((a) => [a.driveId, a._count._all]));
  const offerCount = new Map(offers.map((a) => [a.driveId, a._count._all]));
  const now = new Date();
  return rows.map((d) => ({
    id: d.id,
    title: d.title,
    companyId: d.companyId,
    companyName: d.company.name,
    companyVerified: d.company.verifiedAt !== null,
    kind: d.kind as DriveSummary["kind"],
    status: d.status as DriveStatus,
    packageMinRupees: d.packageMinRupees,
    packageMaxRupees: d.packageMaxRupees,
    hostName: hosts.get(d.schoolId) ?? "",
    hosted: d.schoolId === readerSchoolId,
    nextAt: nextAtOf(readRounds(d.rounds), readSchedule(d.schedule), now),
    applicants: appCount.get(d.id) ?? 0,
    offers: offerCount.get(d.id) ?? 0,
    createdAt: d.createdAt.toISOString(),
  }));
}

/** The drives a college sees: its own, and pooled drives it is a guest of (past their draft). */
async function visibleDrives(schoolId: string, extra: { statusIn?: readonly string[] } = {}) {
  return db.drive.findMany({
    where: {
      OR: [{ schoolId }, { kind: "POOLED", status: { not: "DRAFT" }, poolSchoolIds: { contains: `"${schoolId}"` } }],
      ...(extra.statusIn ? { status: { in: [...extra.statusIn] } } : {}),
    },
    include: { company: { select: { name: true, verifiedAt: true, sectors: true } } },
    orderBy: [{ createdAt: "desc" }],
    take: 300,
  });
}

export async function listDrives(ctx: ActiveContext): Promise<{ drives: DriveSummary[]; canEdit: boolean }> {
  const cell = await cellOf(ctx, "read");
  return { drives: await summaries(await visibleDrives(cell.schoolId), cell.schoolId), canEdit: cell.canEdit };
}

export async function driveView(ctx: ActiveContext, driveId: string): Promise<DriveView> {
  const cell = await cellOf(ctx, "read");
  const d = await loadDrive(driveId);
  const seen = d ? seesDrive(d, cell.schoolId) : null;
  if (!d || !seen) throw new AccessError("placement.noSuchDrive", "NOT_FOUND");
  const [summary] = await summaries([d], cell.schoolId);
  const eligible = (await eligibilityAt(d, cell.schoolId)).filter((r) => r.eligible).length;
  // The host reads every application to its drive — its own students' and its guests' (each consented by
  // applying; POOLED_READABLE lets the host read a guest's); a guest reads its own students' alone.
  const unique = seen === "HOST" ? await applicationViews(d.id) : await applicationViews(d.id, { schoolId: cell.schoolId });
  const pool = poolIdsOf(d);
  const names = await schoolNames(pool);
  return {
    ...summary!,
    jd: d.jd,
    bond: d.bond,
    rounds: readRounds(d.rounds),
    schedule: readSchedule(d.schedule),
    venues: d.venues,
    rule: readRule(d.eligibilityRule),
    requirementId: d.requirementId,
    poolSchools: pool.map((id) => ({ id, name: names.get(id) ?? "" })),
    eligibleCount: eligible,
    invitedAt: d.invitedAt?.toISOString() ?? null,
    closedAt: d.closedAt?.toISOString() ?? null,
    applications: unique,
    recruiterRating: d.recruiterRating,
    recruiterFeedback: d.recruiterFeedback,
    canEdit: cell.canEdit && seen === "HOST" && d.status !== "CLOSED",
  };
}

/* -------------------------------------------------------------------------- */
/* Companies and requirements, the cell's side                                 */
/* -------------------------------------------------------------------------- */

export async function companyViews(schoolId: string | null, where: { ids?: string[] } = {}) {
  const companies = await db.company.findMany({
    where: where.ids ? { id: { in: where.ids } } : schoolId ? { OR: [{ tenantLinks: { some: { schoolId } } }, { createdBySchoolId: schoolId }] } : {},
    orderBy: { name: "asc" },
    include: { _count: { select: { recruiters: { where: { removedAt: null } } } }, tenantLinks: schoolId ? { where: { schoolId }, select: { firstVisitYear: true } } : false },
  });
  const drives = schoolId
    ? await db.drive.groupBy({ by: ["companyId"], where: { schoolId, companyId: { in: companies.map((c) => c.id) } }, _count: { _all: true } })
    : [];
  const driveCount = new Map(drives.map((d) => [d.companyId, d._count._all]));
  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    identifier: c.identifier,
    sectors: readJson<string[]>(c.sectors, []) as never[],
    pointOfContact: c.pointOfContact,
    verifiedAt: c.verifiedAt?.toISOString() ?? null,
    recruiters: c._count.recruiters,
    firstVisitYear: (c as { tenantLinks?: { firstVisitYear: number | null }[] }).tenantLinks?.[0]?.firstVisitYear ?? null,
    drives: driveCount.get(c.id) ?? 0,
  }));
}

export async function listCompanies(ctx: ActiveContext) {
  const cell = await cellOf(ctx, "read");
  return { companies: await companyViews(cell.schoolId) };
}

/** The cell adds a company: a registered one is linked rather than made twice (the identifier is unique across the platform). */
export async function addCompany(ctx: ActiveContext, input: CompanySave) {
  const cell = await cellOf(ctx);
  const existing = await db.company.findUnique({ where: { identifier: input.identifier }, select: { id: true } });
  const id =
    existing?.id ??
    (
      await db.company.create({
        data: { name: input.name, identifier: input.identifier, sectors: writeJson(input.sectors), pointOfContact: input.pointOfContact, createdByUserId: cell.userId, createdBySchoolId: cell.schoolId },
        select: { id: true },
      })
    ).id;
  await db.companyTenantLink.upsert({ where: { schoolId_companyId: { schoolId: cell.schoolId, companyId: id } }, update: {}, create: { schoolId: cell.schoolId, companyId: id } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "placement.company.add", targetType: "Company", targetId: id, meta: { identifier: input.identifier, linked: Boolean(existing) } });
  return (await companyViews(cell.schoolId, { ids: [id] }))[0]!;
}

/** The cell's word that it checked a company: once, for every college. Idempotent. */
export async function verifyCompany(ctx: ActiveContext, companyId: string) {
  const cell = await cellOf(ctx);
  const c = await db.company.findUnique({ where: { id: companyId }, select: { id: true, verifiedAt: true } });
  if (!c) throw new AccessError("placement.noSuchCompany", "NOT_FOUND");
  // Verification counts for every college, so only a cell the company has engaged may give it:
  // the cell added it, it sent this college a requirement, or it has a drive here (campaign S-4).
  const [linked, asked, drive] = await Promise.all([
    db.companyTenantLink.findUnique({ where: { schoolId_companyId: { schoolId: cell.schoolId, companyId } }, select: { schoolId: true } }),
    db.requirement.findFirst({ where: { companyId, targetSchoolIds: { contains: `"${cell.schoolId}"` } }, select: { id: true } }),
    db.drive.findFirst({ where: { companyId, schoolId: cell.schoolId }, select: { id: true } }),
  ]);
  if (!linked && !asked && !drive) throw new AccessError("placement.noSuchCompany", "NOT_FOUND");
  if (!c.verifiedAt) {
    const changed = await db.company.updateMany({ where: { id: companyId, verifiedAt: null }, data: { verifiedAt: new Date(), verifiedByUserId: cell.userId } });
    if (changed.count > 0) await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "placement.company.verify", targetType: "Company", targetId: companyId });
  }
  await db.companyTenantLink.upsert({ where: { schoolId_companyId: { schoolId: cell.schoolId, companyId } }, update: {}, create: { schoolId: cell.schoolId, companyId } });
  return (await companyViews(cell.schoolId, { ids: [companyId] }))[0]!;
}

export async function requirementViews(rows: { id: string; companyId: string; role: string; packageRupees: number; bond: string; locations: string; eligibilityAsked: string; rounds: string; datesProposed: string; targetSchoolIds: string; createdAt: Date }[], forSchoolId: string | null): Promise<RequirementView[]> {
  if (rows.length === 0) return [];
  const [companies, drives] = await Promise.all([
    db.company.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.companyId))] } }, select: { id: true, name: true, verifiedAt: true } }),
    forSchoolId ? db.drive.findMany({ where: { schoolId: forSchoolId, requirementId: { in: rows.map((r) => r.id) } }, select: { id: true, requirementId: true } }) : Promise.resolve([] as { id: string; requirementId: string | null }[]),
  ]);
  const targets = [...new Set(rows.flatMap((r) => readJson<string[]>(r.targetSchoolIds, [])))];
  const names = await schoolNames(targets);
  const companyOf = new Map(companies.map((c) => [c.id, c]));
  const driveOf = new Map(drives.map((d) => [d.requirementId, d.id]));
  return rows.map((r) => ({
    id: r.id,
    companyId: r.companyId,
    companyName: companyOf.get(r.companyId)?.name ?? "",
    companyVerified: Boolean(companyOf.get(r.companyId)?.verifiedAt),
    role: r.role,
    packageRupees: r.packageRupees,
    bond: r.bond,
    locations: r.locations,
    eligibilityAsked: readRule(r.eligibilityAsked),
    rounds: readJson(r.rounds, []),
    datesProposed: r.datesProposed,
    targetSchools: readJson<string[]>(r.targetSchoolIds, []).filter((id) => !forSchoolId || id === forSchoolId).map((id) => ({ id, name: names.get(id) ?? "" })),
    createdAt: r.createdAt.toISOString(),
    driveId: driveOf.get(r.id) ?? null,
  }));
}

/** The requirements addressed to this college, newest first. */
export async function listRequirements(ctx: ActiveContext) {
  const cell = await cellOf(ctx, "read");
  const rows = await db.requirement.findMany({ where: { withdrawnAt: null, targetSchoolIds: { contains: `"${cell.schoolId}"` } }, orderBy: { createdAt: "desc" }, take: 200 });
  return { requirements: await requirementViews(rows, cell.schoolId) };
}

/** The cell turns a requirement into a DRAFT drive, carrying its role, package, rounds and the eligibility asked. Refused for an unverified company. */
export async function acceptRequirement(ctx: ActiveContext, requirementId: string): Promise<DriveView> {
  const cell = await cellOf(ctx);
  const r = await db.requirement.findUnique({ where: { id: requirementId }, include: { company: { select: { verifiedAt: true } } } });
  if (!r || r.withdrawnAt || !readJson<string[]>(r.targetSchoolIds, []).includes(cell.schoolId)) throw new AccessError("placement.noSuchRequirement", "NOT_FOUND");
  if (!r.company.verifiedAt) throw new RuleRefusal("placement.refuseUnverifiedCompany", 409);
  const made = await db.drive.findFirst({ where: { schoolId: cell.schoolId, requirementId }, select: { id: true } });
  if (made) return driveView(ctx, made.id);
  const asked = readRule(r.eligibilityAsked);
  const rounds = readJson<{ kind: string; note: string }[]>(r.rounds, []).map((x, i) => ({ n: i + 1, kind: x.kind, note: x.note ?? "", at: null }));
  const drive = await openDrive(ctx, { companyId: r.companyId, requirementId, kind: "ON_CAMPUS", title: r.role, jd: [r.locations, r.datesProposed].filter(Boolean).join("\n"), packageMinRupees: r.packageRupees, packageMaxRupees: r.packageRupees, bond: r.bond, rounds: rounds as DriveRound[], schedule: [], venues: "", rule: asked, poolSchoolIds: [] });
  return drive;
}

/* -------------------------------------------------------------------------- */
/* Drives, the cell's writes                                                   */
/* -------------------------------------------------------------------------- */

/** The colleges a pooled drive may invite: other colleges with PLACEMENT on (the placement directory). */
export async function placementColleges(exceptSchoolId?: string | null): Promise<{ id: string; name: string; city: string | null }[]> {
  // The directory: id, name and town, never the row (campaign S-13).
  const rows = await forPlacementDirectory(() =>
    db.school.findMany({
      where: { kind: { in: ["COLLEGE", "AUTONOMOUS_COLLEGE"] }, removedAt: null, modules: { some: { module: "PLACEMENT" } }, ...(exceptSchoolId ? { id: { not: exceptSchoolId } } : {}) },
      select: { id: true, name: true, city: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
  );
  return rows;
}

async function checkDriveInput(cell: Cell, input: Partial<DriveSave>, settings: PlacementSettings): Promise<void> {
  if (input.packageMinRupees !== undefined && input.packageMaxRupees !== undefined && input.packageMaxRupees < input.packageMinRupees) throw new RuleRefusal("placement.refusePackageRange", 422, undefined, "packageMaxRupees");
  if (input.rule && input.rule.genders.length > 0 && !settings.allowGenderRule) throw new RuleRefusal("placement.refuseGenderRule", 422, undefined, "rule");
  if (input.rounds && input.rounds.some((r, i) => r.n !== i + 1)) throw new RuleRefusal("placement.refuseRoundOrder", 422, undefined, "rounds");
  if (input.kind === "POOLED" || (input.poolSchoolIds && input.poolSchoolIds.length > 0)) {
    const allowed = new Set((await placementColleges(cell.schoolId)).map((c) => c.id));
    if ((input.poolSchoolIds ?? []).some((id) => !allowed.has(id))) throw new RuleRefusal("placement.refusePoolSchool", 422, undefined, "poolSchoolIds");
  }
  if (input.kind === "POOLED" && (input.poolSchoolIds ?? []).length === 0) throw new RuleRefusal("placement.refusePoolEmpty", 422, undefined, "poolSchoolIds");
  if (input.kind && input.kind !== "POOLED" && (input.poolSchoolIds ?? []).length > 0) throw new RuleRefusal("placement.refusePoolNotPooled", 422, undefined, "poolSchoolIds");
}

export async function openDrive(ctx: ActiveContext, input: DriveSave): Promise<DriveView> {
  const cell = await cellOf(ctx);
  const settings = await placementSettings(cell.schoolId);
  const company = await db.company.findUnique({ where: { id: input.companyId }, select: { id: true } });
  if (!company) throw new RuleRefusal("placement.refuseUnknownCompany", 422, undefined, "companyId");
  await checkDriveInput(cell, input, settings);
  const year = new Date().getUTCFullYear();
  const d = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const drive = await tx.drive.create({
      data: {
        schoolId: cell.schoolId,
        companyId: input.companyId,
        requirementId: input.requirementId,
        kind: input.kind,
        title: input.title,
        jd: input.jd,
        packageMinRupees: input.packageMinRupees,
        packageMaxRupees: input.packageMaxRupees,
        bond: input.bond,
        rounds: writeJson(input.rounds),
        schedule: writeJson(input.schedule),
        venues: input.venues,
        eligibilityRule: writeJson(input.rule),
        poolSchoolIds: writeJson(input.poolSchoolIds),
        createdByUserId: cell.userId,
      },
      select: { id: true },
    });
    await tx.companyTenantLink.upsert({ where: { schoolId_companyId: { schoolId: cell.schoolId, companyId: input.companyId } }, update: {}, create: { schoolId: cell.schoolId, companyId: input.companyId, firstVisitYear: year } });
    await tx.companyTenantLink.updateMany({ where: { schoolId: cell.schoolId, companyId: input.companyId, firstVisitYear: null }, data: { firstVisitYear: year } });
    return drive;
  });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "placement.drive.open", targetType: "Drive", targetId: d.id, meta: { kind: input.kind, companyId: input.companyId, pooled: input.poolSchoolIds.length } });
  return driveView(ctx, d.id);
}

const ORDER = new Map(DRIVE_STATUSES.map((s, i) => [s, i]));

/** The host cell edits a drive or moves it on; a closed drive changes no more, and a status never goes back. */
export async function updateDrive(ctx: ActiveContext, driveId: string, input: DriveUpdate): Promise<DriveView> {
  const cell = await cellOf(ctx);
  const d = await db.drive.findFirst({ where: { id: driveId, schoolId: cell.schoolId } });
  if (!d) throw new AccessError("placement.noSuchDrive", "NOT_FOUND");
  if (d.status === "CLOSED") throw new RuleRefusal("placement.refuseClosed", 409);
  const settings = await placementSettings(cell.schoolId);
  const merged = { kind: input.kind ?? (d.kind as DriveSave["kind"]), poolSchoolIds: input.poolSchoolIds ?? poolIdsOf(d), packageMinRupees: input.packageMinRupees ?? d.packageMinRupees, packageMaxRupees: input.packageMaxRupees ?? d.packageMaxRupees, rule: input.rule, rounds: input.rounds };
  await checkDriveInput(cell, merged, settings);
  if (input.rule && !["DRAFT", "OPEN"].includes(d.status)) throw new RuleRefusal("placement.refuseRuleAfterOpen", 409, undefined, "rule");
  if (input.status && (ORDER.get(input.status)! < ORDER.get(d.status as DriveStatus)!)) throw new RuleRefusal("placement.refuseStatusBack", 409, undefined, "status");
  // The company is what every applicant consented to share with: it is checked as openDrive checks
  // it, and once anyone has applied it does not change (campaign S-5).
  if (input.companyId && input.companyId !== d.companyId) {
    if (!(await db.company.findUnique({ where: { id: input.companyId }, select: { id: true } }))) throw new RuleRefusal("placement.refuseUnknownCompany", 422, undefined, "companyId");
    if (await db.driveApplication.findFirst({ where: { driveId }, select: { id: true } })) throw new RuleRefusal("placement.refuseCompanyChange", 409, undefined, "companyId");
  }
  const closing = input.status === "CLOSED";
  const data = {
    ...(input.companyId ? { companyId: input.companyId } : {}),
    ...(input.kind ? { kind: input.kind } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.jd !== undefined ? { jd: input.jd } : {}),
    ...(input.packageMinRupees !== undefined ? { packageMinRupees: input.packageMinRupees } : {}),
    ...(input.packageMaxRupees !== undefined ? { packageMaxRupees: input.packageMaxRupees } : {}),
    ...(input.bond !== undefined ? { bond: input.bond } : {}),
    ...(input.rounds ? { rounds: writeJson(input.rounds) } : {}),
    ...(input.schedule ? { schedule: writeJson(input.schedule) } : {}),
    ...(input.venues !== undefined ? { venues: input.venues } : {}),
    ...(input.rule ? { eligibilityRule: writeJson(input.rule) } : {}),
    ...(input.poolSchoolIds ? { poolSchoolIds: writeJson(input.poolSchoolIds) } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(closing ? { closedAt: new Date() } : {}),
  };
  // A save that changes nothing is a 200 no-op (W-10): Prisma answers an updateMany with no data
  // as zero rows without asking the database, which once read as somebody else's edit.
  if (Object.keys(data).length === 0) return driveView(ctx, driveId);
  const changed = await db.drive.updateMany({ where: { id: driveId, schoolId: cell.schoolId, status: d.status }, data });
  if (changed.count === 0) throw new RuleRefusal("placement.refuseChangedMeanwhile", 409);
  if (Object.keys(input).length > 0) await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: closing ? "placement.drive.close" : "placement.drive.update", targetType: "Drive", targetId: driveId, meta: { status: input.status ?? d.status, fields: Object.keys(input) } });
  return driveView(ctx, driveId);
}

/**
 * Tells the eligible students of the reader's college about a drive — the
 * host's for its own, a guest's cell for its own students of a pooled drive —
 * and nobody else. Students who already applied are not told again.
 */
export async function inviteEligible(ctx: ActiveContext, driveId: string): Promise<{ told: number; eligible: number }> {
  const cell = await cellOf(ctx);
  const d = await loadDrive(driveId);
  const seen = d ? seesDrive(d, cell.schoolId) : null;
  if (!d || !seen) throw new AccessError("placement.noSuchDrive", "NOT_FOUND");
  if (d.status !== "OPEN") throw new RuleRefusal("placement.refuseInviteNotOpen", 409);
  const rows = (await eligibilityAt(d, cell.schoolId)).filter((r) => r.eligible);
  const applied = new Set((await db.driveApplication.findMany({ where: { driveId, schoolId: cell.schoolId }, select: { studentMembershipId: true } })).map((a) => a.studentMembershipId));
  const toTell = rows.filter((r) => !applied.has(r.studentMembershipId));
  await Promise.all(toTell.map((r) => notify({ userId: r.userId, schoolId: cell.schoolId, kind: "SYSTEM", titleKey: "placement.notifInvited", titleVars: { company: d.company.name, title: d.title }, url: "/student/placement" }).catch((error) => console.error("[placement] invite notice failed", error))));
  if (seen === "HOST" && !d.invitedAt) await db.drive.updateMany({ where: { id: driveId, invitedAt: null }, data: { invitedAt: new Date() } });
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "placement.drive.invite", targetType: "Drive", targetId: driveId, meta: { told: toTell.length, eligible: rows.length } });
  return { told: toTell.length, eligible: rows.length };
}

/** A reminder to the drive's live applicants of the reader's college before the next dated round. */
export async function remindApplicants(ctx: ActiveContext, driveId: string): Promise<{ told: number; eligible: number }> {
  const cell = await cellOf(ctx);
  const d = await loadDrive(driveId);
  const seen = d ? seesDrive(d, cell.schoolId) : null;
  if (!d || !seen) throw new AccessError("placement.noSuchDrive", "NOT_FOUND");
  if (!(RECRUITER_LIVE_STATUSES as readonly string[]).includes(d.status)) throw new RuleRefusal("placement.refuseNotLive", 409);
  const next = nextAtOf(readRounds(d.rounds), readSchedule(d.schedule), new Date());
  const apps = await applicationViews(driveId, { schoolId: cell.schoolId });
  const live = apps.filter((a) => !["WITHDRAWN", "REJECTED"].includes(a.status));
  const users = await db.driveApplication.findMany({ where: { id: { in: live.map((a) => a.id) } }, select: { studentUserId: true } });
  await Promise.all(users.map((u) => notify({ userId: u.studentUserId, schoolId: cell.schoolId, kind: "SYSTEM", titleKey: next ? "placement.notifReminderAt" : "placement.notifReminder", titleVars: { title: d.title, at: next ? new Date(next).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) : "" }, url: "/student/placement" }).catch((error) => console.error("[placement] reminder failed", error))));
  await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: "placement.drive.remind", targetType: "Drive", targetId: driveId, meta: { told: users.length } });
  return { told: users.length, eligible: live.length };
}

/* -------------------------------------------------------------------------- */
/* Rounds and offers: the host cell, or the drive's bound recruiter            */
/* -------------------------------------------------------------------------- */

/** Who records a round or an offer: the host cell, or (placement-recruiter.ts) the bound recruiter, both resolved to the drive. */
export type DriveActor = { userId: string; drive: NonNullable<DriveRow>; via: "CELL" | "RECRUITER" };

export async function cellActor(ctx: ActiveContext, driveId: string): Promise<DriveActor> {
  const cell = await cellOf(ctx);
  const d = await loadDrive(driveId);
  if (!d || d.schoolId !== cell.schoolId) throw new AccessError("placement.noSuchDrive", "NOT_FOUND");
  return { userId: cell.userId, drive: d, via: "CELL" };
}

async function liveApplicants(driveId: string, ids: readonly string[]) {
  return db.driveApplication.findMany({ where: { driveId, studentMembershipId: { in: [...ids] }, consentAt: { not: null }, withdrawnAt: null }, select: { studentMembershipId: true, studentUserId: true, schoolId: true } });
}

/**
 * A round's outcomes. Round 0 is the shortlist; round n (n ≥ 1) takes only
 * candidates who passed round n − 1. Only consented, live applications.
 * Upserts: entering a round again corrects it. Each candidate is told their
 * outcome (and the feedback, when shared) by a push.
 */
export async function recordRoundResults(actor: DriveActor, input: RoundResultsSave): Promise<{ saved: number; told: number }> {
  const d = actor.drive;
  if (!(RECRUITER_LIVE_STATUSES as readonly string[]).includes(d.status)) throw new RuleRefusal("placement.refuseNotLive", 409);
  const rounds = readRounds(d.rounds);
  if (input.round > rounds.length) throw new RuleRefusal("placement.refuseNoSuchRound", 422, { round: input.round }, "round");
  const ids = input.results.map((r) => r.studentMembershipId);
  if (new Set(ids).size !== ids.length) throw new RuleRefusal("placement.refuseDuplicateCandidate", 422, undefined, "results");
  const apps = await liveApplicants(d.id, ids);
  const appOf = new Map(apps.map((a) => [a.studentMembershipId, a]));
  const stranger = ids.find((id) => !appOf.has(id));
  if (stranger) throw new RuleRefusal("placement.refuseNotApplicant", 422, undefined, "results");
  if (input.round > 0) {
    const passedBefore = new Set((await db.roundResult.findMany({ where: { driveId: d.id, round: input.round - 1, outcome: "PASSED", studentMembershipId: { in: ids } }, select: { studentMembershipId: true } })).map((r) => r.studentMembershipId));
    if (ids.some((id) => !passedBefore.has(id))) throw new RuleRefusal("placement.refuseNotThroughLastRound", 409, { round: input.round - 1 }, "results");
  }
  await forSchool(d.schoolId, () =>
    db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      for (const r of input.results) {
        await tx.roundResult.upsert({
          where: { driveId_round_studentMembershipId: { driveId: d.id, round: input.round, studentMembershipId: r.studentMembershipId } },
          update: { outcome: r.outcome, feedback: r.feedback, feedbackShared: r.feedbackShared, byUserId: actor.userId },
          create: { schoolId: d.schoolId, driveId: d.id, round: input.round, studentMembershipId: r.studentMembershipId, outcome: r.outcome, feedback: r.feedback, feedbackShared: r.feedbackShared, byUserId: actor.userId },
        });
      }
      // The drive moves on with its results: a shortlist puts it in SHORTLISTING, a round in ROUNDS.
      const next = input.round === 0 ? "SHORTLISTING" : "ROUNDS";
      if (ORDER.get(next as DriveStatus)! > ORDER.get(d.status as DriveStatus)!) await tx.drive.updateMany({ where: { id: d.id, status: d.status }, data: { status: next } });
    }),
  );
  let told = 0;
  for (const r of input.results) {
    const a = appOf.get(r.studentMembershipId)!;
    const key = r.outcome === "PASSED" ? (input.round === 0 ? "placement.notifShortlisted" : "placement.notifRoundPassed") : r.outcome === "ON_HOLD" ? "placement.notifOnHold" : "placement.notifNotThrough";
    await forSchool(a.schoolId, () => notify({ userId: a.studentUserId, schoolId: a.schoolId, kind: "SYSTEM", titleKey: key, titleVars: { company: d.company.name, title: d.title, round: input.round }, body: r.feedbackShared && r.feedback ? r.feedback : undefined, url: "/student/placement" }))
      .then(() => {
        told += 1;
      })
      .catch((error) => console.error("[placement] result notice failed", error));
  }
  await forSchool(d.schoolId, () => audit({ schoolId: d.schoolId, actorUserId: actor.userId, action: "placement.results", targetType: "Drive", targetId: d.id, meta: { round: input.round, count: input.results.length, via: actor.via } }));
  return { saved: input.results.length, told };
}

/** Spends an upload ticket of `userId`'s: the file is theirs, and its id cannot be named twice. */
export async function spendTicket(userId: string, fileId: string | null | undefined, field: string): Promise<string | null> {
  if (!fileId) return null;
  const spent = await db.uploadTicket.updateMany({ where: { fileId, userId, consumedAt: null }, data: { consumedAt: new Date() } });
  if (spent.count === 0) throw new RuleRefusal("placement.refuseTicket", 422, undefined, field);
  return fileId;
}

/**
 * An offer to a candidate who reached the end (or whom the company selects).
 * THE ONE-OFFER RULE: a candidate who has accepted another offer receives
 * this one only under the dream rule (the flag, and this package at least
 * the ratio times the accepted one), and the offer says so.
 */
export async function recordOffer(actor: DriveActor, input: { studentMembershipId: string; packageRupees: number; letterFileId: string | null }, opts: { storedFileId?: string | null } = {}): Promise<OfferView> {
  const d = actor.drive;
  if (!(RECRUITER_LIVE_STATUSES as readonly string[]).includes(d.status)) throw new RuleRefusal("placement.refuseNotLive", 409);
  // The package is the schema's (offerSaveSchema) whichever door calls: never negative, never absurd (S-19).
  if (!Number.isInteger(input.packageRupees) || input.packageRupees < 0 || input.packageRupees > 1_000_000_000) throw new RuleRefusal("placement.refusePackage", 422, undefined, "packageRupees");
  const [app] = await liveApplicants(d.id, [input.studentMembershipId]);
  if (!app) throw new RuleRefusal("placement.refuseNotApplicant", 422, undefined, "studentMembershipId");
  const rejected = await db.roundResult.findFirst({ where: { driveId: d.id, studentMembershipId: input.studentMembershipId, outcome: { in: ["REJECTED", "ABSENT"] } }, select: { id: true } });
  if (rejected) throw new RuleRefusal("placement.refuseOfferRejected", 409);
  // The rule's facts are the student's own college's (every offer they accepted anywhere, the dream
  // flag its cell granted), read under that college's binding: a recruiter sees none of another
  // company's offers, and the host of a pooled drive none of its guest's.
  const { settings, accepted, profile } = await forSchool(app.schoolId, async () => ({
    settings: await placementSettings(app.schoolId),
    accepted: (await acceptedOffers([input.studentMembershipId])).get(input.studentMembershipId) ?? null,
    profile: await db.placementProfile.findUnique({ where: { studentMembershipId: input.studentMembershipId }, select: { dreamFlag: true } }),
  }));
  let dream = false;
  if (accepted !== null) {
    if (!profile?.dreamFlag || input.packageRupees < Math.ceil(accepted * settings.dreamRatio)) throw new RuleRefusal("placement.refuseOneOffer", 409);
    dream = true;
  }
  // From the phone, an upload ticket of the actor's, spent here; from the web page, a file its own action has just stored.
  const letterFileId = opts.storedFileId ?? (await spendTicket(actor.userId, input.letterFileId, "letterFileId"));
  const existing = await db.offer.findUnique({ where: { driveId_studentMembershipId: { driveId: d.id, studentMembershipId: input.studentMembershipId } }, select: { id: true, acceptedAt: true } });
  if (existing?.acceptedAt) throw new RuleRefusal("placement.refuseOfferAnswered", 409);
  const offer = await forSchool(d.schoolId, () =>
    db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      const o = await tx.offer.upsert({
        where: { driveId_studentMembershipId: { driveId: d.id, studentMembershipId: input.studentMembershipId } },
        update: { packageRupees: input.packageRupees, ...(letterFileId ? { letterFileId } : {}), dreamException: dream, declinedAt: null, byUserId: actor.userId },
        create: { schoolId: d.schoolId, driveId: d.id, studentMembershipId: input.studentMembershipId, packageRupees: input.packageRupees, letterFileId, dreamException: dream, byUserId: actor.userId },
        select: OFFER_SELECT,
      });
      if (ORDER.get("OFFERS")! > ORDER.get(d.status as DriveStatus)!) await tx.drive.updateMany({ where: { id: d.id, status: d.status }, data: { status: "OFFERS" } });
      return o;
    }),
  );
  await forSchool(app.schoolId, () => notify({ userId: app.studentUserId, schoolId: app.schoolId, kind: "SYSTEM", titleKey: "placement.notifOffer", titleVars: { company: d.company.name, title: d.title }, url: "/student/placement" })).catch((error) => console.error("[placement] offer notice failed", error));
  await forSchool(d.schoolId, () => audit({ schoolId: d.schoolId, actorUserId: actor.userId, action: "placement.offer", targetType: "Offer", targetId: offer.id, meta: { driveId: d.id, packageRupees: input.packageRupees, dream, letter: Boolean(letterFileId), via: actor.via } }));
  return (await offerViews([offer]))[0]!;
}

export async function recordJoined(actor: DriveActor, offerId: string, joinedOn: string): Promise<OfferView> {
  const d = actor.drive;
  const o = await db.offer.findFirst({ where: { id: offerId, driveId: d.id }, select: OFFER_SELECT });
  if (!o) throw new AccessError("placement.noSuchOffer", "NOT_FOUND");
  if (!o.acceptedAt) throw new RuleRefusal("placement.refuseJoinNotAccepted", 409);
  const at = new Date(`${joinedOn}T00:00:00Z`);
  const row = await forSchool(d.schoolId, () => db.offer.update({ where: { id: offerId }, data: { joinedAt: at }, select: OFFER_SELECT }));
  await forSchool(d.schoolId, () => audit({ schoolId: d.schoolId, actorUserId: actor.userId, action: "placement.offer.joined", targetType: "Offer", targetId: offerId, meta: { joinedOn, via: actor.via } }));
  return (await offerViews([row]))[0]!;
}

/** The offer a cell may act on: one of its own drives'. */
export async function cellActorForOffer(ctx: ActiveContext, offerId: string): Promise<DriveActor> {
  const o = await db.offer.findUnique({ where: { id: offerId }, select: { driveId: true } });
  if (!o) throw new AccessError("placement.noSuchOffer", "NOT_FOUND");
  return cellActor(ctx, o.driveId);
}

/* -------------------------------------------------------------------------- */
/* Students: the cell's list and the dream flag                                */
/* -------------------------------------------------------------------------- */

export async function listPlacementStudents(ctx: ActiveContext) {
  const cell = await cellOf(ctx, "read");
  const roll = await rollOf(cell.schoolId);
  const ids = roll.map((r) => r.id);
  const [records, profiles, offers] = await Promise.all([
    placementRecords(cell.schoolId, ids, todayKey(await zoneOf(cell.schoolId))),
    db.placementProfile.findMany({ where: { schoolId: cell.schoolId, studentMembershipId: { in: ids } } }),
    db.offer.findMany({ where: { studentMembershipId: { in: ids } }, select: { studentMembershipId: true, packageRupees: true, acceptedAt: true, declinedAt: true } }),
  ]);
  const profileOf = new Map(profiles.map((p) => [p.studentMembershipId, p]));
  return {
    canEdit: cell.canEdit,
    students: roll.map((s) => {
      const p = profileOf.get(s.id);
      const mine = offers.filter((o) => o.studentMembershipId === s.id);
      const accepted = mine.filter((o) => o.acceptedAt && !o.declinedAt).map((o) => o.packageRupees);
      return {
        studentMembershipId: s.id,
        name: s.name,
        record: records.get(s.id) ?? EMPTY_RECORD,
        optedOut: p?.optedOut ?? false,
        dreamFlag: p?.dreamFlag ?? false,
        higherStudies: p?.higherStudies ?? false,
        entrepreneur: p?.entrepreneur ?? false,
        consentAt: p?.consentAt?.toISOString() ?? null,
        offers: mine.length,
        acceptedRupees: accepted.length ? Math.max(...accepted) : null,
      };
    }),
  };
}

/** The cell grants or withdraws a student's dream flag. Idempotent; audited when it changes. */
export async function setDreamFlag(ctx: ActiveContext, studentMembershipId: string, on: boolean) {
  const cell = await cellOf(ctx);
  const student = await db.membership.findFirst({ where: { id: studentMembershipId, schoolId: cell.schoolId, role: "STUDENT" }, select: { id: true } });
  if (!student) throw new AccessError("placement.noSuchStudent", "NOT_FOUND");
  const p = await db.placementProfile.upsert({ where: { studentMembershipId }, update: {}, create: { schoolId: cell.schoolId, studentMembershipId }, select: { dreamFlag: true } });
  if (p.dreamFlag !== on) {
    await db.placementProfile.update({ where: { studentMembershipId }, data: { dreamFlag: on, dreamByUserId: cell.userId } });
    await audit({ schoolId: cell.schoolId, actorUserId: cell.userId, action: on ? "placement.dream.on" : "placement.dream.off", targetType: "Membership", targetId: studentMembershipId });
  }
  return { changed: p.dreamFlag !== on };
}

/* -------------------------------------------------------------------------- */
/* The student                                                                 */
/* -------------------------------------------------------------------------- */

export function profileView(p: { skills: string; certifications: string; projects: string; optedOut: boolean; dreamFlag: boolean; higherStudies: boolean; entrepreneur: boolean; consentAt: Date | null } | null) {
  return {
    skills: readJson<string[]>(p?.skills, []),
    certifications: readJson<string[]>(p?.certifications, []),
    projects: readJson<{ title: string; note: string }[]>(p?.projects, []),
    optedOut: p?.optedOut ?? false,
    dreamFlag: p?.dreamFlag ?? false,
    higherStudies: p?.higherStudies ?? false,
    entrepreneur: p?.entrepreneur ?? false,
    consentAt: p?.consentAt?.toISOString() ?? null,
  };
}

/** The student writes their profile; the first save is their consent to the cell processing their record for the season. */
export async function saveMyProfile(ctx: ActiveContext, input: PlacementProfileSave) {
  const me = await studentOf(ctx);
  const data = { skills: writeJson(input.skills), certifications: writeJson(input.certifications), projects: writeJson(input.projects), optedOut: input.optedOut, higherStudies: input.higherStudies, entrepreneur: input.entrepreneur };
  const p = await db.placementProfile.upsert({ where: { studentMembershipId: me.membershipId }, update: data, create: { schoolId: me.schoolId, studentMembershipId: me.membershipId, ...data, consentAt: new Date() } });
  if (!p.consentAt) await db.placementProfile.update({ where: { id: p.id }, data: { consentAt: new Date() } });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "placement.profile", targetType: "PlacementProfile", targetId: p.id, meta: { optedOut: input.optedOut, higherStudies: input.higherStudies, entrepreneur: input.entrepreneur } });
  return profileView(await db.placementProfile.findUniqueOrThrow({ where: { id: p.id } }));
}

/**
 * Applying IS consenting: to share this profile and this record with this
 * drive's company, for this drive. Refused when the drive is not OPEN, when
 * the student is not eligible (every failed condition named, 409), and a
 * second time. The record is frozen on the application as what was shared.
 */
export async function applyToDrive(ctx: ActiveContext, driveId: string): Promise<DriveApplicationView> {
  const me = await studentOf(ctx);
  const d = await loadDrive(driveId);
  if (!d || !seesDrive(d, me.schoolId)) throw new AccessError("placement.noSuchDrive", "NOT_FOUND");
  if (d.status !== "OPEN") throw new RuleRefusal("placement.refuseNotOpen", 409);
  const [row] = await eligibilityAt(d, me.schoolId, [me.membershipId]);
  if (!row) throw new AccessError("access.wrongRoleForThisAction");
  if (!row.eligible) throw new RuleRefusal("placement.refuseNotEligible", 409, { why: row.failed.map((f) => f.code).join(", ") });
  const school = await db.school.findUniqueOrThrow({ where: { id: me.schoolId }, select: { name: true } });
  const existing = await db.driveApplication.findUnique({ where: { driveId_studentMembershipId: { driveId, studentMembershipId: me.membershipId } }, select: { id: true, withdrawnAt: true } });
  if (existing && !existing.withdrawnAt) throw new RuleRefusal("placement.refuseApplied", 409);
  const now = new Date();
  // A MINOR's applying is not yet consent to share (campaign S-6): the application waits with no
  // consentAt — which every recruiter clause and door requires — until a guardian consents
  // (guardianConsentToApplication), as a minor's paid seat waits in PENDING_CONSENT.
  const who = await db.membership.findUniqueOrThrow({ where: { id: me.membershipId }, select: { user: { select: { birthdate: true, isMinor: true } }, school: { select: { timezone: true } } } });
  const minor = isMinorToday(who.user, who.school.timezone, now);
  const consentAt = minor ? null : now;
  const app = existing
    ? await db.driveApplication.update({ where: { id: existing.id }, data: { withdrawnAt: null, consentAt, appliedAt: now, recordJson: writeJson(sharedRecord(row.record)) }, select: { id: true } })
    : await db.driveApplication.create({ data: { schoolId: me.schoolId, driveId, studentMembershipId: me.membershipId, studentUserId: me.userId, schoolName: school.name, consentAt, recordJson: writeJson(sharedRecord(row.record)) }, select: { id: true } });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "placement.apply", targetType: "DriveApplication", targetId: app.id, meta: { driveId, consent: !minor, guardianConsent: minor ? "pending" : null } });
  if (minor) {
    await notifyGuardians(me.membershipId, (name) => ({ schoolId: me.schoolId, kind: "SYSTEM", titleKey: "placement.notifGuardianConsentAsk", titleVars: { name, drive: d.title }, url: `/parent/placement?child=${me.membershipId}` })).catch((error) => console.error("[placement] consent notice failed", error));
  }
  return (await applicationViews(driveId, { schoolId: me.schoolId })).find((a) => a.id === app.id)!;
}

/** Withdrawing ends the consent: the company reads the application no more (the policy says so too). Refused once an offer is made. */
export async function withdrawApplication(ctx: ActiveContext, driveId: string): Promise<DriveApplicationView> {
  const me = await studentOf(ctx);
  const app = await db.driveApplication.findUnique({ where: { driveId_studentMembershipId: { driveId, studentMembershipId: me.membershipId } }, select: { id: true, withdrawnAt: true } });
  if (!app) throw new AccessError("placement.noSuchApplication", "NOT_FOUND");
  const offer = await db.offer.findUnique({ where: { driveId_studentMembershipId: { driveId, studentMembershipId: me.membershipId } }, select: { id: true } });
  if (offer) throw new RuleRefusal("placement.refuseWithdrawOffered", 409);
  if (!app.withdrawnAt) {
    await db.driveApplication.update({ where: { id: app.id }, data: { withdrawnAt: new Date() } });
    await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "placement.withdraw", targetType: "DriveApplication", targetId: app.id, meta: { driveId } });
  }
  return (await applicationViews(driveId, { schoolId: me.schoolId })).find((a) => a.id === app.id)!;
}

/**
 * The student answers an offer. Accepting a second offer is allowed only for
 * one made under the dream rule, and declines the earlier acceptance. The
 * offer is the host's row: a pooled drive's guest's answer is written under
 * the host's binding once the offer is found to be theirs.
 */
export async function answerOffer(ctx: ActiveContext, offerId: string, accept: boolean): Promise<OfferView> {
  const me = await studentOf(ctx);
  const o = await db.offer.findFirst({ where: { id: offerId, studentMembershipId: me.membershipId }, select: { ...OFFER_SELECT, schoolId: true } });
  if (!o) throw new AccessError("placement.noSuchOffer", "NOT_FOUND");
  if (o.acceptedAt || o.declinedAt) throw new RuleRefusal("placement.refuseOfferAnswered", 409);
  const now = new Date();
  if (accept) {
    const earlier = await db.offer.findMany({ where: { studentMembershipId: me.membershipId, acceptedAt: { not: null }, declinedAt: null, id: { not: offerId } }, select: { id: true, schoolId: true } });
    if (earlier.length > 0 && !o.dreamException) throw new RuleRefusal("placement.refuseOneOffer", 409);
    for (const e of earlier) await forSchool(e.schoolId, () => db.offer.update({ where: { id: e.id }, data: { declinedAt: now } }));
  }
  const row = await forSchool(o.schoolId, () => db.offer.update({ where: { id: offerId }, data: accept ? { acceptedAt: now } : { declinedAt: now }, select: OFFER_SELECT }));
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: accept ? "placement.offer.accept" : "placement.offer.decline", targetType: "Offer", targetId: offerId, meta: { driveId: o.driveId } });
  return (await offerViews([row]))[0]!;
}

/** The drives a student sees — their college's and the pooled ones it is a guest of, past their draft — each with eligibility and their application. */
export async function studentDrives(me: { schoolId: string; membershipId: string }) {
  const rows = (await visibleDrives(me.schoolId)).filter((d) => d.status !== "DRAFT");
  const list = await summaries(rows, me.schoolId);
  const out = [];
  for (const d of rows) {
    const [e] = await eligibilityAt(d, me.schoolId, [me.membershipId]);
    const app = (await applicationViews(d.id, { schoolId: me.schoolId, sharedFeedbackOnly: true })).find((a) => a.studentMembershipId === me.membershipId) ?? null;
    out.push({
      drive: { ...list.find((s) => s.id === d.id)!, jd: d.jd, bond: d.bond, venues: d.venues, rounds: readRounds(d.rounds), schedule: readSchedule(d.schedule) },
      eligible: e?.eligible ?? false,
      failed: e?.failed ?? [],
      application: app,
    });
  }
  return out;
}

export async function myOffers(studentMembershipId: string): Promise<OfferView[]> {
  return offerViews(await db.offer.findMany({ where: { studentMembershipId }, orderBy: { createdAt: "desc" }, select: OFFER_SELECT }));
}

/** Whether a college has PLACEMENT on and is a college at all (the alumnus's and the parent's pages ask). */
export async function placementOn(schoolId: string | null | undefined): Promise<boolean> {
  if (!schoolId) return false;
  return isCollegeKind(await institutionKindOf(schoolId)) && (await isModuleOn(schoolId, "PLACEMENT"));
}
