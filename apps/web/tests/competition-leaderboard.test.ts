import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  refreshStanding,
  leaderboard,
  setLeaderboard,
  recordResult,
  withdrawEntry,
} from "@/lib/competitions";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

/**
 * The cross-school leaderboard.
 *
 * THE ONE CLAIM WORTH TESTING is the one the README spent a paragraph deferring:
 * that ranking schools against each other does not show one school another
 * school's children. Everything else here — the arithmetic, the ordering, the
 * flag — exists to serve that claim or to keep it true when results change.
 *
 * So the tests come in three groups:
 *
 *   WHAT THE SUMMARY SAYS. It counts entries that have a RESULT, not entries;
 *   otherwise a school climbs the board by entering people. It comes off the
 *   board entirely when its last result is cleared, rather than sitting there
 *   with a zero that reads as having competed and lost.
 *
 *   WHEN IT CROSSES. The organiser's flag governs it, and a draft competition's
 *   board is nobody's business. Both are checked here AND in the policy — see
 *   `npm run rls:verify`, which is where the claim is actually enforced. This
 *   suite runs as the database owner and cannot prove a boundary.
 *
 *   WHAT IT CANNOT CARRY. A structural test that the row handed to a page has no
 *   column that could name a child, so adding one is a failing test rather than
 *   a quiet disclosure.
 */

const db = new PrismaClient();

const SCHOOL_A = "zz-board-alpha";
const SCHOOL_B = "zz-board-beta";
const EMAIL_SUFFIX = "@zzboard.test";

let alphaId: string;
let betaId: string;
let alphaAdmin: ActiveContext;
let betaAdmin: ActiveContext;
let competitionId: string;

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

async function member(name: string, role: string, schoolId: string) {
  const user = await db.user.create({
    data: {
      email: `${name.toLowerCase().replace(/\W/g, "")}${EMAIL_SUFFIX}`,
      name,
      preferredName: name,
      prefs: "{}",
    },
  });
  const membership = await db.membership.create({
    data: { userId: user.id, schoolId, role, status: "ACTIVE" },
  });
  return { membershipId: membership.id, userId: user.id };
}

/** A pupil with an entry, optionally already scored. */
async function entrant(
  name: string,
  schoolId: string,
  result: { rank?: number | null; scoreMilli?: number | null } = {},
): Promise<string> {
  const pupil = await member(name, "STUDENT", schoolId);
  const entry = await db.competitionEntry.create({
    data: {
      competitionId,
      studentMembershipId: pupil.membershipId,
      schoolId,
      status: result.rank || result.scoreMilli ? "RESULTS" : "REGISTERED",
      parentConsentAt: new Date(),
      rank: result.rank ?? null,
      scoreMilli: result.scoreMilli ?? null,
    },
  });
  return entry.id;
}

beforeAll(async () => {
  const alpha = await db.school.upsert({
    where: { slug: SCHOOL_A },
    create: {
      name: "ZZ Alpha School",
      slug: SCHOOL_A,
      code: "ZZBOARDA",
      contactEmail: `alpha${EMAIL_SUFFIX}`,
    },
    update: { name: "ZZ Alpha School" },
  });
  alphaId = alpha.id;

  const beta = await db.school.upsert({
    where: { slug: SCHOOL_B },
    create: {
      name: "ZZ Beta School",
      slug: SCHOOL_B,
      code: "ZZBOARDB",
      contactEmail: `beta${EMAIL_SUFFIX}`,
    },
    update: { name: "ZZ Beta School" },
  });
  betaId = beta.id;
});

