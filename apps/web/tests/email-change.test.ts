import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { startEmailChange, confirmEmailChange, findAccount } from "@/lib/passwords";
import { EMAIL_CHANGE_REQUESTS } from "@/lib/rate-limit";
import { HANDLE_DOMAIN } from "@/lib/login-name";
import { hashPassword } from "@/lib/crypto";

/** Every account this file makes has it: moving the address costs the current password. */
const PASSWORD = "correct horse battery";

/**
 * Changing the address an account signs in with.
 *
 * ⚠ THERE WAS NO WAY TO DO THIS AT ALL until this feature. An address arrived at
 * account creation and was permanent, so a family that changed email provider
 * held an account whose password reset went somewhere they could not read.
 *
 * WHAT THESE TESTS ARE REALLY FOR is the pair of properties that make the change
 * safe rather than merely possible: nothing moves before the code comes back,
 * and the ADDRESS BEING LEFT is told once it has. The second is the one nobody
 * asks for and the one that matters — an attacker with a live session can
 * otherwise point an account's recovery at themselves silently.
 */

const db = new PrismaClient();

const SUFFIX = "@zzemail.test";
const made: string[] = [];
/**
 * ⚠ EVERY ADDRESS THIS FILE TOUCHES, because cleaning up by suffix is not
 * enough and that has already cost an afternoon once.
 *
 * The pupil case deliberately uses `@edulink.local` handles, which match no
 * `@zzemail.test` filter — so a `deleteMany` keyed on the suffix leaves them
 * behind. Under normal code nothing is ever mailed to a handle, so the leak only
 * appears while MUTATION TESTING, when the deliverability check is removed on
 * purpose and four stray rows survive into the dev database. Found exactly that
 * way. Tracking what was used is the version that cannot drift.
 */
const addressesUsed = new Set<string>();
let userId: string;
let originalEmail: string;

/** A fresh address in the test domain, so no two runs collide. */
function address(label: string): string {
  const value = `${label}.${randomBytes(4).toString("hex")}${SUFFIX}`;
  addressesUsed.add(value);
  return value;
}

async function makeUser(email: string): Promise<string> {
  addressesUsed.add(email);
  const user = await db.user.create({ data: { email, name: "Test Person", prefs: "{}", passwordHash: await hashPassword(PASSWORD) } });
  made.push(user.id);
  return user.id;
}

/**
 * The code, read out of the devbox mailbox exactly as a person reads it out of
 * their inbox — rather than out of the token row, which would test that the
 * hash round-trips and not that the message anybody receives carries the code.
 */
async function codeSentTo(to: string): Promise<string> {
  const mail = await db.outboundEmail.findFirst({
    where: { to, purpose: "EMAIL_CHANGE" },
    orderBy: { createdAt: "desc" },
    select: { text: true },
  });
  const code = mail?.text.match(/\b(\d{6})\b/)?.[1];
  if (!code) throw new Error(`no code in the message to ${to}`);
  return code;
}

beforeEach(async () => {
  originalEmail = address("before");
  userId = await makeUser(originalEmail);
});

afterEach(async () => {
  await db.rateLimit.deleteMany({ where: { bucket: { startsWith: "email-change:" } } });
  // The password check draws on the login bucket of the address; the confirm has its own ceiling.
  await db.rateLimit.deleteMany({ where: { bucket: { in: [...addressesUsed].map((a) => `login:${a}`) } } });
  await db.rateLimit.deleteMany({ where: { bucket: { in: made.map((id) => `confirm-email:${id}`) } } });
  await db.session.deleteMany({ where: { userId: { in: made } } });
  await db.authToken.deleteMany({ where: { userId: { in: made } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: made } } });
  // By what was actually used, not by shape — see the note on `addressesUsed`.
  await db.outboundEmail.deleteMany({ where: { to: { in: [...addressesUsed] } } });
  await db.user.deleteMany({ where: { id: { in: made } } });
  made.length = 0;
  addressesUsed.clear();
});

