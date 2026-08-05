import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomBytes, createHash } from "node:crypto";
import { claimChild } from "@/app/join/actions";
import { CLAIM_ATTEMPTS, CLAIM_PER_CODE } from "@/lib/rate-limit";
import { SESSION_COOKIE } from "@/lib/constants";
import { __setCookie, __resetCookies } from "../tests/stubs/next-headers";

/**
 * ⚠ THE MOST SERIOUS LIMIT IN THIS APP, and the first test `claimChild` has
 * ever had.
 *
 * The form takes a student code and the child's date of birth. Its own comment
 * claimed it "cannot be used to brute-force a birthdate against a known-good
 * code" — true of DISTINGUISHABILITY, since every failure returns the same
 * message and does the same work, and false of RATE. A schoolchild's birthday
 * has a few thousand plausible values and there was no limit at all, so a
 * known-good code plus a loop bought somebody a GUARDIANSHIP over another
 * family's child: their attendance, marks, messages and record.
 *
 * It had no tests because it needs a live session and the `next/headers` stub
 * could not supply one. The stub's cookie jar is primeable now, which is what
 * lets the action be called the way a request calls it.
 */

const db = new PrismaClient();

const SUFFIX = "@zzclaim.test";
const made: string[] = [];
let schoolId: string;
let parentUserId: string;
let studentCode: string;

/** A real session row, and the cookie that names it. */
async function signIn(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await db.session.create({
    data: {
      userId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  });
  __setCookie(SESSION_COOKIE, token);
}

beforeEach(async () => {
  const school = await db.school.create({
    data: {
      name: "ZZ Claim School",
      slug: `zz-claim-${randomBytes(4).toString("hex")}`,
      code: `ZZC${randomBytes(3).toString("hex").toUpperCase()}`,
      contactEmail: `office${SUFFIX}`,
    },
  });
  schoolId = school.id;

  const child = await db.user.create({
    data: {
      email: `child.${randomBytes(3).toString("hex")}${SUFFIX}`,
      name: "Asha",
      prefs: "{}",
      birthdate: new Date(Date.UTC(2015, 3, 5)),
    },
  });
  made.push(child.id);
  studentCode = `STU-ZZ${randomBytes(3).toString("hex").toUpperCase()}`;
  await db.membership.create({
    data: { userId: child.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode },
  });

  const parent = await db.user.create({
    data: { email: `parent.${randomBytes(3).toString("hex")}${SUFFIX}`, name: "Guardian", prefs: "{}" },
  });
  made.push(parent.id);
  parentUserId = parent.id;
  await signIn(parent.id);
});

afterEach(async () => {
  __resetCookies();
  await db.rateLimit.deleteMany({ where: { bucket: { startsWith: "claim:" } } });
  await db.guardianship.deleteMany({ where: { parentUserId } });
  await db.session.deleteMany({ where: { userId: { in: made } } });
  await db.membership.deleteMany({ where: { schoolId } });
  await db.user.deleteMany({ where: { id: { in: made } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  made.length = 0;
});

afterAll(async () => {
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("claiming a child", () => {
  it("works with the right code and the right birthday", async () => {
    // The happy path first — otherwise every refusal below could be a fixture
    // that never worked, and a test that refuses for the wrong reason proves
    // nothing.
    const result = await claimChild({
      studentCode,
      birthdate: "2015-04-05",
      relation: "PARENT",
    });
    expect(result.ok, JSON.stringify(result.errors)).toBe(true);
    expect(result.child?.name).toBe("Asha");
  });

  it("refuses the right code with the wrong birthday", async () => {
    const result = await claimChild({
      studentCode,
      birthdate: "2015-04-06",
      relation: "PARENT",
    });
    expect(result.ok).toBe(false);
    expect(await db.guardianship.count({ where: { parentUserId } })).toBe(0);
  });

  it("⚠ stops a birthday search dead, per caller", async () => {
    /**
     * THE BUG. Without this, a loop over a few thousand plausible birthdays
     * against a known-good code makes somebody the guardian of a child they
     * have never met. The allowance is what turns that into weeks of audited
     * attempts.
     */
    let refusal: string | undefined;
    for (let i = 0; i < CLAIM_ATTEMPTS.limit + 1; i++) {
      // A different wrong birthday each time, as a search would use.
      const day = String(6 + (i % 20)).padStart(2, "0");
      const result = await claimChild({
        studentCode,
        birthdate: `2015-04-${day}`,
        relation: "PARENT",
      });
      const message = result.errors._form ?? "";
      if (/too many/i.test(message)) {
        refusal = message;
        break;
      }
    }
    expect(refusal, "the search must stop").toBeDefined();
    expect(refusal).toMatch(/try again/i);
    expect(await db.guardianship.count({ where: { parentUserId } })).toBe(0);
  });

  it("⚠ …and the RIGHT birthday is refused too once the allowance is gone", async () => {
    // A limit that lets a correct guess through after the wrong ones is not a
    // limit — it is exactly the last step of the search.
    for (let i = 0; i < CLAIM_ATTEMPTS.limit + 1; i++) {
      await claimChild({ studentCode, birthdate: "2015-04-06", relation: "PARENT" });
    }
    const result = await claimChild({
      studentCode,
      birthdate: "2015-04-05",
      relation: "PARENT",
    });
    expect(result.ok).toBe(false);
    expect(await db.guardianship.count({ where: { parentUserId } })).toBe(0);
  });

  it("⚠ a second account cannot pick the search up where the first left off", async () => {
    /**
     * WHY THERE ARE TWO BUCKETS. The per-caller limit makes grinding cost an
     * account; without a per-CODE limit, an attacker just makes more accounts
     * and the child is no better protected.
     */
    for (let i = 0; i < CLAIM_ATTEMPTS.limit; i++) {
      await claimChild({ studentCode, birthdate: "2015-04-06", relation: "PARENT" });
    }

    // A fresh account, a fresh caller allowance — and the code's own allowance
    // has been running down the whole time.
    let refusal: string | undefined;
    for (let account = 0; account < 5 && !refusal; account++) {
      const next = await db.user.create({
        data: { email: `more.${randomBytes(4).toString("hex")}${SUFFIX}`, name: "Another", prefs: "{}" },
      });
      made.push(next.id);
      await signIn(next.id);

      for (let i = 0; i < CLAIM_ATTEMPTS.limit; i++) {
        const result = await claimChild({
          studentCode,
          birthdate: "2015-04-07",
          relation: "PARENT",
        });
        const message = result.errors._form ?? "";
        if (/too many attempts for that code/i.test(message)) {
          refusal = message;
          break;
        }
      }
    }

    expect(
      refusal,
      `the code's own allowance (${CLAIM_PER_CODE.limit}) must run out however many accounts try`,
    ).toBeDefined();
  });
});
