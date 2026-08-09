import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { accessHistory, removeSchool, withSchoolAccess } from "@/lib/superuser";
import {
  findPeople,
  listPeople,
  listPosts,
  schoolOverview,
  setMembershipSuspension,
  takeDownPost,
} from "@/lib/operator-oversight";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

/**
 * Whoever runs the server, looking inside a school.
 *
 * THE ACCESS MODEL IS ALWAYS-ON NOW — the operator no longer asks for a grant —
 * so what this file proves has shifted with it: that anybody who does NOT run
 * the server is refused at the door; that every look inside still writes a
 * visit row the school can read, without stacking one up per query; that every
 * action lands in THAT SCHOOL'S audit log; and that the powers are the narrow
 * ones — take a post down, pause a person — with the last-admin rule holding
 * for the host exactly as it holds for the school.
 *
 * WHAT IT CANNOT PROVE is the containment itself. The suite connects as the
 * database OWNER, so row-level security is not in force. That claim is made
 * live in `npm run rls:verify`, which binds one school and checks the other
 * stays dark.
 */

const db = new PrismaClient();

const SUFFIX = "@zzoversight.test";
const SCHOOL_SLUG = "zz-oversight-school";
const OTHER_SLUG = "zz-oversight-other";
const DOOMED_SLUG = "zz-oversight-doomed";

let schoolId: string;
let otherSchoolId: string;
let operator: ActiveContext;
let notOperator: ActiveContext;
let adminMembershipId: string;
let secondAdminMembershipId: string;
let pupilMembershipId: string;
let postId: string;
let otherSchoolPostId: string;

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
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
      isSuperuser: over.user?.isSuperuser ?? false,
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

async function makeUser(email: string, name: string, superuser = false) {
  return db.user.upsert({
    where: { email },
    create: { email, name, isSuperuser: superuser, prefs: "{}" },
    update: { isSuperuser: superuser },
  });
}

beforeAll(async () => {
  const school = await db.school.upsert({
    where: { slug: SCHOOL_SLUG },
    create: {
      name: "ZZ Oversight School",
      slug: SCHOOL_SLUG,
      code: "ZZOVER",
      contactEmail: `office${SUFFIX}`,
    },
    update: {},
  });
  const other = await db.school.upsert({
    where: { slug: OTHER_SLUG },
    create: {
      name: "ZZ Oversight Other",
      slug: OTHER_SLUG,
      code: "ZZOVER2",
      contactEmail: `other${SUFFIX}`,
    },
    update: {},
  });
  schoolId = school.id;
  otherSchoolId = other.id;

  const op = await makeUser(`operator${SUFFIX}`, "The Operator", true);
  operator = ctx({ userId: op.id, user: { isSuperuser: true } as ActiveContext["user"] });

  const plain = await makeUser(`plain${SUFFIX}`, "Not An Operator");
  notOperator = ctx({ userId: plain.id, schoolId, role: "ADMIN" });
});

async function rebuild(): Promise<void> {
  await wipe();

  const mk = async (email: string, name: string, role: string) => {
    const user = await makeUser(email, name);
    const membership = await db.membership.create({
      data: { userId: user.id, schoolId, role, status: "ACTIVE" },
    });
    return { userId: user.id, membershipId: membership.id };
  };

  adminMembershipId = (await mk(`admin1${SUFFIX}`, "First Admin", "ADMIN")).membershipId;
  secondAdminMembershipId = (await mk(`admin2${SUFFIX}`, "Second Admin", "ADMIN")).membershipId;
  const pupil = await mk(`pupil${SUFFIX}`, "Aarav Pupil", "STUDENT");
  pupilMembershipId = pupil.membershipId;

  postId = (
    await db.post.create({
      data: {
        schoolId,
        authorUserId: pupil.userId,
        scope: "SCHOOL",
        title: "ZZ Oversight Post",
        body: "Something a host might be asked about.",
        status: "APPROVED",
      },
      select: { id: true },
    })
  ).id;

  // A post at the OTHER school, so a leak shows up as a row that should not be
  // reachable rather than as nothing at all.
  const stranger = await makeUser(`stranger${SUFFIX}`, "Other School Pupil");
  await db.membership.create({
    data: { userId: stranger.id, schoolId: otherSchoolId, role: "STUDENT", status: "ACTIVE" },
  });
  otherSchoolPostId = (
    await db.post.create({
      data: {
        schoolId: otherSchoolId,
        authorUserId: stranger.id,
        scope: "SCHOOL",
        title: "ZZ Other School Post",
        status: "APPROVED",
      },
      select: { id: true },
    })
  ).id;
}

