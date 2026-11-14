/**
 * The owner's decision on TA-090 (testing analysis of 13 November 2026;
 * option 1, chosen 14 November 2026): a company a placement cell added first
 * had no way ever to gain a recruiter, since registering its identifier is
 * refused and only a bound recruiter could invite another. Now a cell that has
 * verified the company, or the operator, invites a recruiter account by its
 * address to a company that has no accepted binding; the recruiter accepts and
 * is bound through the invitation flow colleagues already use, the answer the
 * same whether or not the address is a recruiter's. Registration of a taken
 * identifier stays refused.
 *
 * The library runs AS THE APP ROLE, each caller bound as its request would be
 * (a college's TPO to the college, a recruiter to no school, the operator as
 * the operator); the doors run through minted sessions. At ZZ colleges of this
 * suite's own, removed afterwards by id.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const ENV = await vi.hoisted(async () => {
  const app = process.env.DATABASE_APP_URL;
  const admin = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
  let appUser: string | null = null;
  try {
    if (app && admin && new URL(app).username !== new URL(admin).username) appUser = new URL(app).username;
  } catch {
    appUser = null;
  }
  if (appUser) process.env.DATABASE_URL = app;
  return { appUser, admin };
});

import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { db as appDb } from "@/lib/db";
import { forTenant } from "@/lib/tenant-context";
import { RuleRefusal } from "@/lib/rule-refusal";
import { AccessError } from "@/lib/access-error";
import { ENDPOINTS } from "@/lib/api-catalog";
import { addCompany, listCompanies, verifyCompany } from "@/lib/placement";
import * as recruiterLib from "@/lib/placement-recruiter";

const { answerInvitation, recruiterCompany, recruiterDrives, registerCompany } = recruiterLib;
/** The decision's two new entry points, read off the module so the suite runs (and fails) against the code before them. */
type Invite = (ctx: ActiveContext, companyId: string, email: string) => Promise<{ id: string; recruiters: number }>;
type OperatorInvite = (ctx: ActiveContext, identifier: string, email: string) => Promise<{ ok: true }>;
const lib = recruiterLib as unknown as { inviteCompanyRecruiter?: Invite; operatorInviteCompanyRecruiter?: OperatorInvite };
const invite: Invite = (ctx, companyId, email) => {
  if (!lib.inviteCompanyRecruiter) throw new Error("inviteCompanyRecruiter does not exist");
  return lib.inviteCompanyRecruiter(ctx, companyId, email);
};
const operatorInvite: OperatorInvite = (ctx, identifier, email) => {
  if (!lib.operatorInviteCompanyRecruiter) throw new Error("operatorInviteCompanyRecruiter does not exist");
  return lib.operatorInviteCompanyRecruiter(ctx, identifier, email);
};

