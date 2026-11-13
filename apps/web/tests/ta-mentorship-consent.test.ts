/**
 * TA-006 (testing analysis of 13 November 2026, High): a guardian's consent
 * turns a pupil's un-approved mentor request straight into an active
 * mentorship.
 *
 * The module's own rule (src/lib/mentoring.ts, and tests/mentor-requests.test.ts
 * states it): a pupil's ask grants nothing; a school approves, and ONLY THEN is
 * a guardian asked. `consentToMentorship` refuses a CLOSED thread, returns for
 * an ACTIVE one and otherwise writes ACTIVE — with no branch for REQUESTED, and
 * a guardian reads their child's thread in every status. So the guardian's
 * consent door, called by hand on a request the office has not decided, makes
 * the outside adult a reader and a writer with no decision of the school's and
 * no place claimed on the expert's count.
 *
 * One ZZ school of this suite's own (made here, removed after): two pupils of
 * one guardian, the office, and a published mentoring expert with two places
 * and none used. Each pupil asks; the guardian then agrees to the first ask
 * through the library and to the second through
 * POST /api/v1/community/mentoring/{threadId}/consent, in a real PARENT
 * session. The arrangement and the two acts happen once; each consequence the
 * finding names is its own case.
 *
 * EXPECTED ONCE FIXED: both calls are refused and nothing below moves.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { AccessError } from "@/lib/access-error";
import { RuleRefusal } from "@/lib/rule-refusal";
import { consentToMentorship, listMentorRequests, listMentorships, postMentorMessage, requestMentor } from "@/lib/mentoring";
import { POST as consentPost } from "@/app/api/v1/community/mentoring/[threadId]/consent/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta006-${who}-${STAMP}@test.invalid`;
const WHY = "I would like some help deciding what to study after school.";
const ids: Record<string, string> = {};

/** A real session for one of this suite's people; `route` stamps the request the way the middleware would. */
async function signIn(who: string, role: string, route: string | null = null): Promise<void> {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  await createSession(ids[who]!, role === "PARENT" || role === "EXPERT" ? { role: role as never } : { schoolId: ids.school!, role: role as never });
}
async function as(who: string, role: string): Promise<ActiveContext> {
  await signIn(who, role);
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}

type ThreadState = { status: string; parentConsentAt: Date | null; parentConsentUserId: string | null; decidedByMembershipId: string | null };
type State = {
  first: ThreadState;
  second: ThreadState;
  /** The expert's count of places, beside the threads that hold one (PENDING_CONSENT or ACTIVE). */
  places: { counted: number; holding: number };
  expertSees: string[];
  officeQueue: string[];
  expertTold: number;
};

async function readState(): Promise<State> {
  const select = { status: true, parentConsentAt: true, parentConsentUserId: true, decidedByMembershipId: true } as const;
  const first = await db.mentorThread.findUniqueOrThrow({ where: { id: ids.first! }, select });
  const second = await db.mentorThread.findUniqueOrThrow({ where: { id: ids.second! }, select });
  const profile = await db.expertProfile.findUniqueOrThrow({ where: { id: ids.profile! }, select: { activeMentorships: true } });
  const holding = await db.mentorThread.count({ where: { expertProfileId: ids.profile!, status: { in: ["PENDING_CONSENT", "ACTIVE"] } } });
  const expertSees = (await listMentorships(await as("expert", "EXPERT"))).map((t) => t.status);
  const officeQueue = (await listMentorRequests(await as("admin", "ADMIN"))).map((r) => r.threadId).sort();
  const expertTold = await db.notification.count({ where: { userId: ids.expert!, titleKey: "notifTitle.mentorshipApproved" } });
  return { first, second, places: { counted: profile.activeMentorships, holding }, expertSees, officeQueue, expertTold };
}

const REQUESTED: ThreadState = { status: "REQUESTED", parentConsentAt: null, parentConsentUserId: null, decidedByMembershipId: null };

