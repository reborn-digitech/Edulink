import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { forSchool } from "./tenant-context";
import { readJson, writeJson } from "./json";
import { DEFAULT_PREFS, type ActiveContext, type UserPrefs } from "./session";
import { normaliseLocale } from "@edulink/i18n";
import { translator, type TranslationKey } from "./i18n/dictionary";
import { readMessageTemplateIds, readTwilioConfig, readWhatsappFrom, readWhatsappTransport } from "./env";
import { formatPhone } from "./phone";
import { todayKey, zonedStartOfDay } from "./dates";
import { currentAcademicYear } from "./academic-year";
import { notify } from "./notify";
import { mayUse } from "./platform-features";
import { MESSAGE_EVENTS, MESSAGE_TEMPLATES, OPT_OUT_FORM, isMessageTemplateKey, renderTemplate, smsSegments, whatsappVarOrder, type MessageEvent, type MessageTemplateKey } from "./message-templates";

/**
 * Texts to families: SMS and WhatsApp.
 *
 * WHAT THIS IS FOR. Most of a school's parents will not have the app in the
 * first year, and a push notification to a phone without it reaches nobody.
 * An absence, a fee due, a circular from the office — those have to arrive
 * as a text. This file decides WHO gets one, on WHICH channel, WHETHER the
 * school and the person allow it, and records every outcome including the
 * ones that did not happen, so the office can see the family it did not
 * reach rather than assume it did.
 *
 * THE ROUTING RULE, in order: the person has a number; the school has the
 * channel switched on and the server a transport for it; the person has
 * not switched that channel off in their own settings; the event is one
 * the school lets text; the school's monthly cap and the person's daily
 * cap are not reached. WhatsApp is tried before SMS when both are open,
 * because it costs the school less and carries a longer notice. Every
 * refusal is a SKIPPED row with its reason.
 *
 * ONE PROVIDER, TWO CHANNELS. Both go out through Twilio's Messages
 * endpoint (sms.ts already speaks it for the sign-in codes), with the same
 * "devbox" transport that files the message in /dev/mailbox instead. The
 * texts are the fixed templates in message-templates.ts — an Indian SMS
 * must match a DLT-registered template verbatim, and a WhatsApp template
 * send names a content SID — and the ids come from MESSAGE_TEMPLATE_IDS.
 */

export type Channel = "SMS" | "WHATSAPP";
/** "feature-off" (15 Oct 2026): the operator has the platform's TEXT_MESSAGING feature off (src/lib/platform-features.ts); nothing is texted anywhere, and the row says why. */
export type SkipReason = "no-phone" | "opted-out" | "channel-off" | "event-off" | "cap-monthly" | "cap-daily" | "no-transport" | "disabled" | "unverifiedNumber" | "feature-off";

/**
 * THE EVENTS THAT MAY REACH A NUMBER NOBODY PROVED. With School.textOfficePhones
 * on, a guardian with no proved number is texted at the guardian phone the
 * office typed on the pupil's record — for these three alone: the texts a
 * family must not miss and that say nothing a stranger could use. A receipt
 * (an amount), an incident (a child's name and what happened) and the
 * office's test stay with proved numbers.
 */
export const OFFICE_PHONE_EVENTS: readonly MessageEvent[] = ["absence", "feeReminders", "circulars"];

/** A person may be texted this many times a day, whatever the events say. */
export const DAILY_CAP_PER_PERSON = 5;
const SEND_TIMEOUT_MS = 15_000;
/** A broadcast this small is sent in the request; larger ones the job drains within the minute. */
const INLINE_SEND_LIMIT = 100;

/* -------------------------------------------------------------------------- */
/* School settings                                                             */
/* -------------------------------------------------------------------------- */

export type MessagingSettings = {
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  monthlyCap: number;
  events: Record<MessageEvent, boolean>;
  /** Absence notices, fee reminders and circulars may go to the office-entered guardian phone when no proved number exists. */
  textOfficePhones: boolean;
};

function eventsFrom(json: string): Record<MessageEvent, boolean> {
  const raw = readJson<Partial<Record<MessageEvent, boolean>>>(json, {});
  return Object.fromEntries(MESSAGE_EVENTS.map((e) => [e, raw[e] !== false])) as Record<MessageEvent, boolean>;
}

export async function messagingSettings(schoolId: string): Promise<MessagingSettings> {
  const s = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { msgSmsEnabled: true, msgWhatsappEnabled: true, msgMonthlyCap: true, msgEventsJson: true, textOfficePhones: true, plan: { select: { messageCap: true } } } });
  // The cap is the PLAN'S when the school is on a plan that states one (src/lib/plans.ts), else the school's own dial.
  return { smsEnabled: s.msgSmsEnabled, whatsappEnabled: s.msgWhatsappEnabled, monthlyCap: s.plan?.messageCap ?? s.msgMonthlyCap, events: eventsFrom(s.msgEventsJson), textOfficePhones: s.textOfficePhones };
}

