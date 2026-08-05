import "server-only";
import { randomInt } from "node:crypto";
import { db } from "./db";
import { audit } from "./audit";
import { hashPassword, hashToken, passwordProblems } from "./crypto";
import { readJson } from "./json";
import { isDeliverableEmail, toLoginEmail } from "./login-name";
import { identifierKind, normalisePhone, phoneHint } from "./phone";
import { sendResetCode as sendResetSms } from "./sms";
import { sendResetCode as sendResetEmail } from "./email";

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
  disabled: boolean;
};

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

  const user = await db.user.findUnique({
    where,
    select: { id: true, email: true, phone: true, disabledAt: true },
  });
  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    phone: user.phone,
    disabled: user.disabledAt !== null,
  };
}

/* -------------------------------------------------------------------------- */
/* Asking for a code                                                           */
/* -------------------------------------------------------------------------- */

export type ResetRequest = {
  /** Always true. See the note on enumeration above. */
  ok: true;
  /** The last four digits of what the CALLER typed, never of what we hold. */
  hint: string;
  /** Which channel it would have gone down, from the shape of the input. */
  channel: "EMAIL" | "PHONE";
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
        ? account.phone
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