const owner = new PrismaClient(ENV.admin ? { datasourceUrl: ENV.admin } : undefined);
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-ta090-${who.toLowerCase()}-${STAMP}@test.invalid`;
const AGENT = `zz-ta090-${STAMP}`;
const id: Record<string, string> = {};
const companyIds: string[] = [];
/** A CIN of the right shape, unique to this run: U + five digits + MH + 2026 + PTC + six digits. */
const cin = (n: number) => `U${String(10_000 + n).slice(-5)}MH2026PTC${SUFFIX}`;

const PREFS = { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never;
const ctxOf = (userKey: string, role: "TPO" | "RECRUITER" | null, college: "a" | "b" | null, membershipKey: string | null = null, superuser = false): ActiveContext => ({
  sessionId: "test-session",
  membershipId: membershipKey ? id[membershipKey]! : null,
  schoolId: college ? id[college]! : null,
  role,
  user: { id: id[userKey]!, name: `ZZ TA090 ${userKey}`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: superuser, isAppAdmin: false, prefs: PREFS },
});
const tpoA = () => ctxOf("tpoAUser", "TPO", "a", "tpoA");
const tpoB = () => ctxOf("tpoBUser", "TPO", "b", "tpoB");
const recruiter = (key: string) => ctxOf(key, "RECRUITER", null);
const operator = () => ctxOf("op", null, null, null, true);
const asCollege = <T>(college: "a" | "b", userKey: string, work: () => Promise<T>) => forTenant({ schoolIds: [id[college]!], userId: id[userKey]!, joinCode: null, isSuperuser: false }, work);
const asRecruiter = <T>(userKey: string, work: () => Promise<T>) => forTenant({ schoolIds: [], userId: id[userKey]!, joinCode: null, isSuperuser: false }, work);
const asOperator = <T>(work: () => Promise<T>) => forTenant({ schoolIds: [], userId: id.op!, joinCode: null, isSuperuser: true }, work);

async function refusal(work: Promise<unknown>): Promise<{ key: string; status: number | string }> {
  try {
    await work;
  } catch (error) {
    if (error instanceof RuleRefusal) return { key: error.key, status: error.status };
    if (error instanceof AccessError) return { key: error.key, status: error.code };
    throw error;
  }
  throw new Error("expected a refusal, got an answer");
}

/** A company made through the owner connection, recorded for clean-up. */
async function company(n: number, data: { verifiedByTpoA?: boolean; links?: ("a" | "b")[]; boundTo?: string } = {}) {
  const c = await owner.company.create({
    data: { name: `ZZ TA090 Co ${n} ${STAMP}`, identifier: cin(n), sectors: JSON.stringify(["IT_SOFTWARE"]), pointOfContact: "ZZ desk", ...(data.verifiedByTpoA ? { verifiedAt: new Date(), verifiedByUserId: id.tpoAUser! } : {}) },
    select: { id: true },
  });
  companyIds.push(c.id);
  for (const college of data.links ?? []) await owner.companyTenantLink.create({ data: { schoolId: id[college]!, companyId: c.id } });
  if (data.boundTo) await owner.companyRecruiter.create({ data: { companyId: c.id, userId: id[data.boundTo]!, acceptedAt: new Date() } });
  return c.id;
}

beforeAll(async () => {
  const college = async (key: "a" | "b") => {
    id[key] = (await owner.school.create({ data: { name: `ZZ TA090 College ${key.toUpperCase()} ${STAMP}`, slug: `zz-ta090-${key}-${STAMP}`, code: `ZT90${key.toUpperCase()}${SUFFIX}`, kind: "COLLEGE", contactEmail: MAIL(`school-${key}`), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
    await owner.schoolModule.createMany({ data: ["PLACEMENT", "ACADEMICS"].map((module) => ({ schoolId: id[key]!, module })) });
  };
  await college("a");
  await college("b");
  const user = async (key: string, extra: { superuser?: boolean } = {}) => (id[key] = (await owner.user.create({ data: { name: `ZZ TA090 ${key}`, email: MAIL(key), isTestFixture: true, ...(extra.superuser ? { isSuperuser: true } : {}) }, select: { id: true } })).id);
  await user("tpoAUser");
  await user("tpoBUser");
  id.tpoA = (await owner.membership.create({ data: { userId: id.tpoAUser!, schoolId: id.a!, role: "TPO", status: "ACTIVE" }, select: { id: true } })).id;
  id.tpoB = (await owner.membership.create({ data: { userId: id.tpoBUser!, schoolId: id.b!, role: "TPO", status: "ACTIVE" }, select: { id: true } })).id;
  // Recruiter accounts with proved addresses; r1 for the scenario, r2 for the operator, r3 for the same-answer case, r4 already bound, r5 for the doors.
  for (const key of ["r1", "r2", "r3", "r4", "r5", "r6"]) {
    await user(key);
    await owner.user.update({ where: { id: id[key] }, data: { emailVerifiedAt: new Date() } });
    await owner.recruiterProfile.create({ data: { userId: id[key]!, companyName: `ZZ TA090 ${key}` } });
  }
  await user("plain");
  await user("op", { superuser: true });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const people = Object.entries(id).filter(([k]) => !["a", "b", "tpoA", "tpoB"].includes(k)).map(([, v]) => v);
  await owner.notification.deleteMany({ where: { userId: { in: people } } });
  await owner.auditLog.deleteMany({ where: { schoolId: { in: [id.a!, id.b!] } } });
  await owner.auditLog.deleteMany({ where: { schoolId: null, actorUserId: { in: people } } });
  await owner.drive.deleteMany({ where: { schoolId: { in: [id.a!, id.b!] } } });
  await owner.company.deleteMany({ where: { OR: [{ id: { in: companyIds } }, { identifier: { endsWith: `MH2026PTC${SUFFIX}` }, name: { startsWith: "ZZ TA090" } }] } });
  await owner.session.deleteMany({ where: { userId: { in: people } } });
  await owner.school.deleteMany({ where: { id: { in: [id.a!, id.b!] } } });
  await owner.user.deleteMany({ where: { id: { in: people } } });
  await owner.$disconnect();
});

describe("the suite", () => {
  it("runs the library as the app role, not the owner", async () => {
    expect(ENV.appUser).toBeTruthy();
    const [app] = await appDb.$queryRaw<{ u: string }[]>`SELECT current_user AS u`;
    const [own] = await owner.$queryRaw<{ u: string }[]>`SELECT current_user AS u`;
    expect(app!.u).not.toBe(own!.u);
  });
});

describe("TA-090: a company the cell added first gains a recruiter through the cell's invitation", () => {
  it("TA-090: the cell adds and verifies a company, registration of its identifier stays refused, the cell invites the recruiter, who accepts and reads the cell's live drive", async () => {
    const identifier = cin(1);
    const added = await asCollege("a", "tpoAUser", () => addCompany(tpoA(), { name: `ZZ TA090 Co 1 ${STAMP}`, identifier, sectors: ["IT_SOFTWARE"], pointOfContact: "ZZ desk" }));
    companyIds.push(added.id);
    await asCollege("a", "tpoAUser", () => verifyCompany(tpoA(), added.id));
    const drive = await owner.drive.create({ data: { schoolId: id.a!, companyId: added.id, kind: "ON_CAMPUS", title: `ZZ TA090 Analyst ${STAMP}`, packageMinRupees: 500_000, packageMaxRupees: 800_000, status: "OPEN", createdByUserId: id.tpoAUser! }, select: { id: true } });

    // The recruiter signs up and tries to register the same company: still refused.
    expect(await refusal(asRecruiter("r1", () => registerCompany(recruiter("r1"), { name: "ZZ TA090 Co 1", identifier, sectors: ["IT_SOFTWARE"], pointOfContact: "ZZ desk" })))).toEqual({ key: "placement.refuseCompanyTaken", status: 409 });

    // The cell that verified it invites the recruiter by address.
    const view = await asCollege("a", "tpoAUser", () => invite(tpoA(), added.id, MAIL("r1").toUpperCase()));
    expect(view.id).toBe(added.id);
    expect(view.recruiters).toBe(0); // an invitation is not a recruiter yet
    const pending = await owner.companyRecruiter.findUnique({ where: { companyId_userId: { companyId: added.id, userId: id.r1! } }, select: { acceptedAt: true, removedAt: true, addedByUserId: true } });
    expect(pending).toMatchObject({ acceptedAt: null, removedAt: null, addedByUserId: id.tpoAUser });
    const audit = await owner.auditLog.findFirst({ where: { schoolId: id.a!, action: "placement.company.recruiterInvite", targetId: added.id }, select: { actorUserId: true, meta: true } });
    expect(audit?.actorUserId).toBe(id.tpoAUser);
    expect(JSON.parse(String(audit?.meta))).toEqual({ invited: id.r1 });
    const notice = await owner.notification.findFirst({ where: { userId: id.r1!, titleKey: "placement.notifColleagueInvite" }, select: { url: true, titleVars: true } });
    expect(notice?.url).toBe("/recruiter");
    expect(String(notice?.titleVars)).toContain(`ZZ TA090 College A ${STAMP}`);

    // Before accepting the recruiter reads nothing of the company; the invitation waits.
    const before = await asRecruiter("r1", () => recruiterCompany(recruiter("r1")));
    expect(before.company).toBeNull();
    expect(before.invitations).toEqual([{ companyId: added.id, companyName: `ZZ TA090 Co 1 ${STAMP}` }]);
    expect((await asRecruiter("r1", () => recruiterDrives(recruiter("r1")))).drives).toEqual([]);

    // Accepted, through the colleagues' own flow: bound, and the cell's live drive is theirs to read.
    const after = await asRecruiter("r1", () => answerInvitation(recruiter("r1"), added.id, true));
    expect(after.company?.id).toBe(added.id);
    const { drives } = await asRecruiter("r1", () => recruiterDrives(recruiter("r1")));
    expect(drives.map((d) => d.id)).toEqual([drive.id]);
    // The cell now sees one recruiter.
    const [listed] = (await asCollege("a", "tpoAUser", () => listCompanies(tpoA()))).companies.filter((c) => c.id === added.id);
    expect(listed?.recruiters).toBe(1);
  });

  it("TA-090: the cell's answer is the same whether or not the address is a recruiter's, and only a recruiter's account is invited", async () => {
    const companyId = await company(2, { verifiedByTpoA: true, links: ["a"] });
    const unknown = await asCollege("a", "tpoAUser", () => invite(tpoA(), companyId, `zz-ta090-nobody-${STAMP}@test.invalid`));
    const plain = await asCollege("a", "tpoAUser", () => invite(tpoA(), companyId, MAIL("plain")));
    const real = await asCollege("a", "tpoAUser", () => invite(tpoA(), companyId, MAIL("r3")));
    const again = await asCollege("a", "tpoAUser", () => invite(tpoA(), companyId, MAIL("r3")));
    expect(plain).toEqual(unknown);
    expect(real).toEqual(unknown);
    expect(again).toEqual(unknown);
    const rows = await owner.companyRecruiter.findMany({ where: { companyId }, select: { userId: true, acceptedAt: true } });
    expect(rows).toEqual([{ userId: id.r3, acceptedAt: null }]);
    // The repeat press wrote nothing more: one audit row, one notice.
    expect(await owner.auditLog.count({ where: { schoolId: id.a!, action: "placement.company.recruiterInvite", targetId: companyId } })).toBe(1);
    expect(await owner.notification.count({ where: { userId: id.r3!, titleKey: "placement.notifColleagueInvite" } })).toBe(1);
  });

  it("TA-090: only the cell that verified the company may invite, only while no recruiter is bound, and nothing is written when refused", async () => {
    // Not verified by anybody yet.
    const unverified = await company(3, { links: ["a"] });
    expect(await refusal(asCollege("a", "tpoAUser", () => invite(tpoA(), unverified, MAIL("r6"))))).toEqual({ key: "placement.refuseInviteNotVerifier", status: 409 });
    // Verified by college A's cell; college B works with it too but did not verify it.
    const elsewhere = await company(4, { verifiedByTpoA: true, links: ["a", "b"] });
    expect(await refusal(asCollege("b", "tpoBUser", () => invite(tpoB(), elsewhere, MAIL("r6"))))).toEqual({ key: "placement.refuseInviteNotVerifier", status: 409 });
    // A company this college does not work with at all is not found.
    const stranger = await company(5, { verifiedByTpoA: true, links: [] });
    expect(await refusal(asCollege("b", "tpoBUser", () => invite(tpoB(), stranger, MAIL("r6"))))).toEqual({ key: "placement.noSuchCompany", status: "NOT_FOUND" });
    // A company with an accepted recruiter: they invite their own colleagues.
    const bound = await company(6, { verifiedByTpoA: true, links: ["a"], boundTo: "r4" });
    expect(await refusal(asCollege("a", "tpoAUser", () => invite(tpoA(), bound, MAIL("r6"))))).toEqual({ key: "placement.refuseCompanyHasRecruiter", status: 409 });
    expect(await owner.companyRecruiter.count({ where: { userId: id.r6! } })).toBe(0);
    expect(await owner.auditLog.count({ where: { action: "placement.company.recruiterInvite", targetId: { in: [unverified, elsewhere, stranger, bound] } } })).toBe(0);
  });

  it("TA-090: the operator invites a recruiter by the company's identifier to a company with no accepted binding; nobody else may", async () => {
    const companyId = await company(7);
    // Not the operator: refused as every operator door refuses.
    expect((await refusal(asCollege("a", "tpoAUser", () => operatorInvite(tpoA(), cin(7), MAIL("r2"))))).status).toBe("NOT_FOUND");
    // No such company.
    expect(await refusal(asOperator(() => operatorInvite(operator(), `U99999MH2026PTC${SUFFIX}`, MAIL("r2"))))).toEqual({ key: "placement.noSuchCompany", status: "NOT_FOUND" });
    // The answer is the same for any address.
    expect(await asOperator(() => operatorInvite(operator(), cin(7).toLowerCase(), `zz-ta090-nobody-${STAMP}@test.invalid`))).toEqual({ ok: true });
    expect(await asOperator(() => operatorInvite(operator(), cin(7), MAIL("r2")))).toEqual({ ok: true });
    const row = await owner.companyRecruiter.findUnique({ where: { companyId_userId: { companyId, userId: id.r2! } }, select: { acceptedAt: true, addedByUserId: true } });
    expect(row).toEqual({ acceptedAt: null, addedByUserId: id.op });
    const audit = await owner.auditLog.findFirst({ where: { schoolId: null, actorUserId: id.op!, action: "superuser.recruiter.invite", targetId: companyId }, select: { meta: true } });
    expect(JSON.parse(String(audit?.meta))).toEqual({ invited: id.r2 });
    expect(await owner.notification.count({ where: { userId: id.r2!, titleKey: "placement.notifOperatorInvite" } })).toBe(1);
    // Accepted: bound; a further invitation by the operator is refused, the company's recruiter invites colleagues.
    await asRecruiter("r2", () => answerInvitation(recruiter("r2"), companyId, true));
    expect(await refusal(asOperator(() => operatorInvite(operator(), cin(7), MAIL("r6"))))).toEqual({ key: "placement.refuseCompanyHasRecruiter", status: 409 });
  });
});

describe("TA-090: the doors", () => {
  const P = "http://localhost/api/v1";
  const post = (path: string, body: unknown) => new Request(`${P}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  async function signIn(userId: string, opts: { schoolId?: string | null; role?: "TPO" | null } = {}) {
    __resetCookies();
    __setHeaders({ "user-agent": AGENT });
    await createSession(userId, opts);
  }

  it("TA-090: the catalog names the cell's door and the operator's door", () => {
    const cell = ENDPOINTS.find((e) => e.method === "POST" && e.path === "/api/v1/placement/companies/{companyId}/invite-recruiter");
    expect(cell?.access).toEqual(["TPO"]);
    expect(cell?.module).toBe("PLACEMENT");
    const op = ENDPOINTS.find((e) => e.method === "POST" && e.path === "/api/v1/operator/companies/invite-recruiter");
    expect(op?.access).toBe("operator");
  });

  it("TA-090: the cell's door invites, answers the company and refuses an empty body; the operator's door answers ok and refuses a TPO", async () => {
    const { POST: cellPost } = await import("@/app/api/v1/placement/companies/[companyId]/invite-recruiter/route");
    const { POST: opPost } = await import("@/app/api/v1/operator/companies/invite-recruiter/route");
    const companyId = await company(8, { verifiedByTpoA: true, links: ["a"] });
    await signIn(id.tpoAUser!, { schoolId: id.a!, role: "TPO" });
    const empty = await cellPost(post(`/placement/companies/${companyId}/invite-recruiter`, {}), { params: Promise.resolve({ companyId }) });
    expect(empty.status).toBe(422);
    const done = await cellPost(post(`/placement/companies/${companyId}/invite-recruiter`, { email: MAIL("r5") }), { params: Promise.resolve({ companyId }) });
    expect(done.status).toBe(200);
    expect(await done.json()).toMatchObject({ id: companyId, recruiters: 0 });
    expect(await owner.companyRecruiter.count({ where: { companyId, userId: id.r5!, acceptedAt: null } })).toBe(1);
    // The TPO is no operator.
    const refused = await opPost(post("/operator/companies/invite-recruiter", { identifier: cin(9), email: MAIL("r5") }));
    expect(refused.status).toBe(403);
    const other = await company(9);
    await signIn(id.op!);
    expect((await opPost(post("/operator/companies/invite-recruiter", {}))).status).toBe(422);
    const ok = await opPost(post("/operator/companies/invite-recruiter", { identifier: cin(9), email: MAIL("r5") }));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ ok: true });
    expect(await owner.companyRecruiter.count({ where: { companyId: other, userId: id.r5!, acceptedAt: null } })).toBe(1);
  });
});