function office(ctx: ActiveContext): { schoolId: string; userId: string } {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("messaging.refuseOffice");
  return { schoolId: ctx.schoolId, userId: ctx.user.id };
}
function officeOrHead(ctx: ActiveContext): { schoolId: string; userId: string } {
  if ((ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") || !ctx.schoolId) throw new AccessError("messaging.refuseOffice");
  return { schoolId: ctx.schoolId, userId: ctx.user.id };
}

export async function saveMessagingSettings(ctx: ActiveContext, input: { smsEnabled?: boolean; whatsappEnabled?: boolean; monthlyCap?: number; events?: Partial<Record<MessageEvent, boolean>>; textOfficePhones?: boolean }): Promise<void> {
  const caller = office(ctx);
  const current = await messagingSettings(caller.schoolId);
  const cap = input.monthlyCap === undefined ? current.monthlyCap : Math.round(input.monthlyCap);
  if (!Number.isFinite(cap) || cap < 0 || cap > 1_000_000) throw new AccessError("messaging.refuseCap");
  const events = { ...current.events, ...Object.fromEntries(Object.entries(input.events ?? {}).filter(([, v]) => typeof v === "boolean")) };
  await db.school.update({
    where: { id: caller.schoolId },
    data: { msgSmsEnabled: input.smsEnabled ?? current.smsEnabled, msgWhatsappEnabled: input.whatsappEnabled ?? current.whatsappEnabled, msgMonthlyCap: cap, msgEventsJson: writeJson(events), textOfficePhones: input.textOfficePhones ?? current.textOfficePhones },
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "messaging.settings", targetType: "School", targetId: caller.schoolId, meta: { sms: input.smsEnabled ?? current.smsEnabled, whatsapp: input.whatsappEnabled ?? current.whatsappEnabled, cap, textOfficePhones: input.textOfficePhones ?? current.textOfficePhones } });
}

/* -------------------------------------------------------------------------- */
/* Transport readiness                                                         */
/* -------------------------------------------------------------------------- */

export type TransportStatus = { sms: "devbox" | "twilio" | "off"; whatsapp: "devbox" | "twilio" | "off"; problems: string[] };

/** What the server can actually send with, for the settings page and the router. */
export function transportStatus(): TransportStatus {
  const problems: string[] = [];
  const smsTransport = process.env.SMS_TRANSPORT ?? "devbox";
  let sms: TransportStatus["sms"] = "off";
  if (smsTransport === "devbox") sms = "devbox";
  else if (smsTransport === "twilio") {
    const t = readTwilioConfig();
    if (t.ok) sms = "twilio";
    else problems.push(...t.problems.map((p) => p.message));
  }
  let whatsapp: TransportStatus["whatsapp"] = "off";
  const wa = readWhatsappTransport();
  if (wa === "devbox") whatsapp = "devbox";
  else {
    const t = readTwilioConfig();
    const from = readWhatsappFrom();
    if (t.ok && from.ok) whatsapp = "twilio";
    else {
      if (!t.ok) problems.push(...t.problems.map((p) => p.message));
      if (!from.ok) problems.push(from.problem);
    }
  }
  return { sms, whatsapp, problems };
}

/* -------------------------------------------------------------------------- */
/* Routing                                                                     */
/* -------------------------------------------------------------------------- */

export type SendRequest = {
  schoolId: string;
  userId: string;
  templateKey: MessageTemplateKey;
  vars: Record<string, string | number>;
  purpose: string;
  broadcastId?: string;
  /** Queue only; the job (or the caller) sends. Broadcasts do this. */
  queueOnly?: boolean;
  /** Skip the event switch and the daily cap — the office's own test message. */
  force?: boolean;
};

export type SendOutcome = { id: string; status: string; channel: Channel | null; skipReason: SkipReason | null };

/** The first instant of the school's calendar month that holds `now` — the cap and the overview count in the school's month, not UTC's. */
export async function monthStartFor(schoolId: string, now: Date, client: typeof db = db): Promise<Date> {
  const school = await client.school.findUnique({ where: { id: schoolId }, select: { timezone: true } });
  const tz = school?.timezone ?? "UTC";
  return zonedStartOfDay(`${todayKey(tz, now).slice(0, 7)}-01`, tz);
}

async function monthlyCount(schoolId: string, now: Date, client: typeof db = db): Promise<number> {
  const start = await monthStartFor(schoolId, now, client);
  const agg = await client.outboundMessage.aggregate({ where: { schoolId, status: { in: ["QUEUED", "SENT", "DELIVERED", "UNDELIVERED"] }, createdAt: { gte: start } }, _sum: { segments: true } });
  return agg._sum.segments ?? 0;
}

/**
 * Decide, record and (unless queued) send one text to one person. Never
 * throws for a routing refusal — a SKIPPED row is the answer — and never
 * throws for a provider failure either: that is a FAILED row with the
 * provider's words, because the caller is usually an event that must not
 * fail because a text did.
 */
export async function deliverToUser(req: SendRequest): Promise<SendOutcome> {
  const template = MESSAGE_TEMPLATES[req.templateKey];
  const [user, settings, school] = await Promise.all([
    db.user.findUnique({ where: { id: req.userId }, select: { id: true, phone: true, prefs: true, disabledAt: true } }),
    messagingSettings(req.schoolId),
    db.school.findUniqueOrThrow({ where: { id: req.schoolId }, select: { name: true, timezone: true } }),
  ]);
  const prefs = readJson<UserPrefs>(user?.prefs ?? "{}", DEFAULT_PREFS);
  const locale = normaliseLocale(prefs.locale);
  const transports = transportStatus();

  /**
   * THE OFFICE-ENTERED NUMBER. A guardian with no proved number may still be
   * reached at the guardian phone on their child's record, when the school
   * has chosen that and the event is one of the three; the row then carries
   * that number and the send is audited "office-entered". When the school
   * has not chosen it, or the event is another, the row says the number
   * was there but unproved — "unverifiedNumber" — so the office can see
   * what the switch would reach. Nothing at all stays "no-phone".
   */
  const officeEntered = user && !user.phone && !user.disabledAt ? await officeEnteredPhone(req.schoolId, req.userId) : null;
  const officeRouteOpen = Boolean(officeEntered && settings.textOfficePhones && template.event && !req.force && OFFICE_PHONE_EVENTS.includes(template.event));
  /**
   * WITH AN OPT-OUT LINE (G4-33, risks batch 5 Oct 2026; 08's recommended option). A text to a number nobody proved
   * is sent in its opt-out form (OPT_OUT_FORM: the same words and "Reply STOP to stop these texts."), registered with
   * the carriers like every other; the row keeps that form's key, so the template ids follow it. A number that has
   * answered STOP (the provider's error 21610 on an earlier text) is not texted again: skipped "opted-out", as a
   * person's own channel switches are.
   */
  const viaOffice = Boolean(user && !user.phone && officeRouteOpen);
  const templateKey: MessageTemplateKey = viaOffice ? (OPT_OUT_FORM[req.templateKey] ?? req.templateKey) : req.templateKey;
  const body = renderTemplate(templateKey, locale, { school: school.name, ...req.vars });

  const skip = async (reason: SkipReason, channel: Channel | null = null, to = user?.phone ?? officeEntered ?? ""): Promise<SendOutcome> => {
    const row = await db.outboundMessage.create({
      data: { schoolId: req.schoolId, userId: req.userId, to, channel: channel ?? "SMS", templateKey, locale, varsJson: writeJson(req.vars), body, status: "SKIPPED", skipReason: reason, segments: 0, broadcastId: req.broadcastId ?? null, purpose: req.purpose },
      select: { id: true },
    });
    return { id: row.id, status: "SKIPPED", channel, skipReason: reason };
  };

  // THE PLATFORM'S SWITCH FIRST (15 Oct 2026): while the operator has text messaging off, nothing is sent and the
  // office's report says why. In-app notices and push are not this path and go on as before (notify.ts).
  if (!(await mayUse("TEXT_MESSAGING", { userId: null, schoolId: req.schoolId }))) return skip("feature-off");
  if (!user || user.disabledAt) return skip("disabled");
  if (!user.phone && !officeEntered) return skip("no-phone");
  if (!user.phone && !officeRouteOpen) return skip("unverifiedNumber");
  if (template.event && !req.force && !settings.events[template.event]) return skip("event-off");
  if (viaOffice && (await db.outboundMessage.findFirst({ where: { schoolId: req.schoolId, to: officeEntered!, error: { startsWith: "21610" } }, select: { id: true } }))) return skip("opted-out");

  // Channel: WhatsApp first when both are open to this person.
  let channel: Channel | null = null;
  const waOpen = settings.whatsappEnabled && transports.whatsapp !== "off";
  const smsOpen = settings.smsEnabled && transports.sms !== "off";
  const waWanted = prefs.channels?.whatsapp !== false;
  const smsWanted = prefs.channels?.sms !== false;
  if (waOpen && waWanted) channel = "WHATSAPP";
  else if (smsOpen && smsWanted) channel = "SMS";
  else if (!settings.whatsappEnabled && !settings.smsEnabled) return skip("channel-off");
  else if ((settings.whatsappEnabled && transports.whatsapp === "off") || (settings.smsEnabled && transports.sms === "off")) return skip("no-transport");
  else return skip("opted-out");

  const now = new Date();
  const segments = channel === "SMS" ? smsSegments(body) : 1;
  /**
   * THE CAPS AND THE ROW ARE ONE TRANSACTION, serialised on the school. A
   * broadcast drains many rows at once and a count-then-insert let every
   * one of a burst read the same count and all pass, so a cap of two
   * thousand was a cap of two thousand plus the burst. The school row is
   * locked for the count and the insert together; the send itself happens
   * after the lock is released, so the lock is held for two queries.
   */
  const to = user.phone ?? officeEntered!;
  const chosen: Channel = channel;
  const decided = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    await tx.$queryRaw`SELECT "id" FROM "School" WHERE "id" = ${req.schoolId} FOR UPDATE`;
    if ((await monthlyCount(req.schoolId, now, tx)) + segments > settings.monthlyCap) return { skip: "cap-monthly" as SkipReason, row: null };
    if (!req.force) {
      const dayStart = new Date(`${todayKey(school.timezone, now)}T00:00:00.000Z`);
      const today = await tx.outboundMessage.count({ where: { schoolId: req.schoolId, userId: req.userId, status: { in: ["QUEUED", "SENT", "DELIVERED"] }, createdAt: { gte: new Date(dayStart.getTime() - 12 * 3_600_000) } } });
      if (today >= DAILY_CAP_PER_PERSON) return { skip: "cap-daily" as SkipReason, row: null };
    }
    const row = await tx.outboundMessage.create({
      data: { schoolId: req.schoolId, userId: req.userId, to, channel: chosen, templateKey, locale, varsJson: writeJson(req.vars), body, status: "QUEUED", segments, broadcastId: req.broadcastId ?? null, purpose: req.purpose },
    });
    return { skip: null, row };
  });
  if (decided.skip || !decided.row) return skip(decided.skip ?? "cap-daily", chosen);
  const row = decided.row;
  if (!user.phone) {
    await audit({ schoolId: req.schoolId, actorUserId: null, action: "messaging.officePhone", targetType: "OutboundMessage", targetId: row.id, meta: { source: "office-entered", userId: req.userId, templateKey, purpose: req.purpose, channel: chosen } });
  }
  if (req.queueOnly) return { id: row.id, status: "QUEUED", channel, skipReason: null };
  const sent = await sendRow(row);
  return { id: row.id, status: sent.status, channel, skipReason: null };
}

