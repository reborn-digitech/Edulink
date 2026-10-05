/**
 * Student council notices (risks batch 5A, 5 October 2026), through their /api/v1 doors and the bulletin's
 * own, at a ZZ college of this suite's own (IQAC on, so the committee desk's refusal is reached).
 *
 * What is proved: with no council a student reads none and cannot post (409); the office names the council by
 * student code and a code naming nobody is refused with the code; the IQAC committee desk refuses the council's
 * kind; a member posts a notice that waits for review and is for everyone whatever audience it asked; a
 * student not on the council is refused; nobody can pick the COUNCIL category through the ordinary composer;
 * the office's notice is live at once; readers see the council's name — not the writer's — on the feed and the
 * post, with no profile door, while the review desk sees both; and the category reads like any other.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { GET as councilGet, POST as councilPost } from "@/app/api/v1/shared/bulletin/council/route";
import { POST as officeCouncilPost } from "@/app/api/v1/office/council/route";
import { GET as feedGet, POST as feedPost } from "@/app/api/v1/shared/bulletin/route";
import { GET as postGet } from "@/app/api/v1/shared/bulletin/[postId]/route";
import { POST as reviewPost } from "@/app/api/v1/shared/bulletin/[postId]/review/route";
import { POST as committeePost } from "@/app/api/v1/iqac/committees/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);

const u: Record<string, string> = {};
const m: Record<string, string> = {};
const id: Record<string, string> = {};

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <K extends string>(k: K, v: string) => ({ params: Promise.resolve({ [k]: v } as Record<K, string>) });
async function body<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
async function as(who: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(u[who]!, { schoolId: id.school!, role: role as never });
}
type Feed = { items: { id: string; title: string; authorName: string; category: string; status: string }[] };

beforeAll(async () => {
  id.school = (await db.school.create({ data: { name: `ZZ Council College ${STAMP}`, slug: `zz-council-${STAMP}`, code: `ZCN${SUFFIX}`, contactEmail: `zz-council-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: [{ schoolId: id.school, module: "IQAC" }, { schoolId: id.school, module: "ACADEMICS" }] });
  const people: [string, string][] = [["admin", "ADMIN"], ["principal", "PRINCIPAL"], ["s1", "STUDENT"], ["s2", "STUDENT"]];
  for (const [who, role] of people) {
    u[who] = (await db.user.create({ data: { name: `ZZ Council ${who}`, email: `zz-council-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
    m[who] = (await db.membership.create({ data: { userId: u[who]!, schoolId: id.school, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZCS${who}${SUFFIX}` } : {}) }, select: { id: true } })).id;
  }
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: id.school! } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the council", () => {
  it("is none until the office names one, and nobody posts for it", async () => {
    await as("s1", "STUDENT");
    expect(await body(await councilGet())).toMatchObject({ council: null, canPost: false, canKeep: false });
    expect((await councilPost(json("/api/v1/shared/bulletin/council", { title: "ZZ Too early" }))).status).toBe(409);
  });

  it("is named by the office by student code; a code naming nobody is refused with the code", async () => {
    await as("admin", "ADMIN");
    const refused = await officeCouncilPost(json("/api/v1/office/council", { name: "ZZ Student Council", members: [{ code: `ZCSs1${SUFFIX}`, role: "President" }, { code: "ZZ-NOBODY" }] }));
    expect(refused.status).toBe(422);
    expect((await body<{ error: string }>(refused)).error).toContain("ZZ-NOBODY");
    const saved = await officeCouncilPost(json("/api/v1/office/council", { name: "ZZ Student Council", members: [{ code: `zcss1${SUFFIX}`, role: "President" }] }));
    expect(saved.status).toBe(200);
    const view = await body<{ council: { id: string; members: { membershipId: string; role: string }[] }; canKeep: boolean }>(saved);
    expect(view.council.members).toEqual([expect.objectContaining({ membershipId: m.s1, role: "President" })]);
    expect(view.canKeep).toBe(true);
    id.council = view.council.id;
    expect(await db.auditLog.count({ where: { schoolId: id.school, action: "council.save" } })).toBe(1);
  });

  it("is not written by the IQAC committee desk, which names members as text", async () => {
    await as("admin", "ADMIN");
    expect((await committeePost(json("/api/v1/iqac/committees", { kind: "STUDENT_COUNCIL", name: "ZZ Rival Council", members: [{ name: "ZZ Somebody" }] }))).status).toBe(422);
  });
});

describe("a notice", () => {
  it("from a member waits for review, signed by the council and for everyone", async () => {
    await as("s1", "STUDENT");
    expect(await body(await councilGet())).toMatchObject({ canPost: true });
    const res = await councilPost(json("/api/v1/shared/bulletin/council", { title: "ZZ Council elections on Friday", body: "ZZ Nominations open.", audience: "PARENTS" }));
    expect(res.status).toBe(201);
    const made = await body<{ postId: string; status: string }>(res);
    expect(made.status).toBe("PENDING");
    id.studentNotice = made.postId;
    const row = await db.post.findUniqueOrThrow({ where: { id: made.postId }, select: { category: true, authorCommitteeId: true, audience: true, scope: true } });
    expect(row).toEqual({ category: "COUNCIL", authorCommitteeId: id.council, audience: "ALL", scope: "SCHOOL" });
  });

  it("is refused to a student not on the council", async () => {
    await as("s2", "STUDENT");
    expect(await body(await councilGet())).toMatchObject({ canPost: false });
    expect((await councilPost(json("/api/v1/shared/bulletin/council", { title: "ZZ Not a member" }))).status).toBe(403);
  });

  it("cannot be signed as the council through the ordinary composer", async () => {
    await as("s1", "STUDENT");
    expect((await feedPost(json("/api/v1/shared/bulletin", { scope: "SCHOOL", category: "COUNCIL", title: "ZZ Fake council", body: "", tags: [], media: [] }))).status).toBe(403);
    await as("admin", "ADMIN");
    expect((await feedPost(json("/api/v1/shared/bulletin", { scope: "SCHOOL", category: "COUNCIL", title: "ZZ Fake council", body: "", tags: [], media: [] }))).status).toBe(403);
    expect(await db.post.count({ where: { schoolId: id.school, title: "ZZ Fake council" } })).toBe(0);
  });

  it("from the office is live at once and reads as the council's", async () => {
    await as("admin", "ADMIN");
    const res = await councilPost(json("/api/v1/shared/bulletin/council", { title: "ZZ Council meeting minutes", audience: "ALL" }));
    expect(await body(res)).toMatchObject({ status: "APPROVED" });
    // The student's waits: the office approves it.
    expect((await reviewPost(json(`/api/v1/shared/bulletin/${id.studentNotice}/review`, { decision: "APPROVE" }), params("postId", id.studentNotice!))).status).toBe(200);
    // The review desk sees the writer beside the council.
    const desk = await body<Feed>(await feedGet(get("/api/v1/shared/bulletin?category=COUNCIL")));
    expect(desk.items.find((p) => p.id === id.studentNotice)?.authorName).toBe("ZZ Student Council · ZZ Council s1");
  });

  it("is signed by the council for every other reader, on the feed and the post", async () => {
    await as("s2", "STUDENT");
    const feed = await body<Feed>(await feedGet(get("/api/v1/shared/bulletin?category=COUNCIL")));
    expect(feed.items.map((p) => p.title).sort()).toEqual(["ZZ Council elections on Friday", "ZZ Council meeting minutes"]);
    expect(new Set(feed.items.map((p) => p.authorName))).toEqual(new Set(["ZZ Student Council"]));
    expect(feed.items.every((p) => p.category === "COUNCIL")).toBe(true);
    const post = await body<{ author: { name: string; membershipId?: string | null } }>(await postGet(get(`/api/v1/shared/bulletin/${id.studentNotice}`), params("postId", id.studentNotice!)));
    expect(post.author.name).toBe("ZZ Student Council");
    expect(JSON.stringify(post)).not.toContain("ZZ Council s1");
  });
});
