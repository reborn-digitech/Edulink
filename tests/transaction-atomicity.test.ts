import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { forSchool } from "@/lib/tenant-context";

/**
 * ⚠ WHICH TRANSACTION HELPER IS ACTUALLY ATOMIC.
 *
 * `db` is extended so that every query is re-issued inside its own
 * `base.$transaction`, which is how `app.school_ids` gets bound for row-level
 * security (see db.ts). The consequence is easy to miss and was missed at five
 * call sites: a `db.$transaction` — array form or interactive callback — hands
 * its statements to an outer transaction they never join. The outer one holds
 * nothing, and a failure partway through leaves the earlier writes committed.
 *
 * WHY NOTHING CAUGHT IT. The rest of `npm test` has no session cookie, so the
 * tenant resolves empty, the extension short-circuits at
 * `if (schoolIds.length === 0 && !userId …) return query(args)`, and both broken
 * forms behave exactly like a healthy Prisma transaction. The bug existed only
 * in a real request — the same "holds in one execution context and not the
 * others" trap this codebase has now been caught by three times.
 *
 * THIS FILE CLOSES THAT GAP by binding a tenant explicitly with `forSchool`,
 * which is the same override `audit()` uses. That is the one thing the suite
 * could always have done and never did.
 *
 * `tenancy-shape.test.ts` greps for the call and is the guard that stops a sixth
 * site landing. This is the reason that guard exists — kept separate so that if
 * Prisma's semantics ever change, the justification is re-checked rather than
 * inherited.
 */

const db2 = new PrismaClient();

const CODE_A = "ZZZ-TXA-T";
const CODE_B = "ZZZ-TXB-T";
const UNTOUCHED = "ZZ Atomicity Probe";

let schoolId: string;
let probeId: string;

beforeAll(async () => {
  const school = await db2.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  schoolId = school.id;

  // Our own two rows, and nobody else's. One gets written to; the other exists
  // only so its join code is taken and can be collided with.
  const a = await db2.class.upsert({
    where: { joinCode: CODE_A },
    create: { schoolId, name: UNTOUCHED, joinCode: CODE_A },
    update: { name: UNTOUCHED },
  });
  probeId = a.id;
  await db2.class.upsert({
    where: { joinCode: CODE_B },
    create: { schoolId, name: "ZZ Atomicity Blocker", joinCode: CODE_B },
    update: {},
  });
});

afterAll(async () => {
  await db2.class.deleteMany({ where: { joinCode: { in: [CODE_A, CODE_B] } } });
  await db2.$disconnect();
});

async function probeName(): Promise<string> {
  const after = await db2.class.findUniqueOrThrow({ where: { id: probeId } });
  return after.name;
}

/**
 * Long enough that only a real rollback ever spends it.
 *
 * Measured rather than guessed: over 25 runs the orphaned write landed in a
 * median of 0ms and a maximum of 1ms. The cap is four orders of magnitude above
 * that because being generous is free — it is only ever paid IN FULL when the
 * rename never arrives, which is a red test either way.
 */
const ORPHAN_SETTLE_MS = 5_000;
const POLL_MS = 5;

/**
 * The name once a statement nobody awaited has had its chance to land.
 *
 * ⚠ WHY THIS WAITS AT ALL. Reading the row once, the instant `work()` rejected,
 * failed about one run in six — reporting the rename rolled back when moments
 * later it was permanently there.
 *
 * The array form is why. Each statement is re-issued in its OWN transaction by
 * the extension, so `$transaction([a, b])` rejects the moment b's transaction
 * fails while a's is still in flight on another connection. A rejected promise
 * says nothing about whether its sibling has finished. That is not a quirk of
 * this test: it is the same "they never join" defect the file documents,
 * surfacing one layer out.
 *
 * ⚠ A ROW LOCK IS NOT ENOUGH, WHICH IS WORTH KNOWING BEFORE REACHING FOR ONE.
 * `SELECT … FOR UPDATE` was the obvious fix and it only cut the rate to one in
 * twenty-five, because there are two windows and it closes one: it waits when
 * the orphan already HOLDS the row, and sails straight past while the orphan is
 * still doing the four `set_config` round-trips the extension issues before
 * every query — holding no lock yet, with nothing to wait on. Only time closes
 * that one, and once time closes it the lock has nothing left to do. Thirty
 * runs with the lock removed and the poll kept were green, so it is not here.
 *
 * Waiting does not weaken the assertion. An uncommitted write is invisible to
 * another connection under READ COMMITTED, so a genuinely atomic helper can
 * never flash `CHANGED` and then take it back — a poll that keeps seeing
 * `UNTOUCHED` for five seconds has seen a real rollback.
 */
