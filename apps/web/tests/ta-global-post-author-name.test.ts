/**
 * TA-005 (testing analysis of 13 November 2026, High): a pupil's full name is
 * shown on a global post's own page and door to readers at every other school.
 *
 * The global feed's LIST keeps the rule of security assessment 2026-09-24,
 * finding 11 — "a pupil is a first name on the global feed" (global-feed.ts) —
 * and tests/bulletin-global-hold.test.ts holds the list to it. The post's own
 * read does not: `getPost` (src/lib/bulletin.ts) admits any reader to an
 * approved GLOBAL post and returns the author's and every commenter's `name`
 * and `preferredName` as stored, and `readPost` (src/lib/api-reads/shared.ts),
 * the page and the phone print them. The feed's card links to that page.
 *
 * Two ZZ schools of this suite's own (made here, removed after). At A, a pupil
 * writes a post, the admin approves it and shares it on the global feed, and a
 * second pupil's comment on it is approved by the same admin. A teacher of A
 * and a teacher of B then read the post through the library and through
 * GET /api/v1/shared/bulletin/{postId}, each in a real session.
 *
 * EXPECTED ONCE FIXED: to the reader at B the author and the commenter are a
 * first name and their surnames appear nowhere in what is returned; the
 * pupils' own school reads the names in full, as before.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { addComment, createPost, getPost, moderateComment, moderatePost } from "@/lib/bulletin";
import { listGlobalFeed, publishGlobally } from "@/lib/global-feed";
import { GET as postGet } from "@/app/api/v1/shared/bulletin/[postId]/route";

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-ta005-${who}-${STAMP}@test.invalid`;
// Surnames no other row or sentence carries, so "nowhere in the JSON" means what it says.
const AUTHOR_SURNAME = `Zzsharma${TAIL}`;
const COMMENTER_SURNAME = `Zzkulkarni${TAIL}`;
const AUTHOR_FULL = `Aarav ${AUTHOR_SURNAME}`;
const COMMENTER_FULL = `Meera ${COMMENTER_SURNAME}`;
const ids: Record<string, string> = {};

async function as(who: string, role: string, school: "A" | "B"): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids[school]!, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}

const nameOf = (person: { name: string; preferredName?: string | null }) => person.preferredName ?? person.name;
const surnamesIn = (value: unknown) => [AUTHOR_SURNAME, COMMENTER_SURNAME].filter((surname) => JSON.stringify(value).includes(surname));

type DoorBody = { author: { name: string }; comments: { author: { name: string } }[] };
async function door(): Promise<{ status: number; text: string; body: DoorBody }> {
  const res = await postGet(new Request("http://localhost/x"), { params: Promise.resolve({ postId: ids.post! }) });
  const text = await res.text();
  return { status: res.status, text, body: JSON.parse(text) as DoorBody };
}

beforeAll(async () => {
  for (const key of ["A", "B"] as const) {
    ids[key] = (
      await db.school.create({
        data: { name: `ZZ TA005 School ${key} ${STAMP}`, slug: `zz-ta005-${key.toLowerCase()}-${STAMP}`, code: `ZT5${key}${TAIL}`, contactEmail: MAIL(`contact-${key.toLowerCase()}`), timezone: "Asia/Kolkata", isTestFixture: true },
        select: { id: true },
      })
    ).id;
  }
  const person = async (who: string, school: "A" | "B", role: string, name: string, extra: { preferredName?: string; isMinor?: boolean } = {}) => {
    ids[who] = (await db.user.create({ data: { name, email: MAIL(who), prefs: "{}", ...extra }, select: { id: true } })).id;
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids[school]!, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("author", "A", "STUDENT", `ZZ ${AUTHOR_FULL}`, { preferredName: AUTHOR_FULL, isMinor: true });
  await person("commenter", "A", "STUDENT", `ZZ ${COMMENTER_FULL}`, { preferredName: COMMENTER_FULL, isMinor: true });
  await person("adminA", "A", "ADMIN", "ZZ TA005 Admin A");
  await person("teacherA", "A", "TEACHER", "ZZ TA005 Teacher A");
  await person("teacherB", "B", "TEACHER", "ZZ TA005 Teacher B");

  // The ordinary flow: the pupil's post, approved by their own school and then shared with every school.
  const created = await createPost(await as("author", "STUDENT", "A"), { scope: "SCHOOL", title: `ZZ TA005 science fair ${STAMP}`, body: "Our volcano won a prize.", tags: [], media: [] });
  ids.post = created.postId;
  await moderatePost(await as("adminA", "ADMIN", "A"), ids.post, "APPROVE");
  await publishGlobally(await as("adminA", "ADMIN", "A"), ids.post);
  // A classmate's comment: held, as every comment on a global post is, and approved by their own school.
  await addComment(await as("commenter", "STUDENT", "A"), ids.post, "I helped with the lava.");
  ids.comment = (await db.comment.findFirstOrThrow({ where: { postId: ids.post, authorUserId: ids.commenter! }, select: { id: true } })).id;
  await moderateComment(await as("adminA", "ADMIN", "A"), ids.comment, "APPROVE");
}, 120_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { startsWith: "zz-ta005-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  const schools = [ids.A, ids.B].filter((x): x is string => Boolean(x));
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  // The post and comment counters these people ran up (bulletin.ts keys a post on the membership, a comment on the person).
  const memberships = await db.membership.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
  await db.rateLimit.deleteMany({ where: { bucket: { in: [...memberships.map((m) => `post:${m.id}`), ...userIds.map((id) => `comment:${id}`)] } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: { in: userIds } }] } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-005: a pupil's post shared on the global feed, read at another school", () => {
  it("the arrangement: the post is GLOBAL and approved, the classmate's comment approved, and the feed's list names the child by first name", async () => {
    const post = await db.post.findUniqueOrThrow({ where: { id: ids.post! }, select: { scope: true, status: true, schoolId: true, authorUserId: true } });
    expect(post).toEqual({ scope: "GLOBAL", status: "APPROVED", schoolId: ids.A, authorUserId: ids.author });
    const comment = await db.comment.findUniqueOrThrow({ where: { id: ids.comment! }, select: { status: true, schoolId: true, authorUserId: true } });
    expect(comment).toEqual({ status: "APPROVED", schoolId: ids.A, authorUserId: ids.commenter });
    // The rule the list keeps, and the page should: finding 11 of the security assessment of 24 September 2026.
    const feed = await listGlobalFeed(await as("teacherB", "TEACHER", "B"));
    expect(feed.find((p) => p.id === ids.post)?.authorName).toBe("Aarav");
  });

  it("the pupils' own school reads both names in full, through the library and the door", async () => {
    const view = await getPost(await as("teacherA", "TEACHER", "A"), ids.post!);
    expect(nameOf(view.author)).toBe(AUTHOR_FULL);
    expect(view.comments.map((c) => nameOf(c.author))).toEqual([COMMENTER_FULL]);
    await as("teacherA", "TEACHER", "A");
    const own = await door();
    expect(own.status).toBe(200);
    expect({ author: own.body.author.name, commenters: own.body.comments.map((c) => c.author.name) }).toEqual({ author: AUTHOR_FULL, commenters: [COMMENTER_FULL] });
  });

  it("⚠ getPost gives a reader at another school the author's first name only", async () => {
    const view = await getPost(await as("teacherB", "TEACHER", "B"), ids.post!);
    expect(nameOf(view.author)).toBe("Aarav");
  });

  it("⚠ …and the approved commenter's first name only", async () => {
    const view = await getPost(await as("teacherB", "TEACHER", "B"), ids.post!);
    expect(view.comments.map((c) => nameOf(c.author))).toEqual(["Meera"]);
  });

  it("⚠ …with neither pupil's surname anywhere in what getPost returns", async () => {
    const view = await getPost(await as("teacherB", "TEACHER", "B"), ids.post!);
    expect(surnamesIn(view)).toEqual([]);
  });

  it("⚠ GET /api/v1/shared/bulletin/{postId} answers that reader with first names and no surname in the JSON", async () => {
    await as("teacherB", "TEACHER", "B");
    const read = await door();
    expect(read.status).toBe(200);
    expect({ author: read.body.author.name, commenters: read.body.comments.map((c) => c.author.name), surnamesInJson: surnamesIn(read.body) }).toEqual({ author: "Aarav", commenters: ["Meera"], surnamesInJson: [] });
  });
});
