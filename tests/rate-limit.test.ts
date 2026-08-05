import { afterAll, afterEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { consume, retryHint } from "@/lib/rate-limit";

/**
 * The limiter, and the two properties that make it worth having.
 *
 * IT ACTUALLY STOPS AT THE LIMIT, and it keeps stopping. A limiter that lets one
 * through every N attempts once the window is full is not a limit, it is a
 * speed bump — and the thing being limited here sends a text message to a phone
 * number somebody else owns.
 *
 * IT FAILS OPEN. Stated as a test rather than as a comment, because it is the
 * uncomfortable half of the design: a limiter outage must not become an
 * authentication outage that locks every family out of every account.
 */

const db = new PrismaClient();

const PREFIX = "zz-test:";
let n = 0;
/** A bucket nobody else is using, so parallel suites cannot collide. */
function bucket(): string {
  return `${PREFIX}${process.pid}:${n++}:${Math.random().toString(36).slice(2)}`;
}

afterEach(async () => {
  await db.rateLimit.deleteMany({ where: { bucket: { startsWith: PREFIX } } });
});

afterAll(async () => {
  await db.$disconnect();
});

describe("counting attempts", () => {
  it("allows up to the limit and refuses the one after", async () => {
    const key = bucket();
    for (let i = 1; i <= 3; i++) {
      const result = await consume(key, 3, 60_000);
      expect(result.allowed, `attempt ${i}`).toBe(true);
    }
    const fourth = await consume(key, 3, 60_000);
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("counts down what is left", async () => {
    const key = bucket();
    expect((await consume(key, 3, 60_000)).remaining).toBe(2);
    expect((await consume(key, 3, 60_000)).remaining).toBe(1);
    expect((await consume(key, 3, 60_000)).remaining).toBe(0);
  });

  it("⚠ keeps refusing — a refused attempt still counts", async () => {
    /**
     * THE BUG A NAIVE LIMITER HAS. If refused attempts do not increment, the
     * count sits at the limit forever and every subsequent call compares equal
     * rather than greater — letting a script through at a steady trickle
     * instead of stopping it.
     */
    const key = bucket();
    for (let i = 0; i < 3; i++) await consume(key, 3, 60_000);
    for (let i = 0; i < 10; i++) {
      expect((await consume(key, 3, 60_000)).allowed, `hammering, call ${i}`).toBe(false);
    }
    const row = await db.rateLimit.findUniqueOrThrow({ where: { bucket: key } });
    expect(row.hits).toBe(13);
  });

  it("⚠ buckets do not share a counter", async () => {
    // A failed login must not consume somebody's reset allowance — invisible
    // until the day it matters.
    const a = bucket();
    const b = bucket();
    for (let i = 0; i < 3; i++) await consume(a, 3, 60_000);
    expect((await consume(a, 3, 60_000)).allowed).toBe(false);
    expect((await consume(b, 3, 60_000)).allowed).toBe(true);
  });

  it("⚠ a new window forgives, and resets the count rather than adding to it", async () => {
    const key = bucket();
    for (let i = 0; i < 3; i++) await consume(key, 3, 60_000);
    expect((await consume(key, 3, 60_000)).allowed).toBe(false);

    // Wind the window back rather than sleeping through it.
    await db.rateLimit.update({
      where: { bucket: key },
      data: { windowEndsAt: new Date(Date.now() - 1000) },
    });

    const after = await consume(key, 3, 60_000);
    expect(after.allowed).toBe(true);
    // Reset to 1, not carried over — otherwise the very next call refuses again.
    expect(after.remaining).toBe(2);
    const row = await db.rateLimit.findUniqueOrThrow({ where: { bucket: key } });
    expect(row.hits).toBe(1);
  });

  it("a limit of one allows exactly one", async () => {
    const key = bucket();
    expect((await consume(key, 1, 60_000)).allowed).toBe(true);
    expect((await consume(key, 1, 60_000)).allowed).toBe(false);
  });

  it("reports a retry time inside the window it was given", async () => {
    const key = bucket();
    await consume(key, 1, 60_000);
    const refused = await consume(key, 1, 60_000);
    expect(refused.retryAfterSeconds).toBeGreaterThan(0);
    expect(refused.retryAfterSeconds).toBeLessThanOrEqual(60);
  });
});

describe("⚠ failing open", () => {
  it("allows the attempt when the counter cannot be read", async () => {
    /**
     * THE UNCOMFORTABLE HALF OF THE DESIGN, asserted rather than described.
     * If the database is unreachable, every login and every reset would throw —
     * a degraded database becomes a total outage and every family is locked out
     * of every account. The threat being defended against is somebody sending a
     * stranger texts, which is not worth trading a whole-service outage for.
     *
     * THE FIRST VERSION OF THIS TEST PROVED NOTHING. It used a 20,000-character
     * bucket, assuming the column would refuse it — Postgres `text` has no
     * length limit, the row inserted happily, and `allowed: true` was the
     * ORDINARY answer rather than the fail-open one. Passing for the wrong
     * reason is indistinguishable from passing.
     *
     * So the failure is made real: the delegate itself is replaced with one
     * that throws, which is what an unreachable database looks like from here.
     */
    const failing = { findUnique: () => Promise.reject(new Error("db is down")) };
    const original = Reflect.get(db as object, "rateLimit");

    // Patched on the module's own client, which is what `consume` uses.
    const { db: liveDb } = await import("@/lib/db");
    const realDelegate = Reflect.get(liveDb as object, "rateLimit");
    Object.defineProperty(liveDb, "rateLimit", { value: failing, configurable: true });

    try {
      const result = await consume(bucket(), 1, 60_000);
      expect(result.allowed, "a limiter outage must not be a login outage").toBe(true);
      expect(result.retryAfterSeconds).toBe(0);
    } finally {
      Object.defineProperty(liveDb, "rateLimit", { value: realDelegate, configurable: true });
    }
    expect(original).toBeDefined();
  });
});

describe("telling somebody when to come back", () => {
  it("rounds up, so a second refusal is not earned", () => {
    expect(retryHint(1)).toBe("in a minute");
    expect(retryHint(60)).toBe("in a minute");
    expect(retryHint(61)).toBe("in about 2 minutes");
    expect(retryHint(290)).toBe("in about 5 minutes");
    expect(retryHint(3540)).toBe("in about 59 minutes");
    // Exactly an hour rolls over rather than saying "60 minutes".
    expect(retryHint(3600)).toBe("in about 1 hour");
    expect(retryHint(7200)).toBe("in about 2 hours");
  });
});
