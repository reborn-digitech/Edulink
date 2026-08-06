import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  accessHistory,
  activeGrant,
  closeSchool,
  openSchool,
  withSchoolAccess,
} from "@/lib/superuser";
import {
  findPeople,
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
 * THIS FILE TESTS A DELIBERATE WIDENING OF THE ONE BOUNDARY THE REST OF THIS
 * CODEBASE IS ARRANGED AROUND, so it is worth saying exactly which half it can
 * prove and which half it cannot.
 *
 * WHAT IT PROVES: that an operator cannot reach a school's rows without an open,
 * unexpired, reasoned grant; that opening and every action land in THAT SCHOOL'S
 * audit log rather than nowhere; that a grant expires; and that the powers are
 * the two narrow ones — take a post down, pause a person — with the last-admin
 * rule holding for the host exactly as it holds for the school.
 *
 * WHAT IT CANNOT PROVE is the containment itself. The suite connects as the
 * database OWNER, so row-level security is not in force and a bug that let an
 * operator holding a Riverside grant read Oakfield's register would pass every
 * assertion here. That claim is made live in `npm run rls:verify`, which binds
 * one school and checks the other stays dark.
 *
 * The accountability trade is the feature: the operator gains sight and gives up
 * doing it unobserved. So the tests that matter most below are the ones about
 * the record, not the ones about the reading.
 */

const db = new PrismaClient();

const SUFFIX = "@zzoversight.test";
const SCHOOL_SLUG = "zz-oversight-school";
const OTHER_SLUG = "zz-oversight-other";

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
  await db.user.deleteMany({
    where: { email: { endsWith: SUFFIX }, isSuperuser: false, NOT: { email: `plain${SUFFIX}` } },
  });
}

afterEach(wipe);

afterAll(async () => {
  await wipe();
  await db.school.deleteMany({ where: { slug: { in: [SCHOOL_SLUG, OTHER_SLUG] } } });
  await db.user.deleteMany({ where: { email: { endsWith: SUFFIX } } });
  await db.$disconnect();
});

const REASON = "Investigating a safeguarding report about a post";

/* -------------------------------------------------------------------------- */

