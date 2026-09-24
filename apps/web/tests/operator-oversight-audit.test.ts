import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { findPeople, listPeople, listPosts, schoolOverview } from "@/lib/operator-oversight";
import type { ActiveContext } from "@/lib/session";

/**
 * Every READ the operator makes inside a school is written to that school's
 * audit log — with counts, and never a name.
 *
 * The visitor book (`OperatorAccess`) already said the operator was here this
 * hour. What it could not say was what they looked at: a directory listed, a
 * name searched, and nothing in the school's Safety Centre about either. This
 * proves the line is written for each read, that it is bound to the school
 * being looked at, and that its `meta` carries the size of what was seen and
 * not the people in it — an audit log that repeated a searched name would be
 * a second copy of the thing it was meant to protect.
 *
 * As every suite here, this connects as the OWNER, so what it proves is the
 * application's behaviour. That the app role cannot then rewrite or remove
 * the line is proved in tests/rls-app-role.test.ts.
 */

const db = new PrismaClient();
const SUFFIX = "@zzopaudit.test";
const SLUG = "zz-operator-audit-school";

let schoolId: string;
let operator: ActiveContext;

function ctx(userId: string): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: null,
    schoolId: null,
    role: null,
    user: {
      id: userId,
      name: "The Operator",
      preferredName: null,
      email: `operator${SUFFIX}`,
      avatarKey: null,
      isMinor: false,
      isSuperuser: true,
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

beforeAll(async () => {
  await db.school.deleteMany({ where: { slug: SLUG } });
  await db.user.deleteMany({ where: { email: { endsWith: SUFFIX } } });

  const school = await db.school.create({
    data: { name: "ZZ Operator Audit School", slug: SLUG, code: "ZZOPAU", contactEmail: `office${SUFFIX}` },
    select: { id: true },
  });
  schoolId = school.id;

  const op = await db.user.create({
    data: { email: `operator${SUFFIX}`, name: "The Operator", isSuperuser: true, prefs: "{}" },
    select: { id: true },
  });
  operator = ctx(op.id);

  const pupil = await db.user.create({
    data: { email: `pupil${SUFFIX}`, name: "Zz Aarav Searchable", prefs: "{}" },
    select: { id: true },
  });
  await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE" } });
  await db.post.create({
    data: { schoolId, authorUserId: pupil.id, scope: "SCHOOL", title: "ZZ A post", status: "APPROVED" },
  });
});

beforeEach(async () => {
  await db.auditLog.deleteMany({ where: { schoolId } });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { slug: SLUG } });
  await db.user.deleteMany({ where: { email: { endsWith: SUFFIX } } });
  await db.$disconnect();
});

async function readRows() {
  return db.auditLog.findMany({
    where: { schoolId, action: { startsWith: "operator.read." } },
    select: { action: true, meta: true, actorUserId: true, targetId: true },
    orderBy: { createdAt: "asc" },
  });
}

describe("an oversight read is a line in the school's audit log", () => {
  it("⚠ listing the roll writes operator.read.people, bound to the school, with a count and no name", async () => {
    const people = await listPeople(operator, schoolId);
    expect(people.map((p) => p.name)).toContain("Zz Aarav Searchable");

    const rows = await readRows();
    expect(rows.map((r) => r.action)).toEqual(["operator.read.people"]);
    expect(rows[0]!.actorUserId).toBe(operator.user.id);
    expect(rows[0]!.targetId).toBe(schoolId);
    expect(JSON.parse(rows[0]!.meta)).toEqual({ count: 1 });
    expect(rows[0]!.meta).not.toContain("Aarav");
  });

  it("⚠ a search writes operator.read.people.search with the query's length, never its letters", async () => {
    const found = await findPeople(operator, schoolId, "Aarav");
    expect(found).toHaveLength(1);

    const rows = await readRows();
    expect(rows.map((r) => r.action)).toEqual(["operator.read.people.search"]);
    expect(JSON.parse(rows[0]!.meta)).toEqual({ count: 1, queryLength: 5 });
    expect(rows[0]!.meta.toLowerCase()).not.toContain("aarav");
  });

  it("the overview and the posts list are audited with their counts", async () => {
    await schoolOverview(operator, schoolId);
    await listPosts(operator, schoolId);

    const rows = await readRows();
    expect(rows.map((r) => r.action)).toEqual(["operator.read.overview", "operator.read.posts"]);
    expect(JSON.parse(rows[0]!.meta)).toEqual({ members: 1, classes: 0, pendingPosts: 0, openReports: 0 });
    expect(JSON.parse(rows[1]!.meta)).toEqual({ count: 1 });
  });

  it("never lands in another school's log", async () => {
    await listPeople(operator, schoolId);
    expect(
      await db.auditLog.count({
        where: { action: { startsWith: "operator.read." }, actorUserId: operator.user.id, NOT: { schoolId } },
      }),
    ).toBe(0);
  });
});
