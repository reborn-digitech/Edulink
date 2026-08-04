import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  assertSuperuser,
  checkGradeRange,
  createSchool,
  gradeToNumber,
  gradesInRange,
  inviteAdmin,
  listSchools,
  listServerAudit,
  revokeInvite,
  updateSchool,
} from "@/lib/superuser";
import type { ActiveContext } from "@/lib/session";

/**
 * Whoever runs the server.
 *
 * WHAT THIS FILE CAN AND CANNOT SHOW, and here the gap is wider than usual. The
 * suite connects as the database OWNER, so row-level security is not in force.
 * The most important claim about a superuser is a NEGATIVE one enforced by
 * Postgres — that `app.is_superuser` opens School and Invite and nothing else,
 * so an operator querying a child's marks gets no rows. That claim cannot be
 * made here and is made in `npm run rls:verify`, live, against the real policies.
 *
 * What is left for this file is the application half: who `superuser.ts` will
 * let call it, that a school comes out shaped correctly, and the grade-range
 * arithmetic that the admin's class list is built from.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string; isSuperuser?: boolean }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: over.isSuperuser ?? false,
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

const OPERATOR_EMAIL = "operator.unit@edulink.test";
const TEST_SCHOOL_PREFIX = "ZZ Superuser Test";

let operator: ActiveContext;
let ordinaryAdmin: ActiveContext;

async function wipeTestSchools() {
  await db.school.deleteMany({ where: { name: { startsWith: TEST_SCHOOL_PREFIX } } });
}

beforeAll(async () => {
  const user =
    (await db.user.findUnique({ where: { email: OPERATOR_EMAIL } })) ??
    (await db.user.create({
      data: { email: OPERATOR_EMAIL, name: "The Operator", prefs: "{}", isSuperuser: true },
    }));
  await db.user.update({ where: { id: user.id }, data: { isSuperuser: true } });
  operator = ctx({ userId: user.id, isSuperuser: true });

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  const membership = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riverside.id, role: "ADMIN" },
  });
  ordinaryAdmin = ctx({
    userId: priya.id,
    membershipId: membership.id,
    schoolId: riverside.id,
    role: "ADMIN",
    isSuperuser: false,
  });

  await wipeTestSchools();
});

afterEach(wipeTestSchools);

afterAll(async () => {
  await wipeTestSchools();
  await db.user.deleteMany({ where: { email: OPERATOR_EMAIL } });
  await db.$disconnect();
});

const DETAILS = {
  name: `${TEST_SCHOOL_PREFIX} Academy`,
  contactEmail: "office@zz-test.school",
  timezone: "Asia/Kolkata",
  gradeLow: "3",
  gradeHigh: "10",
};

describe("⚠ only an operator may call any of it", () => {
  it("refuses an ordinary school admin", () => {
    // The most senior person INSIDE a school is still inside it.
    expect(() => assertSuperuser(ordinaryAdmin)).toThrow(AccessError);
  });

  it("refuses every entry point, not merely the first", async () => {
    await expect(listSchools(ordinaryAdmin)).rejects.toBeInstanceOf(AccessError);
    await expect(createSchool(ordinaryAdmin, DETAILS)).rejects.toBeInstanceOf(AccessError);
    await expect(
      updateSchool(ordinaryAdmin, "any-id", { name: "Nope" }),
    ).rejects.toBeInstanceOf(AccessError);
    await expect(
      inviteAdmin(ordinaryAdmin, "any-id", { email: "a@b.test" }),
    ).rejects.toBeInstanceOf(AccessError);
    await expect(revokeInvite(ordinaryAdmin, "any-id")).rejects.toBeInstanceOf(AccessError);
    await expect(listServerAudit(ordinaryAdmin)).rejects.toBeInstanceOf(AccessError);
  });

  it("lets the operator through", () => {
    expect(() => assertSuperuser(operator)).not.toThrow();
  });
});

describe("creating a school", () => {
  it("mints a slug and a join code without being told either", async () => {
    const result = await createSchool(operator, DETAILS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const school = await db.school.findUniqueOrThrow({ where: { id: result.schoolId } });
    expect(school.name).toBe(DETAILS.name);
    expect(school.slug.length).toBeGreaterThan(0);
    expect(school.code).toBe(result.code);
    expect(school.gradeLow).toBe("3");
    expect(school.gradeHigh).toBe("10");
  });

  it("⚠ survives a name that collides, rather than failing the second school", async () => {
    // Two schools genuinely can be called the same thing. The slug is unique,
    // so the second one has to be given a different one rather than refused.
    const first = await createSchool(operator, DETAILS);
    const second = await createSchool(operator, DETAILS);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    const rows = await db.school.findMany({
      where: { id: { in: [first.schoolId, second.schoolId] } },
      select: { slug: true },
    });
    expect(new Set(rows.map((r) => r.slug)).size).toBe(2);
  });

  it("refuses a school with no name and one with no contact email", async () => {
    expect((await createSchool(operator, { ...DETAILS, name: " " })).ok).toBe(false);
    expect((await createSchool(operator, { ...DETAILS, contactEmail: "" })).ok).toBe(false);
  });

  it("⚠ refuses a grade range that runs backwards", async () => {
    const result = await createSchool(operator, { ...DETAILS, gradeLow: "10", gradeHigh: "3" });
    expect(result.ok).toBe(false);
  });

  it("writes an audit row that belongs to NO school", async () => {
    const result = await createSchool(operator, DETAILS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const entry = await db.auditLog.findFirst({
      where: { action: "superuser.school.create", targetId: result.schoolId },
    });
    expect(entry).not.toBeNull();
    // ⚠ An operator's actions belong to the operator. A schoolId here would put
    // them in that school's Safety Centre, which is a different accountability
    // story from the one intended.
    expect(entry!.schoolId).toBeNull();
    expect(entry!.actorUserId).toBe(operator.user.id);
  });
});

describe("correcting a school", () => {
  it("changes only what it was given", async () => {
    const created = await createSchool(operator, DETAILS);
    if (!created.ok) throw new Error("setup");

    await updateSchool(operator, created.schoolId, { city: "Pune" });
    const school = await db.school.findUniqueOrThrow({ where: { id: created.schoolId } });
    expect(school.city).toBe("Pune");
    expect(school.name).toBe(DETAILS.name);
    expect(school.timezone).toBe("Asia/Kolkata");
  });

  it("refuses a school that does not exist", async () => {
    expect((await updateSchool(operator, "no-such-school", { city: "X" })).ok).toBe(false);
  });

  it("⚠ refuses a backwards grade range here too, not only on create", async () => {
    const created = await createSchool(operator, DETAILS);
    if (!created.ok) throw new Error("setup");
    const result = await updateSchool(operator, created.schoolId, {
      gradeLow: "12",
      gradeHigh: "1",
    });
    expect(result.ok).toBe(false);
  });
});

describe("inviting somebody to run a school", () => {
  it("writes a PENDING invite and no membership", async () => {
    const created = await createSchool(operator, DETAILS);
    if (!created.ok) throw new Error("setup");

    const result = await inviteAdmin(operator, created.schoolId, {
      email: "head@zz-test.school",
      name: "New Head",
    });
    expect(result.ok).toBe(true);

    const invite = await db.invite.findFirstOrThrow({ where: { schoolId: created.schoolId } });
    expect(invite.role).toBe("ADMIN");
    expect(invite.status).toBe("PENDING");
    // ⚠ No membership. An operator who could mint one could mint their own.
    expect(await db.membership.count({ where: { schoolId: created.schoolId } })).toBe(0);
  });

  it("⚠ leaves createdByMembershipId null, because an operator is in no school", async () => {
    const created = await createSchool(operator, DETAILS);
    if (!created.ok) throw new Error("setup");
    await inviteAdmin(operator, created.schoolId, { email: "head@zz-test.school" });

    const invite = await db.invite.findFirstOrThrow({ where: { schoolId: created.schoolId } });
    expect(invite.createdByMembershipId).toBeNull();
  });

  it("can invite a principal as well as an admin", async () => {
    const created = await createSchool(operator, DETAILS);
    if (!created.ok) throw new Error("setup");
    await inviteAdmin(operator, created.schoolId, {
      email: "principal@zz-test.school",
      role: "PRINCIPAL",
    });
    const invite = await db.invite.findFirstOrThrow({ where: { schoolId: created.schoolId } });
    expect(invite.role).toBe("PRINCIPAL");
  });

  it("refuses a second invitation to the same address", async () => {
    const created = await createSchool(operator, DETAILS);
    if (!created.ok) throw new Error("setup");
    expect((await inviteAdmin(operator, created.schoolId, { email: "h@zz-test.school" })).ok).toBe(
      true,
    );
    expect((await inviteAdmin(operator, created.schoolId, { email: "h@zz-test.school" })).ok).toBe(
      false,
    );
  });

  it("refuses a malformed address and a school that does not exist", async () => {
    const created = await createSchool(operator, DETAILS);
    if (!created.ok) throw new Error("setup");
    expect((await inviteAdmin(operator, created.schoolId, { email: "not-an-email" })).ok).toBe(false);
    expect((await inviteAdmin(operator, "no-such-school", { email: "a@b.test" })).ok).toBe(false);
  });

  it("revokes a pending invitation, once", async () => {
    const created = await createSchool(operator, DETAILS);
    if (!created.ok) throw new Error("setup");
    await inviteAdmin(operator, created.schoolId, { email: "h@zz-test.school" });
    const invite = await db.invite.findFirstOrThrow({ where: { schoolId: created.schoolId } });

    expect((await revokeInvite(operator, invite.id)).ok).toBe(true);
    expect((await revokeInvite(operator, invite.id)).ok).toBe(false);
  });
});

describe("listing schools", () => {
  it("counts the admin invitations still waiting", async () => {
    const created = await createSchool(operator, DETAILS);
    if (!created.ok) throw new Error("setup");
    await inviteAdmin(operator, created.schoolId, { email: "h@zz-test.school" });

    const schools = await listSchools(operator);
    const mine = schools.find((s) => s.id === created.schoolId);
    expect(mine?.pendingAdminInvites).toBe(1);
  });
});

/**
 * The grade range, which is not decoration: it becomes the list of classes a
 * school's own admin is offered. Getting it wrong means a primary school being
 * asked whether it wants a Year 12.
 */