/* -------------------------------------------------------------------------- */
/* The provider                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The guardian phone the office typed on a child's record, for a guardian of
 * that child in this school: the first non-blank one across their children
 * here, the record's own number before its alternate. Unverified by design
 * (the record's note says why); the caller decides whether it may be used.
 */
async function officeEnteredPhone(schoolId: string, parentUserId: string): Promise<string | null> {
  const links = await db.guardianship.findMany({ where: { parentUserId, studentSchoolId: schoolId, status: "ACTIVE" }, select: { studentMembershipId: true }, take: 20 });
  if (links.length === 0) return null;
  const records = await forSchool(schoolId, () =>
    db.pupilRecord.findMany({ where: { schoolId, studentMembershipId: { in: links.map((l) => l.studentMembershipId) } }, select: { guardianPhone: true, alternatePhone: true }, take: 20 }),
  );
  for (const r of records) for (const candidate of [r.guardianPhone, r.alternatePhone]) if (candidate && candidate.trim()) return candidate.trim();
  return null;
}

type Row = { id: string; schoolId: string; to: string; channel: string; templateKey: string; locale: string; varsJson: string; body: string; purpose: string };

function callbackUrl(schoolId: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/api/webhooks/twilio/status/${schoolId}`;
}

/** Sends one QUEUED row and records what the provider said. Returns the row's new status. */
export async function sendRow(row: Row): Promise<{ status: "SENT" | "FAILED"; error?: string }> {
  const transport = row.channel === "WHATSAPP" ? readWhatsappTransport() : ((process.env.SMS_TRANSPORT ?? "devbox") as "devbox" | "twilio" | string);
  try {
    if (transport === "devbox") {
      // Filed beside the emails and the sign-in texts, so the whole flow can
      // be read at /dev/mailbox with no provider account.
      await db.outboundEmail.create({
        data: {
          to: row.to,
          subject: `${row.channel === "WHATSAPP" ? "WhatsApp" : "SMS"} to ${formatPhone(row.to)} · ${row.templateKey}`,
          text: row.body,
          html: `<p style="font-family:ui-monospace,monospace;white-space:pre-wrap">${escapeHtml(row.body)}</p>`,
          purpose: row.channel,
        },
      });
      await db.outboundMessage.update({ where: { id: row.id }, data: { status: "SENT", sentAt: new Date(), providerSid: `devbox_${row.id}`, providerStatus: "sent" } });
      return { status: "SENT" };
    }
    if (transport !== "twilio") throw new Error(`transport "${transport}" is not implemented`);

    const config = readTwilioConfig();
    if (!config.ok) throw new Error(config.problems.map((p) => p.message).join(" "));
    const form = new URLSearchParams({ StatusCallback: callbackUrl(row.schoolId) });
    const ids = readMessageTemplateIds().ids[row.templateKey];
    if (row.channel === "WHATSAPP") {
      const from = readWhatsappFrom();
      if (!from.ok) throw new Error(from.problem);
      form.set("From", from.from);
      form.set("To", `whatsapp:${row.to}`);
      const contentSid = ids?.whatsapp?.[row.locale] ?? ids?.whatsapp?.en;
      if (contentSid && isMessageTemplateKey(row.templateKey)) {
        // A templated send: the content SID and the variables in the order
        // the registered template numbers them.
        const vars = readJson<Record<string, string | number>>(row.varsJson, {});
        const school = await db.school.findUniqueOrThrow({ where: { id: row.schoolId }, select: { name: true } });
        const all: Record<string, string | number> = { school: school.name, ...vars };
        const order = whatsappVarOrder(row.templateKey, (["en", "hi", "mr"] as const).includes(row.locale as "en") ? (row.locale as "en" | "hi" | "mr") : "en");
        form.set("ContentSid", contentSid);
        form.set("ContentVariables", JSON.stringify(Object.fromEntries(order.map((name, i) => [String(i + 1), String(all[name] ?? "")]))));
      } else {
        form.set("Body", row.body);
      }
    } else {
      form.set("To", row.to);
      form.set("Body", row.body);
      if (/^MG/i.test(config.config.from)) form.set("MessagingServiceSid", config.config.from);
      else form.set("From", config.config.from);
    }
    const apiBase = process.env.TWILIO_API_BASE?.trim().replace(/\/$/, "") || "https://api.twilio.com";
    const response = await fetch(`${apiBase}/2010-04-01/Accounts/${encodeURIComponent(config.config.accountSid)}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${config.config.accountSid}:${config.config.authToken}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    const text = await response.text().catch(() => "");
    if (!response.ok) {
      let reason = text.slice(0, 300);
      try {
        const parsed = JSON.parse(text) as { message?: string; code?: number };
        if (parsed.message) reason = `${parsed.message}${parsed.code ? ` (code ${parsed.code})` : ""}`;
      } catch {
        /* the raw prefix is what there is */
      }
      throw new Error(`Twilio refused the message: HTTP ${response.status} — ${reason}`);
    }
    const parsed = JSON.parse(text) as { sid?: string; status?: string; num_segments?: string };
    await db.outboundMessage.update({
      where: { id: row.id },
      data: { status: "SENT", sentAt: new Date(), providerSid: parsed.sid ?? null, providerStatus: parsed.status ?? "queued", segments: parsed.num_segments ? Number(parsed.num_segments) || 1 : undefined },
    });
    return { status: "SENT" };
  } catch (error) {
    const cause = (error as { cause?: { message?: string } }).cause?.message;
    const message = (cause ?? (error instanceof Error ? error.message : String(error))).slice(0, 300);
    await db.outboundMessage.update({ where: { id: row.id }, data: { status: "FAILED", error: message } });
    return { status: "FAILED", error: message };
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * The job: every QUEUED row, oldest first, a few hundred a minute. Each
 * school's rows are sent under that school's tenant so the policies hold
 * when the runner is the app role.
 */
export async function drainQueue(limit = 300): Promise<{ sent: number; failed: number; perSchool: Record<string, { sent: number; failed: number }> }> {
  // While the platform's text messaging is off (15 Oct 2026), a row queued before the switch went off is not sent:
  // it is recorded SKIPPED "feature-off", as a new one is, and its broadcast's counts are brought up to date.
  if (!(await mayUse("TEXT_MESSAGING", null))) {
    const waiting = await db.outboundMessage.findMany({ where: { status: "QUEUED" }, orderBy: { createdAt: "asc" }, take: limit, select: { id: true, schoolId: true, broadcastId: true } });
    const touched = new Set<string>();
    for (const row of waiting) {
      await forSchool(row.schoolId, () => db.outboundMessage.update({ where: { id: row.id }, data: { status: "SKIPPED", skipReason: "feature-off" } }));
      if (row.broadcastId) touched.add(`${row.schoolId}:${row.broadcastId}`);
    }
    for (const key of touched) {
      const [schoolId, broadcastId] = key.split(":") as [string, string];
      await forSchool(schoolId, () => refreshBroadcastCounts(broadcastId));
    }
    return { sent: 0, failed: 0, perSchool: {} };
  }
  const rows = await db.outboundMessage.findMany({ where: { status: "QUEUED" }, orderBy: { createdAt: "asc" }, take: limit });
  const perSchool: Record<string, { sent: number; failed: number }> = {};
  const touched = new Set<string>();
  for (const row of rows) {
    const result = await forSchool(row.schoolId, () => sendRow(row));
    const bucket = (perSchool[row.schoolId] ??= { sent: 0, failed: 0 });
    if (result.status === "SENT") bucket.sent += 1;
    else bucket.failed += 1;
    if (row.broadcastId) touched.add(`${row.schoolId}:${row.broadcastId}`);
  }
  for (const key of touched) {
    const [schoolId, broadcastId] = key.split(":") as [string, string];
    await forSchool(schoolId, () => refreshBroadcastCounts(broadcastId));
  }
  const totals = Object.values(perSchool).reduce((a, b) => ({ sent: a.sent + b.sent, failed: a.failed + b.failed }), { sent: 0, failed: 0 });
  return { ...totals, perSchool };
}

/* -------------------------------------------------------------------------- */
/* Delivery status from the provider                                           */
/* -------------------------------------------------------------------------- */

const PROVIDER_STATUS: Record<string, string> = { queued: "SENT", accepted: "SENT", sending: "SENT", sent: "SENT", delivered: "DELIVERED", read: "DELIVERED", undelivered: "UNDELIVERED", failed: "FAILED" };

/**
 * A message only ever moves FORWARD: QUEUED → SENT → DELIVERED, and FAILED
 * or UNDELIVERED is the end of the road. Callbacks arrive out of order and
 * can be replayed by anyone who has seen one, so a "sent" after a
 * "delivered" — or a "delivered" after a "failed" — changes nothing.
 */
const STATUS_RANK: Record<string, number> = { QUEUED: 0, SENT: 1, DELIVERED: 2, UNDELIVERED: 3, FAILED: 3 };

/** Whether a provider's word may move a row from `current` to `next`. Exported for the tests. */
export function statusMovesForward(current: string, next: string): boolean {
  const from = STATUS_RANK[current];
  const to = STATUS_RANK[next];
  if (from === undefined || to === undefined) return false;
  if (from >= 3) return false;
  return to > from;
}

/** Twilio's status callback: the row by its sid, then the broadcast's counts. Unknown sids are ignored; a step backwards is ignored too. */
export async function recordProviderStatus(schoolId: string, input: { sid: string; status: string; errorCode?: string | null; errorMessage?: string | null }): Promise<boolean> {
  return forSchool(schoolId, async () => {
    const row = await db.outboundMessage.findFirst({ where: { schoolId, providerSid: input.sid }, select: { id: true, broadcastId: true, status: true } });
    if (!row) return false;
    const status = PROVIDER_STATUS[input.status.toLowerCase()];
    if (!status || !statusMovesForward(row.status, status)) return true;
    // Conditional on the status the decision was made against, so two
    // callbacks landing together cannot interleave a step backwards.
    const moved = await db.outboundMessage.updateMany({
      where: { id: row.id, status: row.status },
      data: {
        status,
        providerStatus: input.status,
        deliveredAt: status === "DELIVERED" ? new Date() : undefined,
        error: input.errorCode ? `${input.errorCode}${input.errorMessage ? `: ${input.errorMessage}` : ""}`.slice(0, 300) : undefined,
      },
    });
    if (moved.count > 0 && row.broadcastId) await refreshBroadcastCounts(row.broadcastId);
    return true;
  });
}

/**
 * Twilio signs every callback: HMAC-SHA1 over the full URL plus every POST
 * parameter appended in key order, keyed on the auth token, base64.
 */
export function twilioSignatureValid(authToken: string, url: string, params: Record<string, string>, signature: string | null): boolean {
  if (!signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", authToken).update(data).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

/* -------------------------------------------------------------------------- */
/* Broadcasts                                                                  */
/* -------------------------------------------------------------------------- */

export type Audience = { kind: "ALL_PARENTS" } | { kind: "CLASS"; classId: string } | { kind: "GRADE"; gradeLevel: string } | { kind: "OVERDUE_FEES" } | { kind: "PEOPLE"; userIds: string[] };

/** Every active guardian the audience names, once each, with whether they can be texted. */
export async function resolveAudience(schoolId: string, audience: Audience): Promise<{ parentUserIds: string[] }> {
  const activePupil = { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } as const;
  let studentIds: string[] | null = null;
  if (audience.kind === "CLASS") {
    const klass = await db.class.findFirst({ where: { id: audience.classId, schoolId }, select: { id: true } });
    if (!klass) throw new AccessError("messaging.notFound", "NOT_FOUND");
    studentIds = (await db.enrollment.findMany({ where: { classId: klass.id, status: "ACTIVE", student: activePupil }, select: { studentMembershipId: true } })).map((e) => e.studentMembershipId);
  } else if (audience.kind === "GRADE") {
    studentIds = (await db.membership.findMany({ where: { ...activePupil, gradeLevel: audience.gradeLevel }, select: { id: true } })).map((m) => m.id);
  } else if (audience.kind === "OVERDUE_FEES") {
    // The current year's overdue demands of pupils still on the roll — the
    // same people the fee-reminder job texts. A leaver's debt is the
    // office's to chase, not a broadcast's; last year's is carried forward.
    const [school, year] = await Promise.all([db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } }), currentAcademicYear(schoolId)]);
    const today = new Date(`${todayKey(school.timezone)}T00:00:00.000Z`);
    studentIds = year ? [...new Set((await db.feeDemand.findMany({ where: { schoolId, academicYearId: year.id, status: { in: ["OPEN", "PART"] }, dueDate: { lt: today }, student: activePupil }, select: { studentMembershipId: true } })).map((d) => d.studentMembershipId))] : [];
  } else if (audience.kind === "PEOPLE") {
    if (audience.userIds.length === 0) throw new AccessError("messaging.refuseNobody");
    const links = await db.guardianship.findMany({ where: { parentUserId: { in: audience.userIds }, status: "ACTIVE", studentSchoolId: schoolId }, select: { parentUserId: true }, distinct: ["parentUserId"] });
    return { parentUserIds: links.map((l) => l.parentUserId) };
  }
  const links = await db.guardianship.findMany({
    where: { status: "ACTIVE", studentSchoolId: schoolId, ...(studentIds ? { studentMembershipId: { in: studentIds } } : { student: activePupil }) },
    select: { parentUserId: true },
    distinct: ["parentUserId"],
  });
  return { parentUserIds: links.map((l) => l.parentUserId) };
}

