import { createHash, randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

/**
 * Sessions for one actor per role on ZZ Northgate, written to e2e/.sessions.json.
 * Minted, not signed in: the login form is exercised by its own suite, and
 * no password is typed here. Every session carries userAgent "e2e" and a
 * one-hour expiry; `teardown` below removes them.
 */
export type Actor = { role: string; cookie: string; classId?: string; slotId?: string };
export type Sessions = Record<string, Actor>;

config({ path: ".env" });
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

async function mint(userId: string, role: string, schoolId: string | null): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.session.create({
    data: {
      userId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      activeSchoolId: schoolId,
      activeRole: role,
      userAgent: "e2e",
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  });
  return `edulink_session=${token}`;
}

export default async function globalSetup() {
  await db.session.deleteMany({ where: { userAgent: "e2e" } });
  const school = await db.school.findUnique({ where: { slug: "zz-northgate-school" } });
  if (!school) throw new Error("ZZ Northgate missing — run npm run zz:fixtures");

  const byEmail = async (email: string) => (await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } })).id;
  const sessions: Sessions = {};

  sessions.ADMIN = { role: "ADMIN", cookie: await mint(await byEmail("zz.admin@zz.test"), "ADMIN", school.id) };
  sessions.PRINCIPAL = { role: "PRINCIPAL", cookie: await mint(await byEmail("zz.principal@zz.test"), "PRINCIPAL", school.id) };

  // A lead teacher of a class with pupils, and an exam slot for that grade —
  // made here if the fixture has none (a fresh CI database has none), ZZ-named
  // and find-or-create so a second run reuses it. One actor who can open both
  // the register and the marks sheet.
  const lead = await db.classTeacher.findFirstOrThrow({
    where: { schoolId: school.id, role: "LEAD", class: { archivedAt: null, gradeLevel: { not: null }, enrollments: { some: { status: "ACTIVE" } } } },
    include: { teacher: { select: { userId: true } }, class: { select: { id: true, gradeLevel: true } } },
    orderBy: { class: { name: "asc" } },
  });
  const gradeLevel = lead.class.gradeLevel!;
  const series =
    (await db.examSeries.findFirst({ where: { schoolId: school.id, name: "ZZ E2E Unit Test", gradeLevel }, select: { id: true } })) ??
    (await db.examSeries.create({ data: { schoolId: school.id, name: "ZZ E2E Unit Test", gradeLevel }, select: { id: true } }));
  const slot =
    (await db.examSlot.findFirst({ where: { seriesId: series.id }, select: { id: true } })) ??
    (await db.examSlot.create({ data: { schoolId: school.id, seriesId: series.id, subject: "Mathematics", dateKey: "2026-09-01", pointsMilli: 50_000 }, select: { id: true } }));
  sessions.TEACHER = { role: "TEACHER", cookie: await mint(lead.teacher.userId, "TEACHER", school.id), classId: lead.class.id, slotId: slot.id };

  const pupil = await db.membership.findFirstOrThrow({ where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE" }, select: { userId: true } });
  sessions.STUDENT = { role: "STUDENT", cookie: await mint(pupil.userId, "STUDENT", school.id) };

  const guardian = await db.guardianship.findFirstOrThrow({ where: { studentSchoolId: school.id, status: "ACTIVE" }, select: { parentUserId: true } });
  sessions.PARENT = { role: "PARENT", cookie: await mint(guardian.parentUserId, "PARENT", null) };

  const expert = await db.expertProfile.findFirst({ where: { user: { email: { endsWith: "@zz.test" } } }, select: { userId: true } });
  if (expert) sessions.EXPERT = { role: "EXPERT", cookie: await mint(expert.userId, "EXPERT", null) };

  writeFileSync(join(__dirname, ".sessions.json"), JSON.stringify(sessions, null, 2));
  await db.$disconnect();
}
