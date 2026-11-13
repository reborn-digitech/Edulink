/**
 * Reset-code limits: finding TA-002 of the testing analysis of 13 November 2026,
 * held by cases that FAIL while the defect stands and pass once it is fixed.
 *
 *   TA-002  Password-reset codes can be guessed across many accounts at once:
 *           asking for a code is limited only by the identifier typed
 *           (`reset:<identifier>`, three a quarter-hour) and completing one only
 *           by the identifier (`reset-complete:<identity>`, ten) and the token's
 *           five guesses. Nothing counts by the caller's address or across the
 *           service, as the password check does (`login-addr:<caller>` fifty,
 *           `login-global` two thousand; src/lib/auth-login.ts), so the number
 *           of guesses grows with the number of accounts tried
 *           (src/lib/passwords.ts requestPasswordReset and resetPassword).
 *
 * WHAT IS RUN. One address asks for a code and completes with a wrong one for
 * sixty different accounts, one after the other, then asks for and reads the
 * RIGHT code of a sixty-first. With a ceiling by address in place the spray
 * meets a "too many, try later" somewhere in those rounds and the sixty-first
 * account keeps its password; today every round is an ordinary wrong code and
 * the sixty-first password is set. A second case does twelve rounds from twelve
 * addresses and looks for a count that belongs to no one account and no one
 * address.
 *
 * The caller is given both ways a fix could read it: on the request (the
 * X-Forwarded-For the stand-in headers carry, what `callerKey()` reads) and as
 * an explicit `{ caller }` argument in the style of `signInWithPassword`.
 *
 * Seventy-three ZZ accounts of this suite's own (its stamp is in each address),
 * no school; the codes are read from the dev mailbox table, which is forced
 * here so nothing can leave the machine. Removed in afterAll: the accounts,
 * their tokens, messages, audit rows and every counter keyed on them or on this
 * suite's two documentation address ranges.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.EMAIL_TRANSPORT = "devbox";
});

import { PrismaClient } from "@prisma/client";
import { requestPasswordReset, resetPassword } from "@/lib/passwords";
import { __setHeaders } from "../tests/stubs/next-headers";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = `@zzta002-${STAMP}.test`;
const mail = (n: number) => `zz.spray.${n}${SUFFIX}`;
const SPRAY = 60;
const MANY = 12;
/** TEST-NET-3 and TEST-NET-2 (RFC 5737): nobody's addresses. */
const ADDRESS = "203.0.113.214";
const otherAddress = (n: number) => `198.51.100.${n + 1}`;
const NEW_PASSWORD = "zz a brand new passphrase 9";

type Answer = { ok: boolean; errorKey?: string };
const ask = requestPasswordReset as unknown as (identifier: string, opts?: { caller?: string | null }) => Promise<Answer>;
const complete = resetPassword as unknown as (identifier: string, code: string, password: string, opts?: { caller?: string | null }) => Promise<Answer>;

const calling = (address: string) => __setHeaders({ "x-forwarded-for": address });

/** The newest code sent to an address, as a developer reads it: out of the dev mailbox. */
async function codeFor(email: string): Promise<string | null> {
  const message = await db.outboundEmail.findFirst({ where: { purpose: "PASSWORD_RESET", to: email }, orderBy: { createdAt: "desc" }, select: { text: true } });
  return message ? (/\b(\d{6})\b/.exec(message.text)?.[1] ?? null) : null;
}

/** One round of the spray: ask, read the code, complete with a different one. */
async function wrongRound(email: string, address: string): Promise<{ asked: Answer; sent: boolean; completed: Answer }> {
  calling(address);
  const asked = await ask(email, { caller: address });
  const code = await codeFor(email);
  const wrong = code ? String((Number(code) + 1) % 1_000_000).padStart(6, "0") : "000000";
  const completed = await complete(email, wrong, NEW_PASSWORD, { caller: address });
  return { asked, sent: code !== null, completed };
}

const RATE = "refusal.tooManyRetry";
const tally = (keys: (string | undefined)[]) => keys.reduce<Record<string, number>>((acc, key) => ({ ...acc, [key ?? "ok"]: (acc[key ?? "ok"] ?? 0) + 1 }), {});

let userIds: string[] = [];
const rounds: Awaited<ReturnType<typeof wrongRound>>[] = [];
let target: { asked: Answer; code: string | null; completed: Answer; passwordSet: boolean };
let movedGlobally: { bucket: string; grew: number }[] = [];
const manyRounds: Awaited<ReturnType<typeof wrongRound>>[] = [];

