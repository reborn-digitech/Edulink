import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { setActiveContext } from "@/lib/session";
import { hashToken, generateToken } from "@/lib/crypto";

/**
 * Switching role or school on an existing session.
 *
 * The role switcher is the one place a signed-in user asks to BE something else,
 * and the request is entirely client-supplied — a role string and a school id
 * off a form. So the only thing standing between "I would like to be an admin"
 * and being one is the re-check inside `setActiveContext`.
 *
 * PARENT is the interesting case and the reason this file exists. Every other
 * role is proved by a Membership row; PARENT has none by design (see
 * constants.ts) and is proved by an ACTIVE Guardianship instead. That means it
 * takes a *different* branch from every other role — one that had no test.
 * A branch that grants a role and has never run is worth pinning.
 */

const db = new PrismaClient();

let teacherUserId: string;
let teacherSchoolId: string;
let otherSchoolId: string;
let parentUserId: string;
let sessionId: string;
let parentSessionId: string;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });
  teacherSchoolId = riverside.id;
  otherSchoolId = oakfield.id;

  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  teacherUserId = tom.id;

  const parent = await db.user.findUniqueOrThrow({ where: { email: "parent@example.com" } });
  parentUserId = parent.id;

  sessionId = (await session(teacherUserId)).id;
  parentSessionId = (await session(parentUserId)).id;
});

afterAll(async () => {
  await db.session.deleteMany({ where: { id: { in: [sessionId, parentSessionId] } } });
  await db.$disconnect();
});

function session(userId: string) {
  return db.session.create({
    data: {
      userId,
      tokenHash: hashToken(generateToken()),
      expiresAt: new Date(Date.now() + 86_400_000),
    },
  });
}

describe("roles proved by a membership", () => {
  it("accepts a role the user actually holds at that school", async () => {
    const ok = await setActiveContext(sessionId, teacherUserId, {
      schoolId: teacherSchoolId,
      role: "TEACHER",
    });
    expect(ok).toBe(true);

    const row = await db.session.findUniqueOrThrow({ where: { id: sessionId } });
    expect(row.activeRole).toBe("TEACHER");
    expect(row.activeSchoolId).toBe(teacherSchoolId);
  });

  it("⚠ refuses a role the user does not hold", async () => {
    // Tom teaches. He is not an admin, and asking nicely must not make him one.
    const ok = await setActiveContext(sessionId, teacherUserId, {
      schoolId: teacherSchoolId,
      role: "ADMIN",
    });
    expect(ok).toBe(false);

    const row = await db.session.findUniqueOrThrow({ where: { id: sessionId } });
    expect(row.activeRole).toBe("TEACHER"); // unchanged
  });

  it("⚠ refuses the right role at the wrong school", async () => {
    // The whole point of the second seeded school: "is a teacher somewhere" must
    // never be enough.
    const ok = await setActiveContext(sessionId, teacherUserId, {
      schoolId: otherSchoolId,
      role: "TEACHER",
    });
    expect(ok).toBe(false);
  });

  it("refuses a membership role with no school at all", async () => {
    const ok = await setActiveContext(sessionId, teacherUserId, {
      schoolId: null,
      role: "TEACHER",
    });
    expect(ok).toBe(false);
  });
});

describe("PARENT, which no membership proves", () => {
  it("accepts a guardian, with no school scope", async () => {
    // A parent legitimately spans schools, so schoolId stays null here — which
    // is exactly why this cannot go through the membership check.
    const ok = await setActiveContext(parentSessionId, parentUserId, {
      schoolId: null,
      role: "PARENT",
    });
    expect(ok).toBe(true);

    const row = await db.session.findUniqueOrThrow({ where: { id: parentSessionId } });
    expect(row.activeRole).toBe("PARENT");
    expect(row.activeSchoolId).toBeNull();
  });

  it("⚠ refuses someone with no active guardianship", async () => {
    // Tom is staff, not a parent. If the PARENT branch skipped its check, this
    // would hand him a role whose pages read children's attendance and grades.
    const ok = await setActiveContext(sessionId, teacherUserId, {
      schoolId: null,
      role: "PARENT",
    });
    expect(ok).toBe(false);
  });

  it("⚠ refuses a parent whose guardianships have all been revoked", async () => {
    const links = await db.guardianship.findMany({
      where: { parentUserId, status: "ACTIVE" },
      select: { id: true },
    });
    expect(links.length).toBeGreaterThan(0);
    const ids = links.map((l) => l.id);

    await db.guardianship.updateMany({ where: { id: { in: ids } }, data: { status: "REVOKED" } });
    try {
      const ok = await setActiveContext(parentSessionId, parentUserId, {
        schoolId: null,
        role: "PARENT",
      });
      expect(ok).toBe(false);
    } finally {
      await db.guardianship.updateMany({ where: { id: { in: ids } }, data: { status: "ACTIVE" } });
    }
  });
});
