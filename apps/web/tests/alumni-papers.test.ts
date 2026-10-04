/**
 * G-6 (campaign of 4 October 2026): a former pupil asks for a paper again.
 * The certificate-request doors are opened to ALUMNUS, the ask is filed on the
 * pupil membership the school's record is kept on, and the office may set a
 * fee — a demand on that membership's ledger, paid at the office, shown on the
 * request. Before, none of the fifteen doors naming ALUMNUS asked for a paper.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { gateRequest } from "@/lib/role-gate";
import { GET as requestsGet, POST as requestsPost } from "@/app/api/v1/family/certificate-requests/route";
import { POST as cancelPost } from "@/app/api/v1/family/certificate-requests/[requestId]/cancel/route";
import { POST as feePost } from "@/app/api/v1/office/certificate-requests/[requestId]/fee/route";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { school: "", admin: "", alumnusUser: "", pupil: "", stranger: "", request: "" };
const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = (requestId: string) => ({ params: Promise.resolve({ requestId }) });
async function as(userId: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId: ids.school, role: role as never });
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Alumni Papers ${STAMP}`, slug: `zz-alumni-papers-${STAMP}`, code: `ZAP${String(STAMP).slice(-6)}`, contactEmail: `zz-alumni-papers-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "ALUMNI" } });
  await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-04-01T00:00:00Z"), endDate: new Date("2027-03-31T00:00:00Z"), isCurrent: true } });
  await db.certificateTemplate.create({ data: { schoolId: ids.school, kind: "BONAFIDE", name: "ZZ Bonafide", title: "Bonafide Certificate", serialPrefix: "BC" } });
  await db.feeHead.create({ data: { schoolId: ids.school, name: "ZZ Other", code: "OTH", kind: "OTHER" } });
  const user = (who: string) => db.user.create({ data: { name: `ZZ Papers ${who}`, email: `zz-papers-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, alumnus, stranger] = await Promise.all([user("Admin"), user("Alumnus"), user("Stranger")]);
  ids.alumnusUser = alumnus.id;
  ids.stranger = stranger.id;
  ids.admin = admin.id;
  await db.membership.create({ data: { userId: admin.id, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" } });
  ids.pupil = (await db.membership.create({ data: { userId: alumnus.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", leftAt: new Date("2026-05-01T00:00:00Z") }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: alumnus.id, schoolId: ids.school, role: "ALUMNUS", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: stranger.id, schoolId: ids.school, role: "ALUMNUS", status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a former pupil's papers", () => {
  it("the gate lets an alumnus through the request doors", async () => {
    await expect(gateRequest("GET /api/v1/family/certificate-requests", { role: "ALUMNUS", schoolId: ids.school })).resolves.toBe("pass");
    await expect(gateRequest("POST /api/v1/family/certificate-requests", { role: "ALUMNUS", schoolId: ids.school })).resolves.toBe("pass");
  });

  it("asks through the pupil membership, and sees the kinds the school offers", async () => {
    await as(ids.alumnusUser, "ALUMNUS");
    const list = await requestsGet(get("/api/v1/family/certificate-requests"));
    expect(list.status).toBe(200);
    expect((await list.json()).kinds).toEqual(["BONAFIDE"]);
    const made = await requestsPost(json("/api/v1/family/certificate-requests", { kind: "BONAFIDE", purpose: "ZZ No-objection for a master's programme" }));
    expect(made.status).toBe(201);
    const body = await made.json();
    expect(body.studentMembershipId).toBe(ids.pupil);
    ids.request = body.id;
  });

  it("carries the fee the office sets, as one demand on the pupil's ledger, read back on the request", async () => {
    await as(ids.admin, "ADMIN");
    expect((await feePost(json("/x", {}), params(ids.request))).status).toBe(422);
    expect((await feePost(json("/x", { amountPaise: 15_000 }), params(ids.request))).status).toBe(200);
    expect((await feePost(json("/x", { amountPaise: 15_000 }), params(ids.request))).status).toBe(200);
    const demands = await db.feeDemand.findMany({ where: { studentMembershipId: ids.pupil }, select: { id: true, netPaise: true, status: true } });
    expect(demands).toEqual([expect.objectContaining({ netPaise: 15_000, status: "OPEN" })]);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "certificate.requestFee" } })).toBe(1);
    await as(ids.alumnusUser, "ALUMNUS");
    const mine = (await (await requestsGet(get("/api/v1/family/certificate-requests"))).json()).items[0];
    expect(mine).toMatchObject({ feePaise: 15_000, feePaid: false });
    // Once paid, the fee stands.
    await db.feeDemand.update({ where: { id: demands[0]!.id }, data: { paidPaise: 15_000, status: "PAID" } });
    await as(ids.admin, "ADMIN");
    expect((await feePost(json("/x", { amountPaise: 20_000 }), params(ids.request))).status).toBe(409);
  });

  it("is the asker's own: another alumnus cannot take it back", async () => {
    await as(ids.stranger, "ALUMNUS");
    expect((await cancelPost(json("/x", {}), params(ids.request))).status).toBe(404);
    await as(ids.alumnusUser, "ALUMNUS");
    expect((await (await cancelPost(json("/x", {}), params(ids.request))).json()).status).toBe("CANCELLED");
  });
});