export type AudiencePreview = { recipients: number; withPhone: number; whatsapp: number; sms: number; unreachable: number; estimatedSegments: number };

/** What a notice would do before it is sent: who, on which channel, and roughly how many segments. */
export async function previewBroadcast(ctx: ActiveContext, input: { audience: Audience; body: string }): Promise<AudiencePreview> {
  const caller = office(ctx);
  const { parentUserIds } = await resolveAudience(caller.schoolId, input.audience);
  const [settings, users, school] = await Promise.all([
    messagingSettings(caller.schoolId),
    db.user.findMany({ where: { id: { in: parentUserIds } }, select: { phone: true, prefs: true, disabledAt: true } }),
    db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { name: true } }),
  ]);
  const transports = transportStatus();
  let withPhone = 0;
  let whatsapp = 0;
  let sms = 0;
  let segments = 0;
  for (const u of users) {
    if (!u.phone || u.disabledAt) continue;
    withPhone += 1;
    const prefs = readJson<UserPrefs>(u.prefs, DEFAULT_PREFS);
    if (settings.whatsappEnabled && transports.whatsapp !== "off" && prefs.channels?.whatsapp !== false) {
      whatsapp += 1;
      segments += 1;
    } else if (settings.smsEnabled && transports.sms !== "off" && prefs.channels?.sms !== false) {
      sms += 1;
      segments += smsSegments(renderTemplate("circular", normaliseLocale(prefs.locale), { school: school.name, notice: input.body }));
    }
  }
  return { recipients: parentUserIds.length, withPhone, whatsapp, sms, unreachable: parentUserIds.length - whatsapp - sms, estimatedSegments: segments };
}

