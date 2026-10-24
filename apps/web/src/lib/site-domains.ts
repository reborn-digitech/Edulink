import "server-only";
import type { Prisma } from "@prisma/client";
import type { SiteCertError, SiteCertStatus, SiteDnsError, SiteDomain, SiteDomainStatus, SiteDomainView } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { assertModuleOn } from "./modules";
import { publishedSiteFor } from "./site-publish";
import { forgetSiteHosts } from "./site-hosts";
import { appHosts, flyConfig, processSiteEnv, siteApexIp, sitesTarget } from "./site-env";
import { canonicalDomain, counterpartOf, type DomainRefusal } from "./site-host-match";
import { checkDns, dnsRecordsFor, servedHosts, storedDomainFor, type DnsOutcome } from "./site-dns";
import { certificateState, removeCertificate, requestCertificate, type CertState, type FlyConfig } from "./fly-certs";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * A SCHOOL'S OWN DOMAIN FOR ITS PUBLIC WEBSITE (the WEBSITE module, website-builder B, 15 October 2026). The one
 * writer of SchoolSiteDomain; the office and the head reach it from /admin/website/domain and four doors under
 * /api/v1/admin/site/domain, the job site:domains every ten minutes.
 *
 * THE STATE MACHINE (advanceDomain), run by Verify and by the job:
 *
 *   PENDING_DNS --Verify, DNS right--> VERIFYING --certificate issued--> LIVE
 *        ^                                 |  \--certificate refused--> FAILED --Verify--> (again)
 *        +-------- DNS not (or no longer) right
 *
 * A DNS failure keeps (or puts back) the domain at PENDING_DNS with the code and the host on the row; DNS takes up
 * to a day to reach every resolver, so it is a wait, not a failure. With DNS right, a certificate is asked of the
 * hosting platform for every host the domain is served on (src/lib/fly-certs.ts) and the domain is VERIFYING until
 * Fly says ISSUED for all of them; then it is LIVE and the middleware serves the published site there. With no
 * platform configured (FLY_API_TOKEN, FLY_SITES_APP unset — development), no certificate is asked, certStatus is
 * NONE with NOT_CONFIGURED, and the domain goes LIVE when the DNS is right, except in production, where a domain
 * with no certificate would be a broken https address: there it stays VERIFYING until the platform is configured.
 * A platform that does not answer is FLY_ERROR, retried; one that refuses the certificate is FAILED, until Verify.
 *
 * One domain per school: saving another replaces it (its certificate removed); a domain, or its www/bare
 * counterpart, held by another school is refused. Every change is audited; the job's under no actor.
 */

export type DomainRow = {
  id: string;
  schoolId: string;
  domain: string;
  status: string;
  dnsCheckedAt: Date | null;
  dnsError: string | null;
  certStatus: string;
  certCheckedAt: Date | null;
  certError: string | null;
  createdAt: Date;
  verifiedAt: Date | null;
};

const ROW = { id: true, schoolId: true, domain: true, status: true, dnsCheckedAt: true, dnsError: true, certStatus: true, certCheckedAt: true, certError: true, createdAt: true, verifiedAt: true } as const;

/** What the state machine needs from the world; tests hand in their own. */
export type DomainDeps = {
  now: Date;
  /** The DNS check for one stored domain. */
  dns: (domain: string) => Promise<DnsOutcome>;
  /** Fly, or null where certificates are not issued (development). */
  fly: FlyConfig | null;
  /** Fly's fetch, for a test's fake. */
  fetchImpl?: (input: string, init: RequestInit) => Promise<Response>;
  /** In production a domain never goes LIVE without a certificate. */
  production: boolean;
  apexIp: string | null;
};

/** The live world: node's resolver, Fly from the environment. */
export function liveDeps(now: Date = new Date()): DomainDeps {
  const env = processSiteEnv();
  const apexIp = siteApexIp(env);
  const target = sitesTarget(env);
  return { now, dns: (domain) => checkDns(domain, { target, apexIp }), fly: flyConfig(env), production: env.NODE_ENV === "production", apexIp };
}

/** The fields a step changes. */
export type DomainPatch = {
  status: SiteDomainStatus;
  dnsCheckedAt?: Date;
  dnsError?: string | null;
  certStatus?: SiteCertStatus;
  certCheckedAt?: Date;
  certError?: string | null;
  verifiedAt?: Date | null;
};

const json = (value: SiteDnsError | SiteCertError) => JSON.stringify(value);

function worstCert(states: CertState[]): CertState {
  if (states.includes("FAILED")) return "FAILED";
  return states.every((s) => s === "ISSUED") ? "ISSUED" : "REQUESTED";
}

