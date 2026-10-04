import "server-only";
import { RECRUITER_LIVE_STATUSES, type CompanySave, type RecruiterDrive, type RequirementSave } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { assertModuleOn, isModuleOn } from "./modules";
import { forSchool } from "./tenant-context";
import { readJson, writeJson } from "./json";
import { toCsvValue } from "./csv";
import { applicationViews, companyViews, eligibilityAt, nameOf, placementColleges, poolIdsOf, readRounds, readSchedule, requirementViews, type DriveActor } from "./placement";
import { renderResumePdf } from "./placement-pdf";
import { normaliseLocale } from "./i18n/locales";
import type { ActiveContext } from "./session";

/**
 * THE RECRUITER'S SIDE OF PLACEMENT (4 October 2026). A recruiter is an
 * outside account (src/lib/recruiters.ts) bound to a company
 * (CompanyRecruiter); it reaches a college ONLY through a drive of that
 * company, and only while the drive is OPEN, SHORTLISTING, ROUNDS or OFFERS:
 *
 *   - before a visit, the drive's eligible count — computed under the
 *     college's own binding, of which only the number leaves;
 *   - the applicants, and only those who consented by applying and did not
 *     withdraw (no name before consent), with the record they consented to;
 *   - shortlists, round results and offers it records itself — written under
 *     the drive's college's binding once this file has found the drive live
 *     and the recruiter bound to its company;
 *   - downloads (the applicant sheet, a resume) watermarked with the
 *     recruiter's name and company and the time, each audited in the
 *     college's log;
 *   - NOTHING once the drive is CLOSED: every door here answers 404, and the
 *     database's policy (RECRUITER_READABLE, in PLACEMENT_READABLE in
 *     scripts/gen-rls.ts) stops returning the rows.
 *
 * Every read is keyed on the session's own user id. The recruiter pays
 * nothing in this version.
 */

type Recruiter = { userId: string; name: string; companyIds: string[] };

export async function recruiterOf(ctx: ActiveContext): Promise<Recruiter> {
  if (ctx.role !== "RECRUITER") throw new AccessError("access.wrongRoleForThisAction");
  const profile = await db.recruiterProfile.findUnique({ where: { userId: ctx.user.id }, select: { disabledAt: true } });
  if (!profile || profile.disabledAt) throw new AccessError("recruiter.refuseDisabled");
  const bindings = await db.companyRecruiter.findMany({ where: { userId: ctx.user.id, removedAt: null }, select: { companyId: true } });
  return { userId: ctx.user.id, name: ctx.user.name, companyIds: bindings.map((b) => b.companyId) };
}

export async function recruiterCompany(ctx: ActiveContext) {
  const me = await recruiterOf(ctx);
  const companyId = me.companyIds[0];
  if (!companyId) return { company: null, colleagues: [] };
  const [company] = await companyViews(null, { ids: [companyId] });
  const colleagues = await db.companyRecruiter.findMany({ where: { companyId, removedAt: null, userId: { not: me.userId } }, select: { user: { select: { name: true, preferredName: true, email: true } } } });
  return { company: company ?? null, colleagues: colleagues.map((c) => ({ name: nameOf(c.user), email: c.user.email })) };
}

/**
 * A recruiter registers its company: the GSTIN or CIN is checked for its
 * form (contracts) and never looked up. One company per recruiter account;
 * a company already on the platform is refused (a colleague bound to it adds
 * this account instead), so nobody binds themselves to somebody else's.
 */
