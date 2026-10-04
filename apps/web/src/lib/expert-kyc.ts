import "server-only";
import { EXPERT_KYC_MAX_DOCUMENTS, EXPERT_RATING_MINIMUM, type ExpertKyc, type ExpertKycStatus, type ExpertRating } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { sendExpertNotice } from "./email";
import { notify } from "./notify";
import { generateToken } from "./crypto";
import { readJson } from "./json";
import { DEFAULT_PREFS, type UserPrefs } from "./session";
import { translator } from "@/lib/i18n/dictionary";
import { normaliseLocale } from "@/lib/i18n/locales";
import { AccessError } from "./tenancy";
import { forSchool, forUser } from "./tenant-context";
import type { ActiveContext } from "./session";

/**
 * An expert's standing beyond their own words.
 *
 * RATINGS are what families gave their sessions (GigBooking.rating, written
 * once by rateBooking), averaged on read and shown from three on — two people's
 * opinion of somebody is gossip, not a score. The rows are each school's, and
 * a school browsing the marketplace holds no other school's binding; the
 * expert does hold every one of their own bookings (GigBooking is
 * SELF_READABLE by providerUserId), so the average is read under the expert's
 * own user binding — `forUser` with an id the database returned on the
 * profile row, never one a caller named — and only the number comes out.
 *
 * KYC is the operator checking who this person is, on papers the expert sends
 * through the upload-ticket pipeline. The stored ids open, through
 * files.ts, to the expert and the operator alone. ONE TRUTH with the older
 * "mark identity checked": `verifiedAt` is set by a VERIFIED decision and
 * cleared by any other, and `setExpertStanding` keeps `kycStatus` in step the
 * other way, so the badge every school reads has exactly one meaning.
 *
 * THE CALENDAR FEED is an iCalendar document of the expert's offered times and
 * booked sessions, opened by a per-expert token in the URL because a calendar
 * application holds no session. School names and session kinds only: no
 * pupil, no guardian, no topic a school typed, is ever in it (decision 0002).
 */

type ProfileRow = { id: string; userId: string; kycStatus: string; kycNote: string | null; kycSubmittedAt: Date | null; kycDecidedAt: Date | null; kycDocumentIds: string[]; calendarToken: string | null; timezone: string };
const PROFILE_SELECT = { id: true, userId: true, kycStatus: true, kycNote: true, kycSubmittedAt: true, kycDecidedAt: true, kycDocumentIds: true, calendarToken: true, timezone: true } as const;

/** The expert's own profile row, listed or not: papers are sent before anybody is listed. */
async function ownProfile(ctx: ActiveContext): Promise<ProfileRow> {
  if (ctx.role !== "EXPERT") throw new AccessError("access.notAnExpert");
  const profile = await db.expertProfile.findUnique({ where: { userId: ctx.user.id }, select: PROFILE_SELECT });
  if (!profile) throw new AccessError("access.noExpertProfile", "NOT_FOUND");
  return profile;
}

/* -------------------------------------------------------------------------- */
/* Ratings                                                                     */
/* -------------------------------------------------------------------------- */

/** Families' ratings of each expert's delivered sessions, by the expert's user id; null below the minimum. */
export async function expertRatings(userIds: string[]): Promise<Map<string, ExpertRating>> {
  const out = new Map<string, ExpertRating>();
  await Promise.all(
    [...new Set(userIds)].map(async (userId) => {
      const agg = await forUser(userId, () => db.gigBooking.aggregate({ where: { providerUserId: userId, status: "DELIVERED", rating: { not: null } }, _avg: { rating: true }, _count: { rating: true } }));
      const count = agg._count.rating;
      const average = agg._avg.rating;
      out.set(userId, count >= EXPERT_RATING_MINIMUM && average !== null ? { average: Math.round(average * 10) / 10, count } : null);
    }),
  );
  return out;
}

/* -------------------------------------------------------------------------- */
/* KYC                                                                         */
/* -------------------------------------------------------------------------- */

const asStatus = (raw: string): ExpertKycStatus => (raw === "SUBMITTED" || raw === "VERIFIED" || raw === "REJECTED" ? raw : "NONE");

/** The stored ids with what the upload pipeline sniffed of each; an id whose ticket has gone is still listed, as an id. */
async function documentsOf(ids: string[]): Promise<ExpertKyc["documents"]> {
  if (ids.length === 0) return [];
  const tickets = await db.uploadTicket.findMany({ where: { fileId: { in: ids } }, select: { fileId: true, mime: true, size: true } });
  const byId = new Map(tickets.map((t) => [t.fileId, t]));
  return ids.map((fileId) => ({ fileId, mime: byId.get(fileId)?.mime ?? "application/octet-stream", size: byId.get(fileId)?.size ?? 0 }));
}