/**
 * ONE STEP OF THE STATE MACHINE for a domain row: check its DNS, then its certificate, and say what changes. Never
 * throws for a DNS or platform failure; those are the row's words.
 */
export async function advanceDomain(row: Pick<DomainRow, "domain" | "status" | "certStatus" | "verifiedAt">, deps: DomainDeps): Promise<DomainPatch> {
  const { now } = deps;
  const dns = await deps.dns(row.domain);
  if (!dns.ok) return { status: "PENDING_DNS", dnsCheckedAt: now, dnsError: json(dns.failure), verifiedAt: null };
  const base = { dnsCheckedAt: now, dnsError: null } as const;

  if (!deps.fly) {
    const certError = json({ code: "NOT_CONFIGURED" });
    if (deps.production) return { ...base, status: "VERIFYING", certStatus: "NONE", certCheckedAt: now, certError };
    return { ...base, status: "LIVE", certStatus: "NONE", certCheckedAt: now, certError, verifiedAt: row.verifiedAt ?? now };
  }

  const hosts = servedHosts(row.domain, deps.apexIp);
  // Ask for every host's certificate when none is asked yet or the last was refused.
  if (row.certStatus === "NONE" || row.certStatus === "FAILED") {
    for (const host of hosts) {
      const asked = await requestCertificate(deps.fly, host, deps.fetchImpl);
      if (!asked.ok) return { ...base, status: "VERIFYING", certStatus: "NONE", certCheckedAt: now, certError: json({ code: "FLY_ERROR", host }) };
    }
  }
  const states: CertState[] = [];
  for (const host of hosts) {
    const state = await certificateState(deps.fly, host, deps.fetchImpl);
    if (!state.ok) return { ...base, status: "VERIFYING", certStatus: "REQUESTED", certCheckedAt: now, certError: json({ code: "FLY_ERROR", host }) };
    states.push(state.value);
  }
  const cert = worstCert(states);
  if (cert === "ISSUED") return { ...base, status: "LIVE", certStatus: "ISSUED", certCheckedAt: now, certError: null, verifiedAt: row.verifiedAt ?? now };
  if (cert === "FAILED") return { ...base, status: "FAILED", certStatus: "FAILED", certCheckedAt: now, certError: json({ code: "CERT_FAILED", host: hosts[states.indexOf("FAILED")] }), verifiedAt: null };
  return { ...base, status: "VERIFYING", certStatus: "REQUESTED", certCheckedAt: now, certError: null };
}

/* -------------------------------------------------------------------------- */
/* The office's and the head's                                                 */
/* -------------------------------------------------------------------------- */