export async function registerCompany(ctx: ActiveContext, input: CompanySave) {
  const me = await recruiterOf(ctx);
  if (me.companyIds.length > 0) throw new RuleRefusal("placement.refuseHaveCompany", 409);
  const taken = await db.company.findUnique({ where: { identifier: input.identifier }, select: { id: true } });
  if (taken) throw new RuleRefusal("placement.refuseCompanyTaken", 409, undefined, "identifier");
  const company = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const c = await tx.company.create({ data: { name: input.name, identifier: input.identifier, sectors: writeJson(input.sectors), pointOfContact: input.pointOfContact, createdByUserId: me.userId }, select: { id: true } });
    await tx.companyRecruiter.create({ data: { companyId: c.id, userId: me.userId } });
    return c;
  });
  await audit({ schoolId: null, actorUserId: me.userId, action: "placement.company.register", targetType: "Company", targetId: company.id, meta: { identifier: input.identifier } });
  return recruiterCompany(ctx);
}

/** A bound recruiter adds a colleague: another RECRUITER account, by its address. Idempotent. */
export async function addColleague(ctx: ActiveContext, email: string) {
  const me = await recruiterOf(ctx);
  const companyId = me.companyIds[0];
  if (!companyId) throw new RuleRefusal("placement.refuseNoCompany", 409);
  const other = await db.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true, recruiterProfile: { select: { disabledAt: true } } } });
  if (!other || !other.recruiterProfile || other.recruiterProfile.disabledAt) throw new RuleRefusal("placement.refuseNotRecruiter", 422, undefined, "email");
  await db.companyRecruiter.upsert({ where: { companyId_userId: { companyId, userId: other.id } }, update: { removedAt: null }, create: { companyId, userId: other.id } });
  await audit({ schoolId: null, actorUserId: me.userId, action: "placement.company.colleague", targetType: "Company", targetId: companyId, meta: { added: other.id } });
  return recruiterCompany(ctx);
}

/** The placement directory: colleges with PLACEMENT on, names and towns only. */
export async function recruiterColleges(ctx: ActiveContext) {
  await recruiterOf(ctx);
  return { colleges: await placementColleges() };
}

/** A requirement to one college or several, each a college with PLACEMENT on; each college's cell is told. */
export async function postRequirement(ctx: ActiveContext, input: RequirementSave) {
  const me = await recruiterOf(ctx);
  const companyId = me.companyIds[0];
  if (!companyId) throw new RuleRefusal("placement.refuseNoCompany", 409);
  const allowed = new Set((await placementColleges()).map((c) => c.id));
  const targets = [...new Set(input.targetSchoolIds)];
  if (targets.some((id) => !allowed.has(id))) throw new RuleRefusal("placement.refuseTargetCollege", 422, undefined, "targetSchoolIds");
  const company = await db.company.findUniqueOrThrow({ where: { id: companyId }, select: { name: true } });
  const r = await db.requirement.create({
    data: { companyId, byUserId: me.userId, role: input.role, packageRupees: input.packageRupees, bond: input.bond, locations: input.locations, eligibilityAsked: writeJson(input.eligibilityAsked), rounds: writeJson(input.rounds), datesProposed: input.datesProposed, targetSchoolIds: writeJson(targets) },
  });
  for (const schoolId of targets) {
    await forSchool(schoolId, async () => {
      const tpos = await db.membership.findMany({ where: { schoolId, role: "TPO", status: "ACTIVE", leftAt: null }, select: { userId: true } });
      await Promise.all(tpos.map((p) => notify({ userId: p.userId, schoolId, kind: "SYSTEM", titleKey: "placement.notifRequirement", titleVars: { company: company.name, role: input.role }, url: "/placement/companies" })));
      await audit({ schoolId, actorUserId: me.userId, action: "placement.requirement", targetType: "Requirement", targetId: r.id, meta: { companyId } });
    }).catch((error) => console.error("[placement] requirement notice failed", error));
  }
  return (await requirementViews([r], null))[0]!;
}

export async function myRequirements(ctx: ActiveContext) {
  const me = await recruiterOf(ctx);
  const rows = me.companyIds.length ? await db.requirement.findMany({ where: { companyId: { in: me.companyIds }, withdrawnAt: null }, orderBy: { createdAt: "desc" }, take: 200 }) : [];
  return { requirements: await requirementViews(rows, null) };
}

