import "server-only";
import { db } from "./db";
import { generateToken, hashPassword, hashToken } from "./crypto";
import { sendVerifyEmail } from "./email";
import { audit } from "./audit";
import { writeJson } from "./json";
import { EMAIL_VERIFY_TTL_HOURS } from "./constants";
import { tellHolderOfSignup } from "./signup-notice";
import { normaliseLocale } from "./i18n/locales";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type ParentSignupOutcome = { outcome: "created"; userId: string } | { outcome: "taken" };

/**
 * The half of a parent's sign-up that depends on the address, run after the form has been answered (TA-287; the
 * action is join/actions.ts `signUpParent`, which checks the form and answers one sentence whatever happens here).
 *
 * The parent's sign-up was the last to say "an account already uses this email": a signed-out caller could test any
 * pupil's, parent's or staff member's address, and a free one was taken by the probe with a session at once. Now, as
 * the school's and the recruiter's sign-ups do since QA-25, an address with an account makes nothing and its holder
 * is told by email (signup-notice.ts); a free one gets its account and the confirmation link, and the parent signs in
 * with the password they chose. Two presses of one address land on the unique index, and the second is the taken case.
 */
export async function completeParentSignup(
  input: { name: string; email: string; password: string; consentNotifications: boolean },
  locale: string,
): Promise<ParentSignupOutcome> {
  const { name, email } = input;
  const taken = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) {
    await tellHolderOfSignup(email, "PARENT");
    return { outcome: "taken" };
  }

  const passwordHash = await hashPassword(input.password);
  const verifyToken = generateToken();
  let userId: string;
  try {
    userId = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          prefs: writeJson({ theme: "system", locale, channels: { push: input.consentNotifications, email: input.consentNotifications } }),
        },
        select: { id: true },
      });
      await tx.authToken.create({
        data: { userId: user.id, email, purpose: "EMAIL_VERIFY", tokenHash: hashToken(verifyToken), expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_HOURS * 3_600_000) },
      });
      return user.id;
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      await tellHolderOfSignup(email, "PARENT");
      return { outcome: "taken" };
    }
    throw error;
  }

  // Outside the transaction: a mail provider's hiccup must not undo an account; the link can be asked for again.
  await sendVerifyEmail(email, `${APP_URL}/verify?token=${verifyToken}`, name, normaliseLocale(locale)).catch((error) =>
    console.error("[parent-signup] verification email failed", error),
  );
  await audit({ actorUserId: userId, action: "parent.signup" });
  return { outcome: "created", userId };
}
