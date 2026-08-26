"use server";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword, passwordProblems, generateToken, hashToken } from "@/lib/crypto";
import { schoolCode, slugify } from "@/lib/codes";
import { createSession } from "@/lib/session";
import { registerSchoolSchema, fieldErrors, type FieldErrors } from "@/lib/validation";
import { sendVerifyEmail } from "@/lib/email";
import { audit } from "@/lib/audit";
import { forSchool } from "@/lib/tenant-context";
import { EMAIL_VERIFY_TTL_HOURS } from "@/lib/constants";
import { writeJson } from "@/lib/json";
import { getT, getLocale } from "@/lib/i18n/server";

export type RegisterState = {
  ok: boolean;
  errors: FieldErrors;
  /** Set on success so the client can celebrate before redirecting. */
  schoolCode?: string;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Creates a school and its first admin.
 *
 * Everything happens in one transaction: a half-created school with no admin
 * would be unrecoverable from the UI — nobody could log in to finish it. (§10)
 */
export async function registerSchool(input: unknown): Promise<RegisterState> {
  const parsed = registerSchoolSchema.safeParse(input);
  if (!parsed.success) {
    // Custom messages on the shared schemas are KEYS; `fieldErrors` turns
    // them into this reader's words when handed `t`.
    return { ok: false, errors: fieldErrors(parsed.error, await getT()) };
  }

  const { school, admin } = parsed.data;

  // Password quality is checked against the person's own details, which the
  // generic length rule cannot see.
  const problems = passwordProblems(admin.password, [admin.name, admin.email, school.name]);
  if (problems.length > 0) {
    return { ok: false, errors: { "admin.password": (await getT())(problems[0]!) } };
  }

  const t = await getT();

  const existing = await db.user.findUnique({ where: { email: admin.email }, select: { id: true } });
  if (existing) {
    return { ok: false, errors: { "admin.email": t("register.emailTakenLong") } };
  }

  const passwordHash = await hashPassword(admin.password);
  const verifyToken = generateToken();

  /**
   * ⚠ THE LANGUAGE THEY REGISTERED IN, not "en".
   *
   * This wrote `locale: "en"` flat. `getLocale` prefers `prefs.locale` the
   * moment a session exists, so a head teacher who read the landing page in
   * Marathi, filled this form in in Marathi and pressed the button was signed
   * straight into an English dashboard — and the only way back was a settings
   * page they now could not read. The cookie is the ONLY signal there is before
   * an account exists, which is exactly what it is for.
   */
  const locale = await getLocale();

  let created: { schoolId: string; userId: string; code: string } | undefined;

  /**
   * THE ONE FLOW THAT CREATES ITS OWN TENANT, which makes it the awkward one.
   *
   * Two things follow from row-level security and neither is optional. The write
   * needs `app.school_ids` to contain the school it is inserting — so the id is
   * minted HERE rather than by the database, and bound before the transaction
   * opens. And the old collision pre-checks (`findUnique` on code and slug)
   * cannot work at all: they ask about OTHER schools, which the policies
   * correctly hide, so they saw nothing, reported no clash, and left the unique
   * index to fail the insert.
   *
   * So collisions are handled the way they should have been anyway — by trying,
   * and reacting to the constraint. That is race-free, which a pre-check never
   * was: two schools registering the same name in the same second both saw no
   * clash.
   */
  const baseSlug = slugify(school.name);

  for (let attempt = 0; attempt < 6; attempt++) {
    const schoolId = randomUUID();
    const code = schoolCode(school.name);
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    try {
      created = await forSchool(schoolId, () =>
        db.$tenantTransaction(async (rawTx) => {
          const tx = rawTx as typeof db;
      const createdSchool = await tx.school.create({
        data: {
          id: schoolId,
          name: school.name,
          slug,
          code,
          contactEmail: school.contactEmail,
          contactPhone: school.contactPhone || null,
          website: school.website || null,
          addressLine: school.addressLine || null,
          city: school.city || null,
          region: school.region || null,
          postalCode: school.postalCode || null,
          country: school.country || null,
          gradeLow: school.gradeLow || null,
          gradeHigh: school.gradeHigh || null,
          // The words become the directory profile's draft; publishing stays
          // a deliberate later act behind the checklist's directory step.
          profileAbout: school.about || "",
          timezone: school.timezone,
          brandPrimary: school.brandPrimary || null,
          onboardingState: writeJson({ createdSchool: true }),
        },
      });

      const createdUser = await tx.user.create({
        data: {
          email: admin.email,
          name: admin.name,
          passwordHash,
          prefs: writeJson({ theme: "system", locale }),
        },
      });

      await tx.membership.create({
        data: {
          userId: createdUser.id,
          schoolId: createdSchool.id,
          role: "ADMIN",
          status: "ACTIVE",
        },
      });

      await tx.authToken.create({
        data: {
          userId: createdUser.id,
          email: admin.email,
          purpose: "EMAIL_VERIFY",
          tokenHash: hashToken(verifyToken),
          expiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_HOURS * 3_600_000),
        },
      });

          return { schoolId: createdSchool.id, userId: createdUser.id, code };
        }),
      );
      break;
    } catch (error) {
      // A taken slug or code is worth another go with a different one; anything
      // else is ours and should not be retried five more times.
      const taken =
        typeof error === "object" &&
        error !== null &&
        (error as { code?: string }).code === "P2002";
      if (taken && attempt < 5) continue;

      console.error("[register] transaction failed", error);
      return { ok: false, errors: { _form: t("register.couldNotCreate") } };
    }
  }

  if (!created) {
    return { ok: false, errors: { _form: t("register.couldNotCreate") } };
  }

  // Outside the transaction: an email provider hiccup must not roll back a
  // successfully created school. The admin can re-request verification.
  await sendVerifyEmail(
    admin.email,
    `${APP_URL}/verify?token=${verifyToken}`,
    school.name,
  ).catch((error) => console.error("[register] verification email failed", error));

  await audit({
    schoolId: created.schoolId,
    actorUserId: created.userId,
    action: "school.create",
    targetType: "School",
    targetId: created.schoolId,
    meta: { name: school.name, code: created.code },
  });

  await createSession(created.userId, { schoolId: created.schoolId, role: "ADMIN" });

  return { ok: true, errors: {}, schoolCode: created.code };
}

/** Server-side availability check used by the wizard's live validation. */
export async function checkEmailAvailable(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return true;
  const existing = await db.user.findUnique({
    where: { email: normalized },
    select: { id: true },
  });
  return !existing;
}