describe("⚠ the door", () => {
  it("refuses anybody who does not run the server", async () => {
    await rebuild();

    await expect(openSchool(notOperator, schoolId, REASON)).rejects.toBeInstanceOf(AccessError);
    await expect(schoolOverview(notOperator, schoolId)).rejects.toBeInstanceOf(AccessError);
    await expect(listPosts(notOperator, schoolId)).rejects.toBeInstanceOf(AccessError);
    expect(await activeGrant(notOperator, schoolId)).toBeNull();
  });

  it("⚠ refuses an operator who has not opened the school", async () => {
    await rebuild();

    // THE CENTRAL CLAIM. Running the server is not by itself a way in — the
    // flag opens School and Invite, and everything else needs a grant.
    await expect(schoolOverview(operator, schoolId)).rejects.toBeInstanceOf(AccessError);
    await expect(listPosts(operator, schoolId)).rejects.toBeInstanceOf(AccessError);
    await expect(findPeople(operator, schoolId, "Aarav")).rejects.toBeInstanceOf(AccessError);
    await expect(
      takeDownPost(operator, schoolId, postId, "Because"),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ demands a reason, and a real one", async () => {
    await rebuild();

    const empty = await openSchool(operator, schoolId, "");
    const terse = await openSchool(operator, schoolId, "because");
    expect(empty.ok).toBe(false);
    expect(terse.ok).toBe(false);

    // Nothing was opened on the way to being refused.
    expect(await activeGrant(operator, schoolId)).toBeNull();
    expect(await db.operatorAccess.count({ where: { schoolId } })).toBe(0);
  });

  it("opens with a reason, and lets the operator in", async () => {
    await rebuild();
    const opened = await openSchool(operator, schoolId, REASON);
    expect(opened.ok).toBe(true);

    const overview = await schoolOverview(operator, schoolId);
    expect(overview.classes).toBe(0);
    expect(overview.members.find((m) => m.role === "STUDENT")?.count).toBe(1);
  });

  it("⚠ a grant on ONE school is not a grant on another", async () => {
    await rebuild();
    await openSchool(operator, schoolId, REASON);

    // Opening Riverside opens Riverside. The application refuses here; the
    // database refuses too, and rls:verify is where that half is proved.
    await expect(schoolOverview(operator, otherSchoolId)).rejects.toBeInstanceOf(AccessError);
    await expect(
      takeDownPost(operator, otherSchoolId, otherSchoolPostId, "Because"),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ an expired grant is not a grant", async () => {
    await rebuild();
    await openSchool(operator, schoolId, REASON);

    // Expiry is checked when the grant is read, not by a sweep — a grant that
    // lapses only when something runs is open for as long as nothing does.
    await db.operatorAccess.updateMany({
      where: { schoolId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    expect(await activeGrant(operator, schoolId)).toBeNull();
    await expect(schoolOverview(operator, schoolId)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ a closed grant is not a grant either", async () => {
    await rebuild();
    await openSchool(operator, schoolId, REASON);
    await closeSchool(operator, schoolId);

    expect(await activeGrant(operator, schoolId)).toBeNull();
    await expect(schoolOverview(operator, schoolId)).rejects.toBeInstanceOf(AccessError);
  });

  it("re-opening while already open does not stack up grants", async () => {
    await rebuild();
    const first = await openSchool(operator, schoolId, REASON);
    const second = await openSchool(operator, schoolId, "A different reason entirely");

    expect(first.ok && second.ok && first.grant.id === second.grant.id).toBe(true);
    expect(await db.operatorAccess.count({ where: { schoolId } })).toBe(1);
  });
});

describe("⚠ the school is told", () => {
  it("⚠ files the opening in the SCHOOL's audit log, not nowhere", async () => {
    await rebuild();
    await openSchool(operator, schoolId, REASON);

    /**
     * THE TRADE THIS WHOLE FEATURE IS. Every other operator action is audited
     * with schoolId NULL so it stays out of a tenant's Safety Centre. This one
     * is the opposite on purpose: a school must be able to see that somebody
     * outside it opened their data, or the accountability half is ornamental.
     */
    const entry = await db.auditLog.findFirst({
      where: { schoolId, action: "operator.school.open" },
    });
    expect(entry).not.toBeNull();
    expect(entry!.actorUserId).toBe(operator.user.id);
    expect(entry!.meta).toContain("safeguarding");
  });

  it("files the closing too", async () => {
    await rebuild();
    await openSchool(operator, schoolId, REASON);
    await closeSchool(operator, schoolId);

    expect(
      await db.auditLog.count({ where: { schoolId, action: "operator.school.close" } }),
    ).toBe(1);
  });

  it("⚠ shows the school every visit, live or finished, with the reason", async () => {
    await rebuild();
    await openSchool(operator, schoolId, REASON);

    const history = await accessHistory(schoolId);
    expect(history).toHaveLength(1);
    expect(history[0]!.reason).toBe(REASON);
    expect(history[0]!.operatorName).toBe("The Operator");
    expect(history[0]!.live).toBe(true);

    await closeSchool(operator, schoolId);
    expect((await accessHistory(schoolId))[0]!.live).toBe(false);
  });

  it("⚠ audits every action against the school as well", async () => {
    await rebuild();
    await openSchool(operator, schoolId, REASON);
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
      "operator.school.open",
    ]);
  });
});

describe("taking a post down", () => {
  it("⚠ rejects it rather than deleting it", async () => {
    await rebuild();
    await openSchool(operator, schoolId, REASON);

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
    await openSchool(operator, schoolId, REASON);
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
    await openSchool(operator, schoolId, REASON);

    expect((await takeDownPost(operator, schoolId, postId, "")).ok).toBe(false);
    const post = await db.post.findUniqueOrThrow({ where: { id: postId } });
    expect(post.status).toBe("APPROVED");
  });
});

describe("pausing somebody", () => {
  it("pauses and restores, and says who did it", async () => {
    await rebuild();
    await openSchool(operator, schoolId, REASON);

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
    await openSchool(operator, schoolId, REASON);

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
    await openSchool(operator, schoolId, REASON);

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

describe("finding people", () => {
  it("⚠ needs something to search for — there is no list-everybody", async () => {
    await rebuild();
    await openSchool(operator, schoolId, REASON);

    // An operator with a name can find that person; an operator with idle
    // curiosity is not handed a directory of children to scroll.
    expect(await findPeople(operator, schoolId, "")).toEqual([]);
    expect(await findPeople(operator, schoolId, "a")).toEqual([]);

    const found = await findPeople(operator, schoolId, "Aarav");
    expect(found.map((p) => p.name)).toEqual(["Aarav Pupil"]);
  });
});

describe("⚠ the visitor book", () => {
  it("keeps the row after the grant is closed", async () => {
    await rebuild();
    await openSchool(operator, schoolId, REASON);
    await closeSchool(operator, schoolId);

    // Closing sets endedAt. It does not remove the evidence that it happened.
    const rows = await db.operatorAccess.findMany({ where: { schoolId } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.endedAt).not.toBeNull();
    expect(rows[0]!.reason).toBe(REASON);
  });

  it("⚠ withSchoolAccess is the only door, and it checks both things SEPARATELY", async () => {
    await rebuild();

    /**
     * TWO CHECKS, AND THE MESSAGES ARE WHY BOTH ARE HERE.
     *
     * Mutation testing removed `assertSuperuser` from this function and the
     * whole suite still passed, because `activeGrant` returns null for a
     * non-superuser and the grant check refuses a moment later. Asserting only
     * that it throws cannot tell the two apart.
     *
     * They are not the same refusal. A school admin who reached this is being
     * told the area is not theirs; an operator is being told to open the school
     * and say why. Collapsing them would answer a school admin with "open this
     * school first" — an instruction implying a door exists for them, which is
     * exactly the thing this feature must not imply.
     *
     * So the guard survives on the sentence, and the sentence is pinned.
     */
    const asOutsider = await withSchoolAccess(notOperator, schoolId, async () => "in").catch(
      (e: unknown) => e as AccessError,
    );
    expect(asOutsider).toBeInstanceOf(AccessError);
    expect((asOutsider as AccessError).message).toMatch(/runs the server/i);
    expect((asOutsider as AccessError).message).not.toMatch(/open this school/i);

    const asOperator = await withSchoolAccess(operator, schoolId, async () => "in").catch(
      (e: unknown) => e as AccessError,
    );
    expect(asOperator).toBeInstanceOf(AccessError);
    expect((asOperator as AccessError).message).toMatch(/open this school/i);

    await openSchool(operator, schoolId, REASON);
    expect(await withSchoolAccess(operator, schoolId, async () => "in")).toBe("in");
  });
});
