/**
 * A SCHOOL'S OWN DOMAIN FOR ITS PUBLIC WEBSITE (website-builder B, 15 October 2026).
 *
 * What is proved: the DNS check against a fake resolver (a www CNAME, a flattened CNAME, a bare domain's A record,
 * nothing there, something else there, a resolver that does not answer) and the records the page asks for; the Fly
 * client against a fake fetch (ask, how it stands, remove, refusals and an unreachable platform); the state machine
 * (PENDING_DNS -> VERIFYING -> LIVE, FAILED, development's LIVE without a certificate and production's wait); the
 * library on a ZZ school of its own (who may, the module, the refusals, one domain per school, another school's
 * domain, a stale screen, the audit rows, the job's flip under no actor, the operator's table); the host resolver
 * (a LIVE domain and its www/bare counterpart, nothing for a domain still being set up, and — since 16 October 2026,
 * when a site came to live only on its school's own domain — no platform subdomain and no slug host outside
 * development);
 * the doors' answers; and the public routes: the page, robots.txt and sitemap.xml for a published site on its host,
 * and 404 noindex for an unknown host, an unpublished site and any other path.
 *
 * The flow builder's src/lib/site-publish.ts is replaced here (vi.mock): which school publishes what is this
 * suite's to say. ZZ rows of its own only, removed after.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { siteDomainViewSchema } from "@edulink/contracts";

const mocked = vi.hoisted(() => ({
  published: new Map<string, { html: Record<"en" | "hi" | "mr", string>; renderedAt: Date; language: "en" | "hi" | "mr"; colour: string }>(),
  slugs: new Map<string, string>(),
}));

vi.mock("@/lib/site-publish", () => ({
  publishedSiteFor: vi.fn(async (schoolId: string) => mocked.published.get(schoolId) ?? null),
  schoolIdForSlug: vi.fn(async (slug: string) => mocked.slugs.get(slug) ?? null),
  // website-two (16 Oct 2026): a page's path besides the home page; a site here has no other page.
  siteHtmlFor: (site: { html: Record<string, string>; language: string; pages?: Record<string, Record<string, string>> }, lang: string | null, path = "") => {
    const language = lang === "en" || lang === "hi" || lang === "mr" ? lang : site.language;
    if (path) return site.pages?.[path] ? { html: site.pages[path]![language], language } : null;
    return { html: site.html[language], language };
  },
  appUrl: () => "http://localhost:3000",
}));

import { ENDPOINTS } from "@/lib/api-catalog";
import { JOBS } from "@/lib/jobs";
import { actionKey } from "@/lib/safety-labels";
import { AccessError, ModuleOffError } from "@/lib/access-error";
import { RuleRefusal } from "@/lib/rule-refusal";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { checkDns, dnsRecordsFor, servedHosts, storedDomainFor, type DnsResolver } from "@/lib/site-dns";
import { certificateState, certStateOf, removeCertificate, requestCertificate, FLY_GRAPHQL } from "@/lib/fly-certs";
import { advanceDomain, operatorSites, recheckSiteDomains, removeSiteDomain, saveSiteDomain, siteDomainView, verifySiteDomain, type DomainDeps } from "@/lib/site-domains";
import { forgetSiteHosts, schoolIdForHost, siteHostFor } from "@/lib/site-hosts";
import { sitemapXml } from "@/lib/site-host-routes";
import { GET as pageGet } from "@/app/sites/by-host/[host]/route";
import { GET as robotsGet } from "@/app/sites/by-host/[host]/robots.txt/route";
import { GET as sitemapGet } from "@/app/sites/by-host/[host]/sitemap.xml/route";
import { GET as restGet } from "@/app/sites/by-host/[host]/[...rest]/route";
import { DELETE as domainDelete, GET as domainGet, POST as domainPost } from "@/app/api/v1/admin/site/domain/route";
import { POST as verifyPost } from "@/app/api/v1/admin/site/domain/verify/route";

const db = new PrismaClient();
const STAMP = Date.now();
const TARGET = "sites.shalaghar.com";
const ids = { school: "", other: "", admin: "", principal: "", teacher: "", operator: "", otherAdmin: "" };
const SLUG = `zz-domains-${STAMP}`;
const D = (name: string) => `${name}.zz-domains-${STAMP}.test`;
const savedEnv = { SITE_CNAME_TARGET: process.env.SITE_CNAME_TARGET, SITE_APEX_IP: process.env.SITE_APEX_IP, FLY_API_TOKEN: process.env.FLY_API_TOKEN, FLY_SITES_APP: process.env.FLY_SITES_APP };

async function as(userId: string, role: string | null, schoolId: string | null = ids.school): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}

async function refusedWith(promise: Promise<unknown>, key: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  // A refusal of what was sent is a RuleRefusal (422/409, QA-54); one of who asks stays an AccessError.
  expect(error instanceof AccessError || error instanceof RuleRefusal).toBe(true);
  expect((error as AccessError).key).toBe(key);
}

/** A resolver answering from a table; a missing name is ENOTFOUND, "!" a resolver that does not answer. */
function resolver(cnames: Record<string, string[] | "!">, a: Record<string, string[] | "!">): DnsResolver {
  const answer = (table: Record<string, string[] | "!">, name: string) => {
    const v = table[name];
    if (v === "!") return Promise.reject(Object.assign(new Error("servfail"), { code: "ESERVFAIL" }));
    if (!v) return Promise.reject(Object.assign(new Error("nope"), { code: "ENOTFOUND" }));
    return Promise.resolve(v);
  };
  return { resolveCname: (n) => answer(cnames, n), resolve4: (n) => answer(a, n) };
}