afterAll(async () => {
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("asking for a code", () => {
  it("⚠ needs the current password: without it nothing is sent, with it the code goes and every other device is signed out at confirm", async () => {
    const next = address("guarded");
    expect(await startEmailChange(userId, next, "")).toMatchObject({ ok: false, errorKey: "refusal.needsPassword" });
    expect(await startEmailChange(userId, next, "not the password")).toMatchObject({ ok: false, errorKey: "refusal.needsPassword" });
    expect(await db.outboundEmail.count({ where: { to: next } })).toBe(0);

    const expiresAt = new Date(Date.now() + 86_400_000);
    const here = await db.session.create({ data: { userId, tokenHash: `zz-email-here-${Date.now()}`, expiresAt } });
    const there = await db.session.create({ data: { userId, tokenHash: `zz-email-there-${Date.now()}`, expiresAt } });

    expect((await startEmailChange(userId, next, PASSWORD)).ok).toBe(true);
    expect((await confirmEmailChange(userId, await codeSentTo(next), here.id)).ok).toBe(true);
    expect((await db.session.findUniqueOrThrow({ where: { id: here.id } })).revokedAt).toBeNull();
    expect((await db.session.findUniqueOrThrow({ where: { id: there.id } })).revokedAt).not.toBeNull();
  });

  it("sends one, and changes nothing yet", async () => {
    const next = address("after");
    const result = await startEmailChange(userId, next, PASSWORD);

    expect(result.ok, result.errorKey).toBe(true);
    expect(result.sentTo).toBe(next);

    // ⚠ THE PROPERTY THE WHOLE TWO-STEP SHAPE EXISTS FOR. A mistyped address
    // that landed on the account immediately would point this person's reset
    // codes at a stranger permanently.
    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, emailVerifiedAt: true },
    });
    expect(user.email).toBe(originalEmail);
    expect(user.emailVerifiedAt).toBeNull();
  });

  it("puts the pending address nowhere a lookup can reach it", async () => {
    const next = address("pending");
    await startEmailChange(userId, next, PASSWORD);

    // Not on the user row, and not in the indexed column on the token either.
    expect(await findAccount(next)).toBeNull();
    const token = await db.authToken.findFirstOrThrow({
      where: { userId, purpose: "EMAIL_CHANGE" },
      select: { email: true, meta: true },
    });
    expect(token.email).toBeNull();
    expect(token.meta).toContain(next);
  });

  it("refuses something that is not an address", async () => {
    for (const bad of ["", "   ", "nope", "no@domain", "two@@at.test", "spaces in@it.test"]) {
      const result = await startEmailChange(userId, bad, PASSWORD);
      expect(result.ok, `"${bad}" should be refused`).toBe(false);
    }
  });

  it("⚠ refuses the handle domain, which is well-formed and never routes", async () => {
    /**
     * `amara.k4f9@edulink.local` passes every shape check ever written — it is a
     * valid address. It is also the one domain in the system guaranteed not to
     * deliver, so accepting it would mint an account that can never be sent a
     * reset code and never recovered.
     */
    const handleAddress = `someone@${HANDLE_DOMAIN}`;
    // Tracked even though nothing should ever be sent there — that is precisely
    // the assertion, and a mutant that breaks it must not leak a row.
    addressesUsed.add(handleAddress);

    const result = await startEmailChange(userId, handleAddress, PASSWORD);
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe("refusal.emailUnreceivable");
  });

  it("refuses the address already on the account", async () => {
    const result = await startEmailChange(userId, originalEmail.toUpperCase(), PASSWORD);
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe("refusal.emailAlreadyYours");
  });

  it("refuses an address another account holds, verified or not", async () => {
    // Deliberately UNVERIFIED, which is the case the phone rule next door lets
    // through and this one must not: `User.email` is unique either way, so
    // allowing it would only move the failure to a constraint error later.
    const theirs = address("someone-else");
    await makeUser(theirs);

    const result = await startEmailChange(userId, theirs, PASSWORD);
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe("refusal.emailTakenJoin");
    expect(await db.authToken.count({ where: { userId, purpose: "EMAIL_CHANGE" } })).toBe(0);
  });

  it("⚠ stops somebody using it to send mail in a loop", async () => {
    let refusal: string | undefined;
    for (let i = 0; i < EMAIL_CHANGE_REQUESTS.limit + 1; i++) {
      const result = await startEmailChange(userId, address(`loop${i}`), PASSWORD);
      if (!result.ok && result.errorKey === "refusal.tooManyCodes") {
        refusal = result.errorKey;
        break;
      }
    }
    expect(refusal, "the loop must stop").toBe("refusal.tooManyCodes");
  });

  it("⚠ a new address does not buy a fresh allowance", async () => {
    // The bucket is keyed on the USER for exactly this reason. Keyed on the
    // address, every iteration above would have started its own window and the
    // limit would have bounded nothing at all.
    for (let i = 0; i < EMAIL_CHANGE_REQUESTS.limit; i++) {
      await startEmailChange(userId, address(`vary${i}`), PASSWORD);
    }
    const result = await startEmailChange(userId, address("brand-new"), PASSWORD);
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe("refusal.tooManyCodes");
  });

  it("only the newest code is live", async () => {
    const first = address("first");
    await startEmailChange(userId, first, PASSWORD);
    const firstCode = await codeSentTo(first);

    const second = address("second");
    await startEmailChange(userId, second, PASSWORD);

    // The first code is spent, so it neither works nor moves the old address.
    expect((await confirmEmailChange(userId, firstCode)).ok).toBe(false);
    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true },
    });
    expect(user.email).toBe(originalEmail);
  });
});

