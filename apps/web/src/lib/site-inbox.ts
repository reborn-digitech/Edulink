import "server-only";
import { SITE_ENQUIRY_KEEP_DAYS, SITE_LANGUAGES, type SiteEnquiryRow, type SiteEnquiryStatus, type SiteLanguage } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { sendSiteEnquiryReply } from "./email";
import { translator } from "./i18n/dictionary";
import { isEmailish } from "./site-config";
import { siteEditor } from "./site-admin";
import { pruneSiteVisits } from "./site-visits";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * THE WEBSITE'S ENQUIRIES, AN INBOX IN THE EDITOR (website-two, 16 October 2026). An enquiry from the site's form is
 * NEW until the office or the head replies — by email, in the enquirer's own language (the language of the page the
 * form was on), through the platform's one mail helper — when it is REPLIED with what was written, or closes it
 * (CLOSED); a closed one may be opened again. Every reply and every change of state is audited (site.enquiry.reply,
 * site.enquiry.status) with nothing personal in the audit row. An enquiry that gave only a phone cannot be answered
 * by email here: the inbox says so and the office calls.
 *
 * RETENTION, stated on the form: the weekly site:enquiries job (Sundays 04:30) deletes an enquiry closed for
 * SITE_ENQUIRY_KEEP_DAYS (180) days, or one nobody has touched for as long, and the site's page-view counts older
 * than 400 days.
 */

type Row = { id: string; name: string; contact: string; email: string; grade: string; wantsVisit: boolean; message: string; locale: string; createdAt: Date; status: string; replyText: string; repliedAt: Date | null };

const languageOf = (raw: string): SiteLanguage => ((SITE_LANGUAGES as readonly string[]).includes(raw) ? (raw as SiteLanguage) : "en");
const statusOf = (raw: string): SiteEnquiryStatus => (raw === "REPLIED" || raw === "CLOSED" ? raw : "NEW");

/** Where a reply goes: the form's email field, else the contact when it is an email; null when only a phone was given. */
export function replyAddress(row: { email: string; contact: string }): string | null {
  if (row.email.trim() && isEmailish(row.email.trim())) return row.email.trim();
  return isEmailish(row.contact.trim()) ? row.contact.trim() : null;
}

function toRow(r: Row): SiteEnquiryRow {
  return {
    id: r.id,
    name: r.name,
    contact: r.contact,
    email: r.email,
    grade: r.grade,
    wantsVisit: r.wantsVisit,
    message: r.message,
    language: languageOf(r.locale),
    createdAt: r.createdAt.toISOString(),
    status: statusOf(r.status),
    replyText: r.replyText,
    repliedAt: r.repliedAt?.toISOString() ?? null,
    replyTo: replyAddress(r),
  };
}

const SELECT = { id: true, name: true, contact: true, email: true, grade: true, wantsVisit: true, message: true, locale: true, createdAt: true, status: true, replyText: true, repliedAt: true } as const;

/** The inbox, newest first (a hundred at most), filtered by state when asked, with the count in each state. */
export async function siteInbox(ctx: ActiveContext, status?: SiteEnquiryStatus): Promise<{ enquiries: SiteEnquiryRow[]; counts: Record<SiteEnquiryStatus, number> }> {
  const ed = await siteEditor(ctx);
  const [rows, grouped] = await Promise.all([
    db.schoolSiteEnquiry.findMany({ where: { schoolId: ed.schoolId, ...(status ? { status } : {}) }, orderBy: { createdAt: "desc" }, take: 100, select: SELECT }),
    db.schoolSiteEnquiry.groupBy({ by: ["status"], where: { schoolId: ed.schoolId }, _count: { _all: true } }),
  ]);
  const counts: Record<SiteEnquiryStatus, number> = { NEW: 0, REPLIED: 0, CLOSED: 0 };
  for (const g of grouped) counts[statusOf(g.status)] += g._count._all;
  return { enquiries: rows.map(toRow), counts };
}

export type SiteReplyResult = { ok: true; enquiry: SiteEnquiryRow } | { ok: false; status: 409 | 422; errorKey: TranslationKey };