let before: State;
let after: State;
let libraryOutcome: { refused: boolean; said: string };
let doorStatus: number;

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TA006 Mentor School ${STAMP}`, slug: `zz-ta006-${STAMP}`, code: `ZTA6${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const S = ids.school;
  const user = async (who: string, name: string, extra: { isMinor?: boolean } = {}) => {
    ids[who] = (await db.user.create({ data: { name, email: MAIL(who), prefs: "{}", ...extra }, select: { id: true } })).id;
  };
  const member = async (who: string, role: string) => {
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: S, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await user("admin", "ZZ TA006 Admin");
  await member("admin", "ADMIN");
  await user("pupilOne", "ZZ TA006 Pupil One", { isMinor: true });
  await member("pupilOne", "STUDENT");
  await user("pupilTwo", "ZZ TA006 Pupil Two", { isMinor: true });
  await member("pupilTwo", "STUDENT");
  await user("guardian", "ZZ TA006 Guardian");
  for (const child of ["pupilOneM", "pupilTwoM"]) {
    await db.guardianship.create({ data: { parentUserId: ids.guardian!, studentMembershipId: ids[child]!, studentSchoolId: S, relation: "PARENT", status: "ACTIVE" } });
  }
  await user("expert", "ZZ TA006 Expert");
  ids.profile = (
    await db.expertProfile.create({
      data: { userId: ids.expert!, headline: "ZZ TA006 marine biologist", offering: "BOTH", mentorCapacity: 2, activeMentorships: 0, publishedAt: new Date(), verifiedAt: new Date() },
      select: { id: true },
    })
  ).id;

  // Each pupil asks. Nobody at the school has decided either ask.
  const asked = async (who: string) => {
    const result = await requestMentor(await as(who, "STUDENT"), { expertProfileId: ids.profile!, purpose: WHY });
    if (!result.ok) throw new Error(`the ask was refused: ${result.errorKey}`);
    return result.threadId;
  };
  ids.first = await asked("pupilOne");
  ids.second = await asked("pupilTwo");

  before = await readState();

  // ACT 1: the guardian agrees to the first ask through the library, as the web's server action does.
  const guardian = await as("guardian", "PARENT");
  try {
    await consentToMentorship(guardian, ids.first);
    libraryOutcome = { refused: false, said: "returned without a refusal" };
  } catch (error) {
    if (!(error instanceof AccessError) && !(error instanceof RuleRefusal)) throw error;
    libraryOutcome = { refused: true, said: `threw ${error.name}` };
  }

  // ACT 2: the same guardian posts to the consent door for the second ask, by hand (both apps hide the button).
  const path = `/api/v1/community/mentoring/${ids.second}/consent`;
  await signIn("guardian", "PARENT", `POST ${path}`);
  doorStatus = (await consentPost(new Request(`http://localhost${path}`, { method: "POST" }), { params: Promise.resolve({ threadId: ids.second }) })).status;

  after = await readState();
}, 120_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { startsWith: "zz-ta006-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  // The expert's profile goes with its own ZZ user.
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-006: a pupil's mentor request the school has not decided", () => {
  it("the arrangement: two REQUESTED asks, no place held, invisible to the expert, both waiting on the office", () => {
    expect(before).toEqual({
      first: REQUESTED,
      second: REQUESTED,
      places: { counted: 0, holding: 0 },
      expertSees: [],
      officeQueue: [ids.first, ids.second].sort(),
      expertTold: 0,
    });
  });

  it("⚠ the guardian's consent is refused by the library", () => {
    expect(libraryOutcome, `consentToMentorship on a REQUESTED thread ${libraryOutcome.said}`).toMatchObject({ refused: true });
  });

  it("⚠ …and by POST /api/v1/community/mentoring/{threadId}/consent", () => {
    expect({ status: doorStatus, refused: doorStatus >= 400 && doorStatus < 500 }).toEqual({ status: doorStatus, refused: true });
  });

  it("⚠ both asks stay REQUESTED, with no consent recorded", () => {
    expect({ first: after.first, second: after.second }).toEqual({ first: REQUESTED, second: REQUESTED });
  });

  it("⚠ both still wait on the office: the school's queue holds them", () => {
    expect(after.officeQueue).toEqual([ids.first, ids.second].sort());
  });

  it("⚠ no mentorship holds a place the expert's count does not show", () => {
    expect(after.places).toEqual({ counted: 0, holding: 0 });
  });

  it("⚠ the expert still sees nothing and was told nothing", () => {
    expect({ expertSees: after.expertSees, expertTold: after.expertTold }).toEqual({ expertSees: [], expertTold: 0 });
  });

  it("⚠ the expert cannot write to the pupil", async () => {
    const expert = await as("expert", "EXPERT");
    const written = await postMentorMessage(expert, ids.first!, "Hello, shall we begin on Monday?").then(
      () => "the message was accepted",
      (error: unknown) => {
        if (error instanceof AccessError || error instanceof RuleRefusal) return "refused";
        throw error;
      },
    );
    expect(written).toBe("refused");
  });
});
