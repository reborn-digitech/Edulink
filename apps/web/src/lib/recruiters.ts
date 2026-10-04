import "server-only";
import { redirect } from "next/navigation";
import type { RecruiterRegister } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { generateToken, hashPassword, hashToken, passwordProblems } from "./crypto";
import { sendVerifyEmail } from "./email";
import { writeJson } from "./json";
import { consumeByCaller, SIGNUPS } from "./rate-limit";
import { EMAIL_VERIFY_TTL_HOURS } from "./constants";
import { getSession, type ActiveContext } from "./session";
import { AccessError } from "./access-error";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * THE RECRUITER'S OWN ACCOUNT (the owner's college plan of 4 October 2026).
 *
 * A recruiter is an outside account like an expert: it belongs to no college,
 * is never a Membership and is never invited. It registers itself — a name, an
 * address, a password and the company it recruits for — and signs in like
 * anybody else; the session carries the RECRUITER role and no school
 * (session.ts treats it as it treats an expert), and the gate (role-gate.ts)
 * lets it through only the doors that name it: today its own home, its
 * account and its notices. It reaches a college ONLY through a placement
 * drive the college's TPO opens — the placement module's binding, which is
 * not built here — so a fresh account sees nothing of any college at all.
 *
 * THE PERSON IS THE FENCE. RecruiterProfile carries no schoolId and no
 * policy, exactly as ExpertProfile does; every read here is keyed on the
 * session's own user id, never on an id from a form.
 */

export type RecruiterRegistration =
  | { ok: true; userId: string }
  | { ok: false; errorKey: TranslationKey; field?: "name" | "email" | "password" | "companyName"; retryAfterSeconds?: number };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Makes a recruiter's account and profile in one transaction, and sends the
 * address a confirmation link. Rate-limited as every sign-up is (the
 * register bucket), refused for an address that already has an account —
 * attaching a recruiter profile to somebody else's account would be a takeover
 * — and for a password the shared rules refuse. Does not sign in: the caller
 * does (a cookie on the web, a bearer token on the phone).
 */
export async function registerRecruiter(input: RecruiterRegister, locale: string): Promise<RecruiterRegistration> {
  const gate = await consumeByCaller("register", SIGNUPS);
  if (!gate.allowed) return { ok: false, errorKey: "recruiter.refuseTooMany", retryAfterSeconds: gate.retryAfterSeconds };

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const companyName = input.companyName.trim();
  if (name.length < 2) return { ok: false, errorKey: "recruiter.refuseName", field: "name" };
  if (companyName.length < 2) return { ok: false, errorKey: "recruiter.refuseCompany", field: "companyName" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, errorKey: "recruiter.refuseEmail", field: "email" };
  const problems = passwordProblems(input.password, [name, email, companyName]);
  if (problems.length > 0) return { ok: false, errorKey: problems[0]!, field: "password" };

  const taken = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) return { ok: false, errorKey: "recruiter.refuseEmailTaken", field: "email" };

  const passwordHash = await hashPassword(input.password);
  const verifyToken = generateToken();
  let userId: string;
  try {
    userId = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const user = await tx.user.create({ data: { email, name, passwordHash, prefs: writeJson({ theme: "system", locale }) } });
      await tx.recruiterProfile.create({ data: { userId: user.id, companyName } });
      await tx.authToken.create({
        data: {
          userId: user.id,
          email,
          purpose: "EMAIL_VERIFY",
          tokenHash: hashToken(verifyToken),
          expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_HOURS * 3_600_000),
        },
      });
      return user.id;
    });
  } catch (error) {
    // Two presses at once, or the same address in the same second: the unique index decides.
    if ((error as { code?: string }).code === "P2002") return { ok: false, errorKey: "recruiter.refuseEmailTaken", field: "email" };
    throw error;
  }

  // Outside the transaction: a mail provider's hiccup must not undo an account; the link can be asked for again.
  await sendVerifyEmail(email, `${APP_URL}/verify?token=${verifyToken}`, companyName).catch((error) => console.error("[recruiters] verification email failed", error));
  await audit({ schoolId: null, actorUserId: userId, action: "recruiter.register", targetType: "User", targetId: userId, meta: { companyName } });
  return { ok: true, userId };
}

export type RecruiterView = { name: string; companyName: string; createdAt: Date; emailVerified: boolean };

/** The signed-in recruiter's own account, or a refusal for anybody else (an API door's gate). */
export async function myRecruiterProfile(ctx: ActiveContext): Promise<RecruiterView> {
  if (ctx.role !== "RECRUITER") throw new AccessError("access.wrongRoleForThisAction");
  const profile = await db.recruiterProfile.findUnique({
    where: { userId: ctx.user.id },
    select: { companyName: true, createdAt: true, disabledAt: true, user: { select: { name: true, preferredName: true, emailVerifiedAt: true } } },
  });
  if (!profile || profile.disabledAt) throw new AccessError("recruiter.refuseDisabled");
  return { name: profile.user.preferredName ?? profile.user.name, companyName: profile.companyName, createdAt: profile.createdAt, emailVerified: profile.user.emailVerifiedAt !== null };
}

/**
 * A recruiter's page gate, the shape of `requireExpert`: a RECRUITER session
 * whose profile exists and is not disabled; anybody else goes to choose.
 */
export async function requireRecruiter(): Promise<ActiveContext & { recruiter: RecruiterView }> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "RECRUITER") redirect("/switch");
  const recruiter = await myRecruiterProfile(session).catch(() => null);
  if (!recruiter) redirect("/switch");
  return { ...session, recruiter };
}
