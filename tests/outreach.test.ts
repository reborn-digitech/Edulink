import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  updateSchoolProfile,
  setProfilePublished,
  listDirectory,
  readSchoolProfile,
} from "@/lib/school-profile";
import { createPosting, closePosting, listBoard, readPosting } from "@/lib/vacancies";
import {
  openEnquiry,
  readEnquiry,
  replyToEnquiry,
  closeEnquiry,
  listEnquiries,
  anyEnquiries,
  findMyOpenEnquiry,
} from "@/lib/enquiries";
import type { ActiveContext } from "@/lib/session";

/**
 * Cross-school outreach — the directory, the job board, the enquiries.
 *
 * What must hold, in one sentence each: a school is in the directory only by
 * its own act and only with a person named to answer; a vacancy is everyone's
 * to read and only the poster's school's to manage; an enquiry belongs to its
 * opener and to the named contact's desk and to NOBODY else — not the staff
 * room, not another school — and every announcement lands in the recipient's
 * own language.
 */

const db = new PrismaClient();

function ctx(over: {
  userId: string;
  membershipId?: string | null;
  schoolId?: string | null;
  role?: ActiveContext["role"];
  name?: string;
}): ActiveContext {
  return {
    sessionId: "test",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId, name: over.name ?? "ZZ Outreach Person", preferredName: null,
      email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

const TAG = "ZZ Outreach";

let riversideId: string;
let oakfieldId: string;
let riversideAdmin: ActiveContext;
let oakfieldAdmin: ActiveContext;
/** The named contact at Riverside — a TEACHER, reading in Marathi. */
let contact: ActiveContext;
let contactMembershipId: string;
/** A Riverside teacher who is nobody's contact. */
let bystander: ActiveContext;
/** A teacher at Oakfield, who enquires about Riverside's vacancy. */
let oakTeacher: ActiveContext;
/** A parent with no school at all, reading in Hindi. */
let parent: ActiveContext;

async function cleanup() {
  const users = await db.user.findMany({ where: { name: { startsWith: TAG } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  await db.enquiry.deleteMany({ where: { fromUserId: { in: ids } } });
  await db.jobPosting.deleteMany({ where: { title: { startsWith: TAG } } });
  await db.membership.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  // The profile is seed state; put it back exactly as the seed leaves it.
  await db.school.updateMany({
    where: { id: { in: [riversideId, oakfieldId] } },
    data: { profilePublishedAt: null, profileAbout: "", admissionsContactMembershipId: null },
  });
}

async function mkUser(name: string, locale: string) {
  return db.user.create({
    data: {
      name,
      prefs: JSON.stringify({ locale, channels: { push: false, email: false } }),
    },
  });
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

  const contactUser = await mkUser(`${TAG} Contact`, "mr");
  const contactMembership = await db.membership.create({
    data: { userId: contactUser.id, schoolId: riversideId, role: "TEACHER", status: "ACTIVE" },
  });
  contactMembershipId = contactMembership.id;
  contact = ctx({ userId: contactUser.id, membershipId: contactMembership.id, schoolId: riversideId, role: "TEACHER" });

  const bystanderUser = await mkUser(`${TAG} Bystander`, "en");
  const bystanderMembership = await db.membership.create({
    data: { userId: bystanderUser.id, schoolId: riversideId, role: "TEACHER", status: "ACTIVE" },
  });
  bystander = ctx({ userId: bystanderUser.id, membershipId: bystanderMembership.id, schoolId: riversideId, role: "TEACHER" });

  const oakTeacherUser = await mkUser(`${TAG} Oak Teacher`, "en");
  const oakTeacherMembership = await db.membership.create({
    data: { userId: oakTeacherUser.id, schoolId: oakfieldId, role: "TEACHER", status: "ACTIVE" },
  });
  oakTeacher = ctx({ userId: oakTeacherUser.id, membershipId: oakTeacherMembership.id, schoolId: oakfieldId, role: "TEACHER" });

  const parentUser = await mkUser(`${TAG} Parent`, "hi");
  parent = ctx({ userId: parentUser.id, role: "PARENT" });
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe("⚠ the directory opens by the school's own act", () => {
  it("refuses to publish with nobody behind the profile", async () => {
    const result = await setProfilePublished(riversideAdmin, true);
    expect(result).toMatchObject({ ok: false, errorKey: "explore.publishNeedsAContact" });
  });

  it("refuses a contact who is not active staff of this school", async () => {
    const result = await updateSchoolProfile(riversideAdmin, {
      about: "x",
      admissionsContactMembershipId: oakTeacher.membershipId!,
    });
    expect(result).toMatchObject({ ok: false, errorKey: "explore.contactMustBeActiveStaff" });
  });

  it("publishes once a contact is named, and the directory shows it to another school", async () => {
    const saved = await updateSchoolProfile(riversideAdmin, {
      about: "A small school by the river.",
      admissionsContactMembershipId: contactMembershipId,
    });
    expect(saved.ok).toBe(true);
    const published = await setProfilePublished(riversideAdmin, true);
    expect(published.ok).toBe(true);

    const seenFromOakfield = await listDirectory(oakfieldAdmin);
    const riverside = seenFromOakfield.find((s) => s.schoolId === riversideId);
    expect(riverside).toBeDefined();
    expect(riverside!.ours).toBe(false);
    expect(riverside!.about).toContain("river");
  });

  it("refuses to clear the contact while the profile is up", async () => {
    const result = await updateSchoolProfile(riversideAdmin, {
      about: "x",
      admissionsContactMembershipId: null,
    });
    expect(result).toMatchObject({ ok: false, errorKey: "explore.publishedNeedsAContact" });
    // And the words on record were not half-applied.
    const school = await db.school.findUniqueOrThrow({ where: { id: riversideId } });
    expect(school.admissionsContactMembershipId).toBe(contactMembershipId);
  });

  it("only an admin edits any of it", async () => {
    await expect(setProfilePublished(contact, false)).rejects.toThrow(AccessError);
    await expect(
      updateSchoolProfile(oakfieldAdmin, { about: "", admissionsContactMembershipId: null }).then(
        () => db.school.findUniqueOrThrow({ where: { id: riversideId } }),
      ),
    ).resolves.toMatchObject({ profilePublishedAt: expect.any(Date) });
  });
});

describe("⚠ a vacancy is posted by the office and read by every school", () => {
  let postingId: string;

  it("a teacher cannot post one", async () => {
    await expect(
      createPosting(bystander, {
        title: `${TAG} refused`, body: "x", subjects: [], employmentType: "FULL_TIME",
        hiringContactMembershipId: contactMembershipId,
      }),
    ).rejects.toThrow(AccessError);
  });

  it("the admin posts one and the named contact is told, in their own language", async () => {
    const result = await createPosting(riversideAdmin, {
      title: `${TAG} Mathematics teacher`,
      body: "Grades 6–8, starting next term.",
      subjects: ["Mathematics", " Mathematics ", ""],
      employmentType: "PART_TIME",
      hiringContactMembershipId: contactMembershipId,
    });
    expect(result.ok).toBe(true);
    postingId = (result as { postingId: string }).postingId;

    // Subjects deduped and trimmed.
    const row = await db.jobPosting.findUniqueOrThrow({ where: { id: postingId } });
    expect(JSON.parse(row.subjects)).toEqual(["Mathematics"]);

    // The contact reads Marathi, so the announcement is Marathi.
    const note = await db.notification.findFirstOrThrow({
      where: { userId: contact.user.id, kind: "ENQUIRY", url: `/vacancies/${postingId}` },
    });
    expect(note.title).toBe("एका नव्या जागेसाठी तुम्ही भरती संपर्क आहात");
  });

  it("another school's teacher sees it on the board, marked not-ours, with the school's name", async () => {
    const board = await listBoard(oakTeacher);
    const posting = board.find((p) => p.id === postingId);
    expect(posting).toBeDefined();
    expect(posting!.ours).toBe(false);
    expect(posting!.schoolName).toBe("Riverside Primary School");
    expect(posting!.employmentType).toBe("PART_TIME");

    const detail = await readPosting(oakTeacher, postingId);
    expect(detail!.canEnquire).toBe(true);
    // The contact's NAME does not cross the boundary.
    expect(detail!.contactName).toBeNull();
    expect(detail!.enquiryCount).toBeNull();
  });

  it("the posting school's own staff see the contact and the count instead of the door", async () => {
    const detail = await readPosting(riversideAdmin, postingId);
    expect(detail!.ours).toBe(true);
    expect(detail!.canEnquire).toBe(false);
    expect(detail!.contactName).toBe(`${TAG} Contact`);
    expect(detail!.enquiryCount).toBe(0);
  });

  it("another school cannot close it; its own school can, and it leaves the board", async () => {
    const refused = await closePosting(oakfieldAdmin, postingId);
    expect(refused).toMatchObject({ ok: false, errorKey: "vacancies.notOpenHere" });

    // Close a SECOND posting so the main one stays open for the enquiry tests.
    const second = await createPosting(riversideAdmin, {
      title: `${TAG} closes`, body: "x", subjects: [], employmentType: "FULL_TIME",
      hiringContactMembershipId: contactMembershipId,
    });
    const closed = await closePosting(riversideAdmin, (second as { postingId: string }).postingId);
    expect(closed.ok).toBe(true);
    const board = await listBoard(oakTeacher);
    expect(board.some((p) => p.title === `${TAG} closes`)).toBe(false);
  });
});

describe("⚠ an enquiry belongs to its opener and the desk it lands on", () => {
  let admissionId: string;
  let jobId: string;
  let postingId: string;

  beforeAll(async () => {
    const posting = await db.jobPosting.findFirstOrThrow({
      where: { title: `${TAG} Mathematics teacher` },
    });
    postingId = posting.id;
  });

  it("a parent cannot enquire at a school that is not taking enquiries", async () => {
    const result = await openEnquiry(parent, { schoolId: oakfieldId, kind: "ADMISSION", body: "Hello?" });
    expect(result).toMatchObject({ ok: false, errorKey: "enquiries.notTakingEnquiries" });
  });

  it("a teacher cannot open an ADMISSION enquiry, nor a parent a JOB one", async () => {
    await expect(
      openEnquiry(oakTeacher, { schoolId: riversideId, kind: "ADMISSION", body: "x" }),
    ).rejects.toThrow(AccessError);
    await expect(
      openEnquiry(parent, { schoolId: riversideId, kind: "JOB", jobPostingId: postingId, body: "x" }),
    ).rejects.toThrow(AccessError);
  });

  it("a parent's admission enquiry reaches the named contact in the contact's language", async () => {
    const result = await openEnquiry(parent, {
      schoolId: riversideId, kind: "ADMISSION", body: "Do you have places in Grade 3?",
    });
    expect(result.ok).toBe(true);
    admissionId = (result as { enquiryId: string }).enquiryId;

    const row = await db.enquiry.findUniqueOrThrow({ where: { id: admissionId } });
    expect(row.schoolName).toBe("Riverside Primary School");
    expect(row.subject).toBe("");

    const note = await db.notification.findFirstOrThrow({
      where: { userId: contact.user.id, kind: "ENQUIRY", url: `/enquiries/${admissionId}` },
    });
    expect(note.title).toBe("प्रवेशाची नवी चौकशी");
  });

  it("asking again while the thread is open appends instead of minting a sibling", async () => {
    const again = await openEnquiry(parent, {
      schoolId: riversideId, kind: "ADMISSION", body: "Also — when could we visit?",
    });
    expect(again).toMatchObject({ ok: true, enquiryId: admissionId });
    const thread = await readEnquiry(parent, admissionId);
    expect(thread.messages).toHaveLength(2);
    expect(await findMyOpenEnquiry(parent, riversideId, "ADMISSION", null)).toBe(admissionId);
  });

  it("a teacher's job enquiry rides the open posting and carries its title", async () => {
    const refusedOwn = await openEnquiry(bystander, {
      schoolId: riversideId, kind: "JOB", jobPostingId: postingId, body: "me!",
    });
    expect(refusedOwn).toMatchObject({ ok: false, errorKey: "enquiries.thisIsYourOwnSchool" });

    const result = await openEnquiry(oakTeacher, {
      schoolId: riversideId, kind: "JOB", jobPostingId: postingId,
      body: "I teach maths at Oakfield and would like to apply.",
    });
    expect(result.ok).toBe(true);
    jobId = (result as { enquiryId: string }).enquiryId;
    const row = await db.enquiry.findUniqueOrThrow({ where: { id: jobId } });
    expect(row.subject).toBe(`${TAG} Mathematics teacher`);
  });

  it("the sides are exactly: the opener, the admins, the named contact — and nobody else", async () => {
    const asOpener = await readEnquiry(parent, admissionId);
    expect(asOpener.side).toBe("opener");
    const asAdmin = await readEnquiry(riversideAdmin, admissionId);
    expect(asAdmin.side).toBe("school");
    const asContact = await readEnquiry(contact, admissionId);
    expect(asContact.side).toBe("school");
    // A teacher who is nobody's contact is the staff room, not the desk.
    await expect(readEnquiry(bystander, admissionId)).rejects.toThrow(AccessError);
    // Another school's admin is another school.
    await expect(readEnquiry(oakfieldAdmin, admissionId)).rejects.toThrow(AccessError);
  });

  it("lists follow the same lines", async () => {
    const forAdmin = await listEnquiries(riversideAdmin);
    expect(forAdmin.inbox.map((e) => e.id)).toEqual(expect.arrayContaining([admissionId, jobId]));

    const forContact = await listEnquiries(contact);
    expect(forContact.inbox.map((e) => e.id)).toEqual(expect.arrayContaining([admissionId, jobId]));

    const forBystander = await listEnquiries(bystander);
    expect(forBystander.inbox).toHaveLength(0);
    expect(await anyEnquiries(bystander)).toBe(false);

    const forParent = await listEnquiries(parent);
    expect(forParent.sent.map((e) => e.id)).toEqual([admissionId]);
    expect(await anyEnquiries(parent)).toBe(true);
  });

  it("a reply from the desk lands on the opener in the opener's language", async () => {
    const result = await replyToEnquiry(contact, admissionId, "Yes — three places in Grade 3.");
    expect(result.ok).toBe(true);
    const note = await db.notification.findFirstOrThrow({
      where: { userId: parent.user.id, kind: "ENQUIRY", url: `/enquiries/${admissionId}` },
    });
    // The parent reads Hindi, so the news is Hindi.
    expect(note.title).toBe("आपकी पूछताछ पर नया उत्तर");
  });

  it("only the school closes, and a closed thread takes no more words", async () => {
    await expect(closeEnquiry(parent, admissionId)).rejects.toThrow(AccessError);
    const closed = await closeEnquiry(riversideAdmin, admissionId);
    expect(closed.ok).toBe(true);
    const late = await replyToEnquiry(parent, admissionId, "one more thing");
    expect(late).toMatchObject({ ok: false, errorKey: "enquiries.thisThreadIsClosed" });
    // A new question after closure is a NEW thread, not a resurrection.
    expect(await findMyOpenEnquiry(parent, riversideId, "ADMISSION", null)).toBeNull();
  });

  it("closing the vacancy closes the door to NEW enquiries while the thread lives on", async () => {
    await closePosting(riversideAdmin, postingId);
    // The opener with a LIVE thread is absorbed, exactly as if they had used
    // the reply box — closing the vacancy closes the door, not the mouth.
    const absorbed = await openEnquiry(oakTeacher, {
      schoolId: riversideId, kind: "JOB", jobPostingId: postingId, body: "too late?",
    });
    expect(absorbed).toMatchObject({ ok: true, enquiryId: jobId });
    const freshUser = await db.user.create({ data: { name: `${TAG} Late Teacher`, prefs: "{}" } });
    const freshMembership = await db.membership.create({
      data: { userId: freshUser.id, schoolId: oakfieldId, role: "TEACHER", status: "ACTIVE" },
    });
    const fresh = ctx({ userId: freshUser.id, membershipId: freshMembership.id, schoolId: oakfieldId, role: "TEACHER" });
    const trulyRefused = await openEnquiry(fresh, {
      schoolId: riversideId, kind: "JOB", jobPostingId: postingId, body: "too late?",
    });
    expect(trulyRefused).toMatchObject({ ok: false, errorKey: "enquiries.vacancyNoLongerOpen" });
    // The existing thread still answers.
    const stillReadable = await readEnquiry(oakTeacher, jobId);
    expect(stillReadable.status).toBe("OPEN");
  });
});
