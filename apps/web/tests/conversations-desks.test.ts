/**
 * Messages for a college's FACULTY and HOD (5 Oct 2026): the people picker offers only those who can open a room.
 * A college desk (accounts, the library, the hostel) or a module role has no conversation door, so offering them
 * left a message waiting unread for ever — more visible now the phone gives faculty a Messages tab.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { peopleToMessage } from "@/lib/conversations";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { college: "", users: [] as string[], faculty: "", byRole: {} as Record<string, string> };

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ Rooms College ${STAMP}`, slug: `zz-rooms-${STAMP}`, code: `ZRM${SUFFIX}`, contactEmail: `zz-rooms-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: ["ACADEMICS", "LIBRARY"].map((module) => ({ schoolId: ids.college, module })) });
  for (const role of ["FACULTY", "HOD", "ADMIN", "STUDENT", "ACCOUNTS", "LIBRARIAN", "TPO"]) {
    const u = await db.user.create({ data: { name: `ZZ Rooms ${role}`, email: `zz-rooms-${role.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
    ids.users.push(u.id);
    ids.byRole[role] = u.id;
    await db.membership.create({ data: { userId: u.id, schoolId: ids.college, role, status: "ACTIVE" } });
  }
  ids.faculty = ids.byRole.FACULTY!;
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: ids.users } } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { id: { in: ids.users } } });
  await db.$disconnect();
});

describe("who a college's faculty member may write to", () => {
  it("offers teaching staff, the office and students, and never a desk with no inbox", async () => {
    __resetCookies();
    __setHeaders({});
    await createSession(ids.faculty, { schoolId: ids.college, role: "FACULTY" });
    const ctx = (await getSession())!;
    const roles = (await peopleToMessage(ctx, ids.college)).map((p) => p.role).sort();
    expect(roles).toEqual(["ADMIN", "HOD", "STUDENT"]);
  });
});
