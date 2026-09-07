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

  // An exam slot the fixture has, then a class of that grade with pupils and
  // its lead teacher: one actor who can open both the register and the sheet.
  const slot = await db.examSlot.findFirstOrThrow({ where: { schoolId: school.id }, select: { id: true, series: { select: { gradeLevel: true } } } });
  const lead = await db.classTeacher.findFirstOrThrow({
    where: { schoolId: school.id, role: "LEAD", class: { archivedAt: null, gradeLevel: slot.series.gradeLevel, enrollments: { some: { status: "ACTIVE" } } } },
    include: { teacher: { select: { userId: true } }, class: { select: { id: true } } },
  });
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
