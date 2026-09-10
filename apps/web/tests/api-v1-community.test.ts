/**
 * The /api/v1/community handlers — the flows the phone used to hand to the
 * web — invoked directly with a primed session, the way api-v1-shared.test.ts
 * does: 401 signed out, 403 for a role the endpoint refuses, the happy path
 * parsed with the contract, and one refusal per write. Mentoring is walked
 * end to end (a pupil asks, the office agrees, the guardian agrees, the
 * guardian ends it; staff pair, the office ends it), so the states between
 * are proved by the handlers themselves rather than by rows typed in.
 *
 * Everything here is ZZ-prefixed, created in beforeAll and removed in afterAll
 * — the rate-limit rows too, which are keyed by these users and codes only.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  communityChildLinkedSchema,
  communityLinkChildPageSchema,
  communityMentoringOptionsSchema,
  communityMentorThreadSchema,
  communitySchoolProfileSchema,
  communityVacancySchema,
  okSchema,
} from "@edulink/contracts";
import { createSession, getSession } from "@/lib/session";
import { CLAIM_ATTEMPTS } from "@/lib/rate-limit";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as optionsGet } from "@/app/api/v1/community/mentoring/options/route";
import { POST as pairPost } from "@/app/api/v1/community/mentoring/pair/route";
import { POST as askPost } from "@/app/api/v1/community/mentoring/ask/route";
import { POST as decidePost } from "@/app/api/v1/community/mentoring/[threadId]/decide/route";
import { POST as consentPost } from "@/app/api/v1/community/mentoring/[threadId]/consent/route";
import { POST as mentorClosePost } from "@/app/api/v1/community/mentoring/[threadId]/close/route";
import { POST as enquiryClosePost } from "@/app/api/v1/community/enquiries/[enquiryId]/close/route";
import { GET as schoolGet } from "@/app/api/v1/community/schools/[schoolId]/route";
import { GET as vacancyGet } from "@/app/api/v1/community/vacancies/[postingId]/route";
import { GET as linkGet, POST as linkPost } from "@/app/api/v1/community/link-child/route";

const db = new PrismaClient();
const STAMP = Date.now();
const tail = String(STAMP).slice(-6);
const NOBODY = "czzzzzzzzzzzzzzzzzzzzzzzz";

let schoolId = "";
let otherSchoolId = "";
let adminUserId = "";
let principalUserId = "";
let teacherUserId = "";
let pupilUserId = "";
let parentUserId = "";
let newParentUserId = "";
let limitedUserId = "";
let otherAdminUserId = "";
let pupilMembershipId = "";
let pupil2MembershipId = "";
let expertProfileId = "";
let sessionsExpertProfileId = "";
let postingId = "";
let enquiryId = "";
const PUPIL2_CODE = `ZCQ${STAMP}`;

const json = (body: unknown) =>
  new Request("http://localhost/api/v1/community", { method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
const empty = () => new Request("http://localhost/api/v1/community", { method: "POST" });
const get = () => new Request("http://localhost/api/v1/community");
const p = <T extends Record<string, string>>(params: T) => ({ params: Promise.resolve(params) });

async function as(userId: string, opts?: { schoolId?: string | null; role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT" | "PARENT" | "EXPERT" }) {
  __resetCookies();
  await createSession(userId, opts);
}
const asAdmin = () => as(adminUserId, { schoolId, role: "ADMIN" });
const asPrincipal = () => as(principalUserId, { schoolId, role: "PRINCIPAL" });
const asTeacher = () => as(teacherUserId, { schoolId, role: "TEACHER" });
const asPupil = () => as(pupilUserId, { schoolId, role: "STUDENT" });
const asParent = () => as(parentUserId, { role: "PARENT" });
const asOtherAdmin = () => as(otherAdminUserId, { schoolId: otherSchoolId, role: "ADMIN" });

async function errorOf(res: Response): Promise<{ error: string; code?: string; issues?: Record<string, string>; retryAfterSeconds?: number }> {
  return (await res.json()) as { error: string; code?: string };
}

beforeAll(async () => {
  const [a, b] = await Promise.all([
    db.school.create({
      data: { name: `ZZ Community School ${STAMP}`, slug: `zz-community-${STAMP}`, code: `ZC${tail}`, contactEmail: `zz-community-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", city: "ZZ Town", profileAbout: "ZZ A school by the river.", profilePublishedAt: new Date() },
      select: { id: true },
    }),
    db.school.create({
      data: { name: `ZZ Community Other ${STAMP}`, slug: `zz-community-o-${STAMP}`, code: `ZD${tail}`, contactEmail: `zz-community-o-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
      select: { id: true },
    }),
  ]);
  schoolId = a.id;
  otherSchoolId = b.id;

  const mk = (tag: string, extra: Record<string, unknown> = {}) =>
    db.user.create({ data: { name: `ZZ Community ${tag}`, email: `zz-community-${tag}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
  const [admin, principal, teacher, pupil, pupil2, parent, newParent, limited, otherAdmin, expert, sessionsExpert] = await Promise.all([
    mk("admin"),
    mk("principal"),
    mk("teacher"),
    mk("pupil", { birthdate: new Date("2015-04-06T00:00:00Z") }),
    mk("pupil2", { birthdate: new Date("2014-02-03T00:00:00Z") }),
    mk("parent"),
    mk("new-parent"),
    mk("limited"),
    mk("other-admin"),
    mk("expert"),
    mk("sessions-expert"),
  ]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  teacherUserId = teacher.id;
  pupilUserId = pupil.id;
  parentUserId = parent.id;
  newParentUserId = newParent.id;
  limitedUserId = limited.id;
  otherAdminUserId = otherAdmin.id;

  const [, , tm, pm, pm2, oam] = await Promise.all([
    db.membership.create({ data: { userId: admin.id, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } }),
    db.membership.create({ data: { userId: principal.id, schoolId, role: "PRINCIPAL", status: "ACTIVE" }, select: { id: true } }),
    db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } }),
    db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZCP${STAMP}` }, select: { id: true } }),
    db.membership.create({ data: { userId: pupil2.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: PUPIL2_CODE }, select: { id: true } }),
    db.membership.create({ data: { userId: otherAdmin.id, schoolId: otherSchoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } }),
  ]);
  pupilMembershipId = pm.id;
  pupil2MembershipId = pm2.id;

  // The teacher leads the class both pupils are in, so the pairing lists and a teacher's reach include them.
  const klass = await db.class.create({ data: { schoolId, name: "ZZ Community Class 5", gradeLevel: "5", joinCode: `ZC${tail}` }, select: { id: true } });
  await db.classTeacher.create({ data: { classId: klass.id, schoolId, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.createMany({ data: [pm.id, pm2.id].map((id) => ({ classId: klass.id, schoolId, studentMembershipId: id, status: "ACTIVE" })) });
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE" } });

  const [e1, e2] = await Promise.all([
    db.expertProfile.create({ data: { userId: expert.id, headline: "ZZ Community bridges", bio: "Ask me about bridges.", offering: "BOTH", publishedAt: new Date() }, select: { id: true } }),
    db.expertProfile.create({ data: { userId: sessionsExpert.id, headline: "ZZ Community talks", bio: "Assemblies only.", offering: "SESSIONS", publishedAt: new Date() }, select: { id: true } }),
  ]);
  expertProfileId = e1.id;
  sessionsExpertProfileId = e2.id;

  const posting = await db.jobPosting.create({
    data: { schoolId: otherSchoolId, title: `ZZ Community physics ${STAMP}`, body: "Come and teach.", subjects: JSON.stringify(["Physics"]), hiringContactMembershipId: oam.id, postedByMembershipId: oam.id },
    select: { id: true },
  });
  postingId = posting.id;

  const enquiry = await db.enquiry.create({
    data: { schoolId, kind: "ADMISSION", fromUserId: parent.id, schoolName: `ZZ Community School ${STAMP}`, subject: "", messages: { create: { schoolId, authorUserId: parent.id, body: "ZZ Is there a place in Year 4?" } } },
    select: { id: true },
  });
  enquiryId = enquiry.id;

  __resetCookies();
});

afterAll(async () => {
  __resetCookies();
  const userIds = [adminUserId, principalUserId, teacherUserId, pupilUserId, parentUserId, newParentUserId, limitedUserId, otherAdminUserId].filter(Boolean);
  await db.rateLimit.deleteMany({ where: { OR: [{ bucket: { in: [newParentUserId, limitedUserId].map((id) => `claim:user:${id}`) } }, { bucket: { contains: String(STAMP) } }] } });
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId].filter(Boolean) } } });
  await db.expertProfile.deleteMany({ where: { id: { in: [expertProfileId, sessionsExpertProfileId].filter(Boolean) } } });
  void userIds;
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("signed out", () => {
  it("every handler answers 401 in the contract's envelope", async () => {
    __resetCookies();
    const calls: Promise<Response>[] = [
      optionsGet(),
      pairPost(json({})),
      askPost(json({})),
      decidePost(json({ approve: true }), p({ threadId: NOBODY })),
      consentPost(empty(), p({ threadId: NOBODY })),
      mentorClosePost(empty(), p({ threadId: NOBODY })),
      enquiryClosePost(empty(), p({ enquiryId })),
      schoolGet(get(), p({ schoolId })),
      vacancyGet(get(), p({ postingId })),
      linkGet(),
      linkPost(json({})),
    ];
    for (const res of await Promise.all(calls)) {
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
    }
  });
});

describe("a school's profile", () => {
  it("a guardian reads the prospectus, may ask, and is pointed at the thread they already have", async () => {
    await asParent();
    const res = await schoolGet(get(), p({ schoolId }));
    expect(res.status).toBe(200);
    const raw = (await res.json()) as Record<string, unknown>;
    const body = communitySchoolProfileSchema.parse(raw);
    expect(body).toMatchObject({ schoolId, name: `ZZ Community School ${STAMP}`, about: "ZZ A school by the river.", published: true, canEnquire: true, ours: false, myEnquiryId: enquiryId });
    expect(body.metrics.pupils).toBe(2);
    expect(body.metrics.teachers).toBe(2);
    // The contact address stays off it, as on the web page.
    expect(raw).not.toHaveProperty("contactEmail");
    expect(raw).not.toHaveProperty("contactPhone");
  });

  it("staff read their own without the admissions door; a hiring school is readable unpublished; nothing else is", async () => {
    await asTeacher();
    const own = communitySchoolProfileSchema.parse(await (await schoolGet(get(), p({ schoolId }))).json());
    expect(own).toMatchObject({ ours: true, canEnquire: false, myEnquiryId: null });
    const hiring = communitySchoolProfileSchema.parse(await (await schoolGet(get(), p({ schoolId: otherSchoolId }))).json());
    expect(hiring.published).toBe(false);
    expect(hiring.vacancies.map((v) => v.id)).toEqual([postingId]);
    expect((await schoolGet(get(), p({ schoolId: NOBODY }))).status).toBe(404);
  });

  it("a session with no role yet is refused", async () => {
    await as(newParentUserId);
    expect((await schoolGet(get(), p({ schoolId }))).status).toBe(403);
  });
});

describe("one vacancy", () => {
  it("a teacher of another school may ask; the posting school sees its contact and count; a pupil is refused", async () => {
    await asTeacher();
    const res = await vacancyGet(get(), p({ postingId }));
    expect(res.status).toBe(200);
    expect(communityVacancySchema.parse(await res.json())).toMatchObject({ id: postingId, schoolId: otherSchoolId, canEnquire: true, ours: false, contactName: null, enquiryCount: null, myEnquiryId: null, subjects: ["Physics"], enquiries: [] });

    await asOtherAdmin();
    expect(communityVacancySchema.parse(await (await vacancyGet(get(), p({ postingId }))).json())).toMatchObject({ ours: true, canEnquire: false, contactName: "ZZ Community other-admin", enquiryCount: 0, enquiries: [] });
    expect((await vacancyGet(get(), p({ postingId: NOBODY }))).status).toBe(404);

    // The teacher asks about it: the poster's office now sees the thread itself, and the teacher is pointed at theirs.
    const job = await db.enquiry.create({
      data: { schoolId: otherSchoolId, kind: "JOB", jobPostingId: postingId, fromUserId: teacherUserId, schoolName: `ZZ Community Other ${STAMP}`, subject: `ZZ Community physics ${STAMP}`, messages: { create: { schoolId: otherSchoolId, authorUserId: teacherUserId, body: "ZZ I teach physics." } } },
      select: { id: true },
    });
    const seen = communityVacancySchema.parse(await (await vacancyGet(get(), p({ postingId }))).json());
    expect(seen.enquiryCount).toBe(1);
    expect(seen.enquiries).toMatchObject([{ id: job.id, fromName: "ZZ Community teacher", status: "OPEN", lastMessagePreview: "ZZ I teach physics.", unread: true }]);
    await asTeacher();
    expect(communityVacancySchema.parse(await (await vacancyGet(get(), p({ postingId }))).json())).toMatchObject({ myEnquiryId: job.id, enquiries: [] });

    await asPupil();
    expect((await vacancyGet(get(), p({ postingId }))).status).toBe(403);
  });
});

describe("mentoring: a pupil asks, the office agrees, the guardian agrees, the guardian ends it", () => {
  let threadId = "";

  it("options: a pupil is offered the mentors who mentor; staff the pairing lists; a guardian nothing", async () => {
    await asPupil();
    const pupil = communityMentoringOptionsSchema.parse(await (await optionsGet()).json());
    expect(pupil.askable.map((e) => e.id)).toContain(expertProfileId);
    expect(pupil.askable.map((e) => e.id)).not.toContain(sessionsExpertProfileId);
    expect(pupil).toMatchObject({ openRequests: 0, maxOpenRequests: 3, pairing: { experts: [], pupils: [] } });

    await asTeacher();
    const teacher = communityMentoringOptionsSchema.parse(await (await optionsGet()).json());
    expect(teacher.pairing.pupils.map((x) => x.id).sort()).toEqual([pupilMembershipId, pupil2MembershipId].sort());
    expect(teacher.pairing.experts.map((e) => e.id)).toEqual(expect.arrayContaining([expertProfileId, sessionsExpertProfileId]));
    expect(teacher.askable).toEqual([]);

    await asParent();
    expect(communityMentoringOptionsSchema.parse(await (await optionsGet()).json())).toMatchObject({ askable: [], pairing: { experts: [], pupils: [] }, openRequests: 0 });
  });

  it("ask: staff are refused; a bad body is 422; too short is the library's sentence; then it is asked", async () => {
    await asTeacher();
    expect((await askPost(json({ expertProfileId, purpose: "Help me please with bridges." }))).status).toBe(403);

    await asPupil();
    expect((await askPost(json({ purpose: "no mentor named" }))).status).toBe(422);
    const short = await askPost(json({ expertProfileId, purpose: "Bridges" }));
    expect(short.status).toBe(422);
    expect((await errorOf(short)).error).toMatch(/Say a bit more/);

    const res = await askPost(json({ expertProfileId, purpose: "ZZ Help me understand how bridges stay up." }));
    expect(res.status).toBe(201);
    threadId = communityMentorThreadSchema.parse(await res.json()).threadId;
    expect(await db.mentorThread.findUnique({ where: { id: threadId }, select: { status: true } })).toEqual({ status: "REQUESTED" });
    expect(communityMentoringOptionsSchema.parse(await (await optionsGet()).json()).openRequests).toBe(1);
    // Asking the same mentor twice is refused with a sentence.
    const again = await askPost(json({ expertProfileId, purpose: "ZZ Help me understand how bridges stay up." }));
    expect(again.status).toBe(422);
  });

  it("decide: a teacher is refused; nothing waiting is 422; the head agrees and the family is asked", async () => {
    await asTeacher();
    expect((await decidePost(json({ approve: true }), p({ threadId }))).status).toBe(403);

    await asPrincipal();
    expect((await decidePost(json({ approve: "yes" }), p({ threadId }))).status).toBe(422);
    const nothing = await decidePost(json({ approve: true }), p({ threadId: NOBODY }));
    expect(nothing.status).toBe(422);
    expect((await errorOf(nothing)).error).toBe("That request is no longer waiting.");

    const res = await decidePost(json({ approve: true }), p({ threadId }));
    expect(res.status).toBe(200);
    expect(okSchema.parse(await res.json())).toEqual({ ok: true });
    expect(await db.mentorThread.findUnique({ where: { id: threadId }, select: { status: true } })).toEqual({ status: "PENDING_CONSENT" });
  });

  it("consent: only a guardian of this child; then it is active", async () => {
    await asTeacher();
    expect((await consentPost(empty(), p({ threadId }))).status).toBe(403);
    await asPupil();
    expect((await consentPost(empty(), p({ threadId }))).status).toBe(403);

    await asParent();
    const res = await consentPost(empty(), p({ threadId }));
    expect(res.status).toBe(200);
    expect(await db.mentorThread.findUnique({ where: { id: threadId }, select: { status: true, parentConsentUserId: true } })).toEqual({ status: "ACTIVE", parentConsentUserId: parentUserId });
  });

  it("close: the pupil cannot; the guardian can, once", async () => {
    await asPupil();
    expect((await mentorClosePost(empty(), p({ threadId }))).status).toBe(403);

    await asParent();
    expect((await mentorClosePost(empty(), p({ threadId }))).status).toBe(200);
    expect(await db.mentorThread.findUnique({ where: { id: threadId }, select: { status: true } })).toEqual({ status: "CLOSED" });
    // Ending an ended one is a no-op, not an error.
    expect((await mentorClosePost(empty(), p({ threadId }))).status).toBe(200);
    expect((await mentorClosePost(empty(), p({ threadId: NOBODY }))).status).toBe(404);
  });
});

describe("mentoring: staff pair", () => {
  it("a pupil is refused; a bad body is 422; a sessions-only expert is refused; then the guardian is asked, and the office ends it", async () => {
    await asPupil();
    expect((await pairPost(json({ expertProfileId, studentMembershipId: pupil2MembershipId, purpose: "Careers in engineering" }))).status).toBe(403);

    await asTeacher();
    expect((await pairPost(json({ expertProfileId, studentMembershipId: pupil2MembershipId, purpose: "no" }))).status).toBe(422);
    const sessionsOnly = await pairPost(json({ expertProfileId: sessionsExpertProfileId, studentMembershipId: pupil2MembershipId, purpose: "Careers in engineering" }));
    expect(sessionsOnly.status).toBe(403);
    expect((await errorOf(sessionsOnly)).error).toContain("ZZ Community sessions-expert");

    const res = await pairPost(json({ expertProfileId, studentMembershipId: pupil2MembershipId, purpose: "ZZ Careers in engineering" }));
    expect(res.status).toBe(201);
    const { threadId } = communityMentorThreadSchema.parse(await res.json());
    expect(await db.mentorThread.findUnique({ where: { id: threadId }, select: { status: true, studentMembershipId: true } })).toEqual({ status: "PENDING_CONSENT", studentMembershipId: pupil2MembershipId });

    await asAdmin();
    expect((await mentorClosePost(empty(), p({ threadId }))).status).toBe(200);
    expect(await db.mentorThread.findUnique({ where: { id: threadId }, select: { status: true } })).toEqual({ status: "CLOSED" });
  });
});

describe("closing an enquiry", () => {
  it("the person who asked cannot; a teacher who is not the contact cannot; nothing is a 404; the office closes it once", async () => {
    await asParent();
    expect((await enquiryClosePost(empty(), p({ enquiryId }))).status).toBe(403);
    await asTeacher();
    expect((await enquiryClosePost(empty(), p({ enquiryId }))).status).toBe(403);

    await asAdmin();
    expect((await enquiryClosePost(empty(), p({ enquiryId: NOBODY }))).status).toBe(404);
    const res = await enquiryClosePost(empty(), p({ enquiryId }));
    expect(res.status).toBe(200);
    expect(okSchema.parse(await res.json())).toEqual({ ok: true });
    expect(await db.enquiry.findUnique({ where: { id: enquiryId }, select: { status: true } })).toEqual({ status: "CLOSED" });
    const again = await enquiryClosePost(empty(), p({ enquiryId }));
    expect(again.status).toBe(422);
    expect((await errorOf(again)).error).toBe("This enquiry is closed.");
  });
});

describe("linking a child", () => {
  it("nobody yet, a bad body, a mismatch that says nothing, then the link — and the session is a guardian's", async () => {
    await as(newParentUserId);
    expect(communityLinkChildPageSchema.parse(await (await linkGet()).json())).toEqual({ children: [] });

    const bad = await linkPost(json({ studentCode: "ZZ", birthdate: "someday" }));
    expect(bad.status).toBe(422);
    expect(Object.keys((await errorOf(bad)).issues ?? {})).toEqual(expect.arrayContaining(["studentCode", "birthdate"]));

    const wrong = await linkPost(json({ studentCode: PUPIL2_CODE, birthdate: "2014-02-04", relation: "PARENT" }));
    expect(wrong.status).toBe(422);
    expect((await errorOf(wrong)).error).toMatch(/do not match a student/);

    const res = await linkPost(json({ studentCode: PUPIL2_CODE, birthdate: "2014-02-03", relation: "GUARDIAN" }));
    expect(res.status).toBe(201);
    expect(communityChildLinkedSchema.parse(await res.json())).toEqual({ child: { name: "ZZ Community pupil2", schoolName: `ZZ Community School ${STAMP}` } });
    expect((await getSession())?.role).toBe("PARENT");
    const page = communityLinkChildPageSchema.parse(await (await linkGet()).json());
    expect(page.children.map((c) => c.name)).toEqual(["ZZ Community pupil2"]);
    expect(await db.guardianship.findFirst({ where: { parentUserId: newParentUserId, studentMembershipId: pupil2MembershipId }, select: { relation: true, status: true } })).toEqual({ relation: "GUARDIAN", status: "ACTIVE" });

    // Linking the same child again is refused with its own sentence.
    const twice = await linkPost(json({ studentCode: PUPIL2_CODE, birthdate: "2014-02-03" }));
    expect(twice.status).toBe(422);
    expect((await errorOf(twice)).error).toBe("You are already linked to this student.");
  });

  it("past the per-caller limit it is a 429 with how long to wait, before any lookup", async () => {
    await db.rateLimit.create({ data: { bucket: `claim:user:${limitedUserId}`, hits: CLAIM_ATTEMPTS.limit, windowEndsAt: new Date(Date.now() + 10 * 60_000) } });
    await as(limitedUserId);
    const res = await linkPost(json({ studentCode: PUPIL2_CODE, birthdate: "2014-02-03" }));
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
    const body = await errorOf(res);
    expect(body.code).toBe("RATE_LIMITED");
    expect(body.retryAfterSeconds).toBeGreaterThan(0);
    expect(body.error).toMatch(/^Too many attempts/);
    expect(await db.guardianship.count({ where: { parentUserId: limitedUserId } })).toBe(0);
  });
});
