import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { spendTickets } from "@/lib/api-reads/teaching";
import { AccessError } from "@/lib/tenancy";

/**
 * An upload ticket is spent ONCE, under concurrency.
 *
 * `ticketedHandouts` checks the ticket is unspent and `spendTickets` stamps
 * it; between the two, a second request that passed the same check could
 * stamp it again and attach the same file to a record of its own. The stamp
 * is now conditional on the row still being unspent, so of two concurrent
 * spends exactly one succeeds and the other is refused — the property the
 * phone's retry and a double-submitted form both depend on.
 */

const db = new PrismaClient();
const EMAIL = "zz.tickets@zztickets.test";
let userId: string;

beforeAll(async () => {
  await db.user.deleteMany({ where: { email: EMAIL } });
  userId = (await db.user.create({ data: { email: EMAIL, name: "ZZ Tickets", prefs: "{}" }, select: { id: true } })).id;
});

afterAll(async () => {
  // Tickets cascade with the user.
  await db.user.deleteMany({ where: { email: EMAIL } });
  await db.$disconnect();
});

async function ticket(): Promise<string> {
  const fileId = `zz-ticket-${randomUUID()}`;
  await db.uploadTicket.create({ data: { userId, fileId, mime: "image/png", size: 10 } });
  return fileId;
}

describe("spendTickets", () => {
  it("⚠ two concurrent spends of one ticket: one succeeds, one is refused, the ticket is stamped once", async () => {
    const fileId = await ticket();
    const outcomes = await Promise.allSettled([spendTickets([fileId]), spendTickets([fileId])]);
    const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
    const rejected = outcomes.filter((o): o is PromiseRejectedResult => o.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]!.reason).toBeInstanceOf(AccessError);
    expect((rejected[0]!.reason as AccessError).key).toBe("access.fileNotYours");
    expect((await db.uploadTicket.findUniqueOrThrow({ where: { fileId } })).consumedAt).not.toBeNull();
  });

  it("refuses a ticket already spent, and a batch that names one", async () => {
    const spent = await ticket();
    const fresh = await ticket();
    await spendTickets([spent]);
    await expect(spendTickets([spent])).rejects.toBeInstanceOf(AccessError);
    // A batch is refused whole when one of its tickets is short.
    await expect(spendTickets([fresh, spent])).rejects.toBeInstanceOf(AccessError);
  });

  it("counts a file named twice as one ticket, and nothing as nothing", async () => {
    const fileId = await ticket();
    await expect(spendTickets([fileId, fileId])).resolves.toBeUndefined();
    await expect(spendTickets([])).resolves.toBeUndefined();
  });
});