export type BroadcastInput = { title: string; body: string; audience: Audience; channels: ("TEXT" | "PUSH")[] };

/**
 * A notice to many families at once. TEXT goes through the router (WhatsApp
 * or SMS per person), PUSH through notify() for those with the app; either
 * or both. Rows are queued and then sent in the request when there are few,
 * by the job within the minute when there are many.
 */
export async function createBroadcast(ctx: ActiveContext, input: BroadcastInput): Promise<{ broadcastId: string; recipients: number; queued: number; skipped: number; pushed: number }> {
  const caller = office(ctx);
  const title = input.title.trim().slice(0, 80);
  const body = input.body.replace(/\s+/g, " ").trim();
  if (title.length < 2) throw new AccessError("messaging.refuseTitle");
  if (body.length < 5 || body.length > 300) throw new AccessError("messaging.refuseBody");
  const channels = [...new Set(input.channels)];
  if (channels.length === 0) throw new AccessError("messaging.refuseChannels");
  const { parentUserIds } = await resolveAudience(caller.schoolId, input.audience);
  if (parentUserIds.length === 0) throw new AccessError("messaging.refuseNobody");

  const broadcast = await db.broadcast.create({
    data: { schoolId: caller.schoolId, authorUserId: caller.userId, title, body, channelsJson: writeJson(channels), audienceJson: writeJson(input.audience), recipients: parentUserIds.length },
    select: { id: true },
  });
  let queued = 0;
  let skipped = 0;
  let pushed = 0;
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { name: true } });
  for (const userId of parentUserIds) {
    if (channels.includes("TEXT")) {
      const out = await deliverToUser({ schoolId: caller.schoolId, userId, templateKey: "circular", vars: { notice: body }, purpose: "broadcast", broadcastId: broadcast.id, queueOnly: true });
      if (out.status === "QUEUED") queued += 1;
      else skipped += 1;
    }
    if (channels.includes("PUSH")) {
      await notify({ userId, schoolId: caller.schoolId, kind: "POST", title: [school.name, title].join(": "), body, url: "/notifications", meta: { broadcastId: broadcast.id } }).catch(() => undefined);
      pushed += 1;
    }
  }
  await db.broadcast.update({ where: { id: broadcast.id }, data: { queued, skipped, status: queued === 0 ? "DONE" : "SENDING", doneAt: queued === 0 ? new Date() : null } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "messaging.broadcast", targetType: "Broadcast", targetId: broadcast.id, meta: { recipients: parentUserIds.length, queued, skipped, pushed, audience: input.audience.kind } });
  if (queued > 0 && queued <= INLINE_SEND_LIMIT) {
    const rows = await db.outboundMessage.findMany({ where: { broadcastId: broadcast.id, status: "QUEUED" }, orderBy: { createdAt: "asc" } });
    for (const row of rows) await sendRow(row);
    await refreshBroadcastCounts(broadcast.id);
  }
  return { broadcastId: broadcast.id, recipients: parentUserIds.length, queued, skipped, pushed };
}

