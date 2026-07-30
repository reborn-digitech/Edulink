import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The shape tenancy relies on, checked against the schema itself.
 *
 * `tenancy.ts` puts `schoolId` in the WHERE clause of every scoped query, and
 * the Postgres migration intends to turn that into an RLS policy per table. Both
 * depend on a property of the DATA MODEL rather than of any one query: that a
 * row can say which school it belongs to.
 *
 * The schema header used to state that every school-owned row carries `schoolId`
 * directly. It does not — five tables reach their tenant only through a join,
 * and nothing said so, which matters because those five need a subquery policy
 * rather than the one-line predicate the header promised. Prose cannot be run;
 * this can.
 *
 * A new model therefore has to land in one of three lists below, deliberately.
 * Adding one and forgetting fails this test rather than being discovered when a
 * policy is written against a column that is not there.
 */

const SCHEMA = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");

/** Models that carry `schoolId` and can take a one-line RLS predicate. */
const DIRECT = [
  "Assignment",
  "AttendanceRecord",
  "AttendanceSession",
  "AuditLog",
  "Class",
  "CompetitionEntry",
  "Grade",
  "Invite",
  "Membership",
  "Notification",
  "Post",
  "RemarkThread",
  "Report",
  "Submission",
];

/**
 * School-owned, but the tenant is one join away. Each needs an RLS policy of the
 * form `EXISTS (SELECT 1 FROM parent WHERE parent.id = <fk> AND parent."schoolId" = …)`.
 * The value is the foreign key that gets there, so the policy and this list
 * cannot drift apart silently.
 */
const VIA_JOIN: Record<string, { fk: string; parent: string }> = {
  ClassTeacher: { fk: "classId", parent: "Class" },
  Enrollment: { fk: "classId", parent: "Class" },
  Comment: { fk: "postId", parent: "Post" },
  Reaction: { fk: "postId", parent: "Post" },
  RemarkMessage: { fk: "threadId", parent: "RemarkThread" },
};

/** Not school-owned, each for a stated reason. */
const NOT_TENANT_SCOPED: Record<string, string> = {
  School: "is the tenant itself — its policy is on id, not schoolId",
  User: "spans schools on purpose — a parent has children in two, a teacher may work at two",
  Session: "belongs to a user, not a school; a session survives switching school",
  AuthToken: "belongs to a user, before any school is chosen",
  PushSubscription: "belongs to a user's device",
  Guardianship: "deliberately cross-school: it is the link between a parent and a child",
  Competition: "organizerSchoolId is nullable because a competition may be run by nobody's school",
  OutboundEmail: "a dev mailbox of sent mail; has no tenant and holds no school data",
};

function modelBodies(): Map<string, string> {
  const bodies = new Map<string, string>();
  const re = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(SCHEMA)) !== null) bodies.set(match[1]!, match[2]!);
  return bodies;
}

const MODELS = modelBodies();

function hasField(body: string, field: string): boolean {
  return new RegExp(`^\\s*${field}\\s`, "m").test(body);
}

describe("the schema parses at all", () => {
  it("finds every model", () => {
    expect(
      MODELS.size,
      "If this FELL, the regex above has stopped matching and every assertion " +
        "below is passing vacuously. If it ROSE, a model was added — say how it " +
        "is scoped in one of the three lists and update this number.",
    ).toBe(27);
  });
});

describe("every model declares how it is scoped", () => {
  it("⚠ has no model missing from all three lists", () => {
    const accounted = new Set([...DIRECT, ...Object.keys(VIA_JOIN), ...Object.keys(NOT_TENANT_SCOPED)]);
    const orphans = [...MODELS.keys()].filter((m) => !accounted.has(m));

    expect(
      orphans,
      `New model(s) with no stated tenancy: ${orphans.join(", ")}. Add a schoolId ` +
        "and list it in DIRECT, or say how it reaches its tenant in VIA_JOIN, or " +
        "why it has none in NOT_TENANT_SCOPED.",
    ).toEqual([]);
  });

  it("lists nothing that does not exist", () => {
    const listed = [...DIRECT, ...Object.keys(VIA_JOIN), ...Object.keys(NOT_TENANT_SCOPED)];
    const ghosts = listed.filter((m) => !MODELS.has(m));
    expect(ghosts, `Listed but not in the schema: ${ghosts.join(", ")}`).toEqual([]);
  });
});

describe("direct scoping", () => {
  it("⚠ every model claiming a schoolId actually has one", () => {
    // A one-line RLS predicate against a column that is not there fails closed
    // in Postgres, but only when the policy is written — months later.
    const missing = DIRECT.filter((m) => !hasField(MODELS.get(m)!, "schoolId"));
    expect(missing, `Claim schoolId but do not have it: ${missing.join(", ")}`).toEqual([]);
  });
});

describe("scoping through a join", () => {
  it("⚠ each one still has the foreign key its policy would go through", () => {
    const broken: string[] = [];
    for (const [model, { fk }] of Object.entries(VIA_JOIN)) {
      if (!hasField(MODELS.get(model)!, fk)) broken.push(`${model}.${fk}`);
    }
    expect(broken, `Missing the key their RLS policy needs: ${broken.join(", ")}`).toEqual([]);
  });

  it("the parent it joins to is itself directly scoped", () => {
    // Otherwise the policy needs two joins, and nobody has written that down.
    for (const [model, { parent }] of Object.entries(VIA_JOIN)) {
      expect(DIRECT, `${model} joins to ${parent}, which is not directly scoped`).toContain(parent);
    }
  });

  it("would be simpler with a schoolId, and that is a real option", () => {
    // Denormalising schoolId onto these five is the one change that would make
    // every policy a one-liner. It is listed in Next steps; this test is here so
    // the list of five cannot quietly grow to eight in the meantime.
    expect(Object.keys(VIA_JOIN)).toHaveLength(5);
  });
});

describe("models with no tenant", () => {
  it("each has a stated reason, not just an absence", () => {
    for (const [model, reason] of Object.entries(NOT_TENANT_SCOPED)) {
      expect(reason.length, `${model} needs a reason`).toBeGreaterThan(20);
    }
  });

  it("⚠ none of them quietly grew a schoolId", () => {
    // If one does, it is probably tenant-scoped after all and its queries should
    // be going through the scoped layer.
    const surprising = Object.keys(NOT_TENANT_SCOPED).filter(
      (m) => m !== "School" && hasField(MODELS.get(m)!, "schoolId"),
    );
    expect(surprising, `Now carry schoolId — should these be scoped? ${surprising.join(", ")}`).toEqual([]);
  });
});
