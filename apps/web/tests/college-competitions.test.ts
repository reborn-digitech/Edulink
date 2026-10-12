/**
 * Competitions by audience (college-content, the owner's decisions of 12 October 2026), and the crawler's audience,
 * class and stream grounding and its two new refusals (the coordinator's rules from the crawler's hand check).
 *
 * Proved here: a tenant's competitions list and a competition's page show only what fits it (a law college LAW's and
 * every college's COLLEGE competitions, a school the SCHOOL ones, everyone the ones with no audience; a guardian what
 * fits any child's school; a school's own competition is its own); the desk's audience door by role, its refusals and
 * its audit line; the crawler's pure rules (classes and streams kept only where the page prints them; the audience
 * from the page, else the source's kind; PAST and NOT_ENTERABLE); landing a moot-court page's entry as a COLLEGE draft
 * with the source's streams and a past or ceremony entry as a refusal; the college organisers in the seed. Every row
 * is a ZZ row made here and removed after.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { sourceKindAudience, type CompetitionExtractEntry } from "@edulink/contracts";
import { createSession, type ActiveContext } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { getCompetition, listCompetitions } from "@/lib/competitions";
import { allDatesPast, classOnPage, crawledAudience, groundClasses, notEnterable, rejectReason } from "@/lib/competition-crawl-rules";
import { POST as audiencePost } from "@/app/api/v1/appadmin/competitions/[competitionId]/audience/route";
import { landEntry, buildDedupeIndex, type LandContext } from "../scripts/competitions-crawl/land";
import { OFFICIAL_SOURCES } from "../scripts/competitions-crawl/sources";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const db = new PrismaClient();
const STAMP = Date.now();
const TAG = STAMP.toString(36);
const P = `zz-ccc-${STAMP}`;
const ROOT = `https://zz-moot-${STAMP}.test/`;
const schools = { school: "", law: "", eng: "" };
const people = { curator: "", schoolAdmin: "", lawStudent: "", schoolStudent: "", engStudent: "", parent: "" };
const members: Record<string, string> = {};
const comp: Record<string, string> = {};
let ownCompetition = "";
let mootSource = "";
const made: string[] = [];

const ctxOf = (user: string, schoolId: string | null, role: string, membershipId: string | null = null): ActiveContext =>
  ({ sessionId: "t", membershipId, schoolId, role, user: { id: user, email: null, name: "ZZ", preferredName: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { locale: "en" } } }) as unknown as ActiveContext;

const embed = async (texts: string[]) =>
  texts.map((t) => {
    const v = new Array<number>(64).fill(0);
    v[parseInt(createHash("sha1").update(t).digest("hex").slice(0, 6), 16) % 64] = 1;
    return v;
  });

const post = (path: string, body?: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
const params = (competitionId: string) => ({ params: Promise.resolve({ competitionId }) });
const mine = (rows: { id: string }[]) => new Set(rows.map((r) => r.id).filter((id) => Object.values(comp).includes(id)));

function entry(over: Partial<CompetitionExtractEntry> = {}): CompetitionExtractEntry {
  return {
    title: `ZZ CCC National Moot Court ${TAG}`,
    organiser: "ZZ CCC Law School",
    summary: "A moot court competition for law students.",
    level: "NATIONAL",
    classFrom: null,
    classTo: null,
    forCollege: true,
    subject: "OTHER",
    registrationOpens: null,
    registrationCloses: "2026-12-15",
    eventStarts: "2027-01-20",
    eventEnds: "2027-01-22",
    fee: null,
    eligibility: "Students of LL.B. programmes",
    prizes: null,
    website: `${ROOT}moot`,
    confidence: 0.9,
    audience: "COLLEGE",
    streams: [],
    enterable: true,
    ...over,
  };
}

const MOOT_PAGE = "ZZ National Moot Court Competition 2026-27. Open to students of LL.B. programmes at law colleges and universities. Registration closes 15 December 2026; the oral rounds are held 20 January 2027 to 22 January 2027.";

beforeAll(async () => {
  const school = (key: keyof typeof schools, data: { kind: string; streamsJson: string }) =>
    db.school.create({ data: { name: `ZZ CCC ${key} ${TAG}`, slug: `${P}-${key}`, code: `ZK${key.slice(0, 1).toUpperCase()}${String(STAMP).slice(-6)}`, contactEmail: `${P}-${key}@demo.relay.test`, timezone: "Asia/Kolkata", isTestFixture: true, ...data }, select: { id: true } });
  schools.school = (await school("school", { kind: "SCHOOL", streamsJson: "[]" })).id;
  schools.law = (await school("law", { kind: "COLLEGE", streamsJson: JSON.stringify(["LAW"]) })).id;
  schools.eng = (await school("eng", { kind: "COLLEGE", streamsJson: JSON.stringify(["ENGINEERING"]) })).id;
  const user = (name: string, flags: { isAppAdmin?: boolean } = {}) => db.user.create({ data: { name: `ZZ CCC ${name}`, email: `${P}-${name.toLowerCase()}@demo.relay.test`, isTestFixture: true, ...flags }, select: { id: true } });
  for (const k of Object.keys(people) as (keyof typeof people)[]) people[k] = (await user(k, k === "curator" ? { isAppAdmin: true } : {})).id;
  const member = async (key: string, userId: string, schoolId: string, role: string) => (members[key] = (await db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id);
  await member("schoolAdmin", people.schoolAdmin, schools.school, "ADMIN");
  await member("lawStudent", people.lawStudent, schools.law, "STUDENT");
  await member("schoolStudent", people.schoolStudent, schools.school, "STUDENT");
  await member("engStudent", people.engStudent, schools.eng, "STUDENT");
  await db.guardianship.create({ data: { parentUserId: people.parent, studentMembershipId: members.lawStudent!, studentSchoolId: schools.law, status: "ACTIVE" } });

  const platform = async (key: string, audience: string | null, streams: string[] = []) =>
    (comp[key] = (await db.competition.create({ data: { title: `ZZ CCC ${key} ${TAG}`, summary: "ZZ", organizerName: "ZZ CCC", status: "PUBLISHED", audience, streams }, select: { id: true } })).id);
  await platform("school", "SCHOOL");
  await platform("law", "COLLEGE", ["LAW"]);
  await platform("eng", "COLLEGE", ["ENGINEERING"]);
  await platform("colleges", "COLLEGE", []);
  await platform("everyone", null);
  ownCompetition = (await db.competition.create({ data: { title: `ZZ CCC own ${TAG}`, summary: "ZZ", organizerName: "ZZ CCC School", organizerSchoolId: schools.school, status: "PUBLISHED", audience: "COLLEGE", streams: ["LAW"] }, select: { id: true } })).id;
  comp.own = ownCompetition;
  mootSource = (await db.competitionSource.create({ data: { name: `ZZ CCC Moot ${TAG}`, rootUrl: ROOT, organiser: "ZZ CCC Law School", kind: "MOOT_COURT", official: true, addedByRole: "FIXTURE", streams: ["LAW"] }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  const users = Object.values(people).filter(Boolean);
  await db.competition.deleteMany({ where: { id: { in: [...Object.values(comp), ...made] }, title: { startsWith: "ZZ CCC" } } });
  await db.competitionSource.deleteMany({ where: { id: mootSource } });
  await db.session.deleteMany({ where: { userId: { in: users } } });
  for (const id of Object.values(schools).filter(Boolean)) await db.school.deleteMany({ where: { id } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("a tenant's competitions list by audience", () => {
  it("a law college sees LAW's and every college's and the unset ones; an engineering college not LAW's; a school its SCHOOL ones", async () => {
    const law = await listCompetitions(ctxOf(people.lawStudent, schools.law, "STUDENT", members.lawStudent!));
    expect(mine(law.platform)).toEqual(new Set([comp.law, comp.colleges, comp.everyone]));
    const eng = await listCompetitions(ctxOf(people.engStudent, schools.eng, "STUDENT", members.engStudent!));
    expect(mine(eng.platform)).toEqual(new Set([comp.eng, comp.colleges, comp.everyone]));
    const school = await listCompetitions(ctxOf(people.schoolStudent, schools.school, "STUDENT", members.schoolStudent!));
    expect(mine(school.platform)).toEqual(new Set([comp.school, comp.everyone]));
    // A school's own competition is its own, whatever is written on it.
    expect(mine(school.school)).toEqual(new Set([ownCompetition]));
    expect(law.platform.find((c) => c.id === comp.law)).toMatchObject({ audience: "COLLEGE", streams: ["LAW"] });
  });

  it("a guardian sees what fits their child's college; a competition for another audience is not found by its id", async () => {
    const parent = await listCompetitions(ctxOf(people.parent, null, "PARENT"));
    expect(mine(parent.platform)).toEqual(new Set([comp.law, comp.colleges, comp.everyone]));
    await expect(getCompetition(ctxOf(people.schoolStudent, schools.school, "STUDENT", members.schoolStudent!), comp.law!)).rejects.toThrow();
    await expect(getCompetition(ctxOf(people.lawStudent, schools.law, "STUDENT", members.lawStudent!), comp.school!)).rejects.toThrow();
    expect((await getCompetition(ctxOf(people.lawStudent, schools.law, "STUDENT", members.lawStudent!), comp.everyone!)).id).toBe(comp.everyone);
  });
});

describe("the desk's audience door", () => {
  it("the content team sets it (audited once, a repeat changes nothing); a school's admin is refused; a body it refuses is 422; another's is 404", async () => {
    __resetCookies();
    await createSession(people.curator);
    const set = await audiencePost(post(`/api/v1/appadmin/competitions/${comp.everyone}/audience`, { audience: "COLLEGE", streams: ["LAW", "PHARMACY"] }), params(comp.everyone!));
    expect(set.status).toBe(200);
    expect(await set.json()).toMatchObject({ ok: true, audience: "COLLEGE", streams: ["PHARMACY", "LAW"], changed: true });
    const again = await audiencePost(post(`/api/v1/appadmin/competitions/${comp.everyone}/audience`, { audience: "COLLEGE", streams: ["PHARMACY", "LAW"] }), params(comp.everyone!));
    expect(await again.json()).toMatchObject({ changed: false });
    expect(await db.auditLog.count({ where: { action: "appadmin.competition.audience", targetId: comp.everyone! } })).toBe(1);
    // A school's streams are not a thing: SCHOOL with streams is refused.
    expect((await audiencePost(post(`/api/v1/appadmin/competitions/${comp.everyone}/audience`, { audience: "SCHOOL", streams: ["LAW"] }), params(comp.everyone!))).status).toBe(422);
    expect((await audiencePost(post(`/api/v1/appadmin/competitions/${comp.everyone}/audience`), params(comp.everyone!))).status).toBe(422);
    expect((await audiencePost(post(`/api/v1/appadmin/competitions/${ownCompetition}/audience`, { audience: null }), params(ownCompetition))).status).toBe(404);
    // The list follows at once: the engineering college no longer sees it.
    expect(mine((await listCompetitions(ctxOf(people.engStudent, schools.eng, "STUDENT", members.engStudent!))).platform).has(comp.everyone!)).toBe(false);
    __resetCookies();
    await createSession(people.schoolAdmin, { schoolId: schools.school, role: "ADMIN" });
    expect((await audiencePost(post(`/api/v1/appadmin/competitions/${comp.everyone}/audience`, { audience: null }), params(comp.everyone!))).status).toBe(403);
    __resetCookies();
    expect((await audiencePost(post(`/api/v1/appadmin/competitions/${comp.everyone}/audience`, { audience: null }), params(comp.everyone!))).status).toBe(401);
  });
});

describe("the crawler's audience, class and stream rules (pure)", () => {
  it("keeps a class only where the page prints it", () => {
    expect(classOnPage(6, "Open to pupils of Classes 6 to 10.")).toBe(true);
    expect(classOnPage(10, "Open to pupils of Classes 6 to 10.")).toBe(true);
    expect(classOnPage(12, "for students of class XII or lower")).toBe(true);
    expect(classOnPage(8, "8th class and 9th class pupils")).toBe(true);
    expect(classOnPage(5, "इयत्ता ५ वी ते ८ वी")).toBe(true);
    expect(classOnPage(9, "The olympiad is held on 9 November 2026.")).toBe(false);
    expect(classOnPage(1, "Class VI to X")).toBe(false);
    const g = groundClasses({ classFrom: 1, classTo: 12, streams: ["LAW", "ENGINEERING"] }, "A moot court for law students; Class 12 pass is the minimum.");
    expect(g.entry).toEqual({ classFrom: null, classTo: 12, streams: ["LAW"] });
    expect(g.dropped).toBe(2);
  });

  it("the audience comes from the page, else the source's kind; a COLLEGE one's streams are the page's, else the source's", () => {
    expect(sourceKindAudience("MOOT_COURT")).toBe("COLLEGE");
    expect(sourceKindAudience("OLYMPIAD")).toBe("SCHOOL");
    expect(sourceKindAudience("OTHER")).toBeNull();
    const none = { classFrom: null, classTo: null, forCollege: false, audience: "UNKNOWN" as const, streams: [] };
    expect(crawledAudience(none, "A contest.", { kind: "MOOT_COURT", streams: ["LAW"] })).toEqual({ audience: "COLLEGE", streams: ["LAW"] });
    expect(crawledAudience(none, "A contest.", { kind: "OLYMPIAD" })).toEqual({ audience: "SCHOOL", streams: [] });
    expect(crawledAudience(none, "A contest.", { kind: "OTHER" })).toEqual({ audience: null, streams: [] });
    expect(crawledAudience({ ...none, classFrom: 6, classTo: 10 }, "Classes 6 to 10", { kind: "HACKATHON" })).toEqual({ audience: "SCHOOL", streams: [] });
    expect(crawledAudience({ ...none, audience: "COLLEGE", streams: ["ENGINEERING"] }, "for engineering colleges", { kind: "OLYMPIAD" })).toEqual({ audience: "COLLEGE", streams: ["ENGINEERING"] });
    // The model says college but the page names no college: the source decides.
    expect(crawledAudience({ ...none, audience: "COLLEGE" }, "A quiz for pupils.", { kind: "QUIZ" })).toEqual({ audience: "SCHOOL", streams: [] });
    expect(crawledAudience({ ...none, audience: "BOTH" }, "schools and colleges", { kind: "OLYMPIAD" })).toEqual({ audience: null, streams: [] });
  });

  it("refuses PAST (every date before the crawl's day) and NOT_ENTERABLE (a heading, a ceremony, results)", () => {
    const today = new Date("2026-10-12T06:00:00Z");
    expect(allDatesPast({ registrationOpens: "2026-09-01", registrationCloses: "2026-10-11", eventStarts: null, eventEnds: null }, today)).toBe(true);
    expect(allDatesPast({ registrationOpens: "2026-09-01", registrationCloses: "2026-10-12", eventStarts: null, eventEnds: null }, today)).toBe(false);
    expect(allDatesPast({ registrationOpens: null, registrationCloses: null, eventStarts: null, eventEnds: null }, today)).toBe(false);
    const ctx = { sourceRoot: ROOT, organiserRoots: [ROOT], today };
    expect(rejectReason(entry({ registrationCloses: "2026-08-01", eventStarts: "2026-09-01", eventEnds: "2026-09-02" }), ctx)).toBe("PAST");
    expect(rejectReason(entry({ title: `ZZ CCC Infosys Award Function ${TAG}` }), ctx)).toBe("NOT_ENTERABLE");
    expect(rejectReason(entry({ enterable: false }), ctx)).toBe("NOT_ENTERABLE");
    expect(notEnterable({ title: "Results of the Regional Olympiad declared", summary: "" })).toBe(true);
    expect(notEnterable({ title: "Regional Mathematical Olympiad", summary: "The second stage." })).toBe(false);
    expect(rejectReason(entry(), ctx)).toBeNull();
    // An entry the first crawls kept (no enterable, no audience) still reads.
    const old = entry();
    delete (old as Partial<CompetitionExtractEntry>).enterable;
    delete (old as Partial<CompetitionExtractEntry>).audience;
    expect(rejectReason(old, ctx)).toBeNull();
  });
});

describe("landing a college organiser's page", () => {
  const ctx = (over: Partial<LandContext> = {}): LandContext => ({
    source: { id: mootSource, rootUrl: ROOT, kind: "MOOT_COURT", streams: ["LAW"] },
    organiserRoots: [ROOT],
    pageUrl: `${ROOT}moot`,
    pageHash: "h1",
    now: new Date("2026-10-12T06:00:00Z"),
    runStartedAt: new Date("2026-10-12T05:00:00Z"),
    pageText: MOOT_PAGE,
    ...over,
  });

  it("a moot court lands a COLLEGE draft with LAW, the invented classes dropped; a past one and a ceremony are refused and write nothing", async () => {
    const index = await buildDedupeIndex(db, embed);
    const r = await landEntry(db, entry({ classFrom: 11, classTo: 12, streams: [] }), ctx(), index, embed);
    expect(r.outcome).toBe("DRAFTED");
    made.push(r.competitionId!);
    const row = await db.competition.findUniqueOrThrow({ where: { id: r.competitionId! }, select: { audience: true, streams: true, gradeLow: true, gradeHigh: true, status: true } });
    expect(row).toMatchObject({ audience: "COLLEGE", streams: ["LAW"], status: "DRAFT" });
    // "11" and "12" are not printed as classes on the page: gone.
    expect(row.gradeLow).not.toBe("11");
    const before = await db.competition.count({ where: { title: { startsWith: "ZZ CCC" } } });
    const past = await landEntry(db, entry({ title: `ZZ CCC Past Moot ${TAG}`, registrationCloses: "2026-08-15", eventStarts: null, eventEnds: null }), ctx({ pageText: "ZZ Past Moot: registration closed 15 August 2026." }), index, embed);
    expect(past.outcome).toEqual({ rejected: "PAST" });
    const ceremony = await landEntry(db, entry({ title: `ZZ CCC Award Ceremony ${TAG}` }), ctx(), index, embed);
    expect(ceremony.outcome).toEqual({ rejected: "NOT_ENTERABLE" });
    expect(await db.competition.count({ where: { title: { startsWith: "ZZ CCC" } } })).toBe(before);
  });

  it("the seed lists the college organisers with their kinds and streams", () => {
    const college = OFFICIAL_SOURCES.filter((s) => sourceKindAudience(s.kind) === "COLLEGE");
    expect(college.map((s) => s.name)).toEqual(["Bar Council of India", "NLSIU moot courts", "NALSAR moot courts", "Smart India Hackathon", "AICTE student events", "Pharmacy Council of India", "ICAR student events"]);
    expect(college.find((s) => s.name === "Pharmacy Council of India")?.streams).toEqual(["PHARMACY"]);
    expect(college.find((s) => s.name === "Smart India Hackathon")?.streams ?? []).toEqual([]);
  });
});
