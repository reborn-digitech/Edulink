/**
 * The owner's decision on TA-481 of the testing analysis of 13 November 2026.
 *
 * TA-481: the lab desk found a lab's stock and equipment by the room's name
 * as the stores had it typed, and renaming a room changed only the room, so
 * after a rename the lab showed empty on the desk (web and phone), the
 * pharmacy council return counted nothing there, and a breakage was refused
 * "below nothing" while the stock sat on under the old name. Now a rename
 * carries the stores with it in the same transaction: the stock under the old
 * name moves to the new one as paired recorded entries through the stores'
 * own writer (so the stock check still adds up), and each asset as a MOVED
 * event in its history; a rename onto a name that already holds stock or
 * assets is refused with a sentence in three languages; it is any room, not
 * only a lab; and the stores' place lists (web and phone read the same
 * setup) offer the college's room names.
 *
 * One ZZ college of this suite's own, made through the operator's
 * createSchool and removed after.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { labDeskSchema } from "@edulink/contracts";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { setDuties } from "@/lib/duties";
import { saveRoom } from "@/lib/academics";
import { labDesk, recordLabBreakage } from "@/lib/duty-desks";
import { actOnAsset, createAsset, inventorySetup, recordMovement } from "@/lib/inventory";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta-481-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;
const OLD = `ZZ 481 Lab ${STAMP}`;
const NEW = `ZZ 481 Lab ${STAMP} (CE)`;

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.A!, role: role as never });
  return (await getSession()) as ActiveContext;
}

async function person(who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ 481 ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.A!, role, status: "ACTIVE" }, select: { id: true } })).id;
}

const adjust = (ctx: ActiveContext, itemCode: string, quantity: number, location: string) =>
  recordMovement(ctx, { kind: "ADJUST", itemCode, quantity, location, toMembershipId: null, toRoom: "", toDepartment: "", reference: "", note: "ZZ" });

const asset = (ctx: ActiveContext, tagNumber: string, location: string) =>
  createAsset(ctx, { tagNumber, name: `ZZ ${tagNumber}`, itemCode: null, categoryId: null, purchaseDateKey: null, costPaise: 100_000, vendorId: null, warrantyUntilKey: null, location, custodianMembershipId: null, method: "NONE", depreciationRateBp: null, condition: "GOOD", note: "" });

/** The stock check of the data audit: every stock row equals the sum of its movements. */
async function stockAddsUp(): Promise<boolean> {
  const rows = await db.inventoryStock.findMany({ where: { schoolId: ids.A! }, select: { itemId: true, location: true, quantity: true } });
  for (const r of rows) {
    const sum = await db.stockMovement.aggregate({ where: { schoolId: ids.A!, itemId: r.itemId, location: r.location }, _sum: { delta: true } });
    if ((sum._sum.delta ?? 0) !== r.quantity) return false;
  }
  return true;
}

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ 481 Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", name: `ZZ 481 Engineering College ${STAMP}`, kind: "COLLEGE", streams: ["ENGINEERING"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.A = made.schoolId;
  await db.school.update({ where: { id: made.schoolId }, data: { isTestFixture: true } });
  await person("admin", "ADMIN");
  await person("lab", "FACULTY");
  await setDuties(await as("admin", "ADMIN"), ids.labM!, ["LAB_INCHARGE"]);
  ids.labRoom = (await db.room.create({ data: { schoolId: ids.A!, name: OLD, capacity: 30, kind: "LAB" }, select: { id: true } })).id;
  for (const [code, name] of [["ZZ-ARD", "ZZ Arduino board"], ["ZZ-BKR", "ZZ Beaker"], ["ZZ-CHK", "ZZ Chalk"]] as const) await db.inventoryItem.create({ data: { schoolId: ids.A!, code, name, unit: "piece" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  if (ids.A) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.A }, { targetId: ids.A }, { actorUserId: { in: userIds } }] } });
    await db.invite.deleteMany({ where: { schoolId: ids.A } });
    await db.school.deleteMany({ where: { id: ids.A } });
  }
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-481: a renamed room keeps what the stores hold there", () => {
  it("TA-481: a lab renamed carries its stock and equipment, the desk shows them and a breakage is written off", async () => {
    const admin = await as("admin", "ADMIN");
    await adjust(admin, "ZZ-ARD", 15, OLD);
    await adjust(admin, "ZZ-BKR", 4, OLD);
    await asset(admin, "ZZ-481-OSC", OLD);
    const gone = await asset(admin, "ZZ-481-OLD", OLD);
    await actOnAsset(admin, gone.tagNumber, { action: "DISPOSE", note: "" });

    await saveRoom(admin, { id: ids.labRoom!, name: NEW, capacity: 30, kind: "LAB" });

    const lab = await as("lab", "FACULTY");
    const desk = labDeskSchema.parse(await labDesk(lab));
    const mine = desk.labs.find((l) => l.roomId === ids.labRoom)!;
    expect(mine.name).toBe(NEW);
    expect(mine.stock.map((s) => [s.itemCode, s.quantity])).toEqual([["ZZ-ARD", 15], ["ZZ-BKR", 4]]);
    expect(mine.assets.map((a) => a.tagNumber)).toEqual(["ZZ-481-OSC"]);
    const broke = await recordLabBreakage(lab, { roomId: ids.labRoom!, itemCode: "ZZ-ARD", quantity: 2, note: "ZZ two boards" });
    expect(broke).toMatchObject({ kind: "WRITE_OFF", delta: -2, location: NEW });

    // Paired recorded entries through the one writer, never an edited row: out of the old name, into the new.
    const moves = await db.stockMovement.findMany({ where: { schoolId: ids.A!, reference: "ROOM_RENAME" }, orderBy: [{ at: "asc" }, { delta: "asc" }], select: { kind: true, delta: true, location: true, toRoom: true, item: { select: { code: true } } } });
    expect(moves.map((m) => [m.item.code, m.kind, m.delta, m.location]).sort()).toEqual(
      [["ZZ-ARD", "ADJUST", -15, OLD], ["ZZ-ARD", "ADJUST", 15, NEW], ["ZZ-BKR", "ADJUST", -4, OLD], ["ZZ-BKR", "ADJUST", 4, NEW]].sort(),
    );
    expect(moves.filter((m) => m.delta < 0).every((m) => m.toRoom === NEW)).toBe(true);
    expect(await db.inventoryStock.findMany({ where: { schoolId: ids.A!, location: OLD, quantity: { not: 0 } } })).toEqual([]);
    expect(await stockAddsUp()).toBe(true);

    // Each live asset moves with a MOVED event in its history; a disposed one stays where it was disposed of.
    const osc = await db.asset.findFirstOrThrow({ where: { schoolId: ids.A!, tagNumber: "ZZ-481-OSC" }, select: { id: true, location: true } });
    expect(osc.location).toBe(NEW);
    expect(await db.assetEvent.count({ where: { assetId: osc.id, kind: "MOVED" } })).toBe(1);
    expect((await db.asset.findFirstOrThrow({ where: { schoolId: ids.A!, tagNumber: "ZZ-481-OLD" }, select: { location: true } })).location).toBe(OLD);

    // The rename's audit row says how much went with it.
    const row = await db.auditLog.findFirstOrThrow({ where: { schoolId: ids.A!, action: "academics.room.save", targetId: ids.labRoom! }, orderBy: { createdAt: "desc" }, select: { meta: true } });
    expect(JSON.parse(row.meta)).toMatchObject({ name: NEW, stockMoved: 2, assetsMoved: 1 });
  });

  it("TA-481: a rename onto a name that already holds stock, or assets, is refused and nothing moves", async () => {
    const admin = await as("admin", "ADMIN");
    const store = `ZZ 481 Store ${STAMP}`;
    const shed = `ZZ 481 Shed ${STAMP}`;
    const room = (await db.room.create({ data: { schoolId: ids.A!, name: `ZZ 481 Room ${STAMP}`, capacity: 40, kind: "CLASSROOM" }, select: { id: true, name: true } }));
    await adjust(admin, "ZZ-CHK", 9, room.name);
    await adjust(admin, "ZZ-CHK", 3, store);
    await asset(admin, "ZZ-481-SHD", shed);
    const before = await db.stockMovement.count({ where: { schoolId: ids.A! } });

    await expect(saveRoom(admin, { id: room.id, name: store, capacity: 40, kind: "CLASSROOM" })).rejects.toMatchObject({ key: "inventory.refuseRenameOntoStock", status: 409 });
    await expect(saveRoom(admin, { id: room.id, name: shed, capacity: 40, kind: "CLASSROOM" })).rejects.toMatchObject({ key: "inventory.refuseRenameOntoStock", status: 409 });
    expect((await db.room.findUniqueOrThrow({ where: { id: room.id }, select: { name: true } })).name).toBe(room.name);
    expect(await db.stockMovement.count({ where: { schoolId: ids.A! } })).toBe(before);
    expect((await db.inventoryStock.findFirstOrThrow({ where: { schoolId: ids.A!, location: room.name } })).quantity).toBe(9);

    // The sentence, in all three languages.
    expect(en.inventory.refuseRenameOntoStock).toContain("{place}");
    expect(hi.inventory.refuseRenameOntoStock.endsWith("।")).toBe(true);
    expect(mr.inventory.refuseRenameOntoStock.endsWith(".")).toBe(true);
    expect(mr.inventory.refuseRenameOntoStock).not.toContain("स्कूल");
  });

  it("TA-481: any room carries, not only a lab, and a save that keeps the name moves nothing", async () => {
    const admin = await as("admin", "ADMIN");
    const room = (await db.room.create({ data: { schoolId: ids.A!, name: `ZZ 481 Seminar ${STAMP}`, capacity: 50, kind: "SEMINAR" }, select: { id: true, name: true } }));
    await asset(admin, "ZZ-481-PRJ", room.name);
    const before = await db.assetEvent.count({ where: { schoolId: ids.A!, kind: "MOVED" } });
    await saveRoom(admin, { id: room.id, name: room.name, capacity: 60, kind: "CLASSROOM" });
    expect(await db.assetEvent.count({ where: { schoolId: ids.A!, kind: "MOVED" } })).toBe(before);
    const renamed = `ZZ 481 Hall ${STAMP}`;
    await saveRoom(admin, { id: room.id, name: renamed, capacity: 60, kind: "CLASSROOM" });
    expect((await db.asset.findFirstOrThrow({ where: { schoolId: ids.A!, tagNumber: "ZZ-481-PRJ" }, select: { location: true } })).location).toBe(renamed);
    expect(await db.assetEvent.count({ where: { schoolId: ids.A!, kind: "MOVED" } })).toBe(before + 1);
  });

  it("TA-481: the stores' place list offers the college's room names, even where nothing is kept yet", async () => {
    const admin = await as("admin", "ADMIN");
    const empty = `ZZ 481 Empty Lab ${STAMP}`;
    await db.room.create({ data: { schoolId: ids.A!, name: empty, capacity: 20, kind: "LAB" } });
    const setup = await inventorySetup(admin);
    expect(setup.locations).toContain(empty);
    expect(setup.locations).toContain(NEW);
    expect(new Set(setup.locations).size).toBe(setup.locations.length);
  });
});
