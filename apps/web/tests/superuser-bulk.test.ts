import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { deleteSchoolsEntirely, removeSchools, restoreSchool } from "@/lib/superuser";
import type { ActiveContext } from "@/lib/session";

/**
 * Several schools through the operator's two doors at once. Each goes
 * through the single door it would have gone through alone, so the promises
 * of removal (reversible, accounts kept) and erasure (the shredder) hold per
 * school; the bulk gate is the count, typed.
 */
const db = new PrismaClient();
const STAMP = Date.now();
let operatorId = "";
let ordinaryId = "";
let ids: string[] = [];

function ctx(userId: string, isSuperuser: boolean): ActiveContext {
  return {
    sessionId: "test", membershipId: null, schoolId: null, role: null,
    user: { id: userId, name: "Op", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser, isAppAdmin: false },
  } as ActiveContext;
}

beforeAll(async () => {
  operatorId = (await db.user.create({ data: { name: "ZZ Bulk Operator", email: `zz-bulk-op-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } })).id;
  ordinaryId = (await db.user.create({ data: { name: "ZZ Bulk Nobody", email: `zz-bulk-nobody-${STAMP}@test.invalid` }, select: { id: true } })).id;
  for (const n of [1, 2, 3]) {
    const s = await db.school.create({
      data: { name: `ZZ Bulk School ${n} ${STAMP}`, slug: `zz-bulk-${n}-${STAMP}`, code: `ZB${n}${String(STAMP).slice(-5)}`, contactEmail: `zz-bulk-${n}-${STAMP}@test.invalid` },
      select: { id: true },
    });
    ids.push(s.id);
  }
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: [operatorId, ordinaryId] } } });
  await db.$disconnect();
});

describe("bulk removal", () => {
  it("refuses an ordinary account", async () => {
    await expect(removeSchools(ctx(ordinaryId, false), ids)).rejects.toBeInstanceOf(AccessError);
  });

  it("removes each, reports one already removed, and each can come back", async () => {
    const first = await removeSchools(ctx(operatorId, true), ids.slice(0, 2));
    expect(first).toEqual({ done: 2, failed: [] });
    const again = await removeSchools(ctx(operatorId, true), [ids[0]!, ids[2]!, "no-such-school"]);
    expect(again.done).toBe(1);
    expect(again.failed.map((f) => f.errorKey).sort()).toEqual(["root.noSuchSchool", "root.schoolWasRemoved"]);
    expect((await db.school.findMany({ where: { id: { in: ids } }, select: { removedAt: true } })).every((s) => s.removedAt !== null)).toBe(true);
    for (const id of ids) expect((await restoreSchool(ctx(operatorId, true), id)).ok).toBe(true);
  });
});

describe("bulk erasure", () => {
  it("is gated on the typed count, and then shreds every one", async () => {
    const wrong = await deleteSchoolsEntirely(ctx(operatorId, true), ids, "DELETE 2");
    expect(wrong).toMatchObject({ ok: false, errorKey: "root.bulkDeleteMismatch", done: 0 });
    expect(await db.school.count({ where: { id: { in: ids } } })).toBe(3);
    const right = await deleteSchoolsEntirely(ctx(operatorId, true), [...ids, "no-such-school"], "delete 4");
    expect(right.done).toBe(3);
    expect(right.failed).toEqual([{ id: "no-such-school", name: null, errorKey: "root.noSuchSchool" }]);
    expect(await db.school.count({ where: { id: { in: ids } } })).toBe(0);
    ids = [];
  });
});