async function nameAfterOrphan(): Promise<string> {
  const deadline = Date.now() + ORPHAN_SETTLE_MS;
  for (;;) {
    const name = await probeName();
    if (name !== UNTOUCHED || Date.now() >= deadline) return name;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

/**
 * Runs `work` with a tenant bound, expecting it to fail on its SECOND statement,
 * and reports whether the FIRST survived.
 *
 * The first statement renames our probe class; the second collides with a join
 * code that is already taken. Anything atomic rolls the rename back.
 *
 * `orphans` says whether this transaction FORM can leave a statement in flight
 * after its promise has rejected — a fact about the helper under test, not about
 * the answer expected. Only the array form can: it hands both statements out at
 * once and rejects on the first failure, whereas the interactive forms await
 * each in turn, so by the time they reject there is nothing still running.
 */
async function firstStatementSurvives(
  work: () => Promise<unknown>,
  opts: { orphans?: boolean } = {},
): Promise<boolean> {
  await db2.class.update({ where: { id: probeId }, data: { name: UNTOUCHED } });

  let threw = false;
  await forSchool(schoolId, async () => {
    try {
      await work();
    } catch {
      threw = true;
    }
  });
  // If the second statement did not fail, this test proves nothing at all.
  expect(threw).toBe(true);

  const after = opts.orphans ? await nameAfterOrphan() : await probeName();
  return after !== UNTOUCHED;
}

const RENAME = { where: { id: "" }, data: { name: "ZZ Atomicity CHANGED" } };
const COLLIDE = { data: { schoolId: "", name: "ZZ Atomicity Duplicate", joinCode: CODE_B } };

describe("⚠ db.$transaction is NOT atomic on the extended client", () => {
  it("the ARRAY form leaves the first statement committed", async () => {
    const survived = await firstStatementSurvives(
      () =>
        db.$transaction([
          db.class.update({ ...RENAME, where: { id: probeId } }),
          db.class.create({ data: { ...COLLIDE.data, schoolId } }),
        ]),
      // The only form that can still be writing after it has rejected.
      { orphans: true },
    );
    // ⚠ This is the bug, asserted rather than described. `cancelLeave` used
    // this form: a leave request cancelled while its cover still stood.
    expect(survived).toBe(true);
  });

  it("the INTERACTIVE form leaves the first statement committed too", async () => {
    const survived = await firstStatementSurvives(() =>
      db.$transaction(async (tx) => {
        await tx.class.update({ ...RENAME, where: { id: probeId } });
        await tx.class.create({ data: { ...COLLIDE.data, schoolId } });
      }),
    );
    // The half the original report missed. `two-factor.ts` used this form, for
    // delete-then-recreate of recovery codes — a second factor with no way past
    // it if the second half never lands.
    expect(survived).toBe(true);
  });
});

describe("⚠ $tenantTransaction IS atomic", () => {
  it("rolls the first statement back when the second fails", async () => {
    const survived = await firstStatementSurvives(() =>
      db.$tenantTransaction(async (txUnknown: unknown) => {
        const tx = txUnknown as {
          class: {
            update(args: unknown): Promise<unknown>;
            create(args: unknown): Promise<unknown>;
          };
        };
        await tx.class.update({ ...RENAME, where: { id: probeId } });
        await tx.class.create({ data: { ...COLLIDE.data, schoolId } });
      }),
    );
    // The whole point of the fix, and the assertion that would go red if the
    // extension's transaction handling ever regressed.
    expect(survived).toBe(false);
  });

  it("commits both when neither fails", async () => {
    // An atomic helper that rolled everything back would also pass the test
    // above. This is the other half.
    await forSchool(schoolId, () =>
      db.$tenantTransaction(async (txUnknown: unknown) => {
        const tx = txUnknown as { class: { update(args: unknown): Promise<unknown> } };
        await tx.class.update({
          where: { id: probeId },
          data: { name: "ZZ Atomicity COMMITTED" },
        });
      }),
    );

    const after = await db2.class.findUniqueOrThrow({ where: { id: probeId } });
    expect(after.name).toBe("ZZ Atomicity COMMITTED");
    await db2.class.update({ where: { id: probeId }, data: { name: UNTOUCHED } });
  });
});
