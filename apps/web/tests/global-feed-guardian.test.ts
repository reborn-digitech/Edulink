import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { listGlobalFeed, publishGlobally, hideGlobalPost } from "@/lib/global-feed";
import { createPost } from "@/lib/bulletin";
import type { ActiveContext } from "@/lib/session";

/**
 * A guardian reads the global feed through their children's schools.
 *
 * Found by a person, not a battery: the feed keyed its hide set on
 * `session.schoolId`, so the page demanded an active school — and a parent
 * never has one, so every guardian bounced to a switcher with no school to
 * offer. The parent of two children at two schools is exactly who hit it.
 * What must hold now: the feed opens with no school bound, the hide set is
 * the UNION across the children's schools, and "ours" means a school one of
 * their children attends.
 */

const db = new PrismaClient();
const TAG = "ZZ GuardianFeed";

function ctx(over: { userId: string; membershipId?: string | null; schoolId?: string | null; role?: ActiveContext["role"] }): ActiveContext {
  return {
    sessionId: "test", membershipId: over.membershipId ?? null, schoolId: over.schoolId ?? null, role: over.role ?? null,
    user: { id: over.userId, name: `${TAG} actor`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}

let riversideId: string;
let oakfieldId: string;
let riversideAdmin: ActiveContext;
let oakfieldAdmin: ActiveContext;
let parent: ActiveContext;
let riversidePostId: string;
let oakfieldPostId: string;

async function cleanup() {
  await db.globalPostHide.deleteMany({ where: { post: { title: { startsWith: TAG } } } });
  await db.post.deleteMany({ where: { title: { startsWith: TAG } } });
  const users = await db.user.findMany({ where: { name: { startsWith: TAG } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  await db.guardianship.deleteMany({ where: { parentUserId: { in: ids } } });
  await db.enrollment.deleteMany({ where: { student: { userId: { in: ids } } } });
  await db.membership.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
}

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });
  riversideId = riverside.id;
  oakfieldId = oakfield.id;
  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const priyaAdmin = await db.membership.findFirstOrThrow({ where: { userId: priya.id, schoolId: riversideId, role: "ADMIN" } });
  riversideAdmin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId: riversideId, role: "ADMIN" });
  const sam = await db.user.findUniqueOrThrow({ where: { email: "sam@oakfield.school" } });
  const samAdmin = await db.membership.findFirstOrThrow({ where: { userId: sam.id, schoolId: oakfieldId, role: "ADMIN" } });
  oakfieldAdmin = ctx({ userId: sam.id, membershipId: samAdmin.id, schoolId: oakfieldId, role: "ADMIN" });

  await cleanup();

  // One child at each school, one guardian over both.
  const parentUser = await db.user.create({ data: { name: `${TAG} Parent`, prefs: "{}" } });
  for (const schoolId of [riversideId, oakfieldId]) {
    const child = await db.user.create({ data: { name: `${TAG} Child ${schoolId.slice(0, 4)}`, isMinor: true, prefs: "{}" } });
    const m = await db.membership.create({ data: { userId: child.id, schoolId, role: "STUDENT", status: "ACTIVE" } });
    await db.guardianship.create({ data: { parentUserId: parentUser.id, studentMembershipId: m.id, studentSchoolId: schoolId, relation: "PARENT", status: "ACTIVE" } });
  }
  parent = ctx({ userId: parentUser.id, role: "PARENT" });

  // A global post from each school.
  const rp = await createPost(riversideAdmin, { scope: "SCHOOL", title: `${TAG} Riverside says`, body: "x", tags: [], media: [], category: "UPDATES" });
  await publishGlobally(riversideAdmin, rp.postId);
  riversidePostId = rp.postId;
  const op = await createPost(oakfieldAdmin, { scope: "SCHOOL", title: `${TAG} Oakfield says`, body: "x", tags: [], media: [], category: "UPDATES" });
  await publishGlobally(oakfieldAdmin, op.postId);
  oakfieldPostId = op.postId;
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe("⚠ the guardian's global feed", () => {
  it("opens with no school bound and marks both children's schools as theirs", async () => {
    const feed = await listGlobalFeed(parent);
    const rPost = feed.find((p) => p.id === riversidePostId);
    const oPost = feed.find((p) => p.id === oakfieldPostId);
    expect(rPost).toBeDefined();
    expect(oPost).toBeDefined();
    expect(rPost!.ours).toBe(true);
    expect(oPost!.ours).toBe(true);
  });

  it("hides by the UNION of the children's schools — one school's hide is enough", async () => {
    // Riverside hides Oakfield's post for its community; Oakfield does not.
    await hideGlobalPost(riversideAdmin, oakfieldPostId, "Not for our lot.");
    const feed = await listGlobalFeed(parent);
    expect(feed.some((p) => p.id === oakfieldPostId)).toBe(false);
    // The Riverside post is untouched.
    expect(feed.some((p) => p.id === riversidePostId)).toBe(true);
    // An Oakfield PUPIL still sees it: the hide belongs to Riverside alone.
    const oakChild = await db.membership.findFirstOrThrow({ where: { schoolId: oakfieldId, user: { name: { startsWith: TAG } } } });
    const asOakChild = await listGlobalFeed(ctx({ userId: oakChild.userId, membershipId: oakChild.id, schoolId: oakfieldId, role: "STUDENT" }));
    expect(asOakChild.some((p) => p.id === oakfieldPostId)).toBe(true);
  });
});
