import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { listContexts } from "@/lib/session";
import { myChildren } from "@/lib/student-record";
import type { ActiveContext } from "@/lib/session";

/**
 * A parent's children come back in a PROMISED order, not Postgres row order.
 *
 * `children[0]` is the child every parent page opens on, and until this was
 * pinned the guardianship query had no orderBy — which child a parent landed on
 * was whatever the database felt like returning, and a vacuum or re-seed could
 * flip it. The same class of bug as grading.test.ts's findFirst-without-orderBy,
 * one layer up.
 *
 * The fixtures are INSERTED IN THE OPPOSITE ORDER to what is asserted, on
 * purpose: if the orderBy is ever deleted, insertion order wins and these fail.
 */

const db = new PrismaClient();

const PARENT_EMAIL = "zz.parent.order@children.test";
const FIRST_EMAIL = "zz.first.order@children.test"; // claimed first, named LAST alphabetically
const SECOND_EMAIL = "zz.second.order@children.test"; // claimed second, named FIRST alphabetically
const MADE = [PARENT_EMAIL, FIRST_EMAIL, SECOND_EMAIL];

let parentId: string;
let riversideId: string;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  riversideId = riverside.id;

  const parent = await db.user.create({
    data: { email: PARENT_EMAIL, name: "ZZ Order Parent", prefs: "{}" },
  });
  parentId = parent.id;

  // Names chosen so alphabetical order CONTRADICTS claim order: Zainab was
  // claimed first, Anil second. listContexts must return [Zainab, Anil]
  // (claim order); myChildren must return [Anil, Zainab] (name order).
  const zainab = await db.user.create({
    data: { email: FIRST_EMAIL, name: "ZZ Zainab Ordertest", prefs: "{}" },
  });
  const anil = await db.user.create({
    data: { email: SECOND_EMAIL, name: "ZZ Anil Ordertest", prefs: "{}" },
  });
  const zainabM = await db.membership.create({
    data: { userId: zainab.id, schoolId: riversideId, role: "STUDENT", status: "ACTIVE" },
  });
  const anilM = await db.membership.create({
    data: { userId: anil.id, schoolId: riversideId, role: "STUDENT", status: "ACTIVE" },
  });

  // Anil's row INSERTED first but claimed later; Zainab's inserted second but
  // claimed earlier. Row order and claim order now disagree.
  await db.guardianship.create({
    data: {
      parentUserId: parentId,
      studentMembershipId: anilM.id,
      studentSchoolId: riversideId,
      status: "ACTIVE",
      createdAt: new Date("2026-01-02T00:00:00Z"),
    },
  });
  await db.guardianship.create({
    data: {
      parentUserId: parentId,
      studentMembershipId: zainabM.id,
      studentSchoolId: riversideId,
      status: "ACTIVE",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    },
  });
});

afterAll(async () => {
  const users = await db.user.findMany({ where: { email: { in: MADE } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  await db.guardianship.deleteMany({ where: { parentUserId: { in: ids } } });
  await db.membership.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});

function parentCtx(): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: null,
    schoolId: riversideId,
    role: "PARENT",
    user: {
      id: parentId,
      name: "ZZ Order Parent",
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

describe("⚠ which child a parent lands on is a promise, not a coin toss", () => {
  it("listContexts: first claimed, first shown — even against insertion order", async () => {
    const { children } = await listContexts(parentId);
    expect(children.map((c) => c.name)).toEqual(["ZZ Zainab Ordertest", "ZZ Anil Ordertest"]);
  });

  it("myChildren: the record page lists children by name", async () => {
    const kids = await myChildren(parentCtx());
    expect(kids.map((k) => k.name)).toEqual(["ZZ Anil Ordertest", "ZZ Zainab Ordertest"]);
  });
});