export async function refreshBroadcastCounts(broadcastId: string): Promise<void> {
  const groups = await db.outboundMessage.groupBy({ by: ["status"], where: { broadcastId }, _count: { _all: true } });
  const count = (status: string) => groups.find((g) => g.status === status)?._count._all ?? 0;
  const queued = count("QUEUED");
  await db.broadcast.update({
    where: { id: broadcastId },
    data: {
      queued,
      // A row is sent OR failed, never both: UNDELIVERED is the carrier's
      // failure after a handover, and counting it twice made sent + failed
      // exceed the recipients on any broadcast with a dead number in it.
      sent: count("SENT") + count("DELIVERED"),
      delivered: count("DELIVERED"),
      failed: count("FAILED") + count("UNDELIVERED"),
      skipped: count("SKIPPED"),
      status: queued === 0 ? "DONE" : "SENDING",
      doneAt: queued === 0 ? new Date() : null,
    },
  });
}

/** The failed and undelivered rows of a broadcast, queued again; a family that opted out or has no number is not retried. */
export async function resendBroadcastFailures(ctx: ActiveContext, broadcastId: string): Promise<{ requeued: number }> {
  const caller = office(ctx);
  const b = await db.broadcast.findFirst({ where: { id: broadcastId, schoolId: caller.schoolId }, select: { id: true } });
  if (!b) throw new AccessError("messaging.notFound", "NOT_FOUND");
  const rows = await db.outboundMessage.findMany({ where: { broadcastId: b.id, status: { in: ["FAILED", "UNDELIVERED"] } } });
  for (const row of rows) {
    await db.outboundMessage.update({ where: { id: row.id }, data: { status: "QUEUED", error: null, providerSid: null, providerStatus: null } });
    await sendRow({ ...row });
  }
  await refreshBroadcastCounts(b.id);
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "messaging.resend", targetType: "Broadcast", targetId: b.id, meta: { requeued: rows.length } });
  return { requeued: rows.length };
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                     */
/* -------------------------------------------------------------------------- */