function office(ctx: ActiveContext): { schoolId: string; userId: string } {
  if (!ctx.schoolId || (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL")) throw new AccessError("siteDomains.refuseRole");
  return { schoolId: ctx.schoolId, userId: ctx.user.id };
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** The row as the page and the doors show it. */
export function domainOut(row: DomainRow, env = processSiteEnv()): SiteDomain {
  const apexIp = siteApexIp(env);
  return {
    domain: row.domain,
    status: row.status as SiteDomainStatus,
    certStatus: row.certStatus as SiteCertStatus,
    dnsCheckedAt: row.dnsCheckedAt?.toISOString() ?? null,
    dnsError: parseJson<SiteDnsError>(row.dnsError),
    certCheckedAt: row.certCheckedAt?.toISOString() ?? null,
    certError: parseJson<SiteCertError>(row.certError),
    createdAt: row.createdAt.toISOString(),
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    records: dnsRecordsFor(row.domain, sitesTarget(env), apexIp),
    hosts: servedHosts(row.domain, apexIp),
  };
}

async function currentRow(schoolId: string): Promise<DomainRow | null> {
  return db.schoolSiteDomain.findFirst({ where: { schoolId }, orderBy: { createdAt: "desc" }, select: ROW });
}

/** The screen's and GET /api/v1/admin/site/domain's answer. */
export async function siteDomainView(ctx: ActiveContext): Promise<SiteDomainView> {
  const me = office(ctx);
  await assertModuleOn(me.schoolId, "WEBSITE");
  return viewFor(me.schoolId);
}

async function viewFor(schoolId: string): Promise<SiteDomainView> {
  const env = processSiteEnv();
  const [school, row, published] = await Promise.all([
    db.school.findUnique({ where: { id: schoolId }, select: { id: true } }),
    currentRow(schoolId),
    publishedSiteFor(schoolId),
  ]);
  if (!school) throw new AccessError("siteDomains.refuseRole", "NOT_FOUND");
  return {
    published: published !== null,
    target: sitesTarget(env),
    certificatesHere: flyConfig(env) !== null,
    domain: row ? domainOut(row, env) : null,
  };
}

const REFUSAL_KEYS: Record<DomainRefusal, TranslationKey> = {
  EMPTY: "siteDomains.refuseEmpty",
  SCHEME: "siteDomains.refuseScheme",
  PATH: "siteDomains.refusePath",
  INVALID: "siteDomains.refuseInvalid",
  IP: "siteDomains.refuseIp",
  APP_HOST: "siteDomains.refuseAppHost",
};

/** Check what a school typed, as the stored domain or the refusal's key. Also for the page's own form. */
export function checkTypedDomain(typed: string, env = processSiteEnv()): { ok: true; domain: string } | { ok: false; key: TranslationKey } {
  const c = canonicalDomain(typed, { appHosts: appHosts(env), target: sitesTarget(env) });
  if (!c.ok) return { ok: false, key: REFUSAL_KEYS[c.reason] };
  return { ok: true, domain: storedDomainFor(c.domain, siteApexIp(env)) };
}

/**
 * Save the school's own domain (POST /api/v1/admin/site/domain). The same domain again changes nothing; another
 * replaces the one the school had, whose certificate is taken off the platform. Refused: an invalid name, the
 * app's own hosts and the sites app's own name, and a domain (or its www/bare counterpart) another school holds.
 */
export async function saveSiteDomain(ctx: ActiveContext, typed: string): Promise<SiteDomainView> {
  const me = office(ctx);
  await assertModuleOn(me.schoolId, "WEBSITE");
  const checked = checkTypedDomain(typed);
  // What was typed cannot be a domain: 422 naming the field, not 403 (QA-54); a domain another school holds is 409.
  if (!checked.ok) throw new RuleRefusal(checked.key, 422, undefined, "domain");
  const domain = checked.domain;
  const existing = await currentRow(me.schoolId);
  if (existing?.domain === domain) return viewFor(me.schoolId);

  // Another school's: the name or its www/bare counterpart. Under RLS this read sees another school's row only
  // once it is LIVE; for a name another school is still setting up, the unique index refuses the insert (P2002)
  // below with the same words.
  const counterpart = counterpartOf(domain);
  const clash = await db.schoolSiteDomain.findFirst({ where: { domain: { in: [domain, ...(counterpart ? [counterpart] : [])] }, NOT: { schoolId: me.schoolId } }, select: { id: true } });
  if (clash) throw new RuleRefusal("siteDomains.refuseTaken", 409);

  try {
    await db.$tenantTransaction(async (raw: unknown) => {
      const tx = raw as Prisma.TransactionClient;
      await tx.schoolSiteDomain.deleteMany({ where: { schoolId: me.schoolId } });
      await tx.schoolSiteDomain.create({ data: { schoolId: me.schoolId, domain, createdByUserId: me.userId } });
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new RuleRefusal("siteDomains.refuseTaken", 409);
    throw error;
  }
  if (existing) await dropCertificates(existing);
  forgetSiteHosts();
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "site.domain.save", targetType: "SchoolSiteDomain", targetId: domain, meta: { domain, replaced: existing?.domain ?? null } });
  return viewFor(me.schoolId);
}

/** The row the page shows, refused when the screen is stale (the school's domain is no longer this one). */
async function confirmedRow(schoolId: string, domain: string): Promise<DomainRow> {
  const row = await currentRow(schoolId);
  const typed = domain.trim().toLowerCase().replace(/\.$/, "");
  if (!row || row.domain !== typed) throw new AccessError("siteDomains.refuseStale", "NOT_FOUND");
  return row;
}

/** Verify (POST /api/v1/admin/site/domain/verify): one step of the state machine now. */
export async function verifySiteDomain(ctx: ActiveContext, domain: string, deps: DomainDeps = liveDeps()): Promise<SiteDomainView> {
  const me = office(ctx);
  await assertModuleOn(me.schoolId, "WEBSITE");
  const row = await confirmedRow(me.schoolId, domain);
  const patch = await advanceDomain(row, deps);
  await db.schoolSiteDomain.update({ where: { id: row.id }, data: patch });
  forgetSiteHosts();
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "site.domain.verify", targetType: "SchoolSiteDomain", targetId: row.domain, meta: { domain: row.domain, from: row.status, to: patch.status, certStatus: patch.certStatus ?? row.certStatus } });
  return viewFor(me.schoolId);
}

/** Remove (DELETE /api/v1/admin/site/domain): the row goes and its certificates are taken off the platform. */
export async function removeSiteDomain(ctx: ActiveContext, domain: string): Promise<{ removed: boolean }> {
  const me = office(ctx);
  await assertModuleOn(me.schoolId, "WEBSITE");
  const row = await confirmedRow(me.schoolId, domain);
  await db.schoolSiteDomain.deleteMany({ where: { id: row.id, schoolId: me.schoolId } });
  await dropCertificates(row);
  forgetSiteHosts();
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "site.domain.remove", targetType: "SchoolSiteDomain", targetId: row.domain, meta: { domain: row.domain, status: row.status } });
  return { removed: true };
}

