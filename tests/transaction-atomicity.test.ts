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

/**
 * Runs `work` with a tenant bound, expecting it to fail on its SECOND statement,
 * and reports whether the FIRST survived.
 *
 * The first statement renames our probe class; the second collides with a join
 * code that is already taken. Anything atomic rolls the rename back.
 */
async function firstStatementSurvives(work: () => Promise<unknown>): Promise<boolean> {
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

  const after = await db2.class.findUniqueOrThrow({ where: { id: probeId } });
  return after.name !== UNTOUCHED;
}

const RENAME = { where: { id: "" }, data: { name: "ZZ Atomicity CHANGED" } };
const COLLIDE = { data: { schoolId: "", name: "ZZ Atomicity Duplicate", joinCode: CODE_B } };

describe("⚠ db.$transaction is NOT atomic on the extended client", () => {
  it("the ARRAY form leaves the first statement committed", async () => {
    const survived = await firstStatementSurvives(() =>
      db.$transaction([
        db.class.update({ ...RENAME, where: { id: probeId } }),
        db.class.create({ data: { ...COLLIDE.data, schoolId } }),
      ]),
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
