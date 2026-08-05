import "server-only";
import { randomInt } from "node:crypto";
import { db } from "./db";
import { audit } from "./audit";
import { hashPassword, hashToken, passwordProblems } from "./crypto";
import { readJson } from "./json";
import { isDeliverableEmail, toLoginEmail } from "./login-name";
import { identifierKind, normalisePhone, phoneHint } from "./phone";
import { sendResetCode as sendResetSms, sendPhoneCode } from "./sms";
import {
  sendResetCode as sendResetEmail,
  sendEmailChangeCode,
  sendEmailChangedNotice,
} from "./email";
import {
  consume,
  retryHint,
  RESET_REQUESTS,
  PHONE_VERIFY_REQUESTS,
  EMAIL_CHANGE_REQUESTS,
} from "./rate-limit";

/**
 * Signing in with whatever you have, and getting back in when you forget.
 *
 * ONE IDENTIFIER, THREE SHAPES. An email, a mobile number, or the handle a pupil
 * who joined with a class code was given. `identifierKind` decides which by
 * shape — see phone.ts — and this file turns each into the one account it names.
 * A toggle asking somebody to categorise their own login before typing it is a
 * question they should not have to answer.
 *
 * THE CODE ALONE IS NOT ENOUGH, and that is the property worth protecting. A
 * reset code is six digits, which is a million possibilities and not a large
 * number. It is hashed TOGETHER WITH the user id, so the row cannot be found
 * without also knowing the identifier it was issued for — and it is limited to
 * five attempts and ten minutes, after which the token is spent whether or not
 * anybody guessed right.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO is tell anybody whether an account exists.
 * Requesting a reset always reports the same thing, exactly as the magic link
 * does, because a form that says "no account with that number" is an
 * enumeration oracle — and for a service holding children's records, a list of
 * which parents are registered is worth having.
 */

/** Ten minutes: long enough to find a phone, short enough to be worthless later. */
export const RESET_TTL_MINUTES = 10;

/**
 * Five wrong codes and the token is spent.
 *
 * The number that makes six digits defensible. One in a million per guess, five
 * guesses, and then the code is gone whether or not the next one was right —
 * so an attacker who has somehow read the identifier but not the phone gets
 * five in a million and has to start a new request, which sends a new code to
 * the real owner and tells them something is happening.
 */
export const MAX_RESET_ATTEMPTS = 5;

const RESET_PURPOSE = "PASSWORD_RESET";

export type ResolvedAccount = {
  userId: string;
  email: string | null;
  phone: string | null;
  /** A number nobody proved they hold is not a login and not a destination. */
  phoneConfirmed: boolean;
  disabled: boolean;
};

/**
 * ⚠ ONLY A CONFIRMED NUMBER IS A LOGIN.
 *
 * `saveMobile` used to write whatever was typed straight onto the account, so
 * anybody could put any number on their own record and a reset code would go to
 * it. One mistyped digit sent somebody's codes to a stranger's phone,
 * permanently, and they would not find out until the day they needed them.
 *
 * Setting a number now costs a code sent to it — see `startPhoneChange` — and
 * this predicate is what makes that mean something. Both lookups use it, so an
 * unconfirmed number is not a login and not a reset destination; there is no
 * third state where it is one but not the other.
 */
const CONFIRMED_PHONE = { phoneVerifiedAt: { not: null } } as const;

/**
 * The one account an identifier names, or null.
 *
 * NEVER MORE THAN ONE. `User.email` and `User.phone` are both unique, and a
 * handle resolves to an email in the internal domain, so each shape is a single
 * indexed lookup rather than a search. A function that could return two accounts
 * would have to guess between them, and guessing which account to send a
 * password reset to is not a thing this should ever do.
 */
export async function findAccount(rawIdentifier: string): Promise<ResolvedAccount | null> {
  const raw = rawIdentifier.trim();
  if (raw.length === 0) return null;

  const kind = identifierKind(raw);

  const where =
    kind === "PHONE"
      ? (() => {
          const phone = normalisePhone(raw);
          return phone ? { phone } : null;
        })()
      : // An email and a handle are the same lookup: `toLoginEmail` turns
        // `amara.k4f9` into `amara.k4f9@edulink.local` and leaves a real address
        // alone. One rule, in one place, since login, merge and this all need it.
        { email: toLoginEmail(raw) };

  if (!where) return null;

  /**
   * `findFirst`, not `findUnique`, ONLY because the confirmed-phone clause is
   * not part of a unique key. It still resolves to at most one row: `phone` and
   * `email` are both unique, so the extra condition can narrow one row to none
   * and never one to two.
   */
  const user = await db.user.findFirst({
    where: kind === "PHONE" ? { ...where, ...CONFIRMED_PHONE } : where,
    select: { id: true, email: true, phone: true, phoneVerifiedAt: true, disabledAt: true },
  });
  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    phone: user.phone,
    phoneConfirmed: user.phoneVerifiedAt !== null,
    disabled: user.disabledAt !== null,
  };
}

