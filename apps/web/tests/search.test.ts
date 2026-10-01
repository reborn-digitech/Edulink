/**
 * GET /api/v1/search — one search across what a person may already see.
 *
 * The fence is the whole feature, so the fence is what is pinned: a teacher
 * finds the pupils of their own classes and not another class's, a guardian
 * their own child and no other, a pupil no people at all; a post is found by
 * its title under the bulletin's visibility rule; a short `q` is refused
 * before any query runs; and nothing of another school ever appears,
 * whatever the word. The handler is invoked directly with a primed session,
 * the way api-v1-shared.test.ts does.
 *
 * Everything here is ZZ-prefixed and removed in afterAll, scoped to the two
 * schools this file creates.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { searchResultsSchema, type SearchResults } from "@edulink/contracts";
import { createSession, getSession } from "@/lib/session";
import { createPost } from "@/lib/bulletin";
import { openConversation } from "@/lib/conversations";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as searchGet } from "@/app/api/v1/search/route";

const db = new PrismaClient();
const STAMP = Date.now();
const tail = String(STAMP).slice(-6);
// A word no other row carries, so the search's answers are this file's alone.
const WORD = `Zzsrch${tail}`;

let schoolId = "";
let otherSchoolId = "";
let adminUserId = "";
let teacherUserId = "";
let otherTeacherUserId = "";
let pupilUserId = "";
let parentUserId = "";
let teacherMembershipId = "";
let pupilMembershipId = "";
let pupilBMembershipId = "";
let postId = "";
let threadId = "";
let conversationId = "";
let certificateId = "";
let cardId = "";

const get = (path: string) => new Request(`http://localhost${path}`);

async function as(userId: string, opts: { schoolId?: string | null; role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT" | "PARENT" }) {
  __resetCookies();
  await createSession(userId, opts);
}
const asAdmin = () => as(adminUserId, { schoolId, role: "ADMIN" });
const asTeacher = () => as(teacherUserId, { schoolId, role: "TEACHER" });
const asOtherTeacher = () => as(otherTeacherUserId, { schoolId, role: "TEACHER" });
const asPupil = () => as(pupilUserId, { schoolId, role: "STUDENT" });
const asParent = () => as(parentUserId, { role: "PARENT" });

async function search(q: string): Promise<SearchResults> {
  const response = await searchGet(get(`/api/v1/search?q=${encodeURIComponent(q)}`));
  expect(response.status).toBe(200);
  return searchResultsSchema.parse(await response.json());
}

beforeAll(async () => {
  const [a, b] = await Promise.all([
    db.school.create({ data: { name: `ZZ Search School ${STAMP}`, slug: `zz-search-${STAMP}`, code: `ZR${tail}`, contactEmail: `zz-search-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } }),
    db.school.create({ data: { name: `ZZ Search Other ${STAMP}`, slug: `zz-search-o-${STAMP}`, code: `ZQ${tail}`, contactEmail: `zz-search-o-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } }),
  ]);
  schoolId = a.id;
  otherSchoolId = b.id;

  const mk = (tag: string, name = `ZZ Search ${tag}`) => db.user.create({ data: { name, email: `zz-search-${tag}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, teacher, otherTeacher, pupil, pupilB, parent, otherAdmin, otherPupil] = await Promise.all([
    mk("admin"),
    mk("teacher"),
    mk("other-teacher"),
    // The two pupils and the stranger's pupil carry the word, so the fence and not the match decides who sees whom.
    mk("pupil", `ZZ Search ${WORD} Asha`),
    mk("pupil-b", `ZZ Search ${WORD} Bhavin`),
    mk("parent"),
    mk("other-admin"),
    mk("other-pupil", `ZZ Search ${WORD} Elsewhere`),
  ]);
  adminUserId = admin.id;
  teacherUserId = teacher.id;
  otherTeacherUserId = otherTeacher.id;
  pupilUserId = pupil.id;
  parentUserId = parent.id;

  const [am, tm, otm, pm, pbm, oam, opm] = await Promise.all([
    db.membership.create({ data: { userId: admin.id, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } }),
    db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } }),
    db.membership.create({ data: { userId: otherTeacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } }),
    db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZRA${STAMP}` }, select: { id: true } }),
    db.membership.create({ data: { userId: pupilB.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZRB${STAMP}` }, select: { id: true } }),
    db.membership.create({ data: { userId: otherAdmin.id, schoolId: otherSchoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } }),
    db.membership.create({ data: { userId: otherPupil.id, schoolId: otherSchoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZRC${STAMP}` }, select: { id: true } }),
  ]);
  void am;
  teacherMembershipId = tm.id;
  pupilMembershipId = pm.id;
  pupilBMembershipId = pbm.id;

  // Two classes: the teacher's (with Asha) and the other teacher's (with Bhavin).
  const [klassA, klassB, otherKlass] = await Promise.all([
    db.class.create({ data: { schoolId, name: `ZZ Search 5A`, gradeLevel: "5", joinCode: `ZRA${tail}` }, select: { id: true } }),
    db.class.create({ data: { schoolId, name: `ZZ Search 6B`, gradeLevel: "6", joinCode: `ZRB${tail}` }, select: { id: true } }),
    db.class.create({ data: { schoolId: otherSchoolId, name: `ZZ Search 7C`, gradeLevel: "7", joinCode: `ZRC${tail}` }, select: { id: true } }),
  ]);
  await Promise.all([
    db.classTeacher.create({ data: { classId: klassA.id, schoolId, teacherMembershipId: tm.id, role: "LEAD" } }),
    db.classTeacher.create({ data: { classId: klassB.id, schoolId, teacherMembershipId: otm.id, role: "LEAD" } }),
    db.enrollment.create({ data: { classId: klassA.id, schoolId, studentMembershipId: pm.id, status: "ACTIVE" } }),
    db.enrollment.create({ data: { classId: klassB.id, schoolId, studentMembershipId: pbm.id, status: "ACTIVE" } }),
    db.enrollment.create({ data: { classId: otherKlass.id, schoolId: otherSchoolId, studentMembershipId: opm.id, status: "ACTIVE" } }),
    db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE" } }),
  ]);

  // A post at each school carrying the word, through the lib so the rules hold.
  await asAdmin();
  postId = (await createPost((await getSession())!, { scope: "SCHOOL", title: `ZZ ${WORD} sports day`, body: "Bring a hat.", tags: [], media: [] })).postId;
  await as(otherAdmin.id, { schoolId: otherSchoolId, role: "ADMIN" });
  await createPost((await getSession())!, { scope: "SCHOOL", title: `ZZ ${WORD} elsewhere`, body: "Not yours.", tags: [], media: [] });

  // A remark thread about Asha with the word in its subject, and a room between the teacher and the admin with the word in a message.
  threadId = (
    await db.remarkThread.create({
      data: { schoolId, studentMembershipId: pm.id, teacherMembershipId: tm.id, subject: `ZZ ${WORD} reading`, messages: { create: { schoolId, authorUserId: teacher.id, body: "Reading well this week.", readBy: JSON.stringify([teacher.id]) } } },
      select: { id: true },
    })
  ).id;
  await db.remarkThread.create({
    data: { schoolId: otherSchoolId, studentMembershipId: opm.id, teacherMembershipId: oam.id, subject: `ZZ ${WORD} elsewhere`, messages: { create: { schoolId: otherSchoolId, authorUserId: otherAdmin.id, body: "Not yours." } } },
  });
  await asTeacher();
  ({ conversationId } = await openConversation((await getSession())!, schoolId, admin.id));
  await db.conversationMessage.create({ data: { conversationId, schoolId, authorUserId: teacher.id, body: `About the ${WORD} trip` } });

  // Papers: a certificate and a published report card for Asha, and one of each at the other school.
  const [cert, card] = await Promise.all([
    db.issuedCertificate.create({
      data: { schoolId, studentMembershipId: pm.id, kind: "BONAFIDE", locale: "en", serial: `ZR/${tail}/1`, number: 1, title: `ZZ ${WORD} bonafide`, code: `ZRC${STAMP}A`, studentName: "Asha" },
      select: { id: true },
    }),
    db.reportCard.create({
      data: { schoolId, classId: klassA.id, studentMembershipId: pm.id, title: `ZZ ${WORD} Term 1`, status: "PUBLISHED", fromDateKey: "2026-06-01", toDateKey: "2026-09-30", publishedAt: new Date() },
      select: { id: true },
    }),
    db.issuedCertificate.create({
      data: { schoolId: otherSchoolId, studentMembershipId: opm.id, kind: "BONAFIDE", locale: "en", serial: `ZQ/${tail}/1`, number: 1, title: `ZZ ${WORD} elsewhere`, code: `ZRC${STAMP}B` },
    }),
    db.reportCard.create({
      data: { schoolId: otherSchoolId, classId: otherKlass.id, studentMembershipId: opm.id, title: `ZZ ${WORD} elsewhere`, status: "PUBLISHED", fromDateKey: "2026-06-01", toDateKey: "2026-09-30", publishedAt: new Date() },
    }),
    db.examSeries.create({ data: { schoolId, name: `ZZ ${WORD} unit test`, gradeLevel: "5", publishedAt: new Date() } }),
    db.examSeries.create({ data: { schoolId: otherSchoolId, name: `ZZ ${WORD} elsewhere`, gradeLevel: "7", publishedAt: new Date() } }),
  ]);
  certificateId = cert.id;
  cardId = card.id;
});

afterAll(async () => {
  const schools = [schoolId, otherSchoolId].filter(Boolean);
  if (schools.length) {
    await db.session.deleteMany({ where: { user: { name: { startsWith: "ZZ Search " } } } });
    // The budget rows this file's people spent, so a rerun starts fresh.
    await db.rateLimit.deleteMany({ where: { bucket: { in: [adminUserId, teacherUserId, otherTeacherUserId, pupilUserId, parentUserId].map((id) => `search:${id}`) } } });
    await db.school.deleteMany({ where: { id: { in: schools } } });
  }
  await db.user.deleteMany({ where: { name: { startsWith: "ZZ Search " }, email: { endsWith: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("GET /api/v1/search", () => {
  it("refuses a short q, and one over eighty characters, before any query runs", async () => {
    await asAdmin();
    const short = await searchGet(get("/api/v1/search?q=a"));
    expect(short.status).toBe(422);
    expect((await short.json()).code).toBe("BAD_REQUEST");
    const blank = await searchGet(get("/api/v1/search?q=%20%20"));
    expect(blank.status).toBe(422);
    const long = await searchGet(get(`/api/v1/search?q=${"x".repeat(81)}`));
    expect(long.status).toBe(422);
    const none = await searchGet(get("/api/v1/search"));
    expect(none.status).toBe(422);
  });

  it("is 401 signed out", async () => {
    __resetCookies();
    const response = await searchGet(get(`/api/v1/search?q=${WORD}`));
    expect(response.status).toBe(401);
  });

  it("the office finds both pupils, the post, the thread, the room and every paper of its own school", async () => {
    await asAdmin();
    const found = await search(WORD);
    expect(found.q).toBe(WORD);
    expect(found.people.map((p) => p.id).sort()).toEqual([pupilMembershipId, pupilBMembershipId].sort());
    expect(found.people.every((p) => p.href === `/people/${p.id}` && p.phoneRoute?.startsWith("/(app)/person?"))).toBe(true);
    expect(found.posts.map((p) => p.id)).toEqual([postId]);
    expect(found.posts[0]).toMatchObject({ kind: "posts", href: `/bulletin/${postId}`, phoneRoute: `/(app)/post?postId=${postId}` });
    expect(found.messages.map((m) => m.id).sort()).toEqual([threadId, conversationId].sort());
    expect(found.messages.find((m) => m.id === threadId)).toMatchObject({ href: `/remarks/${threadId}`, phoneRoute: `/(app)/messages/thread?threadId=${threadId}` });
    expect(found.messages.find((m) => m.id === conversationId)).toMatchObject({ href: `/remarks/c/${conversationId}`, subtitle: `About the ${WORD} trip` });
    const papers = found.papers.map((p) => p.title);
    expect(papers).toContain(`ZZ ${WORD} bonafide`);
    expect(papers).toContain(`ZZ ${WORD} Term 1`);
    expect(papers).toContain(`ZZ ${WORD} unit test`);
    expect(found.papers.find((p) => p.id === certificateId)).toMatchObject({ href: `/certificates/${certificateId}`, phoneRoute: `/(app)/certificate?id=${certificateId}` });
    expect(found.papers.find((p) => p.id === cardId)).toMatchObject({ href: `/report-cards/${cardId}` });
  });

  it("a teacher finds their own class's pupil and not another class's, and the staff room", async () => {
    await asTeacher();
    const found = await search(WORD);
    expect(found.people.map((p) => p.id)).toEqual([pupilMembershipId]);
    expect(found.people[0]).toMatchObject({ title: `ZZ Search ${WORD} Asha`, phoneRoute: expect.stringMatching(/^\/\(app\)\/classes\/detail\?classId=/) });
    // The other teacher's pupil is in the same school and still not theirs.
    expect(found.people.some((p) => p.id === pupilBMembershipId)).toBe(false);
    // The thread they opened and the room they are in; the paper of their own pupil.
    expect(found.messages.map((m) => m.id).sort()).toEqual([threadId, conversationId].sort());
    expect(found.papers.map((p) => p.id)).toContain(certificateId);
    expect(found.papers.map((p) => p.id)).toContain(cardId);

    // A colleague is found by name: the staff list is theirs to see.
    const staff = await search("ZZ Search teacher");
    expect(staff.people.some((p) => p.id === teacherMembershipId)).toBe(true);

    // The other teacher, who teaches 6B, finds Bhavin and not Asha, and none of Asha's papers.
    await asOtherTeacher();
    const theirs = await search(WORD);
    expect(theirs.people.map((p) => p.id)).toEqual([pupilBMembershipId]);
    expect(theirs.papers.map((p) => p.id)).not.toContain(certificateId);
    expect(theirs.papers.map((p) => p.id)).not.toContain(cardId);
    expect(theirs.messages.map((m) => m.id)).not.toContain(threadId);
  });

  it("a parent finds only their own child, and the child's thread and papers", async () => {
    await asParent();
    const found = await search(WORD);
    expect(found.people.map((p) => p.id)).toEqual([pupilMembershipId]);
    expect(found.people[0]).toMatchObject({ href: `/people/${pupilMembershipId}`, phoneRoute: `/(app)/record?childId=${pupilMembershipId}` });
    expect(found.messages.map((m) => m.id)).toEqual([threadId]);
    // The child's certificate and card, and the published round for the child's grade.
    expect(found.papers.map((p) => p.id)).toEqual(expect.arrayContaining([certificateId, cardId]));
    expect(found.papers.map((p) => p.title)).toContain(`ZZ ${WORD} unit test`);
    expect(found.papers).toHaveLength(3);
    expect(found.papers.find((p) => p.id === cardId)?.phoneRoute).toBe(`/(app)/exams?cardId=${cardId}`);
    // The post of the child's school, under the bulletin's rule.
    expect(found.posts.map((p) => p.id)).toEqual([postId]);
  });

  it("a pupil finds no people, but their own post, thread and papers", async () => {
    await asPupil();
    const found = await search(WORD);
    expect(found.people).toEqual([]);
    expect(found.posts.map((p) => p.id)).toEqual([postId]);
    expect(found.messages.map((m) => m.id)).toEqual([threadId]);
    expect(found.papers.map((p) => p.id)).toEqual(expect.arrayContaining([certificateId, cardId]));
    expect(found.papers.map((p) => p.title)).toContain(`ZZ ${WORD} unit test`);
    expect(found.papers).toHaveLength(3);
  });

  it("a post is found by a word of its title, and the match is case-insensitive", async () => {
    await asAdmin();
    const found = await search(WORD.toUpperCase());
    expect(found.posts.map((p) => p.id)).toEqual([postId]);
    expect(found.posts[0]?.title).toBe(`ZZ ${WORD} sports day`);
  });

  it("the role's pages come from the menu, matched on the label", async () => {
    await asAdmin();
    const found = await search("people");
    expect(found.pages.some((p) => p.href === "/admin/people")).toBe(true);
    expect(found.pages.every((p) => p.kind === "pages" && p.phoneRoute === null)).toBe(true);
  });

  it("another school's rows never appear, whatever the word and whoever asks", async () => {
    const elsewhere = (found: SearchResults) =>
      [...found.people, ...found.posts, ...found.messages, ...found.papers].filter((hit) => hit.title.includes("Elsewhere") || hit.title.includes("elsewhere"));
    await asAdmin();
    expect(elsewhere(await search(WORD))).toEqual([]);
    expect(elsewhere(await search("elsewhere"))).toEqual([]);
    await asTeacher();
    expect(elsewhere(await search(WORD))).toEqual([]);
    await asParent();
    expect(elsewhere(await search(WORD))).toEqual([]);
    await asPupil();
    expect(elsewhere(await search(WORD))).toEqual([]);
  });
});