export function kycView(row: Pick<ProfileRow, "kycStatus" | "kycNote" | "kycSubmittedAt" | "kycDecidedAt">, documents: ExpertKyc["documents"]): ExpertKyc {
  const status = asStatus(row.kycStatus);
  return { status, note: row.kycNote, submittedAt: row.kycSubmittedAt?.toISOString() ?? null, decidedAt: row.kycDecidedAt?.toISOString() ?? null, documents, canSubmit: status !== "VERIFIED" };
}

/** GET /api/v1/expert/kyc — where the expert's papers stand. */
export async function readKyc(ctx: ActiveContext): Promise<ExpertKyc> {
  const profile = await ownProfile(ctx);
  return kycView(profile, await documentsOf(profile.kycDocumentIds));
}

/** For the operator's queue: every profile's papers at once. */
export async function kycViews(rows: Pick<ProfileRow, "id" | "kycStatus" | "kycNote" | "kycSubmittedAt" | "kycDecidedAt" | "kycDocumentIds">[]): Promise<Map<string, ExpertKyc>> {
  const docs = await documentsOf(rows.flatMap((r) => r.kycDocumentIds));
  const byId = new Map(docs.map((d) => [d.fileId, d]));
  return new Map(rows.map((r) => [r.id, kycView(r, r.kycDocumentIds.map((id) => byId.get(id) ?? { fileId: id, mime: "application/octet-stream", size: 0 }))]));
}

/**
 * The expert sends their papers: ids of files they uploaded themselves
 * (unspent tickets in their own name — files.ts would otherwise open to the
 * operator a file the expert merely saw), one to five, with a note. A set
 * still waiting may be replaced; a verified expert has nothing to send.
 */
export async function submitKyc(ctx: ActiveContext, input: { documentIds: string[]; note?: string }, now: Date = new Date()): Promise<void> {
  const profile = await ownProfile(ctx);
  if (profile.kycStatus === "VERIFIED") throw new AccessError("expert.kycAlreadyVerified");
  const ids = [...new Set(input.documentIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0 || ids.length > EXPERT_KYC_MAX_DOCUMENTS) throw new AccessError("expert.kycDocumentsCount", "FORBIDDEN", { max: EXPERT_KYC_MAX_DOCUMENTS });
  const kept = new Set(profile.kycDocumentIds);
  const fresh = ids.filter((id) => !kept.has(id));
  const tickets = fresh.length ? await db.uploadTicket.findMany({ where: { fileId: { in: fresh }, userId: ctx.user.id, consumedAt: null }, select: { fileId: true } }) : [];
  if (tickets.length !== fresh.length) throw new AccessError("access.fileNotYours", "NOT_FOUND");
  const note = (input.note ?? "").trim().slice(0, 1_000) || null;
  await db.expertProfile.update({ where: { id: profile.id }, data: { kycStatus: "SUBMITTED", kycNote: note, kycSubmittedAt: now, kycDecidedAt: null, kycDocumentIds: ids, verifiedAt: null, verifiedBy: null } });
  if (fresh.length) await db.uploadTicket.updateMany({ where: { fileId: { in: fresh }, consumedAt: null }, data: { consumedAt: now } });
  await audit({ actorUserId: ctx.user.id, action: "expert.kyc.submit", targetType: "ExpertProfile", targetId: profile.id, meta: { documents: ids.length } });
}

export type KycDecision = { ok: true } | { ok: false; errorKey: TranslationKey };

/**
 * The operator decides. VERIFIED sets `verifiedAt` (the marketplace badge);
 * REJECTED needs a reason and clears it. The expert is told either way — the
 * "kyc.decided" event — in the app and by mail, both in their own language.
 * The in-app row has NO school: an expert's tenant set is empty, and a
 * school-less notice addressed to the acting user is what the
 * Notification_no_school_insert policy allows (scripts/gen-rls.ts) — before
 * it, the tenant clause refused the row and the decision went by mail alone.
 * The profile page says the same the next time it is opened.
 */
export async function decideKyc(ctx: ActiveContext, profileId: string, input: { decision: "VERIFIED" | "REJECTED"; note?: string }, now: Date = new Date()): Promise<KycDecision> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  const profile = await db.expertProfile.findUnique({ where: { id: profileId }, select: { ...PROFILE_SELECT, user: { select: { name: true, preferredName: true, email: true, prefs: true } } } });
  if (!profile) return { ok: false, errorKey: "root.noSuchExpert" };
  const note = (input.note ?? "").trim().slice(0, 1_000) || null;
  if (input.decision === "REJECTED" && !note) return { ok: false, errorKey: "expert.kycNeedReason" };
  if (profile.kycStatus === "NONE" && profile.kycDocumentIds.length === 0 && input.decision === "VERIFIED") return { ok: false, errorKey: "expert.kycNothingSent" };
  const verified = input.decision === "VERIFIED";
  await db.expertProfile.update({
    where: { id: profile.id },
    data: { kycStatus: input.decision, kycNote: note, kycDecidedAt: now, verifiedAt: verified ? now : null, verifiedBy: verified ? ctx.user.id : null },
  });
  // No schoolId: the operator's acts belong to no tenant's Safety Centre.
  await audit({ actorUserId: ctx.user.id, action: verified ? "expert.kyc.verify" : "expert.kyc.reject", targetType: "ExpertProfile", targetId: profile.id, meta: { name: profile.user.name, noted: Boolean(note) } });
  const titleKey = verified ? "expert.kycVerifiedNotif" : "expert.kycRejectedNotif";
  const bodyKey = verified ? "expert.kycVerifiedNotifBody" : "expert.kycRejectedNotifBody";
  // Written under the expert's own binding (an id the database returned on the profile row), so the
  // row is theirs on both sides of the policy: the INSERT's check, and the read-back Prisma's create
  // asks for, which the operator's own binding would not pass. The decision stands whatever happens
  // to the telling: a notice that fails is logged, as the mail is.
  await forUser(profile.userId, () => notify({ userId: profile.userId, schoolId: null, kind: "EXPERT", titleKey, bodyKey, bodyVars: { note: note ?? "" }, url: "/expert/profile", meta: { event: "kyc.decided", decision: input.decision } })).catch((error) => console.error("[expert-kyc] kyc.decided notice failed", error));
  if (profile.user.email) {
    const locale = normaliseLocale(readJson<UserPrefs>(profile.user.prefs, DEFAULT_PREFS).locale);
    const t = translator(locale);
    await sendExpertNotice({
      locale,
      to: profile.user.email,
      subject: t(titleKey),
      heading: t(titleKey),
      lines: [t(bodyKey, { note: note ?? "" }).trim()],
      cta: { label: t("expert.yourProfile"), path: "/expert/profile" },
    }).catch((error) => console.error("[expert-kyc] kyc.decided mail failed", error));
  }
  return { ok: true };
}