async function wipe(): Promise<void> {
  await db.operatorAccess.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: [schoolId, otherSchoolId] } } });
  await db.school.deleteMany({ where: { slug: DOOMED_SLUG } });
  await db.user.deleteMany({
    where: { email: { endsWith: SUFFIX }, isSuperuser: false, NOT: { email: `plain${SUFFIX}` } },
  });
}

afterEach(wipe);

afterAll(async () => {
  await wipe();
  await db.school.deleteMany({ where: { slug: { in: [SCHOOL_SLUG, OTHER_SLUG, DOOMED_SLUG] } } });
  await db.user.deleteMany({ where: { email: { endsWith: SUFFIX } } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("⚠ the door", () => {
  it("refuses anybody who does not run the server", async () => {
    await rebuild();

    await expect(schoolOverview(notOperator, schoolId)).rejects.toBeInstanceOf(AccessError);
    await expect(listPosts(notOperator, schoolId)).rejects.toBeInstanceOf(AccessError);
    await expect(listPeople(notOperator, schoolId)).rejects.toBeInstanceOf(AccessError);
    await expect(
      takeDownPost(notOperator, schoolId, postId, "Because"),
    ).rejects.toBeInstanceOf(AccessError);

    // And the refusal names the right thing: the area is not theirs. There is
    // no "open this school first" door for a school admin to be pointed at.
    const refusal = await withSchoolAccess(notOperator, schoolId, async () => "in").catch(
      (e: unknown) => e as AccessError,
    );
    expect(refusal).toBeInstanceOf(AccessError);
    expect((refusal as AccessError).key).toBe("access.thisAreaBelongsToWhoeverRunsThe");
  });

  it("⚠ lets the operator straight in — access is always on", async () => {
    await rebuild();

    const overview = await schoolOverview(operator, schoolId);
    expect(overview.classes).toBe(0);
    expect(overview.members.find((m) => m.role === "STUDENT")?.count).toBe(1);
  });
});

describe("⚠ the school is told", () => {
  it("⚠ records the visit where the school can read it, once per hour not once per query", async () => {
    await rebuild();

    await schoolOverview(operator, schoolId);
    await listPosts(operator, schoolId);
    await listPeople(operator, schoolId);

    // Three reads, one visit row — the book says "the operator was here",
    // not a line per query.
    const rows = await db.operatorAccess.findMany({ where: { schoolId } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.userId).toBe(operator.user.id);

    const history = await accessHistory(schoolId);
    expect(history).toHaveLength(1);
    expect(history[0]!.operatorName).toBe("The Operator");
    expect(history[0]!.live).toBe(true);
  });

  it("an expired visit row is not reused — the next look writes a fresh line", async () => {
    await rebuild();
    await schoolOverview(operator, schoolId);

    await db.operatorAccess.updateMany({
      where: { schoolId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await listPosts(operator, schoolId);
    expect(await db.operatorAccess.count({ where: { schoolId } })).toBe(2);
  });

  it("⚠ audits every action against the school", async () => {
    await rebuild();
    await takeDownPost(operator, schoolId, postId, "Named a child");
    await setMembershipSuspension(operator, schoolId, pupilMembershipId, {
      suspended: true,
      reason: "Pending a safeguarding review",
    });

    const actions = await db.auditLog.findMany({
      where: { schoolId, action: { startsWith: "operator." } },
      select: { action: true },
    });
    expect(actions.map((a) => a.action).sort()).toEqual([
      "operator.membership.suspend",
      "operator.post.takedown",
    ]);
  });
});

describe("taking a post down", () => {
  it("⚠ rejects it rather than deleting it", async () => {
    await rebuild();

    expect(await takeDownPost(operator, schoolId, postId, "Named a child")).toEqual({ ok: true });

    // A host removing content and leaving nothing behind is indistinguishable
    // from the content never existing. The school must be able to see what went.
    const post = await db.post.findUniqueOrThrow({ where: { id: postId } });
    expect(post.status).toBe("REJECTED");
    expect(post.title).toBe("ZZ Oversight Post");
    expect(post.body).toBe("Something a host might be asked about.");
  });

  it("refuses a post that is already down, and one from another school", async () => {
    await rebuild();
    await takeDownPost(operator, schoolId, postId, "Named a child");

    const again = await takeDownPost(operator, schoolId, postId, "Named a child");
    expect(again.ok).toBe(false);

    // Scoped find: an id from elsewhere is "not in this school", never
    // somebody else's post.
    const foreign = await takeDownPost(operator, schoolId, otherSchoolPostId, "Whatever");
    expect(foreign.ok).toBe(false);
    const untouched = await db.post.findUniqueOrThrow({ where: { id: otherSchoolPostId } });
    expect(untouched.status).toBe("APPROVED");
  });

  it("demands a reason", async () => {
    await rebuild();

    expect((await takeDownPost(operator, schoolId, postId, "")).ok).toBe(false);
    const post = await db.post.findUniqueOrThrow({ where: { id: postId } });
    expect(post.status).toBe("APPROVED");
  });
});

describe("pausing somebody", () => {
  it("pauses and restores, and says who did it", async () => {
    await rebuild();

    expect(
      await setMembershipSuspension(operator, schoolId, pupilMembershipId, {
        suspended: true,
        reason: "Pending a safeguarding review",
      }),
    ).toEqual({ ok: true });

    const paused = await db.membership.findUniqueOrThrow({ where: { id: pupilMembershipId } });
    expect(paused.status).toBe("SUSPENDED");
    // The school reads this on the directory row, so it has to say the pause
    // came from outside rather than looking like their own decision.
    expect(paused.suspendedReason).toContain("EduLink team");

    await setMembershipSuspension(operator, schoolId, pupilMembershipId, {
      suspended: false,
      reason: "",
    });
    const back = await db.membership.findUniqueOrThrow({ where: { id: pupilMembershipId } });
    expect(back.status).toBe("ACTIVE");
    expect(back.suspendedReason).toBeNull();
  });

  it("⚠ will not leave a school with no admin", async () => {
    await rebuild();

    // One of two is fine.
    expect(
      (
        await setMembershipSuspension(operator, schoolId, secondAdminMembershipId, {
          suspended: true,
          reason: "Pending a safeguarding review",
        })
      ).ok,
    ).toBe(true);

    /**
     * THE LAST ONE IS NOT. A school with no admin cannot invite one, restore
     * anybody, or reach its own settings — it is bricked, and the only person
     * who could unbrick it is the host who just bricked it. "The host did it"
     * makes that worse rather than better.
     */
    const result = await setMembershipSuspension(operator, schoolId, adminMembershipId, {
      suspended: true,
      reason: "Pending a safeguarding review",
    });
    expect(result.ok).toBe(false);
    // The lib mints a KEY now; the boundary owns the words.
    expect(result.ok === false && result.errorKey).toBe("root.onlyAdmin");

    const admin = await db.membership.findUniqueOrThrow({ where: { id: adminMembershipId } });
    expect(admin.status).toBe("ACTIVE");
  });

  it("demands a reason to pause, but not to restore", async () => {
    await rebuild();

    expect(
      (await setMembershipSuspension(operator, schoolId, pupilMembershipId, {
        suspended: true,
        reason: "",
      })).ok,
    ).toBe(false);

    // Restoring is the safe direction; demanding paperwork to undo a mistake is
    // how a mistake stays in place.
    await setMembershipSuspension(operator, schoolId, pupilMembershipId, {
      suspended: true,
      reason: "Pending a safeguarding review",
    });
    expect(
      (await setMembershipSuspension(operator, schoolId, pupilMembershipId, {
        suspended: false,
        reason: "",
      })).ok,
    ).toBe(true);
  });
});

describe("the directory", () => {
  it("lists the whole roll, and the filter search still narrows", async () => {
    await rebuild();

    const everyone = await listPeople(operator, schoolId);
    expect(everyone.map((p) => p.name).sort()).toEqual([
      "Aarav Pupil",
      "First Admin",
      "Second Admin",
    ]);

    expect(await findPeople(operator, schoolId, "a")).toEqual([]); // too short
    const found = await findPeople(operator, schoolId, "Aarav");
    expect(found.map((p) => p.name)).toEqual(["Aarav Pupil"]);
  });
});

describe("⚠ removing a school", () => {
  async function buildDoomedSchool() {
    const school = await db.school.create({
      data: {
        name: "ZZ Doomed School",
        slug: DOOMED_SLUG,
        code: "ZZDOOM",
        contactEmail: `doomed${SUFFIX}`,
      },
    });
    const pupilUser = await makeUser(`doomedpupil${SUFFIX}`, "Meera Leaver");
    const staffUser = await makeUser(`doomedstaff${SUFFIX}`, "Doomed Teacher");
    const pupil = await db.membership.create({
      data: {
        userId: pupilUser.id,
        schoolId: school.id,
        role: "STUDENT",
        status: "ACTIVE",
        gradeLevel: "7",
      },
    });
    const staff = await db.membership.create({
      data: { userId: staffUser.id, schoolId: school.id, role: "TEACHER", status: "ACTIVE" },
    });
    return { school, pupil, staff, pupilUser };
  }

  it("⚠ turns every pupil into a leaver with a certificate, and keeps their account", async () => {
    await rebuild();
    const { school, pupil, staff, pupilUser } = await buildDoomedSchool();

    expect(await removeSchool(operator, school.id)).toEqual({ ok: true });

    // The school is flagged, not deleted.
    const flagged = await db.school.findUniqueOrThrow({ where: { id: school.id } });
    expect(flagged.removedAt).not.toBeNull();

    // The pupil left the way any leaver does: membership ended, certificate
    // issued, snapshot frozen with the school's name as it was.
    const membership = await db.membership.findUniqueOrThrow({ where: { id: pupil.id } });
    expect(membership.leftAt).not.toBeNull();

    const record = await db.schoolRecord.findUniqueOrThrow({
      where: { studentMembershipId: pupil.id },
    });
    expect(record.reason).toBe("LEFT");
    expect(record.schoolName).toBe("ZZ Doomed School");
    expect(record.studentUserId).toBe(pupilUser.id);

    // Staff lose the post but get no certificate — same as an ordinary leaving.
    const staffRow = await db.membership.findUniqueOrThrow({ where: { id: staff.id } });
    expect(staffRow.leftAt).not.toBeNull();
    expect(
      await db.schoolRecord.count({ where: { studentMembershipId: staff.id } }),
    ).toBe(0);

    // And the person behind the pupil is untouched.
    const user = await db.user.findUniqueOrThrow({ where: { id: pupilUser.id } });
    expect(user.disabledAt).toBeNull();
  });

  it("refuses to remove twice, and keeps an already-issued certificate", async () => {
    await rebuild();
    const { school, pupil } = await buildDoomedSchool();

    await removeSchool(operator, school.id);
    const first = await db.schoolRecord.findUniqueOrThrow({
      where: { studentMembershipId: pupil.id },
    });

    const again = await removeSchool(operator, school.id);
    expect(again.ok).toBe(false);
    expect(again.ok === false && again.errorKey).toBe("root.schoolWasRemoved");

    const still = await db.schoolRecord.findUniqueOrThrow({
      where: { studentMembershipId: pupil.id },
    });
    expect(still.id).toBe(first.id);
  });

  it("refuses anybody who does not run the server", async () => {
    await rebuild();
    const { school } = await buildDoomedSchool();
    await expect(removeSchool(notOperator, school.id)).rejects.toBeInstanceOf(AccessError);
  });
});