/* -------------------------------------------------------------------------- */
/* Asking for a code                                                           */
/* -------------------------------------------------------------------------- */

export type ResetRequest = {
  /**
   * False ONLY when the caller has asked too many times. Never false because an
   * account was not found — see the note on enumeration above.
   */
  ok: boolean;
  /** The last four digits of what the CALLER typed, never of what we hold. */
  hint: string;
  /** Which channel it would have gone down, from the shape of the input. */
  channel: "EMAIL" | "PHONE";
  /** Set when `ok` is false: a sentence saying when to come back. */
  error?: string;
};

/**
 * Sends a code, if there is anywhere to send one.
 *
 * THE RETURN VALUE IS DERIVED FROM THE INPUT, NOT FROM THE ACCOUNT. "A code is
 * on its way to the number ending 3210" is safe to say because the person
 * reading it typed those digits; "…to the number ending 7788" would be telling
 * them a number they did not know, which is the disclosure. So the hint comes
 * from `rawIdentifier` and the account is never consulted for it.
 *
 * A REQUEST INVALIDATES THE PREVIOUS ONE. Two live codes for one account doubles
 * the guessing surface for no benefit, and somebody who asks twice is going to
 * use the second message.
 */
export async function requestPasswordReset(rawIdentifier: string): Promise<ResetRequest> {
  const raw = rawIdentifier.trim();
  const kind = identifierKind(raw);
  const channel: "EMAIL" | "PHONE" = kind === "PHONE" ? "PHONE" : "EMAIL";
  const hint = channel === "PHONE" ? phoneHint(normalisePhone(raw) ?? raw) : "";

  /**
   * ⚠ HOW MANY TIMES THIS NUMBER HAS BEEN ASKED FOR, and the limit is the whole
   * reason this function is not a way to harass somebody.
   *
   * Without it, an attacker types a stranger's mobile number and presses the
   * button in a loop: the app sends the texts, the stranger's phone rings all
   * evening, and whoever runs the deployment pays for every one. Nothing else
   * in this flow bounds that — the account does not have to exist, and the
   * caller does not have to be signed in.
   *
   * KEYED ON WHAT WAS TYPED, NOT ON THE ACCOUNT IT RESOLVES TO. That is
   * deliberate: an identifier matching nobody has to be limited exactly like
   * one that does, or the limiter becomes the enumeration oracle the rest of
   * this function spends its effort avoiding — "that one refused me, so it must
   * be real". The bucket is built before anything is looked up, for that reason.
   */
  const gate = await consume(
    `reset:${channel === "PHONE" ? (normalisePhone(raw) ?? raw.toLowerCase()) : raw.toLowerCase()}`,
    RESET_REQUESTS.limit,
    RESET_REQUESTS.windowMs,
  );
  if (!gate.allowed) {
    return {
      ok: false,
      hint,
      channel,
      error: `Too many requests for that. Try again ${retryHint(gate.retryAfterSeconds)}.`,
    };
  }

  const account = await findAccount(raw);

  // Everything below is conditional; everything returned is not.
  if (account && !account.disabled) {
    /**
     * WHERE THE CODE WOULD GO, and a handle is not an address.
     *
     * `amara.k4f9@edulink.local` is a lookup key wearing the shape of an email;
     * `.local` is reserved and will never route. Sending there looks harmless
     * in the dev mailbox and, with a real transport configured, is a message
     * carrying a credential for a child's account to a domain we do not own.
     * Found by a test that asked what happens when a pupil with a handle and no
     * mobile number asks for a reset — the answer was "an email".
     */
    const destination =
      channel === "PHONE"
        ? // Reached only through `findAccount`, which already refuses an
          // unconfirmed number — belt and braces, because this is the line that
          // decides where a credential is sent.
          account.phoneConfirmed
          ? account.phone
          : null
        : isDeliverableEmail(account.email)
          ? account.email
          : null;

    // Nowhere to send is silent, on purpose — saying so would confirm the
    // account exists. A pupil in that position asks their school, which is what
    // the form tells them before they press anything.
    if (destination) {
      // Six digits, zero-padded. Not `Math.random`: this is a credential.
      const code = String(randomSixDigits()).padStart(6, "0");

      await db.authToken.updateMany({
        where: { userId: account.userId, purpose: RESET_PURPOSE, consumedAt: null },
        data: { consumedAt: new Date() },
      });

      await db.authToken.create({
        data: {
          userId: account.userId,
          // Stored so the same row can say which channel it went down when the
          // reset is audited. Never used to find the row.
          email: channel === "EMAIL" ? destination : null,
          purpose: RESET_PURPOSE,
          // SALTED WITH THE USER ID. Two people can hold the same six digits at
          // the same time, and `tokenHash` is unique — without the id one of the
          // two writes would fail, and worse, a bare code would be findable
          // without knowing whose it was.
          tokenHash: hashToken(`${account.userId}:${code}`),
          meta: JSON.stringify({ attempts: 0, channel }),
          expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000),
        },
      });

      if (channel === "PHONE") {
        await sendResetSms(destination, code, RESET_TTL_MINUTES);
      } else {
        await sendResetEmail(destination, code, RESET_TTL_MINUTES);
      }

      await audit({
        actorUserId: account.userId,
        action: "auth.reset.requested",
        meta: { channel },
      });
    }
  }

  return { ok: true, hint, channel };
}