/** For files.ts: the expert whose papers a stored file belongs to, or null. */
export async function kycOwningFile(fileId: string): Promise<{ userId: string } | null> {
  return db.expertProfile.findFirst({ where: { kycDocumentIds: { has: fileId } }, select: { userId: true } });
}

/* -------------------------------------------------------------------------- */
/* The calendar feed                                                           */
/* -------------------------------------------------------------------------- */

export const CALENDAR_PATH = "/api/v1/expert/calendar.ics";
const feedUrl = (token: string | null): string | null => (token ? `${CALENDAR_PATH}?token=${encodeURIComponent(token)}` : null);

/** The feed URL as it stands, or null until one is minted. */
export async function calendarTokenUrl(ctx: ActiveContext): Promise<{ url: string | null }> {
  const profile = await ownProfile(ctx);
  return { url: feedUrl(profile.calendarToken) };
}

/** Mint the feed's token, or rotate it: the old URL stops answering in the same write. */
export async function rotateCalendarToken(ctx: ActiveContext): Promise<{ url: string }> {
  const profile = await ownProfile(ctx);
  const token = generateToken(24);
  await db.expertProfile.update({ where: { id: profile.id }, data: { calendarToken: token } });
  await audit({ actorUserId: ctx.user.id, action: "expert.calendar.token", targetType: "ExpertProfile", targetId: profile.id, meta: { rotated: profile.calendarToken !== null } });
  return { url: feedUrl(token)! };
}

const icsStamp = (at: Date) => at.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
/** RFC 5545 TEXT: backslashes, semicolons, commas and line breaks escaped. */
const icsText = (raw: string) => raw.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** Lines folded at 75 octets, continuation lines starting with a space. */
function fold(line: string): string[] {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.byteLength <= 75) return [line];
  const out: string[] = [];
  let rest = line;
  let first = true;
  while (rest.length) {
    const limit = first ? 75 : 74;
    let take = Math.min(rest.length, limit);
    while (take > 1 && Buffer.byteLength(rest.slice(0, take), "utf8") > limit) take -= 1;
    out.push((first ? "" : " ") + rest.slice(0, take));
    rest = rest.slice(take);
    first = false;
  }
  return out;
}

export type FeedEvent = { uid: string; startsAt: Date; endsAt: Date; summary: string; description: string; cancelled: boolean };

