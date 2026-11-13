/**
 * The head's notes on staff (appraisal.ts), findings of the testing analysis of 13 November 2026 (batch
 * campus-library-inventory-payroll).
 *
 * TA-045: the office's and the head's read of one person's timeline had no visible-to-staff filter and no
 * own-membership check, so an office admin (or a second head) read the private notes written about themselves.
 * TA-289: updateAppraisal and deleteAppraisal checked only that the caller was a head, so a head rewrote or removed
 * what another head had written about them, while the create refused "notYourself".
 *
 * One scratch ZZ school of this suite's own with two PRINCIPAL memberships and an ADMIN, through the doors with
 * minted sessions and the library directly; removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as listGet, POST as createPost } from "@/app/api/v1/principal/staff/[membershipId]/appraisals/route";
import { DELETE as entryDelete, PUT as entryPut } from "@/app/api/v1/principal/appraisals/[id]/route";
import { todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const today = todayKey("Asia/Kolkata");
const ids = { school: "", admin: "", adminM: "", headA: "", headAM: "", headB: "", headBM: "" };

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown, method = "POST") => new Request(`http://localhost${path}`, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const list = (membershipId: string) => listGet(get(`/api/v1/principal/staff/${membershipId}/appraisals`), { params: Promise.resolve({ membershipId }) });
const create = (membershipId: string, body: unknown) => createPost(json(`/api/v1/principal/staff/${membershipId}/appraisals`, body), { params: Promise.resolve({ membershipId }) });
const update = (id: string, body: unknown) => entryPut(json(`/api/v1/principal/appraisals/${id}`, body, "PUT"), { params: Promise.resolve({ id }) });
const remove = (id: string) => entryDelete(new Request(`http://localhost/api/v1/principal/appraisals/${id}`, { method: "DELETE" }), { params: Promise.resolve({ id }) });
async function as(who: "ADMIN" | "HEAD_A" | "HEAD_B") {
  __resetCookies();
  if (who === "ADMIN") await createSession(ids.admin, { schoolId: ids.school, role: "ADMIN" });
  if (who === "HEAD_A") await createSession(ids.headA, { schoolId: ids.school, role: "PRINCIPAL" });
  if (who === "HEAD_B") await createSession(ids.headB, { schoolId: ids.school, role: "PRINCIPAL" });
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA Appraisal ${STAMP}`, slug: `zz-ta-appraisal-${STAMP}`, code: `ZTA${SUFFIX}`, contactEmail: `zz-ta-appraisal-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ TA Appraisal ${who}`, email: `zz-ta-appraisal-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, a, b] = await Promise.all([mk("Admin"), mk("HeadA"), mk("HeadB")]);
  Object.assign(ids, { admin: admin.id, headA: a.id, headB: b.id });
  ids.adminM = (await db.membership.create({ data: { userId: admin.id, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.headAM = (await db.membership.create({ data: { userId: a.id, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" }, select: { id: true } })).id;
  ids.headBM = (await db.membership.create({ data: { userId: b.id, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [ids.admin, ids.headA, ids.headB] } } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-045: the subject reading their own timeline through the office's door", () => {
  it("TA-045: the admin reads none of the head's private notes about them, and the one marked visible once it is", async () => {
    await as("HEAD_A");
    const res = await create(ids.adminM, { kind: "OBSERVATION", dateKey: today, summary: "ZZ private note on the office.", rating: 2 });
    expect(res.status).toBe(201);
    const { id } = (await res.json()) as { id: string };
    await as("ADMIN");
    const mine = (await (await list(ids.adminM)).json()) as { items: { id: string }[]; canEdit: boolean };
    expect(mine.items).toEqual([]);
    expect(mine.canEdit).toBe(false);
    await as("HEAD_A");
    expect((await update(id, { kind: "OBSERVATION", dateKey: today, summary: "ZZ now shown.", visibleToStaff: true })).status).toBe(200);
    await as("ADMIN");
    const shown = (await (await list(ids.adminM)).json()) as { items: { id: string; summary: string }[] };
    expect(shown.items.map((i) => i.id)).toEqual([id]);
    // The office still reads a colleague's private entries: its read of the school's records is unchanged.
    await as("HEAD_A");
    const ofHeadB = await create(ids.headBM, { kind: "TARGET", dateKey: today, summary: "ZZ private target for head B." });
    expect(ofHeadB.status).toBe(201);
    await as("ADMIN");
    expect(((await (await list(ids.headBM)).json()) as { items: unknown[] }).items).toHaveLength(1);
  });

  it("TA-045: a second head reads none of the first head's private notes about them", async () => {
    await as("HEAD_A");
    expect((await create(ids.headBM, { kind: "OBSERVATION", dateKey: today, summary: "ZZ private observation of head B." })).status).toBe(201);
    await as("HEAD_B");
    const own = (await (await list(ids.headBM)).json()) as { items: unknown[]; canEdit: boolean };
    expect(own.items).toEqual([]);
    expect(own.canEdit).toBe(false);
  });
});

describe("TA-289: a head rewriting or removing what another head wrote about them", () => {
  it("TA-289: head B's rewrite and delete of head A's entry about B are refused, and the entry stands as A wrote it", async () => {
    await as("HEAD_A");
    const res = await create(ids.headBM, { kind: "APPRAISAL", dateKey: today, summary: "ZZ the year's appraisal of head B.", rating: 2 });
    expect(res.status).toBe(201);
    const { id } = (await res.json()) as { id: string };
    await as("HEAD_B");
    expect((await update(id, { kind: "APPRAISAL", dateKey: today, summary: "ZZ rewritten by B.", rating: 5 })).status).toBe(403);
    expect((await remove(id)).status).toBe(403);
    const row = await db.staffAppraisal.findUniqueOrThrow({ where: { id }, select: { summary: true, rating: true } });
    expect(row).toEqual({ summary: "ZZ the year's appraisal of head B.", rating: 2 });
    // Head A still rewrites and removes their own entry about B.
    await as("HEAD_A");
    expect((await update(id, { kind: "APPRAISAL", dateKey: today, summary: "ZZ revised by A.", rating: 3 })).status).toBe(200);
    expect((await remove(id)).status).toBe(200);
  });
});
