import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  createCompetition,
  enterCompetition,
  getCompetition,
  giveConsent,
  listCompetitions,
  listEntriesForResults,
  listOwnCompetitions,
  ordinal,
  pendingConsents,
  recordResult,
  submitEntry,
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
      isSuperuser: false,
      isAppAdmin: false,
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

describe("the catalogue, in two sections", () => {
  it("lists published competitions, platform ones in the platform section", async () => {
    const list = await listCompetitions(child);
    expect(list.platform.map((c) => c.id)).toContain(published);
    expect(list.school.map((c) => c.id)).not.toContain(published);
  });

  it("puts the school's own in the school section", async () => {
    const list = await listCompetitions(child);
    expect(list.school.map((c) => c.id)).toContain(noConsentNeeded);
    expect(list.platform.map((c) => c.id)).not.toContain(noConsentNeeded);
  });

  it("⚠ never lists a draft", async () => {
    const list = await listCompetitions(admin);
    expect([...list.school, ...list.platform].map((c) => c.id)).not.toContain(draft);
  });

  it("⚠ the PLATFORM section is the same at both schools; the SCHOOL section is each school's own", async () => {
    const riversideView = await listCompetitions(child);
    const oakfieldView = await listCompetitions(otherSchoolChild);

    // The half that makes it a marketplace: platform competitions are one
    // catalogue for the whole server.
    expect(oakfieldView.platform.map((c) => c.id)).toContain(published);
    expect(riversideView.platform.map((c) => c.id).sort()).toEqual(
      oakfieldView.platform.map((c) => c.id).sort(),
    );

    // The half that keeps a school's own to itself: Riverside's Reading Week
    // does not exist from Oakfield.
    expect(oakfieldView.school.map((c) => c.id)).not.toContain(noConsentNeeded);
  });

  it("⚠ another school's own competition is NOT FOUND to read and NOT FOUND to enter", async () => {
    // noConsentNeeded is Riverside's own. From Oakfield it must be
    // indistinguishable from a competition that does not exist — reading it
    // would leak a school's internal events, entering it would put a child on
    // another school's list.
    await expect(getCompetition(otherSchoolChild, noConsentNeeded)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(enterCompetition(otherSchoolChild, noConsentNeeded)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("a guardian sees their child's school's competitions, whatever their own context", async () => {
    // The consent notification links straight to the competition; a parent has
    // no membership and often no active school. The guardianship's
    // studentSchoolId is what lets the link work.
    const view = await listCompetitions(guardian);
    expect(view.school.map((c) => c.id)).toContain(noConsentNeeded);
    const seen = await getCompetition(guardian, noConsentNeeded);
    expect(seen.id).toBe(noConsentNeeded);
  });

  it("can hide the ones nobody can enter any more", async () => {
    const all = await listCompetitions(child);
    const open = await listCompetitions(child, { openOnly: true });
    expect(all.platform.map((c) => c.id)).toContain(closed);
    expect(open.platform.map((c) => c.id)).not.toContain(closed);
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

  it("⚠ refuses everyone who is neither a pupil nor a guardian naming a child of theirs", async () => {
    // decision 0007: a guardian may enrol, but only a child of theirs, named; nobody else enrols anybody.
    await expect(enterCompetition(guardian, published)).rejects.toThrow("competitions.chooseAChild");
    await expect(enterCompetition(guardian, published, { studentMembershipId: classmate.membershipId })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(enterCompetition(admin, published)).rejects.toBeInstanceOf(AccessError);
    await expect(enterCompetition(admin, published, { studentMembershipId: child.membershipId })).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ a guardian enrolling their own child IS the consent: stamped by the guardian, never by the pupil's path (decision 0007)", async () => {
    await db.competitionEntry.deleteMany({ where: { competitionId: published, studentMembershipId: child.membershipId! } });
    const result = await enterCompetition(guardian, published, { studentMembershipId: child.membershipId });
    expect(result.awaitingConsent).toBe(false);
    const row = await db.competitionEntry.findUniqueOrThrow({ where: { id: result.entryId } });
    expect(row.parentConsentBy).toBe(guardian.user.id);
    expect(row.parentConsentAt).not.toBeNull();
    expect((await getCompetition(child, published)).enteredCount).toBe(1);
    // The child asked first; the guardian's enrolment is their yes, on the same row.
    await db.competitionEntry.update({ where: { id: row.id }, data: { parentConsentAt: null, parentConsentBy: null } });
    const again = await enterCompetition(guardian, published, { studentMembershipId: child.membershipId });
    expect(again.entryId).toBe(row.id);
    expect((await db.competitionEntry.findUniqueOrThrow({ where: { id: row.id } })).parentConsentBy).toBe(guardian.user.id);
    // Back to the pupil's own ask for the consent cases below.
    await db.competitionEntry.deleteMany({ where: { id: row.id } });
    await db.notification.deleteMany({ where: { userId: child.user.id, kind: "COMPETITION", title: { contains: TITLE } } });
    await enterCompetition(child, published);
  }, 20_000); // three enrolments with their notifications: past five seconds under a loaded machine

  it("⚠ the office's enrolment switch stands above the dates (decision 0007)", async () => {
    await db.competition.update({ where: { id: noConsentNeeded }, data: { enrolmentOpen: false } });
    await expect(enterCompetition(child, noConsentNeeded)).rejects.toThrow("access.entriesForThisCompetitionHaveClosed");
    expect((await getCompetition(child, noConsentNeeded)).open).toBe(false);
    await db.competition.update({ where: { id: noConsentNeeded }, data: { enrolmentOpen: true } });
    expect((await getCompetition(child, noConsentNeeded)).open).toBe(true);
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

  it("⚠ a result recorded before the yes reaches the board the moment the yes is given", async () => {
    const { recordResult } = await import("@/lib/competitions");
    const riversideId = child.schoolId!;
    const cup = await db.competition.create({
      data: { title: "TEST Consent Board Cup", summary: "Scored before consent", organizerName: "The Maths Trust", status: "PUBLISHED", requiresParentConsent: true, registrationClosesAt: new Date(Date.now() + 30 * 86_400_000) },
      select: { id: true },
    });
    try {
      const { entryId } = await enterCompetition(child, cup.id);
      await recordResult(admin, entryId, { scoreMilli: 7_000, rank: 2 });
      // Without consent the result is not the school's to show.
      expect(await db.competitionStanding.count({ where: { competitionId: cup.id, schoolId: riversideId } })).toBe(0);

      await giveConsent(guardian, entryId);
      const row = await db.competitionStanding.findUniqueOrThrow({ where: { competitionId_schoolId: { competitionId: cup.id, schoolId: riversideId } } });
      expect(row).toMatchObject({ entrants: 1, bestRank: 2, bestScoreMilli: 7_000 });
    } finally {
      await db.competition.delete({ where: { id: cup.id } });
    }
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

  it("⚠ cannot mark its own competition as checked by Shalaghar", async () => {
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

  it("a draft is invisible until published — and then only to ITS OWN school", async () => {
    const id = await createCompetition(admin, {
      title: "TEST Goes Live",
      summary: "x",
      requiresParentConsent: false,
    });
    const before = await listCompetitions(child);
    expect([...before.school, ...before.platform].map((c) => c.id)).not.toContain(id);

    await setCompetitionStatus(admin, id, "PUBLISHED");

    // The organising school's own student sees it, in the school section.
    const after = await listCompetitions(child);
    expect(after.school.map((c) => c.id)).toContain(id);
    expect(after.platform.map((c) => c.id)).not.toContain(id);

    // The school next door never does — publishing widened it to Riverside,
    // not to the server.
    const elsewhere = await listCompetitions(otherSchoolChild);
    expect([...elsewhere.school, ...elsewhere.platform].map((c) => c.id)).not.toContain(id);
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
    const listed = await listCompetitions(child);
    expect([...listed.school, ...listed.platform].map((c) => c.id)).not.toContain(id);
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

describe("handing in", () => {
  it("⚠ refuses until a guardian has said yes", async () => {
    await db.competitionEntry.deleteMany({ where: { competitionId: published } });
    await enterCompetition(child, published);

    await expect(
      submitEntry(child, published, "https://example.org/my-poem"),
    ).rejects.toBeInstanceOf(AccessError);

    const row = await db.competitionEntry.findFirstOrThrow({ where: { competitionId: published } });
    expect(row.submissionUrl).toBeNull();
    expect(row.status).toBe("REGISTERED");
  });

  it("accepts the work once consent is given", async () => {
    const entry = await db.competitionEntry.findFirstOrThrow({ where: { competitionId: published } });
    await giveConsent(guardian, entry.id);
    await submitEntry(child, published, "https://example.org/my-poem");

    const row = await db.competitionEntry.findUniqueOrThrow({ where: { id: entry.id } });
    expect(row.status).toBe("SUBMITTED");
    expect(row.submissionUrl).toBe("https://example.org/my-poem");
  });

  it("lets a child replace a link they got wrong", async () => {
    await submitEntry(child, published, "https://example.org/the-right-one");
    const row = await db.competitionEntry.findFirstOrThrow({ where: { competitionId: published } });
    expect(row.submissionUrl).toBe("https://example.org/the-right-one");
  });

  it("needs no consent where the competition needs none", async () => {
    await db.competitionEntry.deleteMany({ where: { competitionId: noConsentNeeded } });
    await enterCompetition(classmate, noConsentNeeded);
    await submitEntry(classmate, noConsentNeeded, "https://example.org/spelling");

    const row = await db.competitionEntry.findFirstOrThrow({
      where: { competitionId: noConsentNeeded },
    });
    expect(row.status).toBe("SUBMITTED");
  });

  it("⚠ refuses somebody who never entered", async () => {
    await db.competitionEntry.deleteMany({ where: { competitionId: noConsentNeeded } });
    await expect(
      submitEntry(classmate, noConsentNeeded, "https://example.org/cheeky"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("⚠ refuses everyone who is not the child — including their guardian", async () => {
    await expect(submitEntry(guardian, published, "https://x.test")).rejects.toBeInstanceOf(AccessError);
    await expect(submitEntry(admin, published, "https://x.test")).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ refuses once the competition has finished", async () => {
    const finished = await db.competition.create({
      data: {
        title: "TEST Finished Cup",
        summary: "over",
        organizerName: "Someone",
        status: "PUBLISHED",
        requiresParentConsent: false,
        endsAt: new Date(Date.now() - 86_400_000),
      },
    });
    await enterCompetition(child, finished.id);
    await expect(submitEntry(child, finished.id, "https://x.test")).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ but a closed REGISTRATION does not close the hand-in", async () => {
    // Entries close so the organiser knows who is coming; the thing itself
    // happens afterwards. A child who registered in time must still hand in.
    const late = await db.competition.create({
      data: {
        title: "TEST Late Handin",
        summary: "registration shut, event running",
        organizerName: "Someone",
        status: "PUBLISHED",
        requiresParentConsent: false,
        registrationClosesAt: new Date(Date.now() - 86_400_000),
        endsAt: new Date(Date.now() + 86_400_000),
      },
    });
    // Registered while it was still open (written directly, as it would have been).
    await db.competitionEntry.create({
      data: {
        competitionId: late.id,
        studentMembershipId: child.membershipId!,
        schoolId: child.schoolId!,
        status: "REGISTERED",
        parentConsentAt: new Date(),
      },
    });

    await submitEntry(child, late.id, "https://example.org/just-in-time");
    const row = await db.competitionEntry.findFirstOrThrow({ where: { competitionId: late.id } });
    expect(row.status).toBe("SUBMITTED");
  });
});

describe("recording a result", () => {
  let entryId: string;

  beforeEach(async () => {
    await db.competitionEntry.deleteMany({ where: { competitionId: published } });
    const result = await enterCompetition(child, published);
    await giveConsent(guardian, result.entryId);
    await submitEntry(child, published, "https://example.org/my-poem");
    entryId = result.entryId;
  });

  it("stores the score in integer thousandths, never a float", async () => {
    await recordResult(admin, entryId, { scoreMilli: 18_500, rank: 3 });

    const row = await db.competitionEntry.findUniqueOrThrow({ where: { id: entryId } });
    expect(row.scoreMilli).toBe(18_500);
    expect(row.rank).toBe(3);
    expect(row.status).toBe("RESULTS");
  });

  it("tells the child and the people at home", async () => {
    await recordResult(admin, entryId, { scoreMilli: 18_500, rank: 3 });

    const student = await db.membership.findUniqueOrThrow({ where: { id: child.membershipId! } });
    const theirs = await db.notification.findMany({
      where: { userId: student.userId, kind: "COMPETITION" },
    });
    const guardians = await db.notification.findMany({
      where: { userId: guardian.user.id, kind: "COMPETITION" },
    });
    expect(theirs.some((n) => n.title.includes("Your result"))).toBe(true);
    expect(guardians.some((n) => n.title.includes("result"))).toBe(true);
  });

  it("⚠ refuses a negative score", async () => {
    await expect(
      recordResult(admin, entryId, { scoreMilli: -1, rank: null }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ refuses a place below first, or a fractional one", async () => {
    await expect(recordResult(admin, entryId, { scoreMilli: null, rank: 0 })).rejects.toBeInstanceOf(AccessError);
    await expect(recordResult(admin, entryId, { scoreMilli: null, rank: 1.5 })).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ refuses a child recording their own result", async () => {
    await expect(
      recordResult(child, entryId, { scoreMilli: 20_000, rank: 1 }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ refuses a guardian recording it", async () => {
    await expect(
      recordResult(guardian, entryId, { scoreMilli: 20_000, rank: 1 }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ clearing a result is not the same as scoring zero", async () => {
    await recordResult(admin, entryId, { scoreMilli: 18_500, rank: 3 });
    await recordResult(admin, entryId, { scoreMilli: null, rank: null });

    const row = await db.competitionEntry.findUniqueOrThrow({ where: { id: entryId } });
    expect(row.scoreMilli).toBeNull();
    expect(row.rank).toBeNull();
    // Back to where it was, not left claiming results are in.
    expect(row.status).toBe("SUBMITTED");
  });

  it("a score of zero is a real score and stays one", async () => {
    await recordResult(admin, entryId, { scoreMilli: 0, rank: null });
    const row = await db.competitionEntry.findUniqueOrThrow({ where: { id: entryId } });
    expect(row.scoreMilli).toBe(0);
    expect(row.status).toBe("RESULTS");
  });

  it("shows staff this school's entries with the work attached", async () => {
    await recordResult(admin, entryId, { scoreMilli: 18_500, rank: 3 });
    const rows = await listEntriesForResults(admin, published);
    const mine = rows.find((r) => r.entryId === entryId)!;

    expect(mine.submissionUrl).toBe("https://example.org/my-poem");
    expect(mine.scoreMilli).toBe(18_500);
    expect(mine.studentName).toBeTruthy();
  });

  it("⚠ shows a child nothing — this is a staff view", async () => {
    expect(await listEntriesForResults(child, published)).toEqual([]);
    expect(await listEntriesForResults(guardian, published)).toEqual([]);
  });

  it("the child can see their own result", async () => {
    await recordResult(admin, entryId, { scoreMilli: 18_500, rank: 3 });
    const seen = await getCompetition(child, published);
    expect(seen.entry?.scoreMilli).toBe(18_500);
    expect(seen.entry?.rank).toBe(3);
  });
});

describe("ordinal", () => {
  it("reads the way a child would say it", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(ordinal)).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st", "111th",
    ]);
  });
});
