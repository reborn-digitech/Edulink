/**
 * TA-041's schema part (the migration of 14 November 2026): PushSubscription gains the sign-in it was made
 * under, as DeviceToken has had since campaign PH-4.
 *
 * ONLY THE COLUMN, ITS RELATION AND ITS INDEX ARE HERE. The code that uses them (the sign-out step, sending only
 * to a registration whose sign-in is live, the browser re-linking for the same person, the settings switch) is a
 * batch of its own, built after this one, and TA-041 is closed only by that batch. These cases pin what the
 * database now does: a registration may name a session, it goes when that session's row goes, and a registration
 * made before the column (NULL) is neither removed nor changed.
 *
 * ZZ people of this suite's own, made through the owner connection and removed by id.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma, PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { user: "", sessionA: "", sessionB: "" };
const endpoint = (which: string) => `https://push.test.invalid/zz-tamig-push-${which}-${STAMP}`;
const session = (which: string) =>
  db.session.create({ data: { userId: ids.user, tokenHash: createHash("sha256").update(`zz-tamig-push-${which}-${STAMP}`).digest("hex"), userAgent: "zz-walk", expiresAt: new Date(Date.now() + 3_600_000) }, select: { id: true } });

beforeAll(async () => {
  ids.user = (await db.user.create({ data: { name: "ZZ TA Migration Push", email: `zz-tamig-push-${STAMP}@test.invalid`, prefs: "{}" }, select: { id: true } })).id;
  ids.sessionA = (await session("a")).id;
  ids.sessionB = (await session("b")).id;
}, 60_000);

afterAll(async () => {
  await db.pushSubscription.deleteMany({ where: { userId: ids.user } });
  await db.session.deleteMany({ where: { userId: ids.user } });
  await db.user.deleteMany({ where: { id: ids.user } });
  await db.$disconnect();
});

describe("TA-041 (schema part): a browser's push registration can name its sign-in", () => {
  it("TA-041: a registration made with no session keeps NULL, and one made under a session names it", async () => {
    const old = await db.pushSubscription.create({ data: { userId: ids.user, endpoint: endpoint("old"), p256dh: "zz", auth: "zz" }, select: { sessionId: true } });
    expect(old.sessionId).toBeNull();
    const linked = await db.pushSubscription.create({ data: { userId: ids.user, endpoint: endpoint("a"), p256dh: "zz", auth: "zz", sessionId: ids.sessionA }, select: { sessionId: true, session: { select: { userId: true } } } });
    expect(linked.sessionId).toBe(ids.sessionA);
    expect(linked.session?.userId).toBe(ids.user);
    await db.pushSubscription.create({ data: { userId: ids.user, endpoint: endpoint("b"), p256dh: "zz", auth: "zz", sessionId: ids.sessionB } });
    expect(await db.session.findUniqueOrThrow({ where: { id: ids.sessionA }, select: { pushSubscriptions: { select: { endpoint: true } } } })).toEqual({ pushSubscriptions: [{ endpoint: endpoint("a") }] });
  });

  it("TA-041: a registration goes with its session's row, and the others stay", async () => {
    await db.session.delete({ where: { id: ids.sessionA } });
    const left = await db.pushSubscription.findMany({ where: { userId: ids.user }, orderBy: { endpoint: "asc" }, select: { endpoint: true, sessionId: true } });
    expect(left).toEqual([
      { endpoint: endpoint("b"), sessionId: ids.sessionB },
      { endpoint: endpoint("old"), sessionId: null },
    ]);
  });

  it("TA-041: the column is optional, indexed, and shaped as the phone's token's is", async () => {
    const indexes = await db.$queryRaw<{ indexname: string }[]>`SELECT indexname FROM pg_indexes WHERE tablename = 'PushSubscription' AND indexdef LIKE '%("sessionId")%'`;
    expect(indexes.map((i) => i.indexname)).toEqual(["PushSubscription_sessionId_idx"]);
    const model = (name: string) => Prisma.dmmf.datamodel.models.find((m) => m.name === name)!;
    const field = (name: string) => model(name).fields.find((f) => f.name === "sessionId")!;
    expect({ required: field("PushSubscription").isRequired, type: field("PushSubscription").type }).toEqual({ required: field("DeviceToken").isRequired, type: field("DeviceToken").type });
    expect(field("PushSubscription").isRequired).toBe(false);
    const relation = (name: string) => model(name).fields.find((f) => f.name === "session")!;
    expect(relation("PushSubscription").relationOnDelete).toBe(relation("DeviceToken").relationOnDelete);
    expect(relation("PushSubscription").relationOnDelete).toBe("Cascade");
  });
});