/** A fake Fly: certificates by hostname, every call recorded. */
function fakeFly(states: Record<string, string>, opts: { failAdd?: string; status?: number; throws?: boolean } = {}) {
  const calls: { query: string; variables: Record<string, unknown>; auth: string | null }[] = [];
  const fetchImpl = async (url: string, init: RequestInit) => {
    expect(url).toBe(FLY_GRAPHQL);
    if (opts.throws) throw new Error("offline");
    const body = JSON.parse(String(init.body)) as { query: string; variables: Record<string, unknown> };
    calls.push({ query: body.query, variables: body.variables, auth: new Headers(init.headers).get("authorization") });
    if (opts.status) return new Response("no", { status: opts.status });
    const host = String(body.variables.hostname);
    if (body.query.includes("addCertificate")) {
      if (opts.failAdd) return Response.json({ errors: [{ message: opts.failAdd }] });
      return Response.json({ data: { addCertificate: { certificate: { hostname: host, configured: false, clientStatus: "Awaiting configuration", issued: { nodes: [] } } } } });
    }
    if (body.query.includes("deleteCertificate")) return Response.json({ errors: [{ message: "Could not find certificate" }] });
    const status = states[host] ?? "Awaiting certificates";
    return Response.json({ data: { app: { certificate: { hostname: host, configured: status === "Ready", clientStatus: status, issued: { nodes: status === "Ready" ? [{ type: "rsa" }] : [] } } } } });
  };
  return { calls, fetchImpl };
}

const FLY = { token: "fly-test-token", app: "zz-sites" };
const okDns = async () => ({ ok: true as const });
const deps = (over: Partial<DomainDeps> = {}): DomainDeps => ({ now: new Date(), dns: okDns, fly: null, production: false, apexIp: null, ...over });

