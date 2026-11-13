/**
 * TA-002, the answer that must not change with the account: the reset's new per-address walls count identifiers that
 * name nobody exactly as they count real ones, so the wall cannot be used to tell which exist, and a right code costs
 * nothing from them. The copied suite tests/ta-reset-code-limits.test.ts holds the spray across real accounts.
 *
 * Two ZZ accounts of this suite's own (its stamp is in each address) and two documentation addresses (RFC 5737
 * TEST-NET-3), one for asking and one for completing; the codes are read from the dev mailbox table, forced here.
 * Removed in afterAll: the accounts, their tokens, messages, audit rows and every counter keyed on them or on the two
 * addresses.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.EMAIL_TRANSPORT = "devbox";
});

import { PrismaClient } from "@prisma/client";
import { requestPasswordReset, resetPassword } from "@/lib/passwords";
import { LOGIN_PER_ADDRESS } from "@/lib/rate-limit";
import { __setHeaders } from "../tests/stubs/next-headers";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = `@zztahra-${STAMP}.test`;
const ASKING = "203.0.113.231";
const COMPLETING = "203.0.113.232";
const PASSWORD = "zz a brand new passphrase 7";
const real = (n: number) => `zz.real.${n}${SUFFIX}`;
const nobody = (n: number) => `zz.nobody.${n}${SUFFIX}`;
let userIds: string[] = [];

async function codeFor(email: string): Promise<string | null> {
  const message = await db.outboundEmail.findFirst({ where: { purpose: "PASSWORD_RESET", to: email }, orderBy: { createdAt: "desc" }, select: { text: true } });
  return message ? (/\b(\d{6})\b/.exec(message.text)?.[1] ?? null) : null;
}

beforeAll(async () => {
  __setHeaders({});
  await db.user.createMany({ data: [0, 1].map((n) => ({ email: real(n), name: `ZZ TAHRA reset ${n}`, prefs: "{}" })) });
  userIds = (await db.user.findMany({ where: { email: { endsWith: SUFFIX } }, select: { id: true } })).map((u) => u.id);
});

afterAll(async () => {
  __setHeaders({});
  await db.authToken.deleteMany({ where: { userId: { in: userIds } } });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.outboundEmail.deleteMany({ where: { to: { endsWith: SUFFIX } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
  await db.rateLimit.deleteMany({ where: { OR: [{ bucket: { contains: SUFFIX } }, { bucket: { contains: ASKING } }, { bucket: { contains: COMPLETING } }] } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-002: the reset's address walls answer alike whether or not the account exists", () => {
  it("TA-002: asks for identifiers naming nobody use up the address's asks, and the next ask for a real account is refused the same way", async () => {
    for (let n = 0; n < LOGIN_PER_ADDRESS.limit; n += 1) {
      expect((await requestPasswordReset(nobody(n), { caller: ASKING })).ok).toBe(true);
    }
    const refused = await requestPasswordReset(real(0), { caller: ASKING });
    expect(refused).toMatchObject({ ok: false, errorKey: "refusal.tooManyRetry" });
    expect(await codeFor(real(0))).toBeNull();
    // The same answer for one naming nobody.
    expect(await requestPasswordReset(nobody(99), { caller: ASKING })).toMatchObject({ ok: false, errorKey: "refusal.tooManyRetry" });
  });

  it("TA-002: a right code costs nothing from the address; wrong codes for nobody use it up, and then a right code is refused", async () => {
    expect((await requestPasswordReset(real(1), { caller: null })).ok).toBe(true);
    const code = await codeFor(real(1));
    expect(code).not.toBeNull();
    // A weak password with the right code: refused for the password, not counted as a guess.
    expect(await resetPassword(real(1), code!, "short", { caller: COMPLETING })).toMatchObject({ ok: false });
    expect(await db.rateLimit.findUnique({ where: { bucket: `reset-complete-addr:${COMPLETING}` } })).toBeNull();

    for (let n = 0; n < LOGIN_PER_ADDRESS.limit; n += 1) {
      expect(await resetPassword(nobody(n), "123456", PASSWORD, { caller: COMPLETING })).toEqual({ ok: false, errorKey: "refusal.codeWrong" });
    }
    const refused = await resetPassword(real(1), code!, PASSWORD, { caller: COMPLETING });
    expect(refused).toMatchObject({ ok: false, errorKey: "refusal.tooManyRetry" });
    expect((await db.user.findUniqueOrThrow({ where: { email: real(1) }, select: { passwordHash: true } })).passwordHash).toBeNull();
  });
});