/** A drive of one of the recruiter's companies that is live, at a college that has PLACEMENT on — or a 404. */
async function boundDrive(me: Recruiter, driveId: string) {
  const d = await db.drive.findFirst({
    where: { id: driveId, companyId: { in: me.companyIds }, status: { in: [...RECRUITER_LIVE_STATUSES] } },
    include: { company: { select: { name: true, verifiedAt: true, sectors: true } }, school: { select: { name: true } } },
  });
  if (!d) throw new AccessError("placement.noSuchDrive", "NOT_FOUND");
  await assertModuleOn(d.schoolId, "PLACEMENT");
  return d;
}

/** The drive's eligible count: the host's students and, for a pooled drive, each guest's — each computed under that college's binding; only the number leaves. */
async function eligibleCount(d: { id: string; schoolId: string; kind: string; eligibilityRule: string; packageMaxRupees: number; poolSchoolIds: string }): Promise<number> {
  const colleges = [d.schoolId, ...(d.kind === "POOLED" ? poolIdsOf(d) : [])];
  let n = 0;
  for (const schoolId of colleges) {
    if (!(await isModuleOn(schoolId, "PLACEMENT"))) continue;
    n += await forSchool(schoolId, async () => (await eligibilityAt(d, schoolId)).filter((r) => r.eligible).length);
  }
  return n;
}

function driveHead(d: Awaited<ReturnType<typeof boundDrive>>) {
  return {
    id: d.id,
    title: d.title,
    status: d.status as RecruiterDrive["status"],
    kind: d.kind as RecruiterDrive["kind"],
    collegeName: d.school.name,
    packageMinRupees: d.packageMinRupees,
    packageMaxRupees: d.packageMaxRupees,
    rounds: readRounds(d.rounds),
    schedule: readSchedule(d.schedule),
    venues: d.venues,
    recruiterRating: d.recruiterRating,
    recruiterFeedback: d.recruiterFeedback,
  };
}

