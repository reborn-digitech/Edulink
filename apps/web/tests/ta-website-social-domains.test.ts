/**
 * A school's own domain and the host memory, as the WEB PROCESS runs them: three findings of the testing analysis of
 * 13 November 2026, each held by a case that fails while the defect stands.
 *
 *   TA-223  With SITE_APEX_IP set the bare and the www spelling of one domain are two strings, and the clash read runs
 *           under row security, which shows another school's row only once it is LIVE: a second school could save the
 *           counterpart of a name the first is still setting up, and Verify made it LIVE on the first school's DNS.
 *   TA-227  The host-to-school memory took every Host header that arrived, of any length, and never shrank.
 *   TA-398  A LIVE domain fell to PENDING_DNS when the resolver did not answer, and a certificate that went missing on
 *           the platform was never asked for again.
 *
 * WHY THE APPLICATION ROLE. Every other suite talks to the database as the owner, where row security does not apply
 * and the clash read sees every school's row, so tests/site-domains.test.ts can never see TA-223. Here the app's own
 * `db` connects as the role every web process connects as (DATABASE_URL put back to the app role's before anything
 * imports src/lib/db.ts, as tests/ta-cascading-deletes-app-role.test.ts does); fixtures are written and read back
 * through a second, owner client. The TA-223 cases are skipped, and say so, when the configuration has one role.
 *
 * Every row belongs to a scratch ZZ school or a ZZ person of this suite's own (the stamp is in each name, slug, domain
 * and address), removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const ENV = await vi.hoisted(async () => {
  const app = process.env.DATABASE_APP_URL;
  const admin = process.env.DATABASE_ADMIN_URL;
  let appUser: string | null = null;
  try {
    if (app && admin && new URL(app).username !== new URL(admin).username) appUser = new URL(app).username;
  } catch {
    appUser = null;
  }
  if (appUser) process.env.DATABASE_URL = app;
  // The platform has an address for bare domains, so a bare name and its www name are stored apart (site-dns.ts).
  process.env.SITE_APEX_IP = "203.0.113.7";
  delete process.env.SITE_CNAME_TARGET;
  delete process.env.FLY_API_TOKEN;
  delete process.env.FLY_SITES_APP;
  return { appUser, admin };
});

import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { RuleRefusal } from "@/lib/rule-refusal";
import { advanceDomain, saveSiteDomain, verifySiteDomain, type DomainDeps } from "@/lib/site-domains";
import { forgetSiteHosts, schoolIdForHost, siteHostsRemembered, SITE_HOSTS_REMEMBERED_MAX } from "@/lib/site-hosts";
import { FLY_GRAPHQL } from "@/lib/fly-certs";

const owner = new PrismaClient(ENV.admin ? { datasourceUrl: ENV.admin } : undefined);
const STAMP = Date.now();
const MAIL = (who: string) => `zz-tawsd-${who}-${STAMP}@test.invalid`;
const PAIR = `zz-tawsd-pair-${STAMP}.test`;
const ids = { a: "", b: "", adminA: "", adminB: "" };

async function as(userId: string, role: string, schoolId: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}

const okDns = async () => ({ ok: true as const });
const deps = (over: Partial<DomainDeps> = {}): DomainDeps => ({ now: new Date(), dns: okDns, fly: null, production: false, apexIp: "203.0.113.7", ...over });

beforeAll(async () => {
  const school = (key: string) =>
    owner.school.create({ data: { name: `ZZ TA Domains ${key} ${STAMP}`, slug: `zz-tawsd-${key.toLowerCase()}-${STAMP}`, code: `ZTWD${key}${String(STAMP).slice(-6)}`, contactEmail: MAIL(`office-${key}`), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } });
  ids.a = (await school("A")).id;
  ids.b = (await school("B")).id;
  await owner.schoolModule.createMany({ data: [{ schoolId: ids.a, module: "WEBSITE" }, { schoolId: ids.b, module: "WEBSITE" }] });
  const user = (who: string) => owner.user.create({ data: { name: `ZZ TA Domains ${who}`, email: MAIL(who), isTestFixture: true }, select: { id: true } });
  ids.adminA = (await user("AdminA")).id;
  ids.adminB = (await user("AdminB")).id;
  await owner.membership.createMany({
    data: [
      { userId: ids.adminA, schoolId: ids.a, role: "ADMIN", status: "ACTIVE" },
      { userId: ids.adminB, schoolId: ids.b, role: "ADMIN", status: "ACTIVE" },
    ],
  });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await owner.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await owner.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await owner.auditLog.deleteMany({ where: { schoolId: { in: [ids.a, ids.b] } } });
  await owner.schoolSiteDomain.deleteMany({ where: { schoolId: { in: [ids.a, ids.b] } } });
  await owner.school.deleteMany({ where: { id: { in: [ids.a, ids.b] } } });
  await owner.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await owner.$disconnect();
  forgetSiteHosts();
});

describe.skipIf(!ENV.appUser)("TA-223: one www/bare pair belongs to one school, under row security", () => {
  it("arrange: the app's own client is the app role, which does not bypass row security", async () => {
    const { db } = await import("@/lib/db");
    const [who] = await db.$queryRaw<{ name: string; bypass: boolean }[]>`SELECT current_user::text AS name, r.rolbypassrls AS bypass FROM pg_roles r WHERE r.rolname = current_user`;
    expect(who).toEqual({ name: ENV.appUser, bypass: false });
  });

  it("TA-223: a school cannot save the www counterpart of a bare domain another school is still setting up", async () => {
    await saveSiteDomain(await as(ids.adminA, "ADMIN", ids.a), PAIR);
    expect(await owner.schoolSiteDomain.findFirst({ where: { schoolId: ids.a }, select: { domain: true, status: true } })).toEqual({ domain: PAIR, status: "PENDING_DNS" });
    const error = await saveSiteDomain(await as(ids.adminB, "ADMIN", ids.b), `www.${PAIR}`).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(RuleRefusal);
    expect((error as RuleRefusal).key).toBe("siteDomains.refuseTaken");
    expect(await owner.schoolSiteDomain.count({ where: { schoolId: ids.b } })).toBe(0);
    // The first school's row is untouched by the refusal.
    expect(await owner.schoolSiteDomain.count({ where: { schoolId: ids.a, domain: PAIR } })).toBe(1);
  });

  it("TA-223: a counterpart row left from before cannot go LIVE over the school that holds the pair LIVE, and the host stays that school's", async () => {
    await owner.schoolSiteDomain.updateMany({ where: { schoolId: ids.a }, data: { status: "LIVE", verifiedAt: new Date() } });
    // A row the second school saved before this fix (the owner writes it; the library no longer would).
    await owner.schoolSiteDomain.create({ data: { schoolId: ids.b, domain: `www.${PAIR}`, createdByUserId: ids.adminB } });
    forgetSiteHosts();
    const error = await verifySiteDomain(await as(ids.adminB, "ADMIN", ids.b), `www.${PAIR}`, deps()).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(RuleRefusal);
    expect((error as RuleRefusal).key).toBe("siteDomains.refuseTaken");
    expect((await owner.schoolSiteDomain.findFirstOrThrow({ where: { schoolId: ids.b } })).status).not.toBe("LIVE");
    forgetSiteHosts();
    expect(await schoolIdForHost(`www.${PAIR}`)).toBe(ids.a);
    expect(await schoolIdForHost(PAIR)).toBe(ids.a);
  });
});

describe("TA-227: the host memory", () => {
  it("TA-227: refuses a name no domain can have without remembering it", async () => {
    forgetSiteHosts();
    expect(await schoolIdForHost(`${"a".repeat(300)}.zz-tawsd-${STAMP}.test`)).toBeNull();
    expect(await schoolIdForHost(`${"b".repeat(70)}.zz-tawsd-${STAMP}.test`)).toBeNull();
    expect(await schoolIdForHost(`under_score.zz-tawsd-${STAMP}.test`)).toBeNull();
    expect(siteHostsRemembered()).toBe(0);
  });

  it(
    "TA-227: stays under its bound however many made-up hosts arrive",
    async () => {
      forgetSiteHosts();
      const now = Date.now();
      for (let i = 0; i < SITE_HOSTS_REMEMBERED_MAX + 300; i += 1) await schoolIdForHost(`h${i}.zz-tawsd-${STAMP}.test`, now);
      expect(siteHostsRemembered()).toBeLessThanOrEqual(SITE_HOSTS_REMEMBERED_MAX);
      forgetSiteHosts();
    },
    120_000,
  );
});

describe("TA-398: a LIVE domain and a missing certificate", () => {
  it("TA-398: keeps a LIVE domain LIVE when the resolver does not answer, with the failure recorded", async () => {
    const verifiedAt = new Date("2026-11-01T00:00:00.000Z");
    const patch = await advanceDomain(
      { domain: `www.zz-tawsd-live-${STAMP}.test`, status: "LIVE", certStatus: "NONE", verifiedAt },
      deps({ dns: async (domain) => ({ ok: false as const, failure: { code: "LOOKUP_FAILED" as const, host: domain } }) }),
    );
    expect(patch.status).toBe("LIVE");
    expect(patch.verifiedAt ?? verifiedAt).toEqual(verifiedAt);
    expect(JSON.parse(patch.dnsError ?? "null")).toMatchObject({ code: "LOOKUP_FAILED" });
    // A record that is really gone still takes the domain down.
    const gone = await advanceDomain(
      { domain: `www.zz-tawsd-live-${STAMP}.test`, status: "LIVE", certStatus: "NONE", verifiedAt },
      deps({ dns: async (domain) => ({ ok: false as const, failure: { code: "NO_RECORD" as const, host: domain } }) }),
    );
    expect(gone.status).toBe("PENDING_DNS");
  });

  it("TA-398: asks the platform for a certificate again when the one recorded as issued is gone", async () => {
    const calls: string[] = [];
    const fetchImpl = async (url: string, init: RequestInit) => {
      expect(url).toBe(FLY_GRAPHQL);
      const body = JSON.parse(String(init.body)) as { query: string; variables: Record<string, unknown> };
      const host = String(body.variables.hostname);
      if (body.query.includes("addCertificate")) {
        calls.push(`add:${host}`);
        return Response.json({ data: { addCertificate: { certificate: { hostname: host, configured: false, clientStatus: "Awaiting configuration", issued: { nodes: [] } } } } });
      }
      calls.push(`state:${host}`);
      // Fly has no certificate for the host at all.
      return Response.json({ data: { app: { certificate: null } } });
    };
    const domain = `www.zz-tawsd-cert-${STAMP}.test`;
    const patch = await advanceDomain({ domain, status: "VERIFYING", certStatus: "ISSUED", verifiedAt: null }, deps({ apexIp: null, fly: { token: "zz-fly", app: "zz-sites" }, fetchImpl }));
    expect(calls).toContain(`add:${domain}`);
    expect(patch.status).toBe("VERIFYING");
  });
});