/**
 * Six digits from a cryptographic source.
 *
 * `randomInt`, not `Math.random()`. This is a credential: `Math.random` is
 * seeded predictably enough that a stream of its output narrows the next value,
 * and "the reset code was guessable" is not a bug anybody finds by testing.
 */
function randomSixDigits(): number {
  return randomInt(0, 1_000_000);
}

/* -------------------------------------------------------------------------- */
/* Using it                                                                    */
/* -------------------------------------------------------------------------- */

export type ResetResult = { ok: boolean; error?: string };

/**
 * Sets a new password, given the identifier and the code that was sent to it.
 *
 * ONE MESSAGE FOR EVERY WAY IT CAN FAIL, and the same one: no account, wrong
 * code, expired code, spent code, too many tries. The alternative distinguishes
 * "that code is wrong" from "there is no account", which is the enumeration
 * oracle the request side is careful not to be — and it would be pointless to
 * close it there and open it here.
 *
 * EVERY SESSION IS REVOKED ON SUCCESS. Somebody resetting a password has often
 * done it because they think somebody else has it, and leaving the other
 * person's session alive is the one outcome that makes the whole exercise
 * pointless. Their own sessions go too: signing in again is a small price and
 * "log out everywhere" is what a person means by this.
 */
export async function resetPassword(
  rawIdentifier: string,
  code: string,
  newPassword: string,
): Promise<ResetResult> {
  const generic: ResetResult = {
    ok: false,
    error: "That code is not right, or it has expired. Ask for a new one.",
  };

  const trimmedCode = code.trim();
  if (trimmedCode.length === 0) return generic;

  const account = await findAccount(rawIdentifier);
  if (!account || account.disabled) return generic;

  // Found BY the hash, which includes the user id — so a code guessed for one
  // person cannot open another's row even if the digits happen to match.
  const token = await db.authToken.findUnique({
    where: { tokenHash: hashToken(`${account.userId}:${trimmedCode}`) },
    select: { id: true, userId: true, purpose: true, expiresAt: true, consumedAt: true, meta: true },
  });

  /**
   * A WRONG CODE STILL COSTS AN ATTEMPT, which is the whole point of counting
   * them — and it is why the attempt is charged against the live token found by
   * USER rather than against the token found by hash. Charging only when the
   * hash matched would count correct guesses and let wrong ones run forever.
   */
  const live = await db.authToken.findFirst({
    where: {
      userId: account.userId,
      purpose: RESET_PURPOSE,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, meta: true },
    orderBy: { createdAt: "desc" },
  });

  if (!live) return generic;

  const attempts = readJson<{ attempts?: number }>(live.meta, {}).attempts ?? 0;
  if (attempts >= MAX_RESET_ATTEMPTS) {
    await db.authToken.update({ where: { id: live.id }, data: { consumedAt: new Date() } });
    return generic;
  }

  /**
   * BOTH HALVES OF "ONLY THE NEWEST CODE WORKS" ARE HERE, and each one survives
   * mutation testing on its own — which is the point rather than a gap.
   *
   * Requesting a code consumes the previous one; this line additionally refuses
   * anything that is not the newest live token. Remove either and the tests
   * stay green, because the other still holds. Remove BOTH and they fail, which
   * is the check that matters and was run. Same reasoning as the deliberately
   * redundant `m."schoolId" = ANY(...)` line in MEMBER_READABLE: the moment one
   * of these depends on the other for its correctness, a change over there
   * silently becomes a change to who can reset a password.
   */
  const correct =
    token !== null &&
    token.id === live.id &&
    token.userId === account.userId &&
    token.purpose === RESET_PURPOSE &&
    token.consumedAt === null &&
    token.expiresAt.getTime() > Date.now();

  if (!correct) {
    await db.authToken.update({
      where: { id: live.id },
      data: { meta: JSON.stringify({ ...readJson<object>(live.meta, {}), attempts: attempts + 1 }) },
    });
    await audit({ actorUserId: account.userId, action: "auth.reset.failed" });
    return generic;
  }

  // The password itself is checked LAST, so a weak one does not consume the
  // code — somebody who has proved they hold the phone should not have to ask
  // for a second message because they typed a short password first.
  const problems = passwordProblems(newPassword, [account.email ?? "", account.phone ?? ""]);
  if (problems.length > 0) return { ok: false, error: problems[0] };

  const passwordHash = await hashPassword(newPassword);

  await db.user.update({ where: { id: account.userId }, data: { passwordHash } });

  /**
   * EVERYTHING ELSE THE ACCOUNT HOLDS THAT COULD STILL LET SOMEBODY IN.
   *
   * Sessions, because a reset is usually done by somebody who believes another
   * person has their password — leaving that person signed in is the one
   * outcome that makes the whole exercise pointless. Their own sessions go too:
   * "log out everywhere" is what a person means by this.
   *
   * And every outstanding token, which INCLUDES the code just used. An explicit
   * `update` for that one row stood here and was removed after mutation testing
   * could not make it matter — this sweep already consumes it, and a line whose
   * deletion changes nothing is a line that will one day be believed to be
   * doing something. A magic link requested five minutes before the reset is
   * the case that makes the sweep worth more than the single update: it is
   * still live, still a way in, and belongs to a password that no longer exists.
   */
  await db.session.updateMany({
    where: { userId: account.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await db.authToken.updateMany({
    where: { userId: account.userId, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await audit({ actorUserId: account.userId, action: "auth.reset.completed" });

  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Proving you hold the number                                                 */
/* -------------------------------------------------------------------------- */

const PHONE_PURPOSE = "PHONE_VERIFY";

export type PhoneChange = { ok: boolean; error?: string; hint?: string };

/**
 * Step one of putting a mobile number on an account: send a code to it.
 *
 * THE NUMBER IS NOT STORED YET, and that is the entire point. Writing it
 * immediately with `phoneVerifiedAt` null — which is what this used to do —
 * meant anybody could put any number on their own account and have password
 * reset codes delivered to it. A typo pointed somebody's codes at a stranger
 * for good; a deliberate entry pointed this app's SMS at whoever they liked.
 *
 * It waits in the token's `meta` instead, so an unconfirmed number exists
 * nowhere a lookup can reach it.
 *
 * THE CLASH IS CHECKED HERE AND AGAIN AT CONFIRM, because fifteen minutes pass
 * in between and somebody else may confirm the same number first. The database
 * would catch it either way — `User.phone` is unique — but a constraint error
 * is not a sentence anybody can act on.
 */
export async function startPhoneChange(
  userId: string,
  rawPhone: string,
): Promise<PhoneChange> {
  const phone = normalisePhone(rawPhone);
  if (!phone) {
    return {
      ok: false,
      error: "That is not a mobile number we can use. Try it with the country code, like +91 98765 43210.",
    };
  }

  const taken = await db.user.findFirst({
    where: { phone, phoneVerifiedAt: { not: null }, id: { not: userId } },
    select: { id: true },
  });
  if (taken) {
    return {
      ok: false,
      error: "Another account already uses that number. If it is yours, ask your school for help.",
    };
  }

  /**
   * ⚠ KEYED ON THE USER, not on the number. A caller who swapped the number
   * every time would otherwise get a fresh allowance for each one, which is
   * precisely the loop that makes this a way to send strangers text messages.
   */
  const gate = await consume(
    `phone-verify:${userId}`,
    PHONE_VERIFY_REQUESTS.limit,
    PHONE_VERIFY_REQUESTS.windowMs,
  );
  if (!gate.allowed) {
    return {
      ok: false,
      error: `Too many codes requested. Try again ${retryHint(gate.retryAfterSeconds)}.`,
    };
  }

  const code = String(randomSixDigits()).padStart(6, "0");

  await db.authToken.updateMany({
    where: { userId, purpose: PHONE_PURPOSE, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await db.authToken.create({
    data: {
      userId,
      purpose: PHONE_PURPOSE,
      // Salted with the user id, for the same reason the reset code is.
      tokenHash: hashToken(`${userId}:${PHONE_PURPOSE}:${code}`),
      // WHERE THE NUMBER LIVES until it is confirmed.
      meta: JSON.stringify({ attempts: 0, phone }),
      expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000),
    },
  });

  await sendPhoneCode(phone, code, RESET_TTL_MINUTES);
  await audit({ actorUserId: userId, action: "account.mobile.code" });

  return { ok: true, hint: phoneHint(phone) };
}

/**
 * Step two: the code proves they hold it, so it goes on the account.
 *
 * Same attempt cap and same single message for every failure as the password
 * reset — a person confirming their own number is not somebody to be told which
 * of the three things went wrong.
 */
export async function confirmPhoneChange(userId: string, code: string): Promise<PhoneChange> {
  const generic: PhoneChange = {
    ok: false,
    error: "That code is not right, or it has expired. Ask for a new one.",
  };

  const live = await db.authToken.findFirst({
    where: { userId, purpose: PHONE_PURPOSE, consumedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, meta: true },
    orderBy: { createdAt: "desc" },
  });
  if (!live) return generic;

  const meta = readJson<{ attempts?: number; phone?: string }>(live.meta, {});
  const attempts = meta.attempts ?? 0;
  if (attempts >= MAX_RESET_ATTEMPTS) {
    await db.authToken.update({ where: { id: live.id }, data: { consumedAt: new Date() } });
    return generic;
  }

  const token = await db.authToken.findUnique({
    where: { tokenHash: hashToken(`${userId}:${PHONE_PURPOSE}:${code.trim()}`) },
    select: { id: true },
  });

  if (!token || token.id !== live.id) {
    await db.authToken.update({
      where: { id: live.id },
      data: { meta: JSON.stringify({ ...meta, attempts: attempts + 1 }) },
    });
    return generic;
  }

  const phone = meta.phone;
  if (!phone) return generic;

  // Re-checked, because fifteen minutes is long enough for somebody else to
  // have confirmed the same number.
  const taken = await db.user.findFirst({
    where: { phone, phoneVerifiedAt: { not: null }, id: { not: userId } },
    select: { id: true },
  });
  if (taken) {
    await db.authToken.update({ where: { id: live.id }, data: { consumedAt: new Date() } });
    return {
      ok: false,
      error: "Another account claimed that number in the meantime. Ask your school for help.",
    };
  }

  await db.user.update({
    where: { id: userId },
    data: { phone, phoneVerifiedAt: new Date() },
  });
  await db.authToken.update({ where: { id: live.id }, data: { consumedAt: new Date() } });
  await audit({ actorUserId: userId, action: "account.mobile.confirm" });

  return { ok: true, hint: phoneHint(phone) };
}

/* -------------------------------------------------------------------------- */
/* Proving you hold the address                                                */
/* -------------------------------------------------------------------------- */

const EMAIL_PURPOSE = "EMAIL_CHANGE";

export type EmailChange = { ok: boolean; error?: string; sentTo?: string };

/**
 * Step one of changing the email on an account: send a code to the new one.
 *
 * ⚠ THERE WAS NO WAY TO DO THIS AT ALL. An address arrived at account creation —
 * registration, a teacher invite, an expert invite — and then it was permanent.
 * A family that changed email provider, a teacher who left the school whose
 * address they signed up with, a pupil who outgrew the handle a class code gave
 * them: all of them were stuck with an account reachable at an address they no
 * longer read, which for a password reset means an account they cannot recover.
 * Their only route was an account merge or asking the school.
 *
 * THE ADDRESS IS NOT STORED YET, exactly as with the phone. It waits in the
 * token's `meta` so an unconfirmed address exists nowhere a lookup can reach it
 * — which matters more here than it does for a number, because `User.email` IS
 * the login key. Writing it early would sign somebody in under an address they
 * had not yet proved they hold.
 *
 * NOT PUT IN `AuthToken.email` either, though the column is right there and
 * indexed. That column holds addresses a message WAS sent to for auditing; this
 * one is a claim, and a claim that sits in an indexed column is a claim
 * something will eventually search on.
 */
export async function startEmailChange(userId: string, rawEmail: string): Promise<EmailChange> {
  const email = rawEmail.trim().toLowerCase();

  /**
   * Shape first, and `isDeliverableEmail` second — they refuse different things.
   * The first refuses `not an address`; the second refuses
   * `somebody@edulink.local`, which IS a well-formed address and is the one
   * domain in the system guaranteed not to route. Typing a handle domain by hand
   * would otherwise mint an account nobody can ever send a reset to.
   */
  if (!/^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return { ok: false, error: "That does not look like an email address." };
  }
  if (!isDeliverableEmail(email)) {
    return { ok: false, error: "That address cannot receive mail. Use one you can read." };
  }

  const current = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (current?.email === email) {
    return { ok: false, error: "That is already the address on your account." };
  }

  /**
   * ANY match, not just a confirmed one — unlike the phone check next door, and
   * the difference is the schema rather than a change of mind. `User.email` is
   * unique AND every account has one, verified or not, because it doubles as the
   * login key and as a pupil's handle. An unverified address still occupies the
   * row, so letting this through would only move the refusal to a constraint
   * error at confirm time, fifteen minutes later, with no sentence attached.
   *
   * SAYING SO IS A NARROW ENUMERATION ORACLE and it is the same trade
   * `startPhoneChange` already makes: three probes per fifteen minutes, per
   * signed-in account, against a message that otherwise has to lie to somebody
   * who genuinely owns both accounts and is trying to consolidate them. The
   * alternative — pretending to send, then failing silently — traps that person
   * with no way to find out why.
   */
  const taken = await db.user.findFirst({
    where: { email, id: { not: userId } },
    select: { id: true },
  });
  if (taken) {
    return {
      ok: false,
      error:
        "Another account already uses that address. If both are yours, join them together from your account page instead.",
    };
  }

  const gate = await consume(
    `email-change:${userId}`,
    EMAIL_CHANGE_REQUESTS.limit,
    EMAIL_CHANGE_REQUESTS.windowMs,
  );
  if (!gate.allowed) {
    return {
      ok: false,
      error: `Too many codes requested. Try again ${retryHint(gate.retryAfterSeconds)}.`,
    };
  }

  const code = String(randomSixDigits()).padStart(6, "0");

  /**
   * Asking again spends the previous code, so only one is ever live.
   *
   * SURVIVES MUTATION TESTING ON ITS OWN, and that is deliberate rather than a
   * gap — the same arrangement `resetPassword` documents. `confirmEmailChange`
   * additionally refuses any token that is not the newest, so removing either
   * line leaves the tests green and removing BOTH fails three of them. Which was
   * run: without the pair, a code from a request the person abandoned twenty
   * minutes ago still moves their address.
   */
  await db.authToken.updateMany({
    where: { userId, purpose: EMAIL_PURPOSE, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await db.authToken.create({
    data: {
      userId,
      purpose: EMAIL_PURPOSE,
      // Salted with the user id and the purpose, so a six-digit code issued for
      // one person and one job cannot collide with — or open — another's.
      tokenHash: hashToken(`${userId}:${EMAIL_PURPOSE}:${code}`),
      meta: JSON.stringify({ attempts: 0, email }),
      expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60_000),
    },
  });

  await sendEmailChangeCode(email, code, RESET_TTL_MINUTES);
  await audit({ actorUserId: userId, action: "account.email.code" });

  return { ok: true, sentTo: email };
}

/**
 * Step two: the code proves they read that inbox, so the address becomes theirs.
 *
 * SETS `emailVerifiedAt`, and this is the first place in the app that ever does
 * on a real change. Registration mints an `EMAIL_VERIFY` token and emails a link
 * to `/verify`, which does not exist — so a school admin's address has sat
 * unverified since the day they signed up. That is a separate bug and is
 * reported rather than fixed here, but it is the reason this function sets the
 * column itself rather than assuming something upstream did.
 *
 * THE PASSWORD IS NOT RE-ASKED FOR, deliberately. They are signed in, they have
 * proved they read the new inbox, and the old address is told the moment it
 * changes — see `sendEmailChangedNotice`, which is what actually protects the
 * previous owner. Demanding a password on top would stop nobody who already has
 * a live session and would block every parent who cannot remember theirs, which
 * is the population this feature exists for.
 */
export async function confirmEmailChange(userId: string, code: string): Promise<EmailChange> {
  const generic: EmailChange = {
    ok: false,
    error: "That code is not right, or it has expired. Ask for a new one.",
  };

  const live = await db.authToken.findFirst({
    where: { userId, purpose: EMAIL_PURPOSE, consumedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, meta: true },
    orderBy: { createdAt: "desc" },
  });
  if (!live) return generic;

  const meta = readJson<{ attempts?: number; email?: string }>(live.meta, {});
  const attempts = meta.attempts ?? 0;
  if (attempts >= MAX_RESET_ATTEMPTS) {
    await db.authToken.update({ where: { id: live.id }, data: { consumedAt: new Date() } });
    return generic;
  }

  const token = await db.authToken.findUnique({
    where: { tokenHash: hashToken(`${userId}:${EMAIL_PURPOSE}:${code.trim()}`) },
    select: { id: true },
  });

  if (!token || token.id !== live.id) {
    await db.authToken.update({
      where: { id: live.id },
      data: { meta: JSON.stringify({ ...meta, attempts: attempts + 1 }) },
    });
    return generic;
  }

  const email = meta.email;
  if (!email) return generic;

  /**
   * Re-checked, because ten minutes is long enough for somebody else to have
   * claimed the address — an invite accepted, a parent signing up. The database
   * would refuse it either way, `User.email` being unique, but a constraint
   * error is not a sentence anybody can act on.
   *
   * A race narrower than this — two confirms in the same millisecond — is left
   * to the constraint. Catching it would add a branch no test can reach, and a
   * branch nothing can reach is one that will one day be believed to work.
   */
  const taken = await db.user.findFirst({
    where: { email, id: { not: userId } },
    select: { id: true },
  });
  if (taken) {
    await db.authToken.update({ where: { id: live.id }, data: { consumedAt: new Date() } });
    return {
      ok: false,
      error: "Another account claimed that address in the meantime. Ask your school for help.",
    };
  }

  // Read BEFORE the update, because it is the thing being replaced and it is
  // where the warning has to go.
  const previous = await db.user.findUnique({ where: { id: userId }, select: { email: true } });

  await db.user.update({
    where: { id: userId },
    data: { email, emailVerifiedAt: new Date() },
  });
  await db.authToken.update({ where: { id: live.id }, data: { consumedAt: new Date() } });

  /**
   * ⚠ THE OLD ADDRESS IS TOLD, and this is the security of the whole feature.
   *
   * Skipped only when there was nothing deliverable to tell — a pupil's
   * `@edulink.local` handle, which has no previous owner and no route.
   *
   * AFTER the write and not inside a transaction, on purpose: a mail transport
   * that is down must not roll back a change the person has already been shown
   * as done. The alternative fails a legitimate change because of an unrelated
   * outage, which is a worse and much more common outcome than a warning that
   * arrives late.
   */
  if (isDeliverableEmail(previous?.email)) {
    await sendEmailChangedNotice(previous!.email!, email);
  }

  await audit({ actorUserId: userId, action: "account.email.confirm" });

  return { ok: true, sentTo: email };
}

/**
 * Taking a number off. No code needed.
 *
 * Removing is not a claim about holding anything — they are signed in, and it is
 * their own row. Demanding a code to remove a number somebody typed wrongly
 * would trap them with a number they cannot receive codes on, which is the
 * failure this whole feature exists to prevent.
 */
export async function removePhone(userId: string): Promise<PhoneChange> {
  await db.user.update({ where: { id: userId }, data: { phone: null, phoneVerifiedAt: null } });
  await db.authToken.updateMany({
    where: { userId, purpose: PHONE_PURPOSE, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await audit({ actorUserId: userId, action: "account.mobile.remove" });
  return { ok: true };
}