beforeAll(async () => {
  await db.user.createMany({ data: Array.from({ length: SPRAY + 1 + MANY }, (_, n) => ({ email: mail(n), name: `ZZ TA002 ${n}`, prefs: "{}" })) });
  userIds = (await db.user.findMany({ where: { email: { endsWith: SUFFIX } }, select: { id: true } })).map((u) => u.id);

  // Sixty accounts, one address: ask, then a wrong code, sixty times over.
  for (let n = 0; n < SPRAY; n += 1) rounds.push(await wrongRound(mail(n), ADDRESS));

  // The sixty-first account, the same address, the same quarter-hour: this time the code is the right one.
  calling(ADDRESS);
  const asked = await ask(mail(SPRAY), { caller: ADDRESS });
  const code = await codeFor(mail(SPRAY));
  const completed = code ? await complete(mail(SPRAY), code, NEW_PASSWORD, { caller: ADDRESS }) : { ok: false, errorKey: "(no code was sent)" };
  const after = await db.user.findUniqueOrThrow({ where: { email: mail(SPRAY) }, select: { passwordHash: true } });
  target = { asked, code, completed, passwordSet: after.passwordHash !== null };

  // Twelve more accounts, each from an address of its own: what counts them all together?
  const mine = (bucket: string) => bucket.includes(SUFFIX) || bucket.includes("198.51.100.") || bucket.includes(ADDRESS);
  const counts = async () => new Map((await db.rateLimit.findMany({ select: { bucket: true, hits: true } })).map((r) => [r.bucket, r.hits]));
  const before = await counts();
  for (let n = 0; n < MANY; n += 1) manyRounds.push(await wrongRound(mail(SPRAY + 1 + n), otherAddress(n)));
  const afterCounts = await counts();
  movedGlobally = [...afterCounts].filter(([bucket, hits]) => !mine(bucket) && hits - (before.get(bucket) ?? 0) >= MANY).map(([bucket, hits]) => ({ bucket, grew: hits - (before.get(bucket) ?? 0) }));
}, 120_000);

afterAll(async () => {
  __setHeaders({});
  await db.authToken.deleteMany({ where: { userId: { in: userIds } } });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.outboundEmail.deleteMany({ where: { to: { endsWith: SUFFIX } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: userIds } } });
  await db.rateLimit.deleteMany({ where: { OR: [{ bucket: { contains: SUFFIX } }, { bucket: { contains: ADDRESS } }, { bucket: { contains: "198.51.100." } }] } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-002: a reset-code spray across many accounts meets a limit that is not the account's own", () => {
  it("arrange: the first rounds are ordinary — a code is sent, a wrong one is refused as a wrong code", () => {
    expect(userIds).toHaveLength(SPRAY + 1 + MANY);
    expect(rounds.slice(0, 5).map((r) => [r.asked.ok, r.sent, r.completed.ok, r.completed.errorKey])).toEqual(Array.from({ length: 5 }, () => [true, true, false, "refusal.codeWrong"]));
  });

  it("⚠ sixty rounds for sixty different accounts from one address are stopped somewhere by a rate refusal", () => {
    const stopped = rounds.filter((r) => r.asked.errorKey === RATE || r.completed.errorKey === RATE).length;
    expect(stopped, `asking answered ${JSON.stringify(tally(rounds.map((r) => r.asked.errorKey)))}, completing answered ${JSON.stringify(tally(rounds.map((r) => r.completed.errorKey)))}`).toBeGreaterThan(0);
  });

  it("⚠ the right code for a sixty-first account, from that address in the same window, sets no password", () => {
    const said = `asked ${JSON.stringify(target.asked)}, code ${target.code ? "read from the mailbox" : "not sent"}, completion ${JSON.stringify(target.completed)}`;
    expect({ completed: target.completed.ok, passwordSet: target.passwordSet }, said).toEqual({ completed: false, passwordSet: false });
  });

  it("⚠ failed completions from twelve addresses move a count that belongs to no one account and no one address", () => {
    const said = `the twelve rounds answered ${JSON.stringify(tally(manyRounds.map((r) => r.completed.errorKey)))}; counters that grew by twelve or more and are not this suite's accounts or addresses`;
    expect(movedGlobally.map((m) => m.bucket), said).not.toEqual([]);
  });
});