beforeEach(async () => {
  const a = await member("Ada", "ADMIN", alphaId);
  alphaAdmin = ctx({ userId: a.userId, membershipId: a.membershipId, schoolId: alphaId, role: "ADMIN" });
  const b = await member("Bo", "ADMIN", betaId);
  betaAdmin = ctx({ userId: b.userId, membershipId: b.membershipId, schoolId: betaId, role: "ADMIN" });

  // Organised by Alpha, with the leaderboard on. Beta enters it too — which is
  // the whole point: the board has to work for a school that did not organise it.
  competitionId = (
    await db.competition.create({
      data: {
        title: "ZZ Regional Maths Cup",
        summary: "Across schools",
        organizerName: "ZZ Alpha School",
        organizerSchoolId: alphaId,
        status: "PUBLISHED",
        leaderboardEnabled: true,
      },
    })
  ).id;
});

afterEach(async () => {
  await db.competitionStanding.deleteMany({ where: { schoolId: { in: [alphaId, betaId] } } });
  await db.competitionEntry.deleteMany({ where: { schoolId: { in: [alphaId, betaId] } } });
  await db.competition.deleteMany({ where: { title: { startsWith: "ZZ " } } });
  await db.user.deleteMany({ where: { email: { endsWith: EMAIL_SUFFIX } } });
  // The name is a snapshot and one test changes it. Put it back, or the next
  // test asserts against a name a previous one renamed.
  await db.school.update({ where: { id: alphaId }, data: { name: "ZZ Alpha School" } });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { slug: { in: [SCHOOL_A, SCHOOL_B] } } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */
/* What the summary says                                                       */
/* -------------------------------------------------------------------------- */

describe("a school's standing", () => {
  it("counts its results and keeps the best of each", async () => {
    await entrant("Anna", alphaId, { rank: 4, scoreMilli: 82_000 });
    await entrant("Arjun", alphaId, { rank: 2, scoreMilli: 91_500 });

    await refreshStanding(alphaId, competitionId);

    const row = await db.competitionStanding.findFirstOrThrow({
      where: { competitionId, schoolId: alphaId },
    });
    expect(row).toMatchObject({
      schoolName: "ZZ Alpha School",
      entrants: 2,
      bestRank: 2,
      bestScoreMilli: 91_500,
    });
  });

  it("⚠ counts entries with a RESULT, not entries", async () => {
    // Otherwise a school climbs the board by entering thirty children and
    // scoring none of them.
    await entrant("Scored", alphaId, { rank: 3 });
    await entrant("Registered", alphaId);
    await entrant("AlsoRegistered", alphaId);

    await refreshStanding(alphaId, competitionId);

    const row = await db.competitionStanding.findFirstOrThrow({ where: { competitionId } });
    expect(row.entrants).toBe(1);
  });

  it("counts a score with no place, and a place with no score", async () => {
    await entrant("ScoreOnly", alphaId, { scoreMilli: 70_000 });
    await refreshStanding(alphaId, competitionId);
    let row = await db.competitionStanding.findFirstOrThrow({ where: { competitionId } });
    expect(row).toMatchObject({ entrants: 1, bestRank: null, bestScoreMilli: 70_000 });

    await db.competitionStanding.deleteMany({ where: { competitionId } });
    await db.competitionEntry.deleteMany({ where: { competitionId } });

    await entrant("RankOnly", alphaId, { rank: 5 });
    await refreshStanding(alphaId, competitionId);
    row = await db.competitionStanding.findFirstOrThrow({ where: { competitionId } });
    expect(row).toMatchObject({ entrants: 1, bestRank: 5, bestScoreMilli: null });
  });

  it("⚠ aggregates only its OWN school's entries", async () => {
    await entrant("Anna", alphaId, { rank: 9, scoreMilli: 10_000 });
    await entrant("Bella", betaId, { rank: 1, scoreMilli: 99_000 });

    await refreshStanding(alphaId, competitionId);

    const row = await db.competitionStanding.findFirstOrThrow({ where: { schoolId: alphaId } });
    // If this ever picks up Beta's first place, one school is claiming another's
    // result — which is worse than the leaderboard not working.
    expect(row).toMatchObject({ entrants: 1, bestRank: 9, bestScoreMilli: 10_000 });
  });

  it("⚠ comes OFF the board when the last result is cleared", async () => {
    await entrant("Anna", alphaId, { rank: 4 });
    await refreshStanding(alphaId, competitionId);
    expect(await db.competitionStanding.count({ where: { competitionId } })).toBe(1);

    await db.competitionEntry.updateMany({ where: { competitionId }, data: { rank: null } });
    await refreshStanding(alphaId, competitionId);

    // Not a row with zeroes on it — a school sitting at the bottom with 0
    // entrants reads as having competed and lost.
    expect(await db.competitionStanding.count({ where: { competitionId } })).toBe(0);
  });

  it("is idempotent — recomputing changes nothing", async () => {
    await entrant("Anna", alphaId, { rank: 4, scoreMilli: 80_000 });
    await refreshStanding(alphaId, competitionId);
    const first = await db.competitionStanding.findFirstOrThrow({ where: { competitionId } });
    await refreshStanding(alphaId, competitionId);
    const second = await db.competitionStanding.findFirstOrThrow({ where: { competitionId } });

    expect(second.id).toBe(first.id);
    expect(second).toMatchObject({ entrants: 1, bestRank: 4, bestScoreMilli: 80_000 });
    expect(await db.competitionStanding.count({ where: { competitionId } })).toBe(1);
  });

  it("⚠ follows a school that renames itself", async () => {
    await entrant("Anna", alphaId, { rank: 4 });
    await refreshStanding(alphaId, competitionId);
    await db.school.update({ where: { id: alphaId }, data: { name: "ZZ Alpha Academy" } });
    await refreshStanding(alphaId, competitionId);

    const row = await db.competitionStanding.findFirstOrThrow({ where: { competitionId } });
    expect(row.schoolName).toBe("ZZ Alpha Academy");
  });

  it("does not fall over for a school that no longer exists", async () => {
    await entrant("Anna", alphaId, { rank: 1 });
    // Not reachable through the app — the row cascades — but `refreshStanding`
    // reads the name separately, and a throw here would lose a recorded result.
    await expect(refreshStanding("no-such-school", competitionId)).resolves.toBeUndefined();
  });
});

/* -------------------------------------------------------------------------- */
/* Recording a result maintains it                                             */
/* -------------------------------------------------------------------------- */

describe("recording a result maintains the board", () => {
  it("puts the school on the board", async () => {
    const entryId = await entrant("Anna", alphaId);
    await recordResult(alphaAdmin, entryId, { scoreMilli: 88_000, rank: 3 });

    const row = await db.competitionStanding.findFirstOrThrow({ where: { competitionId } });
    expect(row).toMatchObject({ entrants: 1, bestRank: 3, bestScoreMilli: 88_000 });
  });

  it("⚠ clearing a result takes it back off", async () => {
    const entryId = await entrant("Anna", alphaId);
    await recordResult(alphaAdmin, entryId, { scoreMilli: 88_000, rank: 3 });
    await recordResult(alphaAdmin, entryId, { scoreMilli: null, rank: null });

    expect(await db.competitionStanding.count({ where: { competitionId } })).toBe(0);
  });

  it("⚠ correcting a typo'd score does not leave the old one as the best", async () => {
    // The case a running total gets wrong. 910000 was a slip for 91000, and a
    // board that kept the higher number would have this school top for good.
    const entryId = await entrant("Anna", alphaId);
    await recordResult(alphaAdmin, entryId, { scoreMilli: 910_000, rank: 1 });
    await recordResult(alphaAdmin, entryId, { scoreMilli: 91_000, rank: 4 });

    const row = await db.competitionStanding.findFirstOrThrow({ where: { competitionId } });
    expect(row).toMatchObject({ bestScoreMilli: 91_000, bestRank: 4 });
  });

  it("⚠ a withdrawal takes the result it carried off the board", async () => {
    const staying = await entrant("Anna", alphaId, { rank: 6 });
    const leavingPupil = await member("Leaver", "STUDENT", alphaId);
    const leaving = await db.competitionEntry.create({
      data: {
        competitionId,
        studentMembershipId: leavingPupil.membershipId,
        schoolId: alphaId,
        status: "RESULTS",
        parentConsentAt: new Date(),
        rank: 1,
      },
    });
    await refreshStanding(alphaId, competitionId);
    expect((await db.competitionStanding.findFirstOrThrow({ where: { competitionId } })).bestRank).toBe(1);

    const child = ctx({
      userId: leavingPupil.userId,
      membershipId: leavingPupil.membershipId,
      schoolId: alphaId,
      role: "STUDENT",
    });
    await withdrawEntry(child, leaving.id);

    // The other entry is still there, so this is a recompute rather than a
    // delete — and the school must not keep a first place won by an entry that
    // no longer exists.
    const row = await db.competitionStanding.findFirstOrThrow({ where: { competitionId } });
    expect(row).toMatchObject({ entrants: 1, bestRank: 6 });
    expect(staying).toBeTruthy();
  });
});

/* -------------------------------------------------------------------------- */
/* Reading the board                                                           */
/* -------------------------------------------------------------------------- */

describe("reading the board", () => {
  beforeEach(async () => {
    await entrant("Anna", alphaId, { rank: 4, scoreMilli: 80_000 });
    await entrant("Bella", betaId, { rank: 2, scoreMilli: 95_000 });
    await refreshStanding(alphaId, competitionId);
    await refreshStanding(betaId, competitionId);
  });

  it("shows every school that has a result, best place first", async () => {
    const board = await leaderboard(alphaAdmin, competitionId);
    expect(board.map((r) => [r.schoolName, r.bestRank])).toEqual([
      ["ZZ Beta School", 2],
      ["ZZ Alpha School", 4],
    ]);
  });

  it("marks the reader's own school, from either side", async () => {
    const fromAlpha = await leaderboard(alphaAdmin, competitionId);
    expect(fromAlpha.find((r) => r.schoolName === "ZZ Alpha School")!.isOwnSchool).toBe(true);
    expect(fromAlpha.find((r) => r.schoolName === "ZZ Beta School")!.isOwnSchool).toBe(false);

    const fromBeta = await leaderboard(betaAdmin, competitionId);
    expect(fromBeta.find((r) => r.schoolName === "ZZ Beta School")!.isOwnSchool).toBe(true);
  });

  it("⚠ carries no column that could name a child", async () => {
    /**
     * THE STRUCTURAL TEST, and the reason this feature exists in the shape it
     * does. A leaderboard that grew a `topStudentName` some afternoon would be
     * the first thing in this app to show one school another school's children.
     * Adding one is a failing test rather than a quiet disclosure.
     */
    const board = await leaderboard(betaAdmin, competitionId);
    const forbidden = /name|student|pupil|child|entry|entries|member/i;
    for (const row of board) {
      const leaked = Object.keys(row).filter(
        (key) => forbidden.test(key) && key !== "schoolName" && key !== "entrants",
      );
      expect(leaked, `standing row exposes ${leaked.join(", ")}`).toEqual([]);
    }
    // …and the two that DO match are a school's name and a count, neither of
    // which is a person.
    expect(board[0]!.entrants).toBe(1);
  });

  it("⚠ sorts schools with no place LAST, not first", async () => {
    // `a.bestRank - b.bestRank` on a null coerces to 0 and silently interleaves
    // unplaced schools among the medals.
    await db.competitionStanding.updateMany({
      where: { schoolId: betaId },
      data: { bestRank: null, bestScoreMilli: 95_000 },
    });
    const board = await leaderboard(alphaAdmin, competitionId);
    expect(board.map((r) => r.schoolName)).toEqual(["ZZ Alpha School", "ZZ Beta School"]);
  });

  it("breaks a tie on place by best score, then by name", async () => {
    await db.competitionStanding.updateMany({ where: { competitionId }, data: { bestRank: 3 } });
    let board = await leaderboard(alphaAdmin, competitionId);
    expect(board.map((r) => r.schoolName)).toEqual(["ZZ Beta School", "ZZ Alpha School"]);

    await db.competitionStanding.updateMany({
      where: { competitionId },
      data: { bestRank: 3, bestScoreMilli: 80_000 },
    });
    board = await leaderboard(alphaAdmin, competitionId);
    expect(board.map((r) => r.schoolName)).toEqual(["ZZ Alpha School", "ZZ Beta School"]);
  });

  it("⚠ is empty when the organiser has not switched it on", async () => {
    await db.competition.update({
      where: { id: competitionId },
      data: { leaderboardEnabled: false },
    });
    expect(await leaderboard(alphaAdmin, competitionId)).toEqual([]);
  });

  it("⚠ is empty for a draft competition, flag or no flag", async () => {
    await db.competition.update({
      where: { id: competitionId },
      data: { status: "DRAFT", leaderboardEnabled: true },
    });
    expect(await leaderboard(alphaAdmin, competitionId)).toEqual([]);
  });

  it("is empty for a competition that does not exist", async () => {
    expect(await leaderboard(alphaAdmin, "no-such-competition")).toEqual([]);
  });

  it("⚠ switching it off does not destroy the standings", async () => {
    await setLeaderboard(alphaAdmin, competitionId, false);
    expect(await leaderboard(alphaAdmin, competitionId)).toEqual([]);
    // Still maintained underneath, which is what lets it be switched back on
    // mid-competition and show the truth rather than an empty board.
    expect(await db.competitionStanding.count({ where: { competitionId } })).toBe(2);

    await setLeaderboard(alphaAdmin, competitionId, true);
    expect(await leaderboard(alphaAdmin, competitionId)).toHaveLength(2);
  });
});

/* -------------------------------------------------------------------------- */
/* Who may switch it on                                                        */
/* -------------------------------------------------------------------------- */

describe("switching the board on", () => {
  it("the organising school's admin may", async () => {
    await db.competition.update({
      where: { id: competitionId },
      data: { leaderboardEnabled: false },
    });
    await setLeaderboard(alphaAdmin, competitionId, true);
    const row = await db.competition.findUniqueOrThrow({ where: { id: competitionId } });
    expect(row.leaderboardEnabled).toBe(true);
  });

  it("⚠ another school's admin may not, even one that entered", async () => {
    // Beta competes in it. Competing is not organising, and a school that could
    // publish another school's board could publish results the organiser had
    // not finished checking.
    await expect(setLeaderboard(betaAdmin, competitionId, false)).rejects.toThrow(AccessError);
    const row = await db.competition.findUniqueOrThrow({ where: { id: competitionId } });
    expect(row.leaderboardEnabled).toBe(true);
  });

  it("⚠ nobody may, for an externally-organised competition", async () => {
    // `organizerSchoolId` is null — it belongs to no school, so it is in no
    // school's gift.
    const external = await db.competition.create({
      data: {
        title: "ZZ National Olympiad",
        summary: "Run by somebody else",
        organizerName: "The Maths Trust",
        status: "PUBLISHED",
      },
    });
    await expect(setLeaderboard(alphaAdmin, external.id, true)).rejects.toThrow(AccessError);
  });

  it("refuses a teacher and a pupil", async () => {
    const teacher = await member("Tara", "TEACHER", alphaId);
    const teacherCtx = ctx({
      userId: teacher.userId,
      membershipId: teacher.membershipId,
      schoolId: alphaId,
      role: "TEACHER",
    });
    await expect(setLeaderboard(teacherCtx, competitionId, false)).rejects.toThrow(AccessError);
  });
});