describe("⚠ grade ranges", () => {
  it("reads numeric grades as numbers", () => {
    expect(gradeToNumber("5")).toBe(5);
    expect(gradeToNumber(" 12 ")).toBe(12);
  });

  it("⚠ does not pretend a non-numeric grade is a number", () => {
    // "K", "LKG", "Nursery" and "I" are all real first years. Coercing them to
    // NaN and then to 0 would silently sort Nursery below Grade 1 and above
    // nothing, which is how a dropdown ends up in an order nobody recognises.
    for (const grade of ["K", "LKG", "Nursery", "Reception", "I", "", null, undefined]) {
      expect(gradeToNumber(grade)).toBeNull();
    }
  });

  it("refuses a numeric range that runs backwards", () => {
    expect(checkGradeRange("10", "3")).not.toBeNull();
    expect(checkGradeRange("3", "10")).toBeNull();
    expect(checkGradeRange("5", "5")).toBeNull();
  });

  it("⚠ accepts a range it cannot parse rather than rejecting it", () => {
    // Refusing "K" to "5" would be the software telling a school it is named
    // wrong. Unparseable means unchecked, not invalid.
    expect(checkGradeRange("K", "5")).toBeNull();
    expect(checkGradeRange("LKG", "XII")).toBeNull();
  });

  it("expands a numeric range into the grades a school teaches", () => {
    expect(gradesInRange("3", "10")).toEqual(["3", "4", "5", "6", "7", "8", "9", "10"]);
    expect(gradesInRange("5", "12")).toHaveLength(8);
    expect(gradesInRange("1", "1")).toEqual(["1"]);
  });

  it("⚠ expands to nothing when it cannot, so the form falls back to free text", () => {
    // An empty list is the signal to show a text box. A guessed sequence would
    // be worse than no help at all.
    expect(gradesInRange("K", "5")).toEqual([]);
    expect(gradesInRange(null, "10")).toEqual([]);
    expect(gradesInRange("10", "3")).toEqual([]);
  });

  it("⚠ refuses to expand an absurd range instead of rendering 900 options", () => {
    expect(gradesInRange("1", "500")).toEqual([]);
  });
});