export async function recruiterDrives(ctx: ActiveContext) {
  const me = await recruiterOf(ctx);
  const company = me.companyIds[0] ? ((await companyViews(null, { ids: [me.companyIds[0]] }))[0] ?? null) : null;
  if (me.companyIds.length === 0) return { drives: [], company };
  const rows = await db.drive.findMany({
    where: { companyId: { in: me.companyIds }, status: { in: [...RECRUITER_LIVE_STATUSES] } },
    include: { company: { select: { name: true, verifiedAt: true, sectors: true } }, school: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  const out = [];
  for (const d of rows) {
    if (!(await isModuleOn(d.schoolId, "PLACEMENT"))) continue;
    const applicantCount = await db.driveApplication.count({ where: { driveId: d.id, consentAt: { not: null }, withdrawnAt: null } });
    out.push({ ...driveHead(d), eligibleCount: await eligibleCount(d), applicantCount });
  }
  return { drives: out, company };
}

export async function recruiterDrive(ctx: ActiveContext, driveId: string): Promise<RecruiterDrive> {
  const me = await recruiterOf(ctx);
  const d = await boundDrive(me, driveId);
  return { ...driveHead(d), eligibleCount: await eligibleCount(d), applicants: await applicationViews(d.id, { consentedOnly: true }) };
}

/** The recruiter as the actor of a round or an offer on a drive it is bound to. */
export async function recruiterActor(ctx: ActiveContext, driveId: string): Promise<DriveActor> {
  const me = await recruiterOf(ctx);
  const d = await boundDrive(me, driveId);
  return { userId: me.userId, drive: d, via: "RECRUITER" };
}

export async function recruiterActorForOffer(ctx: ActiveContext, offerId: string): Promise<DriveActor> {
  const me = await recruiterOf(ctx);
  const o = await db.offer.findUnique({ where: { id: offerId }, select: { driveId: true } });
  if (!o) throw new AccessError("placement.noSuchOffer", "NOT_FOUND");
  const d = await boundDrive(me, o.driveId);
  return { userId: me.userId, drive: d, via: "RECRUITER" };
}

/** "For <name> (<company>) · <time> · this drive only", the line every download carries. */
function watermarkFor(me: Recruiter, company: string, title: string, now: Date): string {
  return `${me.name} · ${company} · ${now.toISOString().replace("T", " ").slice(0, 16)} UTC · ${title}`;
}

/** The consented applicants as a sheet, watermarked in its first line, the download audited in the college's log. */
export async function recruiterExport(ctx: ActiveContext, driveId: string): Promise<{ filename: string; csv: string }> {
  const me = await recruiterOf(ctx);
  const d = await boundDrive(me, driveId);
  const apps = await applicationViews(d.id, { consentedOnly: true });
  const now = new Date();
  const mark = watermarkFor(me, d.company.name, d.title, now);
  const lines = [
    `# ${mark}`,
    ["name", "college", "programme", "batch", "cgpa", "live_backlogs", "attendance_pct", "skills", "status", "round"].map(toCsvValue).join(","),
    ...apps.map((a) => [a.studentName, a.schoolName, a.record.programmeName ?? "", a.record.batchYear ?? "", a.record.cgpa ?? "", a.record.liveBacklogs ?? "", a.record.attendancePct ?? "", a.skills.join("; "), a.status, a.round ?? ""].map((v) => toCsvValue(String(v))).join(",")),
  ];
  await forSchool(d.schoolId, () => audit({ schoolId: d.schoolId, actorUserId: me.userId, action: "placement.recruiter.export", targetType: "Drive", targetId: d.id, meta: { rows: apps.length, watermark: mark } }));
  return { filename: `applicants-${d.id}.csv`, csv: `${lines.join("\n")}\n` };
}

/** One consented applicant's resume, rendered from the record they consented to share, watermarked, audited. */
export async function recruiterResume(ctx: ActiveContext, driveId: string, studentMembershipId: string): Promise<{ filename: string; pdf: Buffer }> {
  const me = await recruiterOf(ctx);
  const d = await boundDrive(me, driveId);
  const app = (await applicationViews(d.id, { consentedOnly: true })).find((a) => a.studentMembershipId === studentMembershipId);
  if (!app) throw new AccessError("placement.noSuchApplication", "NOT_FOUND");
  const profile = await db.placementProfile.findUnique({ where: { studentMembershipId }, select: { certifications: true, projects: true } });
  const mark = watermarkFor(me, d.company.name, d.title, new Date());
  const pdf = await renderResumePdf({
    locale: normaliseLocale(ctx.user.prefs.locale),
    name: app.studentName,
    collegeName: app.schoolName,
    record: app.record,
    skills: app.skills,
    certifications: readJson<string[]>(profile?.certifications, []),
    projects: readJson<{ title: string; note: string }[]>(profile?.projects, []),
    internships: [],
    watermark: mark,
  });
  await forSchool(d.schoolId, () => audit({ schoolId: d.schoolId, actorUserId: me.userId, action: "placement.recruiter.resume", targetType: "DriveApplication", targetId: app.id, meta: { driveId: d.id, watermark: mark } }));
  return { filename: `resume-${studentMembershipId}.pdf`, pdf };
}

/** The recruiter's word on the college's preparation and a rating of the drive, kept on the drive for the cell. */
export async function recruiterFeedback(ctx: ActiveContext, driveId: string, input: { rating: number; feedback: string }) {
  const me = await recruiterOf(ctx);
  const d = await boundDrive(me, driveId);
  await forSchool(d.schoolId, () => db.drive.update({ where: { id: d.id }, data: { recruiterRating: input.rating, recruiterFeedback: input.feedback || null } }));
  await forSchool(d.schoolId, () => audit({ schoolId: d.schoolId, actorUserId: me.userId, action: "placement.recruiter.feedback", targetType: "Drive", targetId: d.id, meta: { rating: input.rating } }));
  return recruiterDrive(ctx, driveId);
}
