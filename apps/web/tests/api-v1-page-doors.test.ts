/**
 * Pages that had no door (A3-inventory-14, audit of 5 October 2026): the
 * celebrations on /bulletin/celebrations, the pupil's own journey on
 * /student/practice/journey and the operator's jobs by school on
 * /root/jobs/schools. The phone could only follow their notification links.
 * Each door is the page's own library call; this suite holds the catalog's
 * roles to the handler, 401 signed out, the wrong role refused before
 * anything is read, a malformed query 422, and each sample's 200 with the
 * rows the page shows. Everything is made in a ZZ school of this run and
 * deleted afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { ENDPOINTS } from "@/lib/api-catalog";
import { GET as celebrationsGet } from "@/app/api/v1/shared/bulletin/celebrations/route";
import { GET as journeyGet } from "@/app/api/v1/practice/journey/route";
import { GET as jobsGet } from "@/app/api/v1/operator/jobs/schools/route";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
type Who = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT" | "OPERATOR";

let schoolId = "";
const users: Record<Who, string> = { ADMIN: "", TEACHER: "", STUDENT: "", PARENT: "", OPERATOR: "" };
let studentMembershipId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const status = async (res: Response) => res.status;

async function signInAs(who: Who | null) {
  __resetCookies();
  if (!who) return;
  if (who === "OPERATOR") await createSession(users.OPERATOR);
  else if (who === "PARENT") await createSession(users.PARENT, { schoolId: null, role: "PARENT" });
  else await createSession(users[who], { schoolId, role: who });
}

/** A birthdate this many days from the school's today, in 1990. */
function birthdateIn(days: number): Date {
  const key = addDaysToKey(todayKey(TZ), days);
  return new Date(`1990-${key.slice(5)}T00:00:00Z`);
}

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ PD Home ${STAMP}`, slug: `zz-pd-home-${STAMP}`, code: `ZP${String(STAMP).slice(-6)}`, contactEmail: `zz-pd-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } })).id;
  for (const who of Object.keys(users) as Who[]) {
    const birthdate = who === "TEACHER" ? birthdateIn(3) : who === "STUDENT" ? birthdateIn(5) : null;
    users[who] = (await db.user.create({ data: { name: `ZZ PD ${who}`, email: `zz-pd-${who.toLowerCase()}-${STAMP}@test.invalid`, isSuperuser: who === "OPERATOR", birthdate }, select: { id: true } })).id;
  }
  await db.membership.create({ data: { userId: users.ADMIN, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: users.TEACHER, schoolId, role: "TEACHER", status: "ACTIVE" } });
  studentMembershipId = (await db.membership.create({ data: { userId: users.STUDENT, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZPDS${STAMP}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: users.PARENT, studentMembershipId, studentSchoolId: schoolId, status: "ACTIVE" } });
  // One tier badge this month, so the journey has a badge and a bar to show.
  await db.earnedBadge.create({ data: { schoolId, studentMembershipId, badgeId: `zz-pd:tier-1`, label: "ZZ Tier one", description: "ZZ first rung" } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the catalog names the three doors as the handlers decide", () => {
  it("celebrations for every signed-in reader of the feed, the journey for the pupil, the jobs for the operator", () => {
    const entry = (path: string) => ENDPOINTS.find((e) => e.method === "GET" && e.path === path);
    expect(entry("/api/v1/shared/bulletin/celebrations")?.access).toBe("signed-in");
    expect(entry("/api/v1/practice/journey")?.access).toEqual(["STUDENT"]);
    expect(entry("/api/v1/operator/jobs/schools")?.access).toBe("operator");
  });
});

describe("GET /api/v1/shared/bulletin/celebrations", () => {
  it("401 signed out; a malformed window 422", async () => {
    await signInAs(null);
    expect(await status(await celebrationsGet(get("/api/v1/shared/bulletin/celebrations")))).toBe(401);
    await signInAs("TEACHER");
    expect(await status(await celebrationsGet(get("/api/v1/shared/bulletin/celebrations?days=400")))).toBe(422);
    expect(await status(await celebrationsGet(get("/api/v1/shared/bulletin/celebrations?days=zero")))).toBe(422);
  });

  it("staff see every birthday; a pupil and a guardian the staff's alone", async () => {
    await signInAs("TEACHER");
    const staff = await (await celebrationsGet(get("/api/v1/shared/bulletin/celebrations?days=30"))).json();
    expect(staff.days).toBe(30);
    const names = (b: { items: { name: string; kind: string }[] }) => b.items.filter((i) => i.kind === "BIRTHDAY").map((i) => i.name).sort();
    expect(names(staff)).toEqual(["ZZ PD STUDENT", "ZZ PD TEACHER"]);
    await signInAs("STUDENT");
    expect(names(await (await celebrationsGet(get("/api/v1/shared/bulletin/celebrations"))).json())).toEqual(["ZZ PD TEACHER"]);
    await signInAs("PARENT");
    const family = await (await celebrationsGet(get("/api/v1/shared/bulletin/celebrations"))).json();
    expect(names(family)).toEqual(["ZZ PD TEACHER"]);
    expect(family.items[0].schoolName).toBe(`ZZ PD Home ${STAMP}`);
  });

  it("a window too short for the birthday leaves it out", async () => {
    await signInAs("TEACHER");
    const two = await (await celebrationsGet(get("/api/v1/shared/bulletin/celebrations?days=2"))).json();
    expect(two.items.filter((i: { kind: string }) => i.kind === "BIRTHDAY")).toEqual([]);
  });
});

describe("GET /api/v1/practice/journey", () => {
  it("401 signed out; a teacher and a guardian 403", async () => {
    await signInAs(null);
    expect(await status(await journeyGet())).toBe(401);
    await signInAs("TEACHER");
    expect(await status(await journeyGet())).toBe(403);
    await signInAs("PARENT");
    expect(await status(await journeyGet())).toBe(403);
  });

  it("the pupil reads their own badges, six months of tiers and the totals", async () => {
    await signInAs("STUDENT");
    const res = await journeyGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.badges).toEqual([expect.objectContaining({ label: "ZZ Tier one", isTier: true })]);
    expect(body.monthly).toHaveLength(6);
    expect(body.monthly[5].tiers).toBe(1);
    expect(body.monthly[5].month).toMatch(/^\d{4}-\d{2}$/);
    expect(body).toMatchObject({ totalTiers: 1, totalAnswers: 0, practiceWeeks: 0 });
  });
});

describe("GET /api/v1/operator/jobs/schools", () => {
  it("401 signed out; the school's own office 403", async () => {
    await signInAs(null);
    expect(await status(await jobsGet())).toBe(401);
    await signInAs("ADMIN");
    expect(await status(await jobsGet())).toBe(403);
  });

  it("the operator reads the jobs by school and each job's last run", async () => {
    await signInAs("OPERATOR");
    const res = await jobsGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.schools)).toBe(true);
    expect(typeof body.quiet).toBe("number");
    expect(body.runs.length).toBeGreaterThan(0);
  });
});
