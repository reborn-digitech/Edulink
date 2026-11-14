/**
 * TA-453 (testing analysis of 13 November 2026, batch gradebook-exams-reportcards): the class report-card bundle
 * read each card one after another, each card reading again the school, its rules and the set's signatures and
 * count, before laying the pages out. Held here by counting the Prisma operations the door makes (the app's `db`
 * wrapped in a counter, as tests/academics-mark-cost.test.ts does) for a published set of one card and of three:
 * what the cards share is read once a bundle, so the third card costs what the second does and both cost one read
 * each. The PDF itself is stood in for; its layout is not what is counted.
 *
 * One scratch ZZ school of this suite's own (made through the owner connection, removed after): the office, a
 * class teacher, class X of one pupil and class Y of three, one marked paper each, the sets generated and published.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

const counter = vi.hoisted(() => ({ ops: 0 }));

vi.mock("@/lib/db", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/db")>();
  type Fn = (...a: unknown[]) => unknown;
  const delegate = (d: object) =>
    new Proxy(d, {
      get(t, op) {
        const v = (t as Record<string | symbol, unknown>)[op];
        if (typeof v !== "function") return v;
        return (...a: unknown[]) => {
          counter.ops += 1;
          return (v as Fn).apply(t, a);
        };
      },
    });
  const wrap = (client: object): object =>
    new Proxy(client, {
      get(t, k) {
        const v = (t as Record<string | symbol, unknown>)[k];
        if (k === "$tenantTransaction") {
          return (work: (tx: unknown) => Promise<unknown>, opts?: unknown) => (v as Fn).call(t, (tx: unknown) => work(wrap(tx as object)), opts);
        }
        if (typeof k === "string" && !k.startsWith("$") && v && typeof v === "object") return delegate(v);
        return typeof v === "function" ? (v as Fn).bind(t) : v;
      },
    });
  return { ...real, db: wrap(real.db) };
});
vi.mock("@/lib/report-card-pdf", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/report-card-pdf")>();
  return { ...real, renderReportCardsPdf: async () => Buffer.from("%PDF-1.4 stand-in") };
});

const { createSession, getSession } = await import("@/lib/session");
const { __resetCookies, __setHeaders } = await import("./stubs/next-headers");
const { generateCards, publishCards } = await import("@/lib/report-cards");
const { GET: bundleGet } = await import("@/app/api/v1/teaching/classes/[classId]/report-cards/pdf/route");

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tagbu-${who}-${STAMP}@test.invalid`;
const TITLE = "ZZ TAGBU Term 1";
const ids: Record<string, string> = {};

async function as(who: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.school!, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TA Gradebook Bundle ${STAMP}`, slug: `zz-tagbu-${STAMP}`, code: `ZTGU${TAIL}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const S = ids.school;
  const person = async (who: string, role: string) => {
    ids[who] = (await db.user.create({ data: { name: `ZZ TA Bundle ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: S, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZTGU${who}${TAIL}` } : {}) }, select: { id: true } })).id;
  };
  await person("admin", "ADMIN");
  await person("lead", "TEACHER");
  for (const who of ["x1", "y1", "y2", "y3"]) await person(who, "STUDENT");
  const series = await db.examSeries.create({ data: { schoolId: S, name: "ZZ TAGBU Unit Test", gradeLevel: "4", publishedAt: new Date() }, select: { id: true } });
  const slot = await db.examSlot.create({ data: { schoolId: S, seriesId: series.id, subject: "Mathematics", dateKey: "2026-09-01", pointsMilli: 50_000 }, select: { id: true } });
  for (const [key, pupils] of [["X", ["x1"]], ["Y", ["y1", "y2", "y3"]]] as const) {
    const classId = (await db.class.create({ data: { schoolId: S, name: `ZZ TA Bundle 4${key}`, gradeLevel: "4", joinCode: `ZTGU${key}${TAIL}` }, select: { id: true } })).id;
    ids[`class${key}`] = classId;
    await db.classTeacher.create({ data: { classId, schoolId: S, teacherMembershipId: ids.leadM!, role: "LEAD" } });
    const sitting = await db.assignment.create({
      data: { schoolId: S, classId, authorMembershipId: ids.leadM!, title: "ZZ TAGBU Unit Test · Mathematics", category: "Exam", pointsMilli: 50_000, examSlotId: slot.id, publishedAt: new Date() },
      select: { id: true },
    });
    for (const who of pupils) {
      await db.enrollment.create({ data: { classId, schoolId: S, studentMembershipId: ids[`${who}M`]!, status: "ACTIVE" } });
      await db.grade.create({ data: { schoolId: S, assignmentId: sitting.id, studentMembershipId: ids[`${who}M`]!, scoreMilli: 40_000 } });
    }
    const lead = await as("lead", "TEACHER");
    expect((await generateCards(lead, classId, { title: TITLE, assignmentIds: [sitting.id] })).ok).toBe(true);
    expect((await publishCards(lead, classId, TITLE)).ok).toBe(true);
  }
}, 120_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = ["admin", "lead", "x1", "y1", "y2", "y3"].map((w) => ids[w]).filter((id): id is string => Boolean(id));
  await db.rateLimit.deleteMany({ where: { bucket: { in: users.map((id) => `pdf-bundle:${id}`) } } });
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  if (ids.school) await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
}, 60_000);

async function bundleOps(classKey: string): Promise<number> {
  await as("admin", "ADMIN");
  counter.ops = 0;
  const res = await bundleGet(new Request(`http://localhost/x?title=${encodeURIComponent(TITLE)}`), { params: Promise.resolve({ classId: ids[`class${classKey}`]! }) });
  expect(res.status).toBe(200);
  return counter.ops;
}

describe("TA-453: the class bundle's reads", () => {
  it("TA-453: what the cards share is read once a bundle, so each card after the first costs one read", async () => {
    const one = await bundleOps("X");
    const three = await bundleOps("Y");
    expect(three - one).toBeLessThanOrEqual(2);
  });
});
