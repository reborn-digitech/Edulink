/**
 * The owner's word of 15 November 2026 ("Yes, close it"): a school's exam series is not made at a college. The school's
 * exams pages were closed there the same day (d714f25f), but POST /api/v1/admin/exams and createSeries behind it still
 * made one, whose date-sheet and report-card notices point at /exams, a page a college no longer opens. Now the door's
 * catalog entry names the school kinds (role-gate.ts rule 4 answers 404 NOT_FOUND at a college before the handler), and
 * createSeries refuses there for every other caller, the page's action included, as the school's admissions do (TA-269).
 * At ZZ Northgate nothing changes.
 *
 * ZZ fixture schools and their office; every series this suite makes (named with its stamp) is removed afterwards, with
 * its audit rows, in those two schools alone.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { COLLEGE_KINDS, INSTITUTION_KINDS } from "@edulink/contracts";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { POST as examsPost } from "@/app/api/v1/admin/exams/route";
import { createSeries } from "@/lib/exams";
import { NotForThisKindError } from "@/lib/access-error";
import { ENDPOINTS } from "@/lib/api-catalog";

const db = new PrismaClient();
const STAMP = Date.now();
const NAME = `ZZ Door ${STAMP}`;
const minted: string[] = [];
const who = { college: "", collegeAdmin: "", school: "", schoolAdmin: "" };

// The door's route is named to the session's gate as the API does; a page's action names no door, so the function case does not.
async function as(userId: string, schoolId: string, route: string | null = "POST /api/v1/admin/exams") {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  minted.push(await createSession(userId, { schoolId, role: "ADMIN" as never }));
}
const post = (body: unknown) => new Request("http://localhost/api/v1/admin/exams", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const seriesAt = (schoolId: string) => db.examSeries.count({ where: { schoolId, name: { startsWith: NAME } } });

beforeAll(async () => {
  const office = async (slug: string) => {
    const school = await db.school.findUniqueOrThrow({ where: { slug }, select: { id: true } });
    const member = await db.membership.findFirstOrThrow({ where: { schoolId: school.id, role: "ADMIN", status: "ACTIVE", leftAt: null, user: { email: { endsWith: "@zz.test" } } }, orderBy: { id: "asc" }, select: { userId: true } });
    return { schoolId: school.id, userId: member.userId };
  };
  const college = await office("zz-vidya-college");
  const school = await office("zz-northgate-school");
  Object.assign(who, { college: college.schoolId, collegeAdmin: college.userId, school: school.schoolId, schoolAdmin: school.userId });
});

afterAll(async () => {
  const schools = [who.college, who.school].filter(Boolean);
  const series = await db.examSeries.findMany({ where: { schoolId: { in: schools }, name: { startsWith: NAME } }, select: { id: true } });
  const ids = series.map((s) => s.id);
  if (ids.length) {
    await db.auditLog.deleteMany({ where: { schoolId: { in: schools }, targetId: { in: ids } } });
    await db.examSlot.deleteMany({ where: { seriesId: { in: ids } } });
    await db.examSeries.deleteMany({ where: { id: { in: ids } } });
  }
  if (minted.length) await db.session.deleteMany({ where: { id: { in: minted } } });
  await db.$disconnect();
});

describe("a school's exam series is not made at a college", () => {
  it("the door names the school kinds alone, so the session's gate answers it at a college (role-gate.ts rule 4)", () => {
    const door = ENDPOINTS.find((e) => e.method === "POST" && e.path === "/api/v1/admin/exams");
    expect(door?.kinds ? [...door.kinds].sort() : null).toEqual(INSTITUTION_KINDS.filter((k) => !COLLEGE_KINDS.includes(k)).sort());
  });

  it("POST /api/v1/admin/exams as ZZ Vidya College's office: 404 NOT_FOUND, and no series is made", async () => {
    await as(who.collegeAdmin, who.college);
    const res = await examsPost(post({ name: `${NAME} college door`, gradeLevel: "3" }));
    expect(res.status).toBe(404);
    expect(((await res.json()) as { code?: string }).code).toBe("NOT_FOUND");
    expect(await seriesAt(who.college)).toBe(0);
  });

  it("createSeries refuses at a college for any caller, the page's server action among them", async () => {
    await as(who.collegeAdmin, who.college, null);
    const ctx = (await getSession())!;
    await expect(createSeries(ctx, { name: `${NAME} college function`, gradeLevel: "3" })).rejects.toBeInstanceOf(NotForThisKindError);
    expect(await seriesAt(who.college)).toBe(0);
  });

  it("at ZZ Northgate the door still schedules a series", async () => {
    await as(who.schoolAdmin, who.school);
    const res = await examsPost(post({ name: `${NAME} school`, gradeLevel: "3" }));
    expect(res.status).toBe(201);
    expect(await seriesAt(who.school)).toBe(1);
  });
});
