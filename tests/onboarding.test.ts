import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { lookupCode } from "@/app/join/actions";
import { sameCalendarDay, parseDateOnly } from "@/lib/dates";
import { normalizeCode } from "@/lib/codes";

/**
 * Join-flow entry points.
 *
 * `lookupCode` is the only unauthenticated endpoint that takes a guessable
 * string and answers questions about a real school, so its failure behaviour
 * matters as much as its success behaviour.
 */

const db = new PrismaClient();

let schoolCode: string;
let classJoinCode: string;
let archivedClassCode: string;
let oakfieldCode: string;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });
  schoolCode = riverside.code;
  oakfieldCode = oakfield.code;

  const klass = await db.class.findFirstOrThrow({
    where: { schoolId: riverside.id, archivedAt: null },
    orderBy: { name: "asc" },
  });
  classJoinCode = klass.joinCode;

  // A throwaway archived class, to prove an archived code stops working.
  const archived = await db.class.create({
    data: {
      schoolId: riverside.id,
      name: "ZZ Test Archived",
      joinCode: "ZZZ-TEST",
      archivedAt: new Date(),
    },
  });
  archivedClassCode = archived.joinCode;
});

afterAll(async () => {
  await db.class.deleteMany({ where: { name: "ZZ Test Archived" } });
  await db.$disconnect();
});

describe("lookupCode", () => {
  it("resolves a class code to its class AND school", async () => {
    const result = await lookupCode(classJoinCode);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.kind).toBe("class");
    expect(result.schoolName).toBe("Riverside Primary School");
  });

  it("resolves a school code", async () => {
    const result = await lookupCode(schoolCode);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.kind).toBe("school");
    expect(result.schoolName).toBe("Riverside Primary School");
  });

  it("is case- and whitespace-insensitive, because children retype codes badly", async () => {
    const variants = [
      classJoinCode.toLowerCase(),
      ` ${classJoinCode} `,
      classJoinCode.replace(/-/g, " - "),
    ];
    for (const variant of variants) {
      const result = await lookupCode(variant);
      expect(result.ok, `variant ${JSON.stringify(variant)}`).toBe(true);
    }
  });

  it("does NOT resolve a hyphen-stripped code, so codes stay exact", async () => {
    // normalizeCode strips whitespace but not hyphens — the hyphen is part of
    // the code, and accepting it optionally would widen the guess space.
    const stripped = classJoinCode.replace(/-/g, "");
    expect(normalizeCode(stripped)).toBe(stripped);
    const result = await lookupCode(stripped);
    expect(result.ok).toBe(false);
  });

  it("refuses an archived class code", async () => {
    const result = await lookupCode(archivedClassCode);
    expect(result.ok).toBe(false);
  });

  it("refuses garbage, empty and oversized input rather than throwing", async () => {
    for (const bad of ["", "  ", "AB", "!!!!", "x".repeat(500), "'; DROP TABLE School;--"]) {
      const result = await lookupCode(bad);
      expect(result.ok, `input ${JSON.stringify(bad.slice(0, 20))}`).toBe(false);
    }
  });

  it("gives the SAME message for a wrong code as for a well-formed unknown one", async () => {
    // No hint about whether a code merely does not exist vs is malformed, past
    // the length checks — otherwise the endpoint helps enumerate real schools.
    const a = await lookupCode("ZZZZZ-9999");
    const b = await lookupCode("QQQ-8888");
    expect(a.ok).toBe(false);
    expect(b.ok).toBe(false);
    if (a.ok || b.ok) return;
    expect(a.error).toBe(b.error);
  });

  it("keeps the two seeded schools distinct", async () => {
    const riverside = await lookupCode(schoolCode);
    const oakfield = await lookupCode(oakfieldCode);
    expect(riverside.ok && oakfield.ok).toBe(true);
    if (!riverside.ok || !oakfield.ok) return;
    expect(riverside.schoolId).not.toBe(oakfield.schoolId);
    expect(oakfield.schoolName).toBe("Oakfield Academy");
  });
});

describe("sameCalendarDay — the parent claim's second factor", () => {
  it("matches a stored UTC-midnight birthdate against a typed date", () => {
    expect(sameCalendarDay(parseDateOnly("2016-04-11"), parseDateOnly("2016-04-11"))).toBe(true);
  });

  it("rejects a date one day out", () => {
    expect(sameCalendarDay(parseDateOnly("2016-04-11"), parseDateOnly("2016-04-12"))).toBe(false);
    expect(sameCalendarDay(parseDateOnly("2016-04-11"), parseDateOnly("2016-04-10"))).toBe(false);
  });

  it("rejects the same day in a different month or year", () => {
    expect(sameCalendarDay(parseDateOnly("2016-04-11"), parseDateOnly("2016-05-11"))).toBe(false);
    expect(sameCalendarDay(parseDateOnly("2016-04-11"), parseDateOnly("2015-04-11"))).toBe(false);
  });

  it("still matches when the stored value carries a time component", () => {
    // The case that would silently lock every parent out if this compared
    // timestamps: an import or migration writing 09:30 instead of midnight.
    const storedWithTime = new Date("2016-04-11T09:30:00.000Z");
    expect(sameCalendarDay(storedWithTime, parseDateOnly("2016-04-11"))).toBe(true);
  });

  it("is false for null, undefined and Invalid Date rather than throwing", () => {
    expect(sameCalendarDay(null, parseDateOnly("2016-04-11"))).toBe(false);
    expect(sameCalendarDay(parseDateOnly("2016-04-11"), null)).toBe(false);
    expect(sameCalendarDay(undefined, undefined)).toBe(false);
    expect(sameCalendarDay(new Date("nonsense"), parseDateOnly("2016-04-11"))).toBe(false);
  });

  it("does not treat two invalid dates as equal", () => {
    expect(sameCalendarDay(new Date("nonsense"), new Date("nonsense"))).toBe(false);
  });
});

describe("student login handles", () => {
  it("gives every self-joined student a unique, routable-looking login", async () => {
    const students = await db.user.findMany({
      where: { email: { endsWith: "@edulink.local" } },
      select: { email: true },
    });
    const emails = students.map((s) => s.email);
    expect(new Set(emails).size).toBe(emails.length);
    for (const email of emails) {
      // handle.xxxx@edulink.local — lowercase, no spaces, typeable by a child.
      expect(email).toMatch(/^[a-z0-9]+\.[a-z0-9]{4}@edulink\.local$/);
    }
  });
});