/** Best effort: a certificate left on the platform costs nothing and serves nothing once the row is gone. */
async function dropCertificates(row: Pick<DomainRow, "domain" | "certStatus">, deps: Pick<DomainDeps, "fly" | "apexIp" | "fetchImpl"> = liveDeps()): Promise<void> {
  if (!deps.fly || row.certStatus === "NONE") return;
  for (const host of servedHosts(row.domain, deps.apexIp)) await removeCertificate(deps.fly, host, deps.fetchImpl);
}

/* -------------------------------------------------------------------------- */
/* The job                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * site:domains (every ten minutes): one step for every VERIFYING domain, so a certificate the platform issues
 * makes the domain LIVE without anybody pressing Verify again. Runs as the owner (every school). Counts only.
 */
export async function recheckSiteDomains(deps: DomainDeps = liveDeps(), scope?: { schoolIds?: string[] }): Promise<{ checked: number; live: number; failed: number; waiting: number; perSchool: Record<string, Record<string, number>> }> {
  const rows = await db.schoolSiteDomain.findMany({ where: { status: "VERIFYING", ...(scope?.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}) }, select: ROW, orderBy: { createdAt: "asc" }, take: 500 });
  const out = { checked: 0, live: 0, failed: 0, waiting: 0, perSchool: {} as Record<string, Record<string, number>> };
  for (const row of rows) {
    const patch = await advanceDomain(row, deps);
    await db.schoolSiteDomain.update({ where: { id: row.id }, data: patch });
    out.checked += 1;
    const bucket = patch.status === "LIVE" ? "live" : patch.status === "FAILED" ? "failed" : "waiting";
    out[bucket] += 1;
    out.perSchool[row.schoolId] = { ...(out.perSchool[row.schoolId] ?? {}), [bucket]: (out.perSchool[row.schoolId]?.[bucket] ?? 0) + 1 };
    if (patch.status !== row.status) {
      await audit({ schoolId: row.schoolId, actorUserId: null, action: "site.domain.status", targetType: "SchoolSiteDomain", targetId: row.domain, meta: { domain: row.domain, from: row.status, to: patch.status, certStatus: patch.certStatus ?? row.certStatus } });
    }
  }
  if (out.checked > 0) forgetSiteHosts();
  return out;
}

/* -------------------------------------------------------------------------- */
/* The operator                                                                */
/* -------------------------------------------------------------------------- */

export type OperatorSiteRow = {
  schoolId: string;
  schoolName: string;
  isTestFixture: boolean;
  publishedAt: Date | null;
  domain: SiteDomain | null;
};

/**
 * Every published site and every school's own domain, for the operator's read-only table at /root/sites. A
 * published version is readable by anyone and a domain by the operator (SUPERUSER_READABLE); the schools' names
 * through the operator's own reach of School. Nothing about a person.
 */
export async function operatorSites(ctx: ActiveContext): Promise<OperatorSiteRow[]> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.thisAreaBelongsToWhoeverRunsThe", "NOT_FOUND");
  const env = processSiteEnv();
  const [live, domains] = await Promise.all([
    db.schoolSiteVersion.findMany({ where: { liveAt: { not: null } }, select: { schoolId: true, liveAt: true } }),
    db.schoolSiteDomain.findMany({ select: ROW, orderBy: { createdAt: "desc" } }),
  ]);
  const ids = [...new Set([...live.map((v) => v.schoolId), ...domains.map((d) => d.schoolId)])];
  if (ids.length === 0) return [];
  const schools = await db.school.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, isTestFixture: true } });
  const rows: OperatorSiteRow[] = schools.map((s) => {
    const version = live.find((v) => v.schoolId === s.id);
    const domain = domains.find((d) => d.schoolId === s.id);
    return { schoolId: s.id, schoolName: s.name, isTestFixture: s.isTestFixture, publishedAt: version?.liveAt ?? null, domain: domain ? domainOut(domain, env) : null };
  });
  return rows.sort((a, b) => Number(a.isTestFixture) - Number(b.isTestFixture) || a.schoolName.localeCompare(b.schoolName));
}