/* -------------------------------------------------------------------------- */

describe("using the code", () => {
  it("moves the address across and marks it verified", async () => {
    const next = address("after");
    await startEmailChange(userId, next, PASSWORD);
    const code = await codeSentTo(next);

    const result = await confirmEmailChange(userId, code);
    expect(result.ok, result.errorKey).toBe(true);

    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, emailVerifiedAt: true },
    });
    expect(user.email).toBe(next);
    expect(user.emailVerifiedAt).not.toBeNull();
  });

  it("and the new address is what signs in from then on", async () => {
    const next = address("after");
    await startEmailChange(userId, next, PASSWORD);
    await confirmEmailChange(userId, await codeSentTo(next));

    // The point of the whole feature, stated as the thing a person does.
    expect((await findAccount(next))?.userId).toBe(userId);
    expect(await findAccount(originalEmail)).toBeNull();
  });

  it("⚠ tells the address being left", async () => {
    /**
     * THE SECURITY OF THE FEATURE, and the part that is easy to leave out. An
     * attacker holding a live session can otherwise repoint an account's
     * recovery at themselves in silence; revoking sessions would not help,
     * because theirs is the one that survives. The previous address finding out
     * — while it is still on record everywhere else — is what does.
     */
    const next = address("after");
    await startEmailChange(userId, next, PASSWORD);
    await confirmEmailChange(userId, await codeSentTo(next));

    const notice = await db.outboundEmail.findFirst({
      where: { to: originalEmail, purpose: "EMAIL_CHANGE" },
      select: { subject: true, text: true },
    });
    expect(notice, "the old address must be warned").not.toBeNull();
    expect(notice!.subject).toMatch(/changed/i);
    expect(notice!.text).toContain(next);
    expect(notice!.text).toMatch(/did not do this/i);
  });

  it("a wrong code does not move the address, and costs an attempt", async () => {
    const next = address("after");
    await startEmailChange(userId, next, PASSWORD);
    const code = await codeSentTo(next);
    // DERIVED FROM THE REAL CODE rather than hardcoded, so it is wrong every
    // run. A fixed "123456" is right one run in a million, and a test that
    // fails once a year is a test nobody trusts.
    const wrong = String((Number(code) + 1) % 1_000_000).padStart(6, "0");

    const result = await confirmEmailChange(userId, wrong);
    expect(result.ok).toBe(false);

    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true },
    });
    expect(user.email).toBe(originalEmail);

    // Charged, which is what makes five the ceiling rather than a suggestion —
    // in the column, by one conditional UPDATE, not in `meta`.
    const token = await db.authToken.findFirstOrThrow({
      where: { userId, purpose: "EMAIL_CHANGE" },
      select: { attempts: true },
    });
    expect(token.attempts).toBe(1);

    // And the right code still works afterwards — a wrong guess must not spend
    // the token, only count against it.
    expect((await confirmEmailChange(userId, code)).ok).toBe(true);
  });

  it("⚠ five wrong codes spend the token, and the right one no longer works", async () => {
    const next = address("after");
    await startEmailChange(userId, next, PASSWORD);
    const code = await codeSentTo(next);

    for (let i = 0; i < 5; i++) {
      // Six digits that are not the code, whatever the code is.
      const wrong = String((Number(code) + i + 1) % 1_000_000).padStart(6, "0");
      await confirmEmailChange(userId, wrong);
    }

    const result = await confirmEmailChange(userId, code);
    expect(result.ok).toBe(false);
    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true },
    });
    expect(user.email).toBe(originalEmail);
  });

  it("refuses when there is no live request at all", async () => {
    const result = await confirmEmailChange(userId, "123456");
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe("refusal.codeWrong");
  });

  it("refuses an expired code", async () => {
    const next = address("after");
    await startEmailChange(userId, next, PASSWORD);
    const code = await codeSentTo(next);

    await db.authToken.updateMany({
      where: { userId, purpose: "EMAIL_CHANGE", consumedAt: null },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });

    expect((await confirmEmailChange(userId, code)).ok).toBe(false);
  });

  it("⚠ refuses an address somebody else claimed while the code was in flight", async () => {
    // Ten minutes is long enough for an invite to be accepted at the same
    // address. The database would refuse it regardless — `User.email` is unique
    // — but a constraint error is not a sentence anybody can act on.
    const contested = address("contested");
    await startEmailChange(userId, contested, PASSWORD);
    const code = await codeSentTo(contested);

    await makeUser(contested);

    const result = await confirmEmailChange(userId, code);
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe("refusal.emailClaimed");
    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true },
    });
    expect(user.email).toBe(originalEmail);
  });
});