beforeAll(async () => {
  delete process.env.SITE_CNAME_TARGET;
  delete process.env.SITE_APEX_IP;
  delete process.env.FLY_API_TOKEN;
  delete process.env.FLY_SITES_APP;
  const school = (name: string, slug: string, code: string) =>
    db.school.create({ data: { name, slug, code, contactEmail: `${slug}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } });
  ids.school = (await school(`ZZ Domains ${STAMP}`, SLUG, `ZDM${String(STAMP).slice(-6)}`)).id;
  ids.other = (await school(`ZZ Domains Other ${STAMP}`, `zz-domains-other-${STAMP}`, `ZDO${String(STAMP).slice(-6)}`)).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.school, module: "WEBSITE" }, { schoolId: ids.other, module: "WEBSITE" }] });
  const user = (who: string, extra: Record<string, unknown> = {}) => db.user.create({ data: { name: `ZZ Domains ${who}`, email: `zz-domains-${who.toLowerCase()}-${STAMP}@test.invalid`, isTestFixture: true, ...extra }, select: { id: true } });
  const [admin, principal, teacher, operator, otherAdmin] = await Promise.all([user("Admin"), user("Principal"), user("Teacher"), user("Operator", { isSuperuser: true }), user("OtherAdmin")]);
  Object.assign(ids, { admin: admin.id, principal: principal.id, teacher: teacher.id, operator: operator.id, otherAdmin: otherAdmin.id });
  await db.membership.createMany({
    data: [
      { userId: admin.id, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" },
      { userId: principal.id, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" },
      { userId: teacher.id, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" },
      { userId: otherAdmin.id, schoolId: ids.other, role: "ADMIN", status: "ACTIVE" },
    ],
  });
  mocked.slugs.set(SLUG, ids.school);
});

beforeEach(() => forgetSiteHosts());

afterAll(async () => {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  __resetCookies();
  __setHeaders({});
  const users = [ids.admin, ids.principal, ids.teacher, ids.operator, ids.otherAdmin];
  await db.auditLog.deleteMany({ where: { schoolId: { in: [ids.school, ids.other] } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: users } } });
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.schoolSiteDomain.deleteMany({ where: { schoolId: { in: [ids.school, ids.other] } } });
  await db.school.deleteMany({ where: { id: { in: [ids.school, ids.other] } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("the DNS a domain needs, and the check", () => {
  it("asks for a www CNAME and the bare domain's forwarding, or its A record when the platform has an address", () => {
    expect(dnsRecordsFor("www.example.in", TARGET, null)).toEqual([
      { type: "CNAME", name: "www", host: "www.example.in", value: TARGET },
      { type: "REDIRECT", name: "@", host: "example.in", value: "https://www.example.in" },
    ]);
    expect(dnsRecordsFor("example.in", TARGET, "203.0.113.7")[1]).toEqual({ type: "A", name: "@", host: "example.in", value: "203.0.113.7" });
    expect(dnsRecordsFor("site.school.ac.in", TARGET, null)).toEqual([{ type: "CNAME", name: "site", host: "site.school.ac.in", value: TARGET }]);
    expect(storedDomainFor("example.in", null)).toBe("www.example.in");
    expect(storedDomainFor("example.in", "203.0.113.7")).toBe("example.in");
    expect(servedHosts("www.example.in", null)).toEqual(["www.example.in"]);
    expect(servedHosts("example.in", "203.0.113.7")).toEqual(["example.in", "www.example.in"]);
  });

  it("passes a www CNAME to the target, or a flattened one whose addresses are the target's", async () => {
    expect(await checkDns("www.example.in", { target: TARGET, apexIp: null }, resolver({ "www.example.in": [`${TARGET}.`] }, {}))).toEqual({ ok: true });
    expect(await checkDns("www.example.in", { target: TARGET, apexIp: null }, resolver({}, { "www.example.in": ["198.51.100.4"], [TARGET]: ["198.51.100.4"] }))).toEqual({ ok: true });
  });

  it("names nothing there, something else there, and a resolver that did not answer", async () => {
    expect(await checkDns("www.example.in", { target: TARGET, apexIp: null }, resolver({}, {}))).toEqual({ ok: false, failure: { code: "NO_RECORD", host: "www.example.in" } });
    expect(await checkDns("www.example.in", { target: TARGET, apexIp: null }, resolver({ "www.example.in": ["ghs.google.com"] }, {}))).toEqual({ ok: false, failure: { code: "WRONG_TARGET", host: "www.example.in", found: "ghs.google.com" } });
    expect(await checkDns("www.example.in", { target: TARGET, apexIp: null }, resolver({}, { "www.example.in": ["192.0.2.1"], [TARGET]: ["198.51.100.4"] }))).toEqual({ ok: false, failure: { code: "WRONG_TARGET", host: "www.example.in", found: "192.0.2.1" } });
    expect(await checkDns("www.example.in", { target: TARGET, apexIp: null }, resolver({ "www.example.in": "!" }, {}))).toEqual({ ok: false, failure: { code: "LOOKUP_FAILED", host: "www.example.in" } });
  });

  it("checks both the bare domain's A record and www when the platform has an address", async () => {
    const r = resolver({ "www.example.in": [TARGET] }, { "example.in": ["203.0.113.7"] });
    expect(await checkDns("example.in", { target: TARGET, apexIp: "203.0.113.7" }, r)).toEqual({ ok: true });
    const wrong = resolver({ "www.example.in": [TARGET] }, { "example.in": ["192.0.2.9"] });
    expect(await checkDns("example.in", { target: TARGET, apexIp: "203.0.113.7" }, wrong)).toEqual({ ok: false, failure: { code: "WRONG_TARGET", host: "example.in", found: "192.0.2.9" } });
  });
});

describe("the hosting platform's certificates (Fly, fetch faked)", () => {
  it("asks with the token, the app and the hostname, and reads Fly's states as ours", async () => {
    const fly = fakeFly({ "www.example.in": "Ready" });
    expect(await requestCertificate(FLY, "www.example.in", fly.fetchImpl)).toEqual({ ok: true, value: "REQUESTED" });
    expect(fly.calls[0]).toMatchObject({ auth: "Bearer fly-test-token", variables: { appId: "zz-sites", hostname: "www.example.in" } });
    expect(fly.calls[0]!.query).toContain("addCertificate");
    expect(await certificateState(FLY, "www.example.in", fly.fetchImpl)).toEqual({ ok: true, value: "ISSUED" });
    expect(fly.calls[1]!.variables).toEqual({ appName: "zz-sites", hostname: "www.example.in" });
    expect(await certificateState(FLY, "other.example.in", fly.fetchImpl)).toEqual({ ok: true, value: "REQUESTED" });
    expect(certStateOf({ clientStatus: "Failed" })).toBe("FAILED");
  });

  it("takes an existing certificate and a missing one on removal as done, and answers a refusal or an outage as an error", async () => {
    expect(await requestCertificate(FLY, "www.example.in", fakeFly({}, { failAdd: "Hostname has already been taken" }).fetchImpl)).toEqual({ ok: true, value: "REQUESTED" });
    expect(await requestCertificate(FLY, "www.example.in", fakeFly({}, { failAdd: "Hostname is invalid" }).fetchImpl)).toEqual({ ok: false, error: "Hostname is invalid" });
    expect(await removeCertificate(FLY, "www.example.in", fakeFly({}).fetchImpl)).toEqual({ ok: true, value: true });
    expect(await certificateState(FLY, "www.example.in", fakeFly({}, { status: 500 }).fetchImpl)).toEqual({ ok: false, error: "FLY_HTTP_500" });
    expect(await certificateState(FLY, "www.example.in", fakeFly({}, { throws: true }).fetchImpl)).toEqual({ ok: false, error: "FLY_UNREACHABLE" });
  });
});

describe("the state machine", () => {
  const row = { domain: "www.example.in", status: "PENDING_DNS", certStatus: "NONE", verifiedAt: null };

  it("keeps a domain whose DNS is not there yet waiting, with the reason", async () => {
    const patch = await advanceDomain(row, deps({ dns: async () => ({ ok: false, failure: { code: "NO_RECORD", host: "www.example.in" } }) }));
    expect(patch.status).toBe("PENDING_DNS");
    expect(JSON.parse(patch.dnsError!)).toEqual({ code: "NO_RECORD", host: "www.example.in" });
  });

  it("with no platform: LIVE in development without a certificate, VERIFYING in production", async () => {
    const dev = await advanceDomain(row, deps());
    expect(dev).toMatchObject({ status: "LIVE", certStatus: "NONE", dnsError: null });
    expect(JSON.parse(dev.certError!)).toEqual({ code: "NOT_CONFIGURED" });
    expect(dev.verifiedAt).toBeInstanceOf(Date);
    expect((await advanceDomain(row, deps({ production: true }))).status).toBe("VERIFYING");
  });

  it("with Fly: asks, waits while it issues, LIVE once ISSUED, FAILED when refused, VERIFYING when Fly does not answer", async () => {
    const waiting = fakeFly({});
    expect(await advanceDomain(row, deps({ fly: FLY, fetchImpl: waiting.fetchImpl }))).toMatchObject({ status: "VERIFYING", certStatus: "REQUESTED" });
    expect(waiting.calls.map((c) => (c.query.includes("addCertificate") ? "add" : "state"))).toEqual(["add", "state"]);

    const issued = fakeFly({ "www.example.in": "Ready" });
    const live = await advanceDomain({ ...row, status: "VERIFYING", certStatus: "REQUESTED" }, deps({ fly: FLY, fetchImpl: issued.fetchImpl }));
    expect(live).toMatchObject({ status: "LIVE", certStatus: "ISSUED", certError: null });
    expect(issued.calls.some((c) => c.query.includes("addCertificate"))).toBe(false);

    const refused = await advanceDomain({ ...row, status: "VERIFYING", certStatus: "REQUESTED" }, deps({ fly: FLY, fetchImpl: fakeFly({ "www.example.in": "Failed" }).fetchImpl }));
    expect(refused).toMatchObject({ status: "FAILED", certStatus: "FAILED" });
    expect(JSON.parse(refused.certError!)).toEqual({ code: "CERT_FAILED", host: "www.example.in" });

    const down = await advanceDomain(row, deps({ fly: FLY, fetchImpl: fakeFly({}, { throws: true }).fetchImpl }));
    expect(down).toMatchObject({ status: "VERIFYING", certStatus: "NONE" });
    expect(JSON.parse(down.certError!)).toEqual({ code: "FLY_ERROR", host: "www.example.in" });
  });

  it("asks for both the bare domain and www when the platform has an address, and is LIVE only when both are issued", async () => {
    const fly = fakeFly({ "example.in": "Ready" });
    const one = await advanceDomain({ ...row, domain: "example.in" }, deps({ fly: FLY, fetchImpl: fly.fetchImpl, apexIp: "203.0.113.7" }));
    expect(one.status).toBe("VERIFYING");
    expect(fly.calls.filter((c) => c.query.includes("addCertificate")).map((c) => c.variables.hostname)).toEqual(["example.in", "www.example.in"]);
    const both = await advanceDomain({ ...row, domain: "example.in", certStatus: "REQUESTED" }, deps({ fly: FLY, fetchImpl: fakeFly({ "example.in": "Ready", "www.example.in": "Ready" }).fetchImpl, apexIp: "203.0.113.7" }));
    expect(both.status).toBe("LIVE");
  });
});

describe("the office's domain (the library)", () => {
  it("is the office's and the head's, behind the WEBSITE module", async () => {
    await refusedWith(siteDomainView(await as(ids.teacher, "TEACHER")), "siteDomains.refuseRole");
    await db.schoolModule.deleteMany({ where: { schoolId: ids.school, module: "WEBSITE" } });
    const off = await saveSiteDomain(await as(ids.admin, "ADMIN"), D("www")).then(
      () => null,
      (e: unknown) => e,
    );
    expect(off).toBeInstanceOf(ModuleOffError);
    await db.schoolModule.create({ data: { schoolId: ids.school, module: "WEBSITE" } });
    const view = siteDomainViewSchema.parse(await siteDomainView(await as(ids.principal, "PRINCIPAL")));
    expect(view).toMatchObject({ published: false, target: TARGET, certificatesHere: false, domain: null });
    expect(view).not.toHaveProperty("subdomain");
  });

  it("refuses what is not a domain, the app's own hosts and the CNAME target", async () => {
    const admin = await as(ids.admin, "ADMIN");
    await refusedWith(saveSiteDomain(admin, "https://www.example.in"), "siteDomains.refuseScheme");
    await refusedWith(saveSiteDomain(admin, "www.example.in/x"), "siteDomains.refusePath");
    await refusedWith(saveSiteDomain(admin, "not a domain"), "siteDomains.refuseInvalid");
    await refusedWith(saveSiteDomain(admin, "10.0.0.1"), "siteDomains.refuseIp");
    await refusedWith(saveSiteDomain(admin, TARGET), "siteDomains.refuseAppHost");
    await refusedWith(saveSiteDomain(admin, "localhost"), "siteDomains.refuseInvalid");
    expect(await db.schoolSiteDomain.count({ where: { schoolId: ids.school } })).toBe(0);
  });

  it("saves one domain per school, a bare one served on www, audited once, the same again a no-op", async () => {
    const admin = await as(ids.admin, "ADMIN");
    const bare = `zz-domains-${STAMP}.test`;
    const view = await saveSiteDomain(admin, bare.toUpperCase());
    expect(view.domain).toMatchObject({ domain: `www.${bare}`, status: "PENDING_DNS", certStatus: "NONE", hosts: [`www.${bare}`] });
    expect(view.domain!.records.map((r) => r.type)).toEqual(["CNAME", "REDIRECT"]);
    await saveSiteDomain(admin, `www.${bare}`);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "site.domain.save" } })).toBe(1);
    // Another domain replaces it.
    await saveSiteDomain(admin, D("site"));
    const rows = await db.schoolSiteDomain.findMany({ where: { schoolId: ids.school }, select: { domain: true } });
    expect(rows.map((r) => r.domain)).toEqual([D("site")]);
    await saveSiteDomain(admin, `www.${bare}`);
  });

  it("refuses a domain, or its www/bare counterpart, another school holds", async () => {
    const other = await as(ids.otherAdmin, "ADMIN", ids.other);
    await refusedWith(saveSiteDomain(other, `www.zz-domains-${STAMP}.test`), "siteDomains.refuseTaken");
    // Through the door: 409, the state of the name is in the way (QA-54; it was 403 FORBIDDEN).
    const taken = await domainPost(new Request("http://localhost/api/v1/admin/site/domain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domain: `www.zz-domains-${STAMP}.test` }) }));
    expect(taken.status).toBe(409);
    expect(await taken.json()).toMatchObject({ code: "CONFLICT" });
    await db.schoolSiteDomain.updateMany({ where: { schoolId: ids.school }, data: { status: "LIVE" } });
    await refusedWith(saveSiteDomain(other, `zz-domains-${STAMP}.test`), "siteDomains.refuseTaken");
    await db.schoolSiteDomain.updateMany({ where: { schoolId: ids.school }, data: { status: "PENDING_DNS" } });
    expect(await db.schoolSiteDomain.count({ where: { schoolId: ids.other } })).toBe(0);
  });

  it("verifies the domain the page shows, refuses a stale screen, and records the step", async () => {
    const admin = await as(ids.admin, "ADMIN");
    const domain = `www.zz-domains-${STAMP}.test`;
    await refusedWith(verifySiteDomain(admin, D("gone"), deps()), "siteDomains.refuseStale");
    const waiting = await verifySiteDomain(admin, domain, deps({ dns: async () => ({ ok: false, failure: { code: "WRONG_TARGET", host: domain, found: "parked.example" } }) }));
    expect(waiting.domain).toMatchObject({ status: "PENDING_DNS", dnsError: { code: "WRONG_TARGET", host: domain, found: "parked.example" } });
    const verifying = await verifySiteDomain(admin, domain.toUpperCase(), deps({ production: true }));
    expect(verifying.domain).toMatchObject({ status: "VERIFYING", certStatus: "NONE", dnsError: null, certError: { code: "NOT_CONFIGURED" } });
    const audits = await db.auditLog.findMany({ where: { schoolId: ids.school, action: "site.domain.verify" }, select: { actorUserId: true, meta: true } });
    expect(audits).toHaveLength(2);
    expect(audits.every((a) => a.actorUserId === ids.admin)).toBe(true);
  });

  it("the job makes a VERIFYING domain LIVE once the certificate is issued, audited under no actor", async () => {
    const domain = `www.zz-domains-${STAMP}.test`;
    await db.schoolSiteDomain.updateMany({ where: { schoolId: ids.school }, data: { certStatus: "REQUESTED" } });
    const fly = fakeFly({ [domain]: "Ready" });
    const run = await recheckSiteDomains(deps({ fly: FLY, fetchImpl: fly.fetchImpl }), { schoolIds: [ids.school] });
    expect(run).toMatchObject({ checked: 1, live: 1, failed: 0, waiting: 0 });
    expect(run.perSchool[ids.school]).toEqual({ live: 1 });
    const row = await db.schoolSiteDomain.findFirstOrThrow({ where: { schoolId: ids.school }, select: { status: true, certStatus: true, verifiedAt: true } });
    expect(row).toMatchObject({ status: "LIVE", certStatus: "ISSUED" });
    expect(row.verifiedAt).toBeInstanceOf(Date);
    const flip = await db.auditLog.findFirst({ where: { schoolId: ids.school, action: "site.domain.status" }, select: { actorUserId: true } });
    expect(flip).toEqual({ actorUserId: null });
    // A LIVE domain is left alone by the job.
    expect((await recheckSiteDomains(deps({ fly: FLY, fetchImpl: fly.fetchImpl }), { schoolIds: [ids.school] })).checked).toBe(0);
    expect(JOBS["site:domains"]).toMatchObject({ schedule: "5-59/10 * * * *", describeKey: "root.jobDescSiteDomains", narrows: ["schoolIds"] });
  });

  it("finds the school for its LIVE domain and the counterpart, never by a subdomain or slug, and says where the site lives", async () => {
    const domain = `www.zz-domains-${STAMP}.test`;
    expect(await schoolIdForHost(domain)).toBe(ids.school);
    expect(await schoolIdForHost(`ZZ-DOMAINS-${STAMP}.test:443`)).toBe(ids.school);
    // ⚠ No platform subdomain (16 Oct 2026), and <slug>.localhost only in a development process (this is a test one).
    expect(await schoolIdForHost(`${SLUG}.shalaghar.site`)).toBeNull();
    expect(await schoolIdForHost(`${SLUG}.localhost:3000`)).toBeNull();
    expect(await schoolIdForHost("www.nobody-zz.test")).toBeNull();
    expect(await siteHostFor(ids.school)).toBe(domain);
    // A school with no LIVE domain has no address at all.
    expect(await siteHostFor(ids.other)).toBeNull();
    await db.schoolSiteDomain.updateMany({ where: { schoolId: ids.school }, data: { status: "VERIFYING" } });
    // Remembered for a minute in this process…
    expect(await schoolIdForHost(domain)).toBe(ids.school);
    forgetSiteHosts();
    // …and a domain still being set up is nobody's.
    expect(await schoolIdForHost(domain)).toBeNull();
    expect(await siteHostFor(ids.school)).toBeNull();
    await db.schoolSiteDomain.updateMany({ where: { schoolId: ids.school }, data: { status: "LIVE" } });
  });

  it("the operator's table lists the school with its domain, and refuses anybody else", async () => {
    const rows = await operatorSites(await as(ids.operator, null, null));
    const mine = rows.find((r) => r.schoolId === ids.school);
    expect(mine).toMatchObject({ publishedAt: null, isTestFixture: true, domain: { domain: `www.zz-domains-${STAMP}.test`, status: "LIVE" } });
    expect(mine).not.toHaveProperty("subdomain");
    await refusedWith(operatorSites(await as(ids.admin, "ADMIN")), "access.thisAreaBelongsToWhoeverRunsThe");
  });
});

describe("the public routes on a site host", () => {
  const domain = () => `www.zz-domains-${STAMP}.test`;
  const call = (path: string, host: string, headers: Record<string, string> = {}) => new Request(`http://localhost${path}`, { headers: { host, ...headers } });
  const params = (host: string) => ({ params: Promise.resolve({ host }) });

  it("⚠ 404 noindex for a host nobody has, and for a LIVE domain whose site is not published", async () => {
    for (const host of ["www.nobody-zz.test", domain()]) {
      const res = await pageGet(call("/", host), params(host));
      expect(res.status, host).toBe(404);
      expect(res.headers.get("x-robots-tag")).toContain("noindex");
      expect(res.headers.get("set-cookie")).toBeNull();
      expect((await robotsGet(call("/robots.txt", host), params(host))).status).toBe(404);
      expect((await sitemapGet(call("/sitemap.xml", host), params(host))).status).toBe(404);
    }
  });

  it("serves the published page on the LIVE domain, and not on a platform subdomain, with the language asked for and the host's hardening", async () => {
    mocked.published.set(ids.school, { html: { en: "<p>EN</p>", hi: "<p>HI</p>", mr: "<p>EN</p>" }, renderedAt: new Date("2026-10-15T08:00:00Z"), language: "en", colour: "#1d4ed8" });
    const res = await pageGet(call("/?lang=hi", domain()), params(domain()));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("<p>HI</p>");
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("cache-control")).toBe("public, max-age=300");
    expect(res.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(res.headers.get("content-security-policy")).not.toContain("script-src");
    expect(res.headers.get("x-robots-tag")).toBeNull();
    expect(res.headers.get("set-cookie")).toBeNull();
    // ⚠ The published site is not on any platform subdomain (16 Oct 2026).
    const sub = await pageGet(call("/", `${SLUG}.shalaghar.site`), params(`${SLUG}.shalaghar.site`));
    expect(sub.status).toBe(404);
    expect(sub.headers.get("x-robots-tag")).toContain("noindex");
  });

  it("robots.txt names the sitemap, and the sitemap lists one URL per language the site offers", async () => {
    const robots = await robotsGet(call("/robots.txt", domain(), { "x-forwarded-proto": "https" }), params(domain()));
    expect(robots.status).toBe(200);
    expect(await robots.text()).toContain(`Sitemap: https://${domain()}/sitemap.xml`);
    const map = await sitemapGet(call("/sitemap.xml", domain(), { "x-forwarded-proto": "https" }), params(domain()));
    expect(map.status).toBe(200);
    expect(map.headers.get("content-type")).toContain("application/xml");
    const body = await map.text();
    expect(body).toContain(`<loc>https://${domain()}/</loc>`);
    expect(body).toContain(`<loc>https://${domain()}/?lang=hi</loc>`);
    // Marathi is not offered: its page is the site's own.
    expect(body).not.toContain("lang=mr");
    expect(sitemapXml({ html: { en: "a", hi: "a", mr: "a" }, language: "en", renderedAt: new Date() }, "https://x.in")).not.toContain("xhtml:link");
  });

  it("⚠ answers every other path on a site host 404, noindex", async () => {
    // Since website-two (16 Oct 2026) a GET of one of the site's pages is that page; /login is none of them.
    const res = await restGet(call("/login", domain()), { params: Promise.resolve({ host: domain(), rest: ["login"] }) });
    expect(res.status).toBe(404);
    expect(res.headers.get("x-robots-tag")).toContain("noindex");
  });
});

describe("the doors", () => {
  const json = (body: unknown, method = "POST") => new Request("http://localhost/api/v1/admin/site/domain", { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });

  it("are in the catalog, the office's and the head's, behind the WEBSITE module, and audited words exist", () => {
    const doors = ENDPOINTS.filter((e) => e.path.startsWith("/api/v1/admin/site/domain"));
    expect(doors.map((e) => `${e.method} ${e.path}`).sort()).toEqual(["DELETE /api/v1/admin/site/domain", "GET /api/v1/admin/site/domain", "POST /api/v1/admin/site/domain", "POST /api/v1/admin/site/domain/verify"]);
    for (const e of doors) expect(e).toMatchObject({ access: ["ADMIN", "PRINCIPAL"], module: "WEBSITE" });
    for (const action of ["site.domain.save", "site.domain.verify", "site.domain.remove", "site.domain.status"]) expect(actionKey(action), action).not.toBeNull();
  });

  it("answer the view, 422 to an empty body, and remove the domain named", async () => {
    await as(ids.admin, "ADMIN");
    const got = await domainGet();
    expect(got.status).toBe(200);
    expect(siteDomainViewSchema.parse(await got.json()).domain?.domain).toBe(`www.zz-domains-${STAMP}.test`);
    expect((await domainPost(json(undefined))).status).toBe(422);
    expect((await verifyPost(json(undefined))).status).toBe(422);
    expect((await domainDelete(json(undefined, "DELETE"))).status).toBe(422);
    // QA-54: refused input is 422 naming the field, not 403 FORBIDDEN; a domain another school holds is 409.
    const notDomain = await domainPost(json({ domain: "localhost" }));
    expect(notDomain.status).toBe(422);
    expect(await notDomain.json()).toMatchObject({ code: "BAD_REQUEST", issues: { domain: expect.any(String) } });
    expect((await domainPost(json({ domain: "https://x.in" }))).status).toBe(422);
    expect((await domainDelete(json({ domain: D("other") }, "DELETE"))).status).toBe(404);
    const gone = await domainDelete(json({ domain: `www.zz-domains-${STAMP}.test` }, "DELETE"));
    expect(gone.status).toBe(200);
    expect(await gone.json()).toEqual({ removed: true });
    expect(await db.schoolSiteDomain.count({ where: { schoolId: ids.school } })).toBe(0);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "site.domain.remove" } })).toBe(1);
    await as(ids.teacher, "TEACHER");
    expect((await domainGet()).status).toBe(403);
  });
});

describe("removing", () => {
  it("is refused for a domain the school does not hold", async () => {
    await refusedWith(removeSiteDomain(await as(ids.admin, "ADMIN"), D("never")), "siteDomains.refuseStale");
  });
});
