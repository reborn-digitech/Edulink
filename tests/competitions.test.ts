import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  createCompetition,
  enterCompetition,
  getCompetition,
  giveConsent,
  listCompetitions,
  listOwnCompetitions,
  pendingConsents,
  setCompetitionStatus,
  registrationOpen,
  withdrawEntry,
} from "@/lib/competitions";
import type { ActiveContext } from "@/lib/session";

/**
 * The competitions marketplace, and the one rule that actually matters in it.
 *
 * Entering sends a child's name out of the school, usually to an organisation
 * nobody here controls. So an entry is inert until a guardian says yes: it
 * exists, the child can see they asked, and it counts for NOTHING until then.
 * Every test below that says "awaiting consent" is really asking whether a
 * nine-year-old can put themselves in front of strangers on their own.
 *
 * The other half is the shape the schema chose: the catalogue is shared between
 * schools and the entries are not. Both halves are checked, because getting the
 * first one wrong makes the feature pointless and getting the second one wrong
 * publishes a list of children.
 *
 * Tenant isolation here is checked at the QUERY level, as everywhere else in
 * this suite — it runs as the database owner, so the policies are not in play.
 * `npm run rls:verify` covers those.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
}

let child: ActiveContext; // a Riverside pupil with a guardian
let classmate: ActiveContext; // another Riverside pupil, NOT guarded by that parent
let guardian: ActiveContext; // the first child's parent
let otherSchoolChild: ActiveContext; // an Oakfield pupil
let admin: ActiveContext;

let published: string;
let draft: string;
let closed: string;
let noConsentNeeded: string;

const TITLE = "TEST Junior Maths Challenge";

async function cleanup() {
  await db.competitionEntry.deleteMany({ where: { competition: { title: { startsWith: "TEST " } } } });
  await db.competition.deleteMany({ where: { title: { startsWith: "TEST " } } });
  await db.notification.deleteMany({ where: { title: { contains: "TEST " } } });
  await db.auditLog.deleteMany({ where: { action: { startsWith: "competition." } } });
}

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });
  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const parentUser = await db.user.findUniqueOrThrow({ where: { email: "parent@example.com" } });

  const guarded = await db.guardianship.findFirstOrThrow({
    where: { parentUserId: parentUser.id, status: "ACTIVE", student: { schoolId: riverside.id } },
    include: { student: true },
  });
  const notGuarded = await db.membership.findFirstOrThrow({
    where: {
      schoolId: riverside.id,
      role: "STUDENT",
      status: "ACTIVE",
      id: { not: guarded.studentMembershipId },
    },
  });
  const oakStudent = await db.membership.findFirstOrThrow({
    where: { schoolId: oakfield.id, role: "STUDENT", status: "ACTIVE" },
  });
  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riverside.id, role: "ADMIN" },
  });

  child = ctx({
    userId: guarded.student.userId,
    membershipId: guarded.studentMembershipId,
    schoolId: riverside.id,
    role: "STUDENT",
  });
  classmate = ctx({
    userId: notGuarded.userId,
    membershipId: notGuarded.id,
    schoolId: riverside.id,
    role: "STUDENT",
  });
  guardian = ctx({ userId: parentUser.id, role: "PARENT" });
  otherSchoolChild = ctx({
    userId: oakStudent.userId,
    membershipId: oakStudent.id,
    schoolId: oakfield.id,
    role: "STUDENT",
  });
  admin = ctx({
    userId: priya.id,
    membershipId: priyaAdmin.id,
    schoolId: riverside.id,
    role: "ADMIN",
  });

  await cleanup();

  const soon = new Date(Date.now() + 30 * 86_400_000);
  const longAgo = new Date(Date.now() - 30 * 86_400_000);

  published = (
    await db.competition.create({
      data: {
        title: TITLE,
        summary: "Sums, but competitive.",
        organizerName: "The Maths Trust",
        status: "PUBLISHED",
        registrationClosesAt: soon,
        requiresParentConsent: true,
      },
    })
  ).id;
  draft = (
    await db.competition.create({
      data: { title: "TEST Draft Cup", summary: "Not ready", organizerName: "Nobody", status: "DRAFT" },
    })
  ).id;
  closed = (
    await db.competition.create({
      data: {
        title: "TEST Closed Cup",
        summary: "Too late",
        organizerName: "The Maths Trust",
        status: "PUBLISHED",
        registrationClosesAt: longAgo,
      },
    })
  ).id;
  noConsentNeeded = (
    await db.competition.create({
      data: {
        title: "TEST Reading Week",
        summary: "In school, no data leaves",
        organizerName: "Riverside Primary School",
        organizerSchoolId: riverside.id,
        status: "PUBLISHED",
        requiresParentConsent: false,
      },
    })
  ).id;
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe("registrationOpen", () => {
  const now = new Date("2026-07-31T12:00:00Z");
  const day = 86_400_000;

  it("⚠ treats no stated deadline as open, not closed", () => {
    // Reading a missing date as closed would hide every competition that never
    // published one, which is most of them.
    expect(registrationOpen({ registrationOpensAt: null, registrationClosesAt: null }, now)).toBe(true);
  });

  it("is closed before it opens", () => {
    expect(
      registrationOpen(
        { registrationOpensAt: new Date(now.getTime() + day), registrationClosesAt: null },
        now,
      ),
    ).toBe(false);
  });

  it("is closed after the deadline", () => {
    expect(
      registrationOpen(
        { registrationOpensAt: null, registrationClosesAt: new Date(now.getTime() - day) },
        now,
      ),
    ).toBe(false);
  });

  it("is open on the boundary itself, so a deadline includes its own moment", () => {
    expect(registrationOpen({ registrationOpensAt: now, registrationClosesAt: now }, now)).toBe(true);
  });
});

describe("the catalogue", () => {
  it("lists published competitions", async () => {
    const list = await listCompetitions(child);
    expect(list.map((c) => c.id)).toContain(published);
  });

  it("⚠ never lists a draft", async () => {
    const list = await listCompetitions(admin);
    expect(list.map((c) => c.id)).not.toContain(draft);
  });

  it("⚠ is the SAME catalogue at both schools — that is what makes it a marketplace", async () => {
    const riversideView = await listCompetitions(child);
    const oakfieldView = await listCompetitions(otherSchoolChild);
    expect(oakfieldView.map((c) => c.id)).toContain(published);
    expect(riversideView.map((c) => c.id).sort()).toEqual(oakfieldView.map((c) => c.id).sort());
  });

  it("can hide the ones nobody can enter any more", async () => {
    const all = await listCompetitions(child);
    const open = await listCompetitions(child, { openOnly: true });
    expect(all.map((c) => c.id)).toContain(closed);
    expect(open.map((c) => c.id)).not.toContain(closed);
  });

  it("a draft is NOT FOUND rather than forbidden, so it does not confirm itself", async () => {
    await expect(getCompetition(child, draft)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("…except to the admin of the school organising it, who has to publish it", async () => {
    const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
    const own = await db.competition.create({
      data: {
        title: "TEST Our Own Draft",
        summary: "ours",
        organizerName: "Riverside",
        organizerSchoolId: riverside.id,
        status: "DRAFT",
      },
    });
    const seen = await getCompetition(admin, own.id);
    expect(seen.isOrganiser).toBe(true);
  });
});

describe("entering", () => {
  it("creates an entry that is NOT yet consented", async () => {
    const result = await enterCompetition(child, published);
    expect(result.awaitingConsent).toBe(true);

    const row = await db.competitionEntry.findUniqueOrThrow({ where: { id: result.entryId } });
    expect(row.parentConsentAt).toBeNull();
    expect(row.status).toBe("REGISTERED");
  });

  it("⚠ tells the guardian, or nothing happens anywhere a grown-up can see", async () => {
    const notifications = await db.notification.findMany({
      where: { userId: guardian.user.id, kind: "COMPETITION" },
    });
    expect(notifications.some((n) => n.title.includes(TITLE))).toBe(true);
  });

  it("⚠ does not count as taking part until a guardian says yes", async () => {
    const seen = await getCompetition(child, published);
    expect(seen.entry?.awaitingConsent).toBe(true);
    expect(seen.enteredCount).toBe(0);
  });

  it("is idempotent — a second press is not an error", async () => {
    const first = await enterCompetition(child, published);
    const second = await enterCompetition(child, published);
    expect(second.entryId).toBe(first.entryId);

    const count = await db.competitionEntry.count({
      where: { competitionId: published, studentMembershipId: child.membershipId! },
    });
    expect(count).toBe(1);
  });

  it("⚠ refuses once entries have closed", async () => {
    await expect(enterCompetition(child, closed)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ refuses a draft, by id, even though it exists", async () => {
    await expect(enterCompetition(child, draft)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("⚠ refuses everyone who is not a student — including the guardian", async () => {
    await expect(enterCompetition(guardian, published)).rejects.toBeInstanceOf(AccessError);
    await expect(enterCompetition(admin, published)).rejects.toBeInstanceOf(AccessError);
  });

  it("needs no consent when nothing leaves the school", async () => {
    const result = await enterCompetition(classmate, noConsentNeeded);
    expect(result.awaitingConsent).toBe(false);
  });
});

describe("consent", () => {
  it("⚠ a guardian can consent for their own child", async () => {
    const { entryId } = await enterCompetition(child, published);
    await giveConsent(guardian, entryId);

    const row = await db.competitionEntry.findUniqueOrThrow({ where: { id: entryId } });
    expect(row.parentConsentAt).not.toBeNull();
    expect(row.parentConsentBy).toBe(guardian.user.id);
  });

  it("⚠ and then the child counts as taking part", async () => {
    const seen = await getCompetition(child, published);
    expect(seen.entry?.awaitingConsent).toBe(false);
    expect(seen.enteredCount).toBe(1);
  });

  it("⚠ a guardian CANNOT consent for a child who is not theirs", async () => {
    const { entryId } = await enterCompetition(classmate, published);
    await expect(giveConsent(guardian, entryId)).rejects.toMatchObject({ code: "NOT_FOUND" });

    const row = await db.competitionEntry.findUniqueOrThrow({ where: { id: entryId } });
    expect(row.parentConsentAt).toBeNull();
  });

  it("⚠ a child cannot consent for themselves", async () => {
    const { entryId } = await enterCompetition(classmate, published);
    await expect(giveConsent(classmate, entryId)).rejects.toBeInstanceOf(AccessError);

    const row = await db.competitionEntry.findUniqueOrThrow({ where: { id: entryId } });
    expect(row.parentConsentAt).toBeNull();
  });

  it("⚠ nor can an admin, who is not the child's guardian", async () => {
    const { entryId } = await enterCompetition(classmate, published);
    await expect(giveConsent(admin, entryId)).rejects.toBeInstanceOf(AccessError);
  });

  it("consenting twice is not an error and does not move the timestamp", async () => {
    const { entryId } = await enterCompetition(child, published);
    await giveConsent(guardian, entryId);
    const first = await db.competitionEntry.findUniqueOrThrow({ where: { id: entryId } });
    await giveConsent(guardian, entryId);
    const second = await db.competitionEntry.findUniqueOrThrow({ where: { id: entryId } });
    expect(second.parentConsentAt?.getTime()).toBe(first.parentConsentAt?.getTime());
  });

  it("tells the child once they are in", async () => {
    const student = await db.membership.findUniqueOrThrow({ where: { id: child.membershipId! } });
    const notifications = await db.notification.findMany({
      where: { userId: student.userId, kind: "COMPETITION" },
    });
    expect(notifications.some((n) => n.title.includes(TITLE))).toBe(true);
  });
});

describe("the parent's waiting list", () => {
  it("shows what is waiting on them, naming the child", async () => {
    await db.competitionEntry.deleteMany({ where: { competitionId: published } });
    await enterCompetition(child, published);

    const waiting = await pendingConsents(guardian);
    expect(waiting.some((w) => w.title === TITLE)).toBe(true);
    expect(waiting[0]?.childName).toBeTruthy();
  });

  it("⚠ drops off the list the moment consent is given", async () => {
    const waiting = await pendingConsents(guardian);
    const target = waiting.find((w) => w.title === TITLE)!;
    await giveConsent(guardian, target.entryId);

    const after = await pendingConsents(guardian);
    expect(after.some((w) => w.title === TITLE)).toBe(false);
  });

  it("⚠ never shows another parent's child", async () => {
    await enterCompetition(classmate, published);
    const waiting = await pendingConsents(guardian);
    const classmateEntry = await db.competitionEntry.findFirstOrThrow({
      where: { competitionId: published, studentMembershipId: classmate.membershipId! },
    });
    expect(waiting.some((w) => w.entryId === classmateEntry.id)).toBe(false);
  });

  it("stops asking about a competition that was pulled", async () => {
    const pulled = await db.competition.create({
      data: {
        title: "TEST Pulled Cup",
        summary: "here then gone",
        organizerName: "Someone",
        status: "PUBLISHED",
        requiresParentConsent: true,
      },
    });
    await enterCompetition(child, pulled.id);
    expect((await pendingConsents(guardian)).some((w) => w.competitionId === pulled.id)).toBe(true);

    await db.competition.update({ where: { id: pulled.id }, data: { status: "ARCHIVED" } });
    expect((await pendingConsents(guardian)).some((w) => w.competitionId === pulled.id)).toBe(false);
  });

  it("is empty for anybody who is not a guardian", async () => {
    expect(await pendingConsents(child)).toEqual([]);
    expect(await pendingConsents(admin)).toEqual([]);
  });
});

describe("withdrawing", () => {
  it("a guardian can change their mind", async () => {
    await db.competitionEntry.deleteMany({ where: { competitionId: published } });
    const { entryId } = await enterCompetition(child, published);
    await giveConsent(guardian, entryId);
    await withdrawEntry(guardian, entryId);

    expect(await db.competitionEntry.findUnique({ where: { id: entryId } })).toBeNull();
  });

  it("a child can withdraw their own entry", async () => {
    const { entryId } = await enterCompetition(child, published);
    await withdrawEntry(child, entryId);
    expect(await db.competitionEntry.findUnique({ where: { id: entryId } })).toBeNull();
  });

  it("⚠ a child cannot withdraw somebody else's", async () => {
    const { entryId } = await enterCompetition(classmate, published);
    await expect(withdrawEntry(child, entryId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await db.competitionEntry.findUnique({ where: { id: entryId } })).not.toBeNull();
  });

  it("⚠ a parent cannot withdraw a child who is not theirs", async () => {
    const entry = await db.competitionEntry.findFirstOrThrow({
      where: { studentMembershipId: classmate.membershipId! },
    });
    await expect(withdrawEntry(guardian, entry.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("lets the child ask again — a no today is not a no forever", async () => {
    const again = await enterCompetition(child, published);
    expect(again.awaitingConsent).toBe(true);
  });
});

describe("organising one", () => {
  it("saves as a DRAFT — publishing is a separate, deliberate press", async () => {
    const id = await createCompetition(admin, {
      title: "TEST Our Spelling Bee",
      summary: "In the hall",
      requiresParentConsent: false,
    });
    const row = await db.competition.findUniqueOrThrow({ where: { id } });
    expect(row.status).toBe("DRAFT");
  });

  it("⚠ stamps the organising school from the SESSION, not from the form", async () => {
    const id = await createCompetition(admin, {
      title: "TEST Stamped",
      summary: "x",
      requiresParentConsent: true,
    });
    const row = await db.competition.findUniqueOrThrow({ where: { id } });
    expect(row.organizerSchoolId).toBe(admin.schoolId);
    expect(row.organizerName).toBe("Riverside Primary School");
  });

  it("⚠ cannot mark its own competition as checked by EduLink", async () => {
    const id = await createCompetition(admin, {
      title: "TEST Not Verified",
      summary: "x",
      requiresParentConsent: true,
      // @ts-expect-error — deliberately passing a field the input type refuses
      verified: true,
    });
    const row = await db.competition.findUniqueOrThrow({ where: { id } });
    expect(row.verified).toBe(false);
  });

  it("⚠ refuses everyone who is not an admin", async () => {
    const input = { title: "TEST Nope", summary: "x", requiresParentConsent: true };
    await expect(createCompetition(child, input)).rejects.toBeInstanceOf(AccessError);
    await expect(createCompetition(guardian, input)).rejects.toBeInstanceOf(AccessError);
  });

  it("a draft is invisible until published, then visible to the other school too", async () => {
    const id = await createCompetition(admin, {
      title: "TEST Goes Live",
      summary: "x",
      requiresParentConsent: false,
    });
    expect((await listCompetitions(otherSchoolChild)).map((c) => c.id)).not.toContain(id);

    await setCompetitionStatus(admin, id, "PUBLISHED");
    expect((await listCompetitions(otherSchoolChild)).map((c) => c.id)).toContain(id);
  });

  it("⚠ another school's admin cannot publish or withdraw it", async () => {
    const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });
    const sam = await db.user.findUniqueOrThrow({ where: { email: "sam@oakfield.school" } });
    const samAdmin = await db.membership.findFirstOrThrow({
      where: { userId: sam.id, schoolId: oakfield.id, role: "ADMIN" },
    });
    const otherAdmin = ctx({
      userId: sam.id,
      membershipId: samAdmin.id,
      schoolId: oakfield.id,
      role: "ADMIN",
    });

    const id = await createCompetition(admin, {
      title: "TEST Ours Not Theirs",
      summary: "x",
      requiresParentConsent: false,
    });
    await expect(setCompetitionStatus(otherAdmin, id, "PUBLISHED")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect((await db.competition.findUniqueOrThrow({ where: { id } })).status).toBe("DRAFT");
  });

  it("⚠ nobody can publish an externally-organised one, which no school owns", async () => {
    await expect(setCompetitionStatus(admin, published, "ARCHIVED")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("⚠ withdrawing KEEPS the entries already made", async () => {
    const id = await createCompetition(admin, {
      title: "TEST Withdrawn Later",
      summary: "x",
      requiresParentConsent: false,
    });
    await setCompetitionStatus(admin, id, "PUBLISHED");
    const { entryId } = await enterCompetition(child, id);

    await setCompetitionStatus(admin, id, "ARCHIVED");

    // Off the list, but the child's entry is still there — deleting it would
    // take away something a guardian may already have agreed to.
    expect((await listCompetitions(child)).map((c) => c.id)).not.toContain(id);
    expect(await db.competitionEntry.findUnique({ where: { id: entryId } })).not.toBeNull();
  });

  it("lists this school's own, and only this school's", async () => {
    const own = await listOwnCompetitions(admin);
    expect(own.length).toBeGreaterThan(0);

    // Every row actually belongs to this school. Checked against the database
    // rather than against the titles, because the seed legitimately organises
    // some of its own and they belong in this list too.
    const rows = await db.competition.findMany({
      where: { id: { in: own.map((c) => c.id) } },
      select: { organizerSchoolId: true },
    });
    expect(rows.every((r) => r.organizerSchoolId === admin.schoolId)).toBe(true);

    // An externally-organised one belongs to no school, so it is in nobody's list.
    expect(own.map((c) => c.id)).not.toContain(published);
    expect(await listOwnCompetitions(child)).toEqual([]);
  });
});