/** Reply by email in the enquirer's language; the enquiry becomes REPLIED with the words kept. Audited. */
export async function replyToSiteEnquiry(ctx: ActiveContext, enquiryId: string, text: string, now: Date = new Date()): Promise<SiteReplyResult> {
  const ed = await siteEditor(ctx);
  const words = text.trim();
  if (!words || words.length > 4000) return { ok: false, status: 422, errorKey: "siteEditor.refuseReplyEmpty" };
  const row = await db.schoolSiteEnquiry.findFirst({ where: { id: enquiryId, schoolId: ed.schoolId }, select: SELECT });
  if (!row) throw new AccessError("website.enquiryNotFound", "NOT_FOUND");
  const to = replyAddress(row);
  if (!to) return { ok: false, status: 409, errorKey: "siteEditor.refuseReplyNoEmail" };
  const school = await db.school.findUniqueOrThrow({ where: { id: ed.schoolId }, select: { name: true } });
  const locale = languageOf(row.locale);
  const t = translator(locale);
  await sendSiteEnquiryReply({
    to,
    locale,
    subject: t("siteEditor.replySubject", { school: school.name }),
    lines: [t("siteEditor.replyGreeting", { name: row.name }), words, t("siteEditor.replyFooter", { school: school.name })],
  });
  const updated = await db.schoolSiteEnquiry.update({
    where: { id: row.id },
    data: { status: "REPLIED", replyText: words, repliedAt: now, repliedByUserId: ed.userId, closedAt: null, lastActivityAt: now, readAt: row.status === "NEW" ? now : undefined, readByUserId: row.status === "NEW" ? ed.userId : undefined },
    select: SELECT,
  });
  await audit({ schoolId: ed.schoolId, actorUserId: ed.userId, action: "site.enquiry.reply", targetType: "SchoolSiteEnquiry", targetId: row.id });
  return { ok: true, enquiry: toRow(updated) };
}

/** Close an enquiry, or open it again (NEW, or REPLIED when it was answered). Audited when the state changes. */
export async function setSiteEnquiryStatus(ctx: ActiveContext, enquiryId: string, status: SiteEnquiryStatus, now: Date = new Date()): Promise<SiteEnquiryRow> {
  const ed = await siteEditor(ctx);
  const row = await db.schoolSiteEnquiry.findFirst({ where: { id: enquiryId, schoolId: ed.schoolId }, select: SELECT });
  if (!row) throw new AccessError("website.enquiryNotFound", "NOT_FOUND");
  // REPLIED is what a reply makes; asked for directly it stands for "open again" on an answered enquiry.
  const next: SiteEnquiryStatus = status === "CLOSED" ? "CLOSED" : row.repliedAt ? "REPLIED" : "NEW";
  if (statusOf(row.status) === next) return toRow(row);
  const updated = await db.schoolSiteEnquiry.update({
    where: { id: row.id },
    data: { status: next, closedAt: next === "CLOSED" ? now : null, lastActivityAt: now },
    select: SELECT,
  });
  await audit({ schoolId: ed.schoolId, actorUserId: ed.userId, action: "site.enquiry.status", targetType: "SchoolSiteEnquiry", targetId: row.id, meta: { from: statusOf(row.status), to: next } });
  return toRow(updated);
}

/**
 * The weekly site:enquiries job (Sundays 04:30): enquiries closed for SITE_ENQUIRY_KEEP_DAYS days, or untouched for as
 * long, deleted; and the page-view counts past their own horizon. Counts per school, nothing that names a person.
 * Run under the jobs runner's owner connection, as the retention sweep is. `schoolIds` narrows it (a test's own).
 */
export async function tidySiteEnquiries(now: Date = new Date(), scope: { schoolIds?: string[] } = {}): Promise<{ deleted: number; visitsPruned: number; perSchool: Record<string, Record<string, number>> }> {
  const cutoff = new Date(now.getTime() - SITE_ENQUIRY_KEEP_DAYS * 24 * 60 * 60_000);
  const where = {
    ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}),
    OR: [{ status: "CLOSED", closedAt: { lt: cutoff } }, { lastActivityAt: { lt: cutoff } }],
  };
  const stale = await db.schoolSiteEnquiry.findMany({ where, select: { id: true, schoolId: true } });
  const perSchool: Record<string, Record<string, number>> = {};
  for (const s of stale) perSchool[s.schoolId] = { deleted: (perSchool[s.schoolId]?.deleted ?? 0) + 1 };
  const gone = stale.length ? await db.schoolSiteEnquiry.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } }) : { count: 0 };
  const visitsPruned = await pruneSiteVisits(now, scope);
  return { deleted: gone.count, visitsPruned, perSchool };
}
