import "server-only";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { writeDefaultModules } from "./modules";
import { selfReadAgeDefault } from "./self-read";
import { streamsToStore } from "./streams";
import { db } from "./db";
import { hashPassword, generateToken, hashToken } from "./crypto";
import { schoolCode, slugify } from "./codes";
import { sendVerifyEmail } from "./email";
import { audit } from "./audit";
import { forSchool } from "./tenant-context";
import { EMAIL_VERIFY_TTL_HOURS } from "./constants";
import { writeJson } from "./json";
import { normaliseLocation } from "./places";
import { tellHolderOfSignup } from "./signup-notice";
import type { registerSchoolSchema } from "./validation";
import type { Locale } from "./i18n/locales";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type SchoolSignupOutcome = { outcome: "created"; schoolId: string; userId: string; code: string } | { outcome: "taken" } | { outcome: "failed" };

/**
 * The half of a school's registration that depends on the founder's address,
 * run after the form has been answered (QA-25, 24 Oct 2026; the action is
 * register/actions.ts, which checks the form and answers the same sentence
 * whatever happens here).
 *
 * An address that already has an account makes nothing: its holder is told by
 * email that somebody tried (signup-notice.ts). A free one makes the school and
 * its first admin in one transaction and mails the confirmation link; the
 * founder signs in with the password they chose. The two presses of one
 * address in the same second land on the unique index, and the second is the
 * taken case.
 *
 * Everything below is the registration as it was written before it moved here
 * (one transaction; a half-created school with no admin would be unrecoverable
 * from the UI — §10).
 */
export async function completeSchoolRegistration(data: z.infer<typeof registerSchoolSchema>, locale: Locale): Promise<SchoolSignupOutcome> {
  const { school, admin, kind, streams } = data;

  const existing = await db.user.findUnique({ where: { email: admin.email }, select: { id: true } });
  if (existing) {
    await tellHolderOfSignup(admin.email, "SCHOOL");
    return { outcome: "taken" };
  }

  const passwordHash = await hashPassword(admin.password);
  const verifyToken = generateToken();

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
  // The directory groups on the exact string, so the country and state are
  // saved in one shape whatever the wizard was handed. See lib/places.ts.
  const location = normaliseLocation(school);

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
              region: location.region,
              postalCode: school.postalCode || null,
              country: location.country,
              gradeLow: school.gradeLow || null,
              gradeHigh: school.gradeHigh || null,
              // The words become the directory profile's draft; publishing stays
              // a deliberate later act behind the checklist's directory step.
              profileAbout: school.about || "",
              timezone: school.timezone,
              brandPrimary: school.brandPrimary || null,
              onboardingState: writeJson({ createdSchool: true }),
              kind,
              streamsJson: streamsToStore(kind, streams),
              // A college's adults read their own health card and incidents from 18 (DS-5, self-read.ts); a school starts at never.
              selfReadAge: selfReadAgeDefault(kind),
            },
          });

          const createdUser = await tx.user.create({
            data: {
              email: admin.email,
              name: admin.name,
              passwordHash,
              // ⚠ THE LANGUAGE THEY REGISTERED IN, not "en" (register/actions.ts says why).
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
          // Every school starts with ALUMNI on (3 Oct 2026), a college with ACADEMICS too (4 Oct) and its streams' preset (5 Oct); the rest wait for the admin.
          await writeDefaultModules(createdSchool.id, tx, kind, streams);

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
      // A taken slug or code is worth another go with a different one; the
      // founder's address taken a moment ago is the taken case; anything else
      // is ours and should not be retried five more times.
      const unique = typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
      const target = unique ? String((error as { meta?: { target?: unknown } }).meta?.target ?? "") : "";
      if (unique && target.includes("email")) {
        await tellHolderOfSignup(admin.email, "SCHOOL");
        return { outcome: "taken" };
      }
      if (unique && attempt < 5) continue;
      console.error("[register] transaction failed", error);
      return { outcome: "failed" };
    }
  }

  if (!created) return { outcome: "failed" };

  // Outside the transaction: an email provider hiccup must not roll back a
  // successfully created school. The admin can re-request verification.
  await sendVerifyEmail(admin.email, `${APP_URL}/verify?token=${verifyToken}`, school.name, locale).catch((error) =>
    console.error("[register] verification email failed", error),
  );

  await audit({
    schoolId: created.schoolId,
    actorUserId: created.userId,
    action: "school.create",
    targetType: "School",
    targetId: created.schoolId,
    meta: { name: school.name, code: created.code, kind, streams: JSON.parse(streamsToStore(kind, streams)) },
  });

  return { outcome: "created", ...created };
}
