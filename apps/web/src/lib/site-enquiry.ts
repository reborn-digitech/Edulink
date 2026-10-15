import "server-only";
import type { SiteEnquiryBody, SiteLanguage } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { consume, consumeByCaller } from "./rate-limit";
import { forSchool } from "./tenant-context";
import { CONTACTABLE_ROLES } from "./constants";
import { readJson } from "./json";
import { isEmailish, isPhoneish, sectionOn } from "./site-config";
import { publishedSiteFor, schoolIdForSlug, type SiteSnapshot } from "./site-publish";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * AN ADMISSION ENQUIRY FROM A SCHOOL'S PUBLIC WEBSITE (website-builder A, 15 October 2026).
 *
 * The site is static and its visitor signed in to nothing, while the shared enquiries (Enquiry, enquiries.ts)
 * need a signed-in parent — so the site's form writes its own row, SchoolSiteEnquiry, under the school's
 * binding (the school id is the live version's, which the database returned for the slug). The form exists
 * only while the published site carries the Admissions section with the form on; the module must be on.
 *
 * LIMITS, as every signed-out form here: five valid enquiries an hour per caller address (counted after the
 * form is checked, like the expert applications), and a hundred a day per school so a flood cannot bury the
 * office. A hidden field (`website`) a person never sees and a robot fills: a body carrying it is thanked and
 * dropped. The admissions contact (or, with none, the admins) is told in the app; the office reads the
 * enquiries on /admin/website. No personal word goes into the audit row.
 */

export const SITE_ENQUIRIES_PER_HOUR = { limit: 5, windowMs: 60 * 60_000 };
export const SITE_ENQUIRIES_PER_SCHOOL_DAY = { limit: 100, windowMs: 24 * 60 * 60_000 };

export type SiteEnquiryOutcome =
  | { ok: true; schoolId: string; schoolName: string; language: SiteLanguage; colour: string }
  | { ok: false; status: 404 | 422 | 429; errorKey: TranslationKey; retryAfterSeconds?: number; language?: SiteLanguage; colour?: string };

export async function takeSiteEnquiry(slug: string, body: SiteEnquiryBody): Promise<SiteEnquiryOutcome> {
  const schoolId = await schoolIdForSlug(slug);
  const site = schoolId ? await publishedSiteFor(schoolId) : null;
  if (!schoolId || !site) return { ok: false, status: 404, errorKey: "site.notFoundBody" };
  const live = await db.schoolSiteVersion.findFirst({ where: { schoolId, liveAt: { not: null } }, select: { snapshotJson: true } });
  const config = readJson<Partial<SiteSnapshot>>(live?.snapshotJson, {}).config;
  if (!config || !sectionOn(config, "ADMISSIONS") || !config.enquiryForm) return { ok: false, status: 404, errorKey: "site.notFoundBody", language: site.language, colour: site.colour };
  const look = { language: site.language, colour: site.colour };

  // A robot filled the field nobody sees: thank it and keep nothing.
  if (body.website.trim()) {
    const school = await forSchool(schoolId, () => db.school.findUnique({ where: { id: schoolId }, select: { name: true } }));
    return { ok: true, schoolId, schoolName: school?.name ?? "", ...look };
  }
  const contact = body.contact.trim();
  if (!isEmailish(contact) && !isPhoneish(contact)) return { ok: false, status: 422, errorKey: "site.refusedContact", ...look };

  const gate = await consumeByCaller("site-enquiry", SITE_ENQUIRIES_PER_HOUR);
  if (!gate.allowed) return { ok: false, status: 429, errorKey: "site.busyBody", retryAfterSeconds: gate.retryAfterSeconds, ...look };
  const perSchool = await consume(`site-enquiry-school:${schoolId}`, SITE_ENQUIRIES_PER_SCHOOL_DAY.limit, SITE_ENQUIRIES_PER_SCHOOL_DAY.windowMs);
  if (!perSchool.allowed) return { ok: false, status: 429, errorKey: "site.busyBody", retryAfterSeconds: perSchool.retryAfterSeconds, ...look };

  return forSchool(schoolId, async () => {
    const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true, admissionsContactMembershipId: true } });
    const row = await db.schoolSiteEnquiry.create({
      data: { schoolId, name: body.name.trim(), contact, grade: body.grade.trim(), message: body.message.trim(), locale: site.language },
      select: { id: true },
    });
    const recipients = await contactsOf(schoolId, school.admissionsContactMembershipId);
    await Promise.all(recipients.map((userId) => notify({ userId, schoolId, kind: "ENQUIRY", titleKey: "website.notifEnquiry", titleVars: { name: body.name.trim().slice(0, 60) }, url: "/admin/website/publish#enquiries" })));
    await audit({ schoolId, actorUserId: null, action: "site.enquiry", targetType: "SchoolSiteEnquiry", targetId: row.id });
    return { ok: true, schoolId, schoolName: school.name, ...look };
  });
}

/** The admissions contact while still contactable, else the school's admins (the shared enquiries' own rule). */
async function contactsOf(schoolId: string, contactMembershipId: string | null): Promise<string[]> {
  if (contactMembershipId) {
    const named = await db.membership.findFirst({ where: { id: contactMembershipId, schoolId, status: "ACTIVE", role: { in: [...CONTACTABLE_ROLES] } }, select: { userId: true } });
    if (named) return [named.userId];
  }
  const admins = await db.membership.findMany({ where: { schoolId, status: "ACTIVE", leftAt: null, role: "ADMIN" }, select: { userId: true } });
  return [...new Set(admins.map((a) => a.userId))];
}