/* -------------------------------------------------------------------------- */

describe("a pupil who joined with a class code", () => {
  /**
   * Their login lives in the same column, against a domain that does not route.
   * This is the case the feature was worth building for: before it, a child who
   * outgrew their handle could never own an address, and so could never reset
   * their own password.
   */
  let pupilId: string;
  let handle: string;

  beforeEach(async () => {
    handle = `asha.${randomBytes(3).toString("hex")}@${HANDLE_DOMAIN}`;
    pupilId = await makeUser(handle);
  });

  it("can set a real address for the first time", async () => {
    const real = address("asha-real");
    const started = await startEmailChange(pupilId, real, PASSWORD);
    expect(started.ok, started.errorKey).toBe(true);

    const result = await confirmEmailChange(pupilId, await codeSentTo(real));
    expect(result.ok, result.errorKey).toBe(true);

    expect((await findAccount(real))?.userId).toBe(pupilId);
  });

  it("⚠ and no warning is sent to the handle, which cannot receive one", async () => {
    // `.local` is reserved and will never route. Sending there is a message
    // carrying account news to a domain nobody owns — and there is no previous
    // owner to warn in the first place.
    const real = address("asha-real");
    await startEmailChange(pupilId, real, PASSWORD);
    await confirmEmailChange(pupilId, await codeSentTo(real));

    expect(await db.outboundEmail.count({ where: { to: handle } })).toBe(0);
  });

  it("the handle stops being a login once it is replaced", async () => {
    const real = address("asha-real");
    await startEmailChange(pupilId, real, PASSWORD);
    await confirmEmailChange(pupilId, await codeSentTo(real));

    expect(await findAccount(handle)).toBeNull();
  });
});
