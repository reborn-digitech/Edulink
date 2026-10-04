/**
 * The global feed's changes of 4 October 2026 (src/lib/global-feed.ts).
 *
 * Four ZZ tenants of this suite's own — Alder, Birch and Deodar (schools) and
 * Cedar (a college) — and a person who left all four and holds an ALUMNUS row
 * at each. What is proved: an alumnus reads the feed, once, with the hides of
 * every school they belong to; the reader rule names every role (the module
 * and college staff read as staff, an expert and a recruiter not at all); a
 * post carries its publisher's kind and each tenant's admin chooses schools,
 * colleges or both; the platform's take-down hides a post from every tenant,
 * tells the publisher and is audited, and its restore puts it back; and a
 * guardian of an adult at a college reads nothing until the student grants
 * MESSAGES. An alumnus may react to another school's global post.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { globalReader, hideGlobalPost, listGlobalFeed, publishGlobally } from "@/lib/global-feed";
import { createPost, platformRestore, platformTakedown, toggleReaction } from "@/lib/bulletin";
import { setGlobalFeedKinds, globalFeedKinds } from "@/lib/college-profile";
import { setStudentConsent } from "@/lib/student-consent";
import { actionKey } from "@/lib/safety-labels";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const TAG = `ZZ GFC ${STAMP}`;
const schools: Record<"alder" | "birch" | "cedar" | "deodar", string> = { alder: "", birch: "", cedar: "", deodar: "" };
const admins: Record<string, ActiveContext> = {};
let alumnus: ActiveContext;
let parent: ActiveContext;
let adultStudent: ActiveContext;
let platform: ActiveContext;
const posts = { alder: "", cedar: "" };

function ctx(over: { userId: string; membershipId?: string | null; schoolId?: string | null; role?: ActiveContext["role"]; isAppAdmin?: boolean; isMinor?: boolean }): ActiveContext {
  return {
    sessionId: "test", membershipId: over.membershipId ?? null, schoolId: over.schoolId ?? null, role: over.role ?? null,
    user: { id: over.userId, name: `${TAG} actor`, preferredName: null, email: null, avatarKey: null, isMinor: over.isMinor ?? false, isSuperuser: false, isAppAdmin: over.isAppAdmin ?? false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}
const user = (who: string, extra: { isMinor?: boolean; isAppAdmin?: boolean } = {}) => db.user.create({ data: { name: `${TAG} ${who}`, email: `zz-gfc-${who.toLowerCase()}-${STAMP}@test.invalid`, prefs: "{}", ...extra }, select: { id: true } });
const ids = (list: { id: string }[]) => list.map((p) => p.id);

beforeAll(async () => {
  for (const [key, kind] of [["alder", "SCHOOL"], ["birch", "SCHOOL"], ["cedar", "COLLEGE"], ["deodar", "SCHOOL"]] as const) {
    const s = await db.school.create({ data: { name: `${TAG} ${key}`, slug: `zz-gfc-${key}-${STAMP}`, code: `ZGF${key[0]!.toUpperCase()}${String(STAMP).slice(-5)}`, contactEmail: `zz-gfc-${key}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind }, select: { id: true } });
    schools[key] = s.id;
    await db.schoolModule.create({ data: { schoolId: s.id, module: "ALUMNI" } });
    const a = await user(`Admin-${key}`);
    const m = await db.membership.create({ data: { userId: a.id, schoolId: s.id, role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
    admins[key] = ctx({ userId: a.id, membershipId: m.id, schoolId: s.id, role: "ADMIN" });
  }
  // One person, four alumnus rows: left Alder, Birch, Cedar and Deodar.
  const p = await user("Alumnus");
  let alderRow = "";
  for (const key of ["alder", "birch", "cedar", "deodar"] as const) {
    const row = await db.membership.create({ data: { userId: p.id, schoolId: schools[key], role: "ALUMNUS", status: "ACTIVE", joinedAt: new Date("2024-04-30T06:30:00Z") }, select: { id: true } });
    if (key === "alder") alderRow = row.id;
  }
  alumnus = ctx({ userId: p.id, membershipId: alderRow, schoolId: schools.alder, role: "ALUMNUS" });

  // An adult student at Cedar, and their guardian.
  const s = await user("Student");
  const sm = await db.membership.create({ data: { userId: s.id, schoolId: schools.cedar, role: "STUDENT", status: "ACTIVE" }, select: { id: true } });
  adultStudent = ctx({ userId: s.id, membershipId: sm.id, schoolId: schools.cedar, role: "STUDENT" });
  const g = await user("Guardian");
  await db.guardianship.create({ data: { parentUserId: g.id, studentMembershipId: sm.id, studentSchoolId: schools.cedar, relation: "PARENT", status: "ACTIVE" } });
  parent = ctx({ userId: g.id, role: "PARENT" });

  const team = await user("Platform", { isAppAdmin: true });
  platform = ctx({ userId: team.id, isAppAdmin: true });

  const a = await createPost(admins.alder!, { scope: "SCHOOL", title: `${TAG} Alder says`, body: "x", tags: [], media: [], category: "UPDATES" });
  await publishGlobally(admins.alder!, a.postId);
  posts.alder = a.postId;
  const c = await createPost(admins.cedar!, { scope: "SCHOOL", title: `${TAG} Cedar says`, body: "x", tags: [], media: [], category: "UPDATES" });
  await publishGlobally(admins.cedar!, c.postId);
  posts.cedar = c.postId;
});

afterAll(async () => {
  await db.platformTakedown.deleteMany({ where: { postId: { in: [posts.alder, posts.cedar].filter(Boolean) } } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: { in: Object.values(schools) } } });
  await db.school.deleteMany({ where: { id: { in: Object.values(schools).filter(Boolean) } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("who reads the global feed", () => {
  it("names every role: staff of every kind, a pupil and an alumnus by their own age, a guardian through the children; never an expert or a recruiter", () => {
    for (const role of ["ADMIN", "PRINCIPAL", "TEACHER", "DRIVER", "LIBRARIAN", "WARDEN", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"] as const) expect(globalReader(role)).toBe("staff");
    expect(globalReader("STUDENT")).toBe("pupil");
    expect(globalReader("ALUMNUS")).toBe("pupil");
    expect(globalReader("PARENT")).toBe("family");
    expect(globalReader("EXPERT")).toBeNull();
    expect(globalReader("RECRUITER")).toBeNull();
    expect(globalReader(null)).toBeNull();
  });

  it("is read by an alumnus of four schools once, with the hides of every school they belong to", async () => {
    const before = await listGlobalFeed(alumnus);
    const mine = before.filter((p) => p.title.startsWith(TAG));
    expect(ids(mine).sort()).toEqual([posts.alder, posts.cedar].sort());
    expect(new Set(ids(before)).size).toBe(before.length);
    // Deodar, one of the four, hides Alder's post: gone from the person's one feed, though they read it as Alder's alumnus.
    await hideGlobalPost(admins.deodar!, posts.alder, "ZZ not for us");
    const after = (await listGlobalFeed(alumnus)).filter((p) => p.title.startsWith(TAG));
    expect(ids(after)).toEqual([posts.cedar]);
    // Alder's own office still reads it, unhidden there.
    expect(ids(await listGlobalFeed(admins.alder!))).toContain(posts.alder);
    await db.globalPostHide.deleteMany({ where: { postId: posts.alder } });
  });

  it("lets an alumnus react to another school's global post", async () => {
    expect(await toggleReaction(alumnus, posts.cedar, "CLAP")).toEqual({ added: true });
    expect(await toggleReaction(alumnus, posts.cedar, "CLAP")).toEqual({ added: false });
  });
});

describe("the kind filter", () => {
  it("stamps the publisher's kind on the post, and shows each tenant only the kinds its admin chose", async () => {
    const stamped = await db.post.findMany({ where: { id: { in: [posts.alder, posts.cedar] } }, select: { id: true, globalSchoolKind: true } });
    expect(Object.fromEntries(stamped.map((p) => [p.id, p.globalSchoolKind]))).toEqual({ [posts.alder]: "SCHOOL", [posts.cedar]: "COLLEGE" });
    expect(await globalFeedKinds(admins.birch!)).toEqual({ choice: "BOTH" });

    expect(await setGlobalFeedKinds(admins.birch!, "SCHOOLS")).toEqual({ choice: "SCHOOLS", changed: true });
    expect(await setGlobalFeedKinds(admins.birch!, "SCHOOLS")).toEqual({ choice: "SCHOOLS", changed: false });
    const birch = ids(await listGlobalFeed(admins.birch!));
    expect(birch).toContain(posts.alder);
    expect(birch).not.toContain(posts.cedar);

    await setGlobalFeedKinds(admins.cedar!, "COLLEGES");
    const cedar = ids(await listGlobalFeed(admins.cedar!));
    expect(cedar).toContain(posts.cedar);
    expect(cedar).not.toContain(posts.alder);

    // A person who belongs to several reads only what every one of them allows: Birch says schools, Cedar colleges — neither post.
    expect(ids(await listGlobalFeed(alumnus)).filter((id) => id === posts.alder || id === posts.cedar)).toEqual([]);

    await setGlobalFeedKinds(admins.birch!, "BOTH");
    await setGlobalFeedKinds(admins.cedar!, "BOTH");
    const audited = await db.auditLog.count({ where: { schoolId: { in: [schools.birch, schools.cedar] }, action: "feed.global.kinds" } });
    expect(audited).toBe(4);
    expect(actionKey("feed.global.kinds")).toBe("audit.feedGlobalKinds");
  });
});

describe("the platform's take-down", () => {
  it("hides the post from every tenant, tells the publisher, is audited, and is undone by a restore", async () => {
    await platformTakedown(platform, posts.cedar, "ZZ off the feed for everyone");
    for (const key of ["alder", "birch", "deodar"] as const) expect(ids(await listGlobalFeed(admins[key]!))).not.toContain(posts.cedar);
    expect(ids(await listGlobalFeed(alumnus))).not.toContain(posts.cedar);
    const row = await db.auditLog.findFirst({ where: { schoolId: schools.cedar, action: "post.platformTakedown", targetId: posts.cedar }, select: { meta: true } });
    expect(row).not.toBeNull();
    const told = await db.notification.count({ where: { userId: admins.cedar!.user.id, schoolId: schools.cedar } });
    expect(told).toBeGreaterThan(0);
    await platformRestore(platform, posts.cedar);
    expect(ids(await listGlobalFeed(admins.birch!))).toContain(posts.cedar);
  });
});

describe("a guardian of an adult at a college", () => {
  it("reads nothing until the student grants MESSAGES, then reads the feed", async () => {
    expect(await listGlobalFeed(parent)).toEqual([]);
    await setStudentConsent(adultStudent, "MESSAGES", true);
    expect(ids(await listGlobalFeed(parent))).toContain(posts.cedar);
    await setStudentConsent(adultStudent, "MESSAGES", false);
    expect(await listGlobalFeed(parent)).toEqual([]);
  });
});
