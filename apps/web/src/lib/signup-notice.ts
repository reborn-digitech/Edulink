import "server-only";
import { consume } from "./rate-limit";
import { isDeliverableEmail } from "./login-name";
import { localeForAddress, sendAccountNotice } from "./email";
import { translator } from "./i18n/dictionary";

/**
 * A SIGN-UP WITH AN ADDRESS THAT ALREADY HAS AN ACCOUNT, told to the account's
 * holder rather than to whoever typed it (QA-25, 24 Oct 2026).
 *
 * The school's and the recruiter's sign-up forms used to answer "that email
 * already has an account" on the spot, which let a signed-out caller find out
 * whether any address — a parent's, a pupil's — was registered. They now answer
 * the same sentence either way, and this is where the difference goes: to the
 * mailbox, which only the holder reads. It says somebody tried, that nothing
 * was made, how to sign in or reset the password, and that a stranger's try
 * needs nothing done.
 *
 * Three a day per address at most, so the form cannot be turned into a way of
 * filling somebody's inbox; past that the try is answered the same and nothing
 * is sent. A pupil's handle (`@edulink.local`) is never written to.
 */
export const SIGNUP_NOTICES = { limit: 3, windowMs: 24 * 60 * 60_000 };

export async function tellHolderOfSignup(email: string, kind: "RECRUITER" | "SCHOOL" | "PARENT"): Promise<boolean> {
  const address = email.trim().toLowerCase();
  if (!isDeliverableEmail(address)) return false;
  const gate = await consume(`signup-notice:${address}`, SIGNUP_NOTICES.limit, SIGNUP_NOTICES.windowMs);
  if (!gate.allowed) return false;
  const locale = await localeForAddress(address);
  const t = translator(locale);
  await sendAccountNotice({
    to: address,
    purpose: "SIGNUP_EXISTING",
    subject: t("accountGuard.signupTakenSubject"),
    lines: [
      t(kind === "RECRUITER" ? "accountGuard.signupTakenRecruiter" : kind === "PARENT" ? "accountGuard.signupTakenParent" : "accountGuard.signupTakenSchool"),
      t("accountGuard.signupTakenIfYou"),
      t("accountGuard.signupTakenIfNotYou"),
    ],
    cta: { label: t("accountGuard.signInCta"), path: "/login" },
    locale,
  });
  return true;
}