export type BroadcastRow = { id: string; title: string; body: string; channels: string[]; audience: Audience; recipients: number; queued: number; sent: number; delivered: number; failed: number; skipped: number; status: string; createdAt: Date; doneAt: Date | null; author: string };

const broadcastRow = (b: { id: string; title: string; body: string; channelsJson: string; audienceJson: string; recipients: number; queued: number; sent: number; delivered: number; failed: number; skipped: number; status: string; createdAt: Date; doneAt: Date | null; author: { name: string } }): BroadcastRow => ({
  id: b.id,
  title: b.title,
  body: b.body,
  channels: readJson<string[]>(b.channelsJson, []),
  audience: readJson<Audience>(b.audienceJson, { kind: "ALL_PARENTS" }),
  recipients: b.recipients,
  queued: b.queued,
  sent: b.sent,
  delivered: b.delivered,
  failed: b.failed,
  skipped: b.skipped,
  status: b.status,
  createdAt: b.createdAt,
  doneAt: b.doneAt,
  author: b.author.name,
});

export async function listBroadcasts(ctx: ActiveContext, limit = 30): Promise<BroadcastRow[]> {
  const caller = officeOrHead(ctx);
  const rows = await db.broadcast.findMany({ where: { schoolId: caller.schoolId }, orderBy: { createdAt: "desc" }, take: limit, include: { author: { select: { name: true } } } });
  return rows.map(broadcastRow);
}

export type MessageRow = { id: string; userId: string | null; name: string | null; to: string; channel: string; status: string; skipReason: string | null; error: string | null; segments: number; createdAt: Date; sentAt: Date | null; deliveredAt: Date | null; templateKey: string; purpose: string };

