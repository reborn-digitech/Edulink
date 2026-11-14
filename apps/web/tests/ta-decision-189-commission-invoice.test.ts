/**
 * TA-189, built as the owner decided on 14 November 2026 (option 1): a teacher's commission invoice is opened by the
 * person it is addressed to, whatever their role, and by the operator. recordPayout issues a GigInvoice for a
 * teacher's sold guidance seats and tells them "your invoice is ready", but the only door that rendered one was the
 * expert's (EXPERT role, EXPERT_SESSIONS), so neither the teacher nor the operator could open it. Now:
 *
 *   - invoiceView reads the addressee's own whatever role they are signed in as, the operator's any, anybody else's
 *     not found;
 *   - GET /api/v1/account/gig-invoices/{invoiceId}/pdf is the addressee's door, under both session features
 *     ("any of") and plan-free, open to every signed-in role, catalogued with a sample;
 *   - GET /api/v1/operator/gigs/invoices/{invoiceId}/pdf is the operator's, catalogued with the fixture's sample;
 *   - the teacher's guidance view (GET /api/v1/gigs/slots) carries the invoices addressed to them, and the guidance
 *     page, the operator's gigs page and the phone link the PDFs.
 *
 * As the database's owner (tests/setup.ts). A scratch ZZ school of the suite's own with a teacher (who is also the
 * office there), a second teacher and an operator; the payout and the invoice rows are made directly, addressed to
 * the teacher, and removed afterwards with everything else the suite made.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PLATFORM_FEATURES } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { invoiceView } from "@/lib/gig-payments";
import { mySlots } from "@/lib/gig-sessions";
import { ENDPOINTS } from "@/lib/api-catalog";
import { featuresOf } from "@/lib/api-catalog/types";
import { gateRequest } from "@/lib/role-gate";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { FeatureOffError } from "@/lib/access-error";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });
const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-d189-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const ADDRESSEE_DOOR = "/api/v1/account/gig-invoices/{invoiceId}/pdf";
const OPERATOR_DOOR = "/api/v1/operator/gigs/invoices/{invoiceId}/pdf";
const params = (invoiceId: string) => ({ params: Promise.resolve({ invoiceId }) });
const req = (path: string) => new Request(`http://localhost${path}`);

async function as(who: "teacher" | "other" | "operator", role: "TEACHER" | "ADMIN" | null): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  if (role) await createSession(ids[who]!, { schoolId: ids.school!, role });
  else await createSession(ids[who]!);
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}
function signedOut() {
  __resetCookies();
  __setHeaders({});
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ D189 School ${STAMP}`, slug: `zz-d189-${STAMP}`, code: `ZZD189${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", teacherGuidanceOn: true, isTestFixture: true }, select: { id: true } })).id;
  const user = async (key: string, extra: Record<string, unknown> = {}) => (ids[key] = (await db.user.create({ data: { name: `ZZ D189 ${key} ${STAMP}`, email: MAIL(key), isTestFixture: true, ...extra }, select: { id: true } })).id);
  await user("teacher");
  await user("other");
  await user("operator", { isSuperuser: true });
  await db.membership.create({ data: { userId: ids.teacher!, schoolId: ids.school!, role: "TEACHER", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: ids.teacher!, schoolId: ids.school!, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: ids.other!, schoolId: ids.school!, role: "TEACHER", status: "ACTIVE" } });
  const payout = await db.expertPayout.create({ data: { expertUserId: ids.teacher!, netPaise: 7640, paymentsCount: 1, status: "PAID", reference: `ZZD189${STAMP}`, paidAt: new Date() }, select: { id: true } });
  ids.payout = payout.id;
  const serial = 100_000 + (STAMP % 800_000);
  const invoice = await db.gigInvoice.create({
    data: {
      number: `ZZC/D189/${serial}`,
      series: `ZZC/D189-${STAMP}`,
      serial,
      payoutId: payout.id,
      expertUserId: ids.teacher!,
      locale: "en",
      taxableValuePaise: 2000,
      cgstPaise: 180,
      sgstPaise: 180,
      igstPaise: 0,
      totalPaise: 2360,
      sacCode: "998599",
      sellerJson: JSON.stringify({ name: "ZZ Shalaghar Test Private Limited", gstin: "27AAACZ1234A1Z5", address: "ZZ 1 Test Road, Pune", stateCode: "27" }),
      buyerJson: JSON.stringify({ name: "ZZ D189 Teacher Payee", gstin: null, address: null, stateCode: "27" }),
      linesJson: JSON.stringify([{ paymentId: "zz-d189-payment", title: "ZZ D189 guidance", date: "2026-11-01", grossPaise: 10000, commissionPaise: 2000, gstPaise: 360 }]),
    },
    select: { id: true, number: true },
  });
  ids.invoice = invoice.id;
  ids.number = invoice.number;
});

afterAll(async () => {
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests([]);
  const users = ["teacher", "other", "operator"].map((k) => ids[k]).filter((x): x is string => Boolean(x));
  await db.gigInvoice.deleteMany({ where: { expertUserId: { in: users } } });
  await db.expertPayout.deleteMany({ where: { expertUserId: { in: users } } });
  await db.rateLimit.deleteMany({ where: { bucket: { in: users.map((u) => `pdf:${u}`) } } }).catch(() => {});
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId: ids.school ?? "none" }] } }).catch(() => {});
  await db.membership.deleteMany({ where: { userId: { in: users } } });
  if (ids.school) await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("who reads a commission invoice", () => {
  it("TA-189: the teacher it is addressed to reads it through invoiceView, as a teacher and as the office; another teacher's read is not found; the operator reads it", async () => {
    const asTeacher = await invoiceView(await as("teacher", "TEACHER"), ids.invoice!);
    expect(asTeacher).toMatchObject({ id: ids.invoice, number: ids.number, expertUserId: ids.teacher, totalPaise: 2360 });
    expect((await invoiceView(await as("teacher", "ADMIN"), ids.invoice!)).id).toBe(ids.invoice);
    await expect(invoiceView(await as("other", "TEACHER"), ids.invoice!)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await invoiceView(await as("operator", null), ids.invoice!)).id).toBe(ids.invoice);
  });

  it("TA-189: the addressee's door answers the teacher 200 application/pdf, whatever role they are signed in as; another teacher 404; signed out 401", async () => {
    const { GET } = await import("@/app/api/v1/account/gig-invoices/[invoiceId]/pdf/route");
    const path = `/api/v1/account/gig-invoices/${ids.invoice}/pdf`;
    await as("teacher", "TEACHER");
    const mine = await GET(req(path), params(ids.invoice!));
    expect(mine.status).toBe(200);
    expect(mine.headers.get("content-type")).toBe("application/pdf");
    expect(Buffer.from(await mine.arrayBuffer()).subarray(0, 5).toString()).toBe("%PDF-");
    await as("teacher", "ADMIN");
    expect((await GET(req(path), params(ids.invoice!))).status).toBe(200);
    await as("other", "TEACHER");
    expect((await GET(req(path), params(ids.invoice!))).status).toBe(404);
    signedOut();
    expect((await GET(req(path), params(ids.invoice!))).status).toBe(401);
  });

  it("TA-189: the operator's door answers the operator 200 application/pdf, a teacher (even the addressee) 403, and an id no invoice holds 404", async () => {
    const { GET } = await import("@/app/api/v1/operator/gigs/invoices/[invoiceId]/pdf/route");
    const path = `/api/v1/operator/gigs/invoices/${ids.invoice}/pdf`;
    await as("operator", null);
    const read = await GET(req(path), params(ids.invoice!));
    expect(read.status).toBe(200);
    expect(read.headers.get("content-type")).toBe("application/pdf");
    expect(Buffer.from(await read.arrayBuffer()).subarray(0, 5).toString()).toBe("%PDF-");
    expect((await GET(req("/api/v1/operator/gigs/invoices/zz-d189-no-such/pdf"), params(`zz-d189-no-such-${STAMP}`))).status).toBe(404);
    await as("teacher", "TEACHER");
    expect((await GET(req(path), params(ids.invoice!))).status).toBe(403);
  });
});

describe("the doors in the catalog and the gate", () => {
  it("TA-189: the addressee's door is catalogued under both session features, plan-free, for every signed-in role with a sample; the operator's is the operator's with the fixture's sample", async () => {
    const mine = ENDPOINTS.find((e) => e.method === "GET" && e.path === ADDRESSEE_DOOR);
    expect(mine, ADDRESSEE_DOOR).toBeTruthy();
    expect([...featuresOf(mine!)].sort()).toEqual(["EXPERT_SESSIONS", "TEACHER_SESSIONS"]);
    expect(mine!.planFree).toBeTruthy();
    expect(mine!.access).toBe("signed-in");
    expect(mine!.sample).toBeTruthy();
    const op = ENDPOINTS.find((e) => e.method === "GET" && e.path === OPERATOR_DOOR);
    expect(op, OPERATOR_DOOR).toBeTruthy();
    expect(op!.access).toBe("operator");
    expect(op!.feature).toBeUndefined();
    expect(typeof op!.sample).toBe("function");
    const sample = op!.sample as (f: { gigInvoiceId: string | null }) => string | null;
    expect(sample({ gigInvoiceId: "inv1" })).toBe("/api/v1/operator/gigs/invoices/inv1/pdf");

    // Plan-free under either feature: with guidance on and the expert gig off, a teacher holding no plan is let
    // through while the Teacher plan is active; with both off it is not here.
    const route = `GET /api/v1/account/gig-invoices/${ids.invoice}/pdf`;
    try {
      setFeaturesForTests(["TEACHER_SESSIONS"]);
      setActivePlansForTests(["TEACHER", "EXPERT"]);
      expect(await gateRequest(route, { role: "TEACHER", schoolId: ids.school!, userId: ids.teacher! })).toBe("pass");
      setFeaturesForTests([]);
      await expect(gateRequest(route, { role: "TEACHER", schoolId: ids.school!, userId: ids.teacher! })).rejects.toBeInstanceOf(FeatureOffError);
    } finally {
      setFeaturesForTests([...PLATFORM_FEATURES]);
      setActivePlansForTests([]);
    }
  });
});

describe("where the invoice is linked", () => {
  it("TA-189: the teacher's guidance view lists the invoices addressed to them, and another teacher's lists none of them", async () => {
    const mine = await mySlots(await as("teacher", "TEACHER"));
    expect(mine.kind).toBe("TEACHER");
    expect((mine as { invoices?: { id: string; number: string; totalPaise: number }[] }).invoices).toEqual([expect.objectContaining({ id: ids.invoice, number: ids.number, totalPaise: 2360 })]);
    const theirs = await mySlots(await as("other", "TEACHER"));
    expect(((theirs as { invoices?: { id: string }[] }).invoices ?? []).some((i) => i.id === ids.invoice)).toBe(false);
  });

  it("TA-189: the guidance page links the addressee's door and the operator's gigs page the operator's", () => {
    const read = (p: string) => readFileSync(resolve(__dirname, "..", p), "utf8");
    expect(read("src/components/gigs/provider-screen.tsx")).toContain("/api/v1/account/gig-invoices/");
    expect(read("src/app/root/gigs/page.tsx")).toContain("/api/v1/operator/gigs/invoices/");
  });

  it("TA-189: the page sweep expects the addressee's door by the session switches (200 while either is on, 404 while both are off), never a bare 200", () => {
    // check() adjusts its expectation for a feature's pages only (pageGate is null under /api), so a plain sweep with
    // EXPERT_SESSIONS and TEACHER_SESSIONS both off would fail a literal 200 falsely (the second reader's concern).
    const sweep = readFileSync(resolve(__dirname, "..", "scripts/sweep.ts"), "utf8");
    const block = sweep.slice(sweep.indexOf("// decision-189 (TA-189)"), sweep.indexOf("// end decision-189"));
    expect(block.length).toBeGreaterThan(0);
    const addresseeChecks = block.split("\n").filter((l) => l.includes("await check(zzExpert, `/api/v1/account/gig-invoices/"));
    expect(addresseeChecks.length).toBe(1);
    expect(addresseeChecks[0]).not.toMatch(/\/pdf`,\s*200\s*,/);
    expect(block).toMatch(/gate\.on\.has\("EXPERT_SESSIONS"\)\s*\|\|\s*gate\.on\.has\("TEACHER_SESSIONS"\)\s*\?\s*200\s*:\s*404/);
    // The catalog agrees: the door asks the switches alone ("any of", plan-free), and is not found while both are off.
    const door = ENDPOINTS.find((e) => e.method === "GET" && e.path === ADDRESSEE_DOOR)!;
    expect([...featuresOf(door)].sort()).toEqual(["EXPERT_SESSIONS", "TEACHER_SESSIONS"]);
    expect(door.planFree).toBeTruthy();
  });
});