/** The document for a list of events; exported for the test to hold the shape. */
export function renderIcs(events: FeedEvent[], now: Date, calendarName: string): string {
  const lines: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Shalaghar//ExpertCalendar//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${icsText(calendarName)}`];
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.uid}@relay`, `DTSTAMP:${icsStamp(now)}`, `DTSTART:${icsStamp(e.startsAt)}`, `DTEND:${icsStamp(e.endsAt)}`, `SUMMARY:${icsText(e.summary)}`);
    if (e.description) lines.push(`DESCRIPTION:${icsText(e.description)}`);
    lines.push(`STATUS:${e.cancelled ? "CANCELLED" : "CONFIRMED"}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.flatMap(fold).join("\r\n") + "\r\n";
}

const DAY = 86_400_000;
type Words = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/**
 * The expert's feed by its token: the last sixty days and everything ahead of
 * their sessions and workshops (decision 0004's slots, with how many seats
 * are taken and which schools' pupils hold them) and their consultation
 * windows (free, or booked by a school). Null when no profile holds the
 * token — which is what a rotated token becomes. Read under the expert's own
 * binding, as their session would be; the school names come school by
 * school under each school's own, as the sessions page reads them.
 */
export async function calendarFeed(token: string, t: Words, now: Date = new Date()): Promise<string | null> {
  if (!token || token.length > 200) return null;
  const profile = await db.expertProfile.findUnique({ where: { calendarToken: token }, select: { ...PROFILE_SELECT, user: { select: { name: true, preferredName: true } } } });
  if (!profile) return null;
  const since = new Date(now.getTime() - 60 * DAY);
  const kindWord = (kind: string) => (kind === "WORKSHOP" ? t("gigs.kindWORKSHOP") : t("gigs.kindONE_TO_ONE"));
  return forUser(profile.userId, async () => {
    const events: FeedEvent[] = [];
    const slots = await db.gigSlot.findMany({ where: { providerUserId: profile.userId, startsAt: { gte: since } }, orderBy: { startsAt: "asc" }, take: 500, select: { id: true, kind: true, title: true, startsAt: true, endsAt: true, seats: true, seatsTaken: true, cancelledAt: true } });
    const seats = slots.length ? await db.gigBooking.findMany({ where: { providerUserId: profile.userId, slotId: { in: slots.map((s) => s.id) }, status: { in: ["PENDING_CONSENT", "CONFIRMED", "DELIVERED"] } }, select: { slotId: true, schoolId: true } }) : [];
    const schoolNames = new Map<string, string>();
    for (const schoolId of new Set(seats.map((b) => b.schoolId))) {
      const school = await forSchool(schoolId, () => db.school.findUnique({ where: { id: schoolId }, select: { name: true } }));
      if (school) schoolNames.set(schoolId, school.name);
    }
    for (const s of slots) {
      const held = seats.filter((b) => b.slotId === s.id);
      const schools = [...new Set(held.map((b) => schoolNames.get(b.schoolId)).filter((n): n is string => Boolean(n)))];
      const summary = `${kindWord(s.kind)}: ${s.title}`;
      const description = s.cancelledAt ? t("expert.icsCancelled") : held.length === 0 ? t("expert.icsNoSeats") : t("expert.icsSeats", { taken: held.length, seats: s.seats, schools: schools.join(", ") || t("expert.icsSchoolsUnnamed") });
      events.push({ uid: `gig-slot-${s.id}`, startsAt: s.startsAt, endsAt: s.endsAt, summary, description, cancelled: s.cancelledAt !== null });
    }
    const windows = await db.expertSlot.findMany({ where: { expertProfileId: profile.id, startsAt: { gte: since } }, orderBy: { startsAt: "asc" }, take: 500, select: { id: true, startsAt: true, endsAt: true, cancelledAt: true, booking: { select: { status: true, schoolId: true } } } });
    const bookedSchools = new Map<string, string>();
    for (const schoolId of new Set(windows.map((w) => w.booking?.schoolId).filter((id): id is string => Boolean(id)))) {
      // The id came from the expert's own booking row; the name is read under that school's binding, as the seats' were.
      const school = await forSchool(schoolId, () => db.school.findUnique({ where: { id: schoolId }, select: { name: true } }));
      if (school) bookedSchools.set(schoolId, school.name);
    }
    for (const w of windows) {
      const booked = w.booking && w.booking.status !== "CANCELLED" ? w.booking : null;
      const schoolName = booked ? bookedSchools.get(booked.schoolId) : undefined;
      const summary = booked ? t("expert.icsConsultationWith", { school: schoolName ?? t("expert.icsSchoolsUnnamed") }) : t("expert.icsWindowFree");
      events.push({ uid: `expert-slot-${w.id}`, startsAt: w.startsAt, endsAt: w.endsAt, summary, description: booked ? t("expert.icsConsultationBody") : t("expert.icsWindowBody"), cancelled: w.cancelledAt !== null });
    }
    return renderIcs(events, now, t("expert.icsCalendarName", { name: profile.user.preferredName ?? profile.user.name }));
  });
}