const messageRow = (m: { id: string; userId: string | null; to: string; channel: string; status: string; skipReason: string | null; error: string | null; segments: number; createdAt: Date; sentAt: Date | null; deliveredAt: Date | null; templateKey: string; purpose: string; user: { name: string } | null }): MessageRow => ({
  id: m.id,
  userId: m.userId,
  name: m.user?.name ?? null,
  to: formatPhone(m.to),
  channel: m.channel,
  status: m.status,
  skipReason: m.skipReason,
  error: m.error,
  segments: m.segments,
  createdAt: m.createdAt,
  sentAt: m.sentAt,
  deliveredAt: m.deliveredAt,
  templateKey: m.templateKey,
  purpose: m.purpose,
});

export async function broadcastDetail(ctx: ActiveContext, broadcastId: string): Promise<{ broadcast: BroadcastRow; messages: MessageRow[] }> {
  const caller = officeOrHead(ctx);
  const b = await db.broadcast.findFirst({ where: { id: broadcastId, schoolId: caller.schoolId }, include: { author: { select: { name: true } } } });
  if (!b) throw new AccessError("messaging.notFound", "NOT_FOUND");
  const messages = await db.outboundMessage.findMany({ where: { broadcastId: b.id }, orderBy: [{ status: "asc" }, { createdAt: "asc" }], include: { user: { select: { name: true } } }, take: 5000 });
  return { broadcast: broadcastRow(b), messages: messages.map(messageRow) };
}

export type MessagingOverview = {
  settings: MessagingSettings;
  transports: TransportStatus;
  month: { sent: number; delivered: number; failed: number; skipped: number; segments: number; cap: number };
  skippedByReason: Record<string, number>;
  templates: { key: MessageTemplateKey; label: string; event: MessageEvent | null; smsIds: Record<string, string>; whatsappIds: Record<string, string> }[];
  recent: BroadcastRow[];
  recentMessages: MessageRow[];
  parentsWithPhone: number;
  parentsTotal: number;
  /** Whether the operator has the platform's TEXT_MESSAGING feature on (15 Oct 2026); while false the page says texts are off platform-wide. */
  platformOn: boolean;
};

export async function messagingOverview(ctx: ActiveContext): Promise<MessagingOverview> {
  const caller = officeOrHead(ctx);
  const schoolId = caller.schoolId;
  const now = new Date();
  const monthStart = await monthStartFor(schoolId, now);
  const [settings, groups, segments, skipped, recent, recentMessages, guardians] = await Promise.all([
    messagingSettings(schoolId),
    db.outboundMessage.groupBy({ by: ["status"], where: { schoolId, createdAt: { gte: monthStart } }, _count: { _all: true } }),
    db.outboundMessage.aggregate({ where: { schoolId, createdAt: { gte: monthStart }, status: { in: ["SENT", "DELIVERED", "UNDELIVERED", "QUEUED"] } }, _sum: { segments: true } }),
    db.outboundMessage.groupBy({ by: ["skipReason"], where: { schoolId, createdAt: { gte: monthStart }, status: "SKIPPED" }, _count: { _all: true } }),
    listBroadcasts(ctx, 10),
    db.outboundMessage.findMany({ where: { schoolId, broadcastId: null }, orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { name: true } } } }),
    db.guardianship.findMany({ where: { status: "ACTIVE", studentSchoolId: schoolId, student: { status: "ACTIVE", leftAt: null } }, select: { parent: { select: { id: true, phone: true } } }, distinct: ["parentUserId"] }),
  ]);
  const count = (status: string) => groups.find((g) => g.status === status)?._count._all ?? 0;
  const ids = readMessageTemplateIds().ids;
  const t = translator(normaliseLocale((ctx.user.prefs as { locale?: string } | undefined)?.locale));
  return {
    settings,
    transports: transportStatus(),
    month: { sent: count("SENT") + count("DELIVERED"), delivered: count("DELIVERED"), failed: count("FAILED") + count("UNDELIVERED"), skipped: count("SKIPPED"), segments: segments._sum.segments ?? 0, cap: settings.monthlyCap },
    skippedByReason: Object.fromEntries(skipped.map((s) => [s.skipReason ?? "unknown", s._count._all])),
    templates: (Object.keys(MESSAGE_TEMPLATES) as MessageTemplateKey[]).map((key) => ({
      key,
      label: t(MESSAGE_TEMPLATES[key].labelKey as TranslationKey),
      event: MESSAGE_TEMPLATES[key].event,
      smsIds: Object.fromEntries(Object.entries(ids[key]?.sms ?? {}).filter((e): e is [string, string] => typeof e[1] === "string")),
      whatsappIds: Object.fromEntries(Object.entries(ids[key]?.whatsapp ?? {}).filter((e): e is [string, string] => typeof e[1] === "string")),
    })),
    recent,
    recentMessages: recentMessages.map(messageRow),
    parentsWithPhone: guardians.filter((g) => g.parent.phone).length,
    parentsTotal: guardians.length,
    platformOn: await mayUse("TEXT_MESSAGING", ctx),
  };
}

/** The office texts itself, forcing past the event switch and the daily cap, to prove the wiring end to end. */
export async function sendTestMessage(ctx: ActiveContext): Promise<SendOutcome> {
  const caller = office(ctx);
  const out = await deliverToUser({ schoolId: caller.schoolId, userId: caller.userId, templateKey: "test", vars: {}, purpose: "test", force: true });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "messaging.test", targetType: "School", targetId: caller.schoolId, meta: { status: out.status, channel: out.channel, skipReason: out.skipReason } });
  return out;
}