/**
 * The operator's own trail.
 *
 * WHAT THIS FILE CAN SHOW is that the reader returns the unattributed rows and
 * refuses a school admin. What it CANNOT show is the half that matters most —
 * that Postgres lets a superuser read schoolId-NULL rows and no others — because
 * this suite connects as the database owner with row-level security not in
 * force. That claim is made in `npm run rls:verify`, live, against the policy.
 */
describe("the server log", () => {
  it("⚠ shows the operator's own actions, which appear in no school", async () => {
    const result = await createSchool(operator, DETAILS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Newest first, so the action just taken is row zero. Counting the list
    // before and after would not work: it is capped, and on a server with any
    // history at all the cap is already reached.
    const after = await listServerAudit(operator);
    expect(after[0]!.action).toBe("superuser.school.create");
    expect(after[0]!.targetId).toBe(result.schoolId);
    expect(after[0]!.actorName).toBe("The Operator");
    // The school is named in meta precisely because the row cannot carry a
    // schoolId — that is what keeps it out of every Safety Centre.
    expect(after[0]!.meta.name).toBe(DETAILS.name);
  });

  it("⚠ carries no school-scoped row", async () => {
    // A school's history belongs to that school. If a tenant row ever reached
    // this list, the operator would be reading inside a school through the one
    // table that records everything that happens in one.
    await createSchool(operator, DETAILS);
    const rows = await listServerAudit(operator, { take: 500 });
    expect(rows.length).toBeGreaterThan(0);

    const ids = rows.map((r) => r.id);
    const scoped = await db.auditLog.count({
      where: { id: { in: ids }, schoolId: { not: null } },
    });
    expect(scoped).toBe(0);
  });
});
