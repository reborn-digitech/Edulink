import "server-only";
import webpush from "web-push";
import { db } from "./db";
import { sendExpoPush } from "./expo-push";
import { readJson, writeJson } from "./json";
import { DEFAULT_PREFS, type UserPrefs } from "./session";
import { channel, publish } from "./realtime";
import { translator, type TranslationKey } from "./i18n/dictionary";
import { normaliseLocale } from "./i18n/locales";
import { localiseVars } from "./notice-dates";
import { readVapidConfig } from "./env";
import { isPushServiceEndpoint } from "./validation";

/** How long one push send may wait on its socket before it is abandoned. */
export const PUSH_SEND_TIMEOUT_MS = 10_000;

/**
 * Whether the server will POST to this stored endpoint at all.
 *
 * The allow-list in validation.ts is applied when a device registers, and
 * /api/push is the only writer of the table — but a row written before the
 * list existed, or through any door added later, is a URL this server would
 * call with a signed VAPID header. So the send asks again. OUTSIDE PRODUCTION
 * a loopback host is allowed as well: the delivery suite stands up a local
 * HTTPS push server and proves the encrypted payload reaches it, which is the
 * one end-to-end check of the whole pipeline and worth a door that
 * `NODE_ENV=production` keeps shut — the same shape as every other dev-only
 * door here.
 */
export function isSendableEndpoint(endpoint: string): boolean {
  if (isPushServiceEndpoint(endpoint)) return true;
  if (process.env.NODE_ENV === "production") return false;
  try {
    const host = new URL(endpoint).hostname;
    return host === "127.0.0.1" || host === "localhost" || host === "[::1]";
  } catch {
    return false;
  }
}
import type { NotificationKind } from "./constants";
import type { MessageTemplateKey } from "./message-templates";
import { guardiansToTell, type StudentConsentGrant } from "./student-consent";

/**
 * Notification delivery: in-app row + Web Push, honouring per-user channel
 * preferences and quiet hours.
 */

/**
 * Reads the same contract the boot check reads, so "configured" means one
 * thing in this codebase. Before this shared it with env.ts, a mismatched
 * pair passed the boot check and then failed here for every recipient with
 * nothing said about why.
 */
let vapidConfigured = false;
function configureVapid(): boolean {
  if (vapidConfigured) return true;
  const read = readVapidConfig();
  if (!read.ok) return false;
  const { subject, publicKey, privateKey } = read.config;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/**
 * A notification's title is either a literal string or a translation key.
 *
 * A KEY IS RESOLVED INTO THE RECIPIENT'S OWN LANGUAGE AT WRITE TIME — unlike a
 * page, whose reader is unknown until the request, a notification's reader is
 * exactly one known user, so their saved `prefs.locale` can pick the words
 * before the row is stored. Literal titles remain for the callers not yet
 * converted; the union makes passing neither (or both) a type error.
 */
type NotifyTitle =
  | { title: string; titleKey?: never; titleVars?: never }
  | { titleKey: TranslationKey; titleVars?: Record<string, string | number>; title?: never };

export type NotifyInput = NotifyTitle & {
  userId: string;
  schoolId?: string | null;
  kind: NotificationKind;
  /** Literal body — for DATA: a post's title, an assignment's name, a
   * teacher's own note. Prose goes through `bodyKey`. */
  body?: string;
  /** A body that is a sentence, resolved like the title into the recipient's
   * language at write time. Wins over `body` when both are given. */
  bodyKey?: TranslationKey;
  bodyVars?: Record<string, string | number>;
  url?: string;
  meta?: Record<string, unknown>;
  /** Bypasses quiet hours. Reserved for safeguarding-critical messages. */
  urgent?: boolean;
  /**
   * Also as a TEXT — SMS or WhatsApp, whichever the school and the person
   * allow (messaging.ts decides and records the outcome). Only for the
   * events that must reach a family without the app; needs `schoolId`.
   */
  text?: { templateKey: MessageTemplateKey; vars: Record<string, string | number>; purpose: string };
};

/**
 * messaging.ts imports notify, so notify reaches it lazily — and through ONE
 * promise. A circular told to several guardians at once calls notify for
 * each of them together; with a bare `await import()` in each call, the
 * second caller could be handed the module while the first was still
 * loading it, and its text failed with "cannot access before
 * initialization", caught and logged below as if the send had failed. Seen
 * under the test runner; one shared promise makes the order not matter.
 */
let messagingModule: Promise<typeof import("./messaging")> | null = null;
const messaging = () => (messagingModule ??= import("./messaging"));

export async function notify(input: NotifyInput): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { id: true, prefs: true, disabledAt: true, isMinor: true },
  });
  if (!user || user.disabledAt) return;

  const prefs = readJson<UserPrefs>(user.prefs, DEFAULT_PREFS);

  const locale = normaliseLocale(prefs.locale);
  const t = translator(locale);
  // A date variable (noticeDate) is said in the recipient's language too; the row keeps the date itself (B-15).
  const title = input.titleKey ? t(input.titleKey, localiseVars(input.titleVars, locale)) : input.title;
  const body = input.bodyKey ? t(input.bodyKey, localiseVars(input.bodyVars, locale)) : (input.body ?? "");

  // The in-app row is always written. Quiet hours silence the *interruption*,
  // never the record — a parent must still find the message in the morning.
  const row = await db.notification.create({
    data: {
      userId: input.userId,
      schoolId: input.schoolId ?? null,
      kind: input.kind,
      title,
      body,
      url: input.url ?? null,
      meta: writeJson(input.meta ?? {}),
      // The key and its variables travel with the sentence, so the page can
      // say it again in whatever language the reader has since chosen.
      titleKey: input.titleKey ?? null,
      titleVars: writeJson(input.titleVars ?? {}),
      bodyKey: input.bodyKey ?? null,
      bodyVars: writeJson(input.bodyVars ?? {}),
    },
  });

  publish([channel.user(input.userId)], { type: "notification", userId: input.userId });

  // The text does not wait for quiet hours or the push preference: it is
  // the channel for the family WITHOUT the app, and the router has its own
  // switches. A failure there is a FAILED row, never a thrown notify().
  if (input.text && input.schoolId) {
    const { deliverToUser } = await messaging();
    await deliverToUser({ schoolId: input.schoolId, userId: input.userId, templateKey: input.text.templateKey, vars: input.text.vars, purpose: input.text.purpose }).catch((error) => console.error("[notify] text", error instanceof Error ? error.message : error));
  }

  if (!prefs.channels?.push) return;
  // Quiet hours are the person's evening, not the server's. The school's
  // zone is the best fact we hold about where they are.
  const zone = input.schoolId
    ? (await db.school.findUnique({ where: { id: input.schoolId }, select: { timezone: true } }))?.timezone
    : undefined;
  if (!input.urgent && inQuietHours(prefs.quietHours, new Date(), zone)) return;

  // A CHILD'S LOCK SCREEN CARRIES NO MESSAGE TEXT (TA-249), kept here for every caller rather than by each one: a
  // literal body is somebody's words (an outside mentor's message, a remark thread's subject) and a push lands on a
  // phone anyone can pick up, so a minor's push carries the title alone. The in-app row above keeps the body, read
  // in the app; a body that is a dictionary sentence (bodyKey) is the app's own words and still goes.
  const pushBody = user.isMinor && !input.bodyKey ? "" : body;
  await Promise.all([
    sendPush(input.userId, {
      title,
      body: pushBody,
      url: input.url ?? "/notifications",
      tag: `${input.kind}:${row.id}`,
    }),
    // The phone, through Expo, with the same words and the same quiet hours
    // and preference already applied above; the app opens `url` on tap.
    sendExpoPush(input.userId, { title, body: pushBody, data: { url: input.url ?? "/notifications", kind: input.kind, id: row.id } }),
  ]);
}

/**
 * `Omit` over a union collapses it to the common keys, which would let a
 * caller pass neither `title` nor `titleKey`; distributing keeps the
 * either-or contract intact for `notifyGuardians` builders.
 */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

/** The one exception to a guardian notice's consent rule: the guardian is asked to act, whoever the student is. */
export const EVERY_GUARDIAN = "EVERY_GUARDIAN";
export type GuardianNoticeGrant = StudentConsentGrant | typeof EVERY_GUARDIAN;

/**
 * Fan a notification out to every active guardian of a student.
 *
 * `grant`, when the notice is about something an adult college student keeps
 * to themself until they grant it (student-consent.ts) — money, results,
 * attendance: a guardian is told only while the student has granted it TO THAT
 * GUARDIAN (`guardiansToTell`; per guardian since TA-555, so one the student
 * shared nothing with hears nothing while another is told). A receipt's amount
 * by text to a guardian the student never let see their fees was the leak
 * (campaign S-2). A minor's guardian, and every guardian at a school, is told
 * as before.
 *
 * NO GRANT IS DEFAULT-DENY, as assertGuardianAccess is (TA-262, testing
 * analysis of 13 November 2026): a notice that names none tells an adult
 * college student's guardians nothing, so a notice written before colleges
 * existed cannot tell them what the family page would refuse them. A notice a
 * guardian must act on whoever the student is (a mentor's or a PEN change's
 * ask, which the guardian's own door decides) says so with EVERY_GUARDIAN.
 *
 * Answers how many guardians it told, so a caller that records "the family was
 * told" records it only when somebody was (TA-298).
 */
export async function notifyGuardians(
  studentMembershipId: string,
  build: (childName: string) => DistributiveOmit<NotifyInput, "userId">,
  grant?: GuardianNoticeGrant,
): Promise<number> {
  // Who may be told: every active guardian for an ask (EVERY_GUARDIAN); otherwise the guardians the grant is open to
  // (all of a minor's or a school pupil's; of an adult at a college only those holding it, and with none named nobody).
  const allowed = grant === EVERY_GUARDIAN ? null : new Set((await guardiansToTell([studentMembershipId], grant)).get(studentMembershipId) ?? []);
  if (allowed && allowed.size === 0) return 0;
  const guardians = (
    await db.guardianship.findMany({
      where: { studentMembershipId, status: "ACTIVE" },
      include: {
        student: { include: { user: { select: { name: true, preferredName: true } } } },
      },
    })
  ).filter((g) => !allowed || allowed.has(g.parentUserId));

  const childName =
    guardians[0]?.student.user.preferredName ?? guardians[0]?.student.user.name ?? "Your child";

  await Promise.all(
    guardians.map((g) => notify({ ...build(childName), userId: g.parentUserId })),
  );
  return guardians.length;
}

/**
 * Tell every guardian of a WHOLE CLASS once.
 *
 * Publishing a piece of work used to call `notifyGuardians` once per pupil,
 * so a guardian with two children in the class read the same "New work set"
 * twice — and the school's stand-in guardian, who stands for every unclaimed
 * pupil, read it once per pupil: four identical notices for one worksheet at
 * a class of four, forty at a class of forty. The message is about the class,
 * not about a child, so one guardian gets it once however many of the class
 * are theirs. Where the message IS about a child (marked work, an absence),
 * `notifyGuardians` per child remains the right shape.
 */
export async function notifyGuardiansOfClass(
  studentMembershipIds: string[],
  build: () => DistributiveOmit<NotifyInput, "userId">,
  // As notifyGuardians' (5 Oct 2026): an adult college student's guardians hear of the class's work only under the grant,
  // and with no grant named not at all (TA-262).
  grant?: StudentConsentGrant,
): Promise<number> {
  // Each guardian once, and of an adult college student only the guardians the grant is open to (TA-555).
  const guardians = [...new Set([...(await guardiansToTell(studentMembershipIds, grant)).values()].flat())];
  await Promise.all(guardians.map((userId) => notify({ ...build(), userId })));
  return guardians.length;
}

/* -------------------------------------------------------------------------- */
/* Web Push                                                                    */
/* -------------------------------------------------------------------------- */

type PushPayload = { title: string; body: string; url: string; tag?: string };

/**
 * What a send actually did.
 *
 * ⚠ RETURNED RATHER THAN INFERRED, because inferring it was wrong. `push:test`
 * used to report "sent to N devices" by counting the subscriptions still
 * present afterwards — but a transient failure deliberately KEEPS its
 * subscription (only 404/410 retire one), so a send that reached nothing at
 * all reported success. A tool whose whole purpose is to stop a deployment
 * believing it sends notifications when it does not must not itself say
 * "sent" for a failure. Found by pointing it at a sink it could not reach.
 */
export type PushResult = {
  /** Endpoints the push service accepted. */
  delivered: number;
  /** Endpoints that failed and were kept for a later try. */
  failed: number;
  /** Endpoints the browser had thrown away; deleted here. */
  retired: number;
  /** No usable VAPID configuration — nothing was attempted. */
  skipped: boolean;
};

export async function sendPush(userId: string, payload: PushPayload): Promise<PushResult> {
  const none: PushResult = { delivered: 0, failed: 0, retired: 0, skipped: false };
  if (!configureVapid()) {
    console.warn("[push] VAPID is not correctly configured — skipping push. Run `npm run vapid`, or `npm run push:test` to see what is wrong.");
    return { ...none, skipped: true };
  }

  const subscriptions = await db.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return none;

  const body = JSON.stringify(payload);
  const result: PushResult = { delivered: 0, failed: 0, retired: 0, skipped: false };

  await Promise.all(
    subscriptions.map(async (sub) => {
      // Checked again at the moment of sending, not only at registration —
      // see isSendableEndpoint. A stored endpoint off the list is retired
      // the way a 410 is: it was never a device we could reach.
      if (!isSendableEndpoint(sub.endpoint)) {
        await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        result.retired++;
        console.warn(`[push] retired a subscription whose endpoint is not a known push service`);
        return;
      }
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
          // A socket that never answers must not hold a notification batch
          // open for as long as the OS allows; ten seconds is generous for
          // a push service and short enough that a job still finishes.
          { TTL: 60 * 60 * 24, timeout: PUSH_SEND_TIMEOUT_MS },
        );
        await db.pushSubscription.update({
          where: { id: sub.id },
          data: { lastUsedAt: new Date(), failureCount: 0 },
        });
        result.delivered++;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // 404/410 mean the browser threw the subscription away (app removed,
        // permission revoked). Delete rather than retry forever.
        if (status === 404 || status === 410) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          result.retired++;
          return;
        }
        // A rate limit (429), the push service's own fault (5xx), a timeout or
        // a network fault with no status says nothing about this device
        // (TA-510): it is a failed send, counted against nothing, so a burst
        // at a peak cannot retire healthy browsers.
        result.failed++;
        if (status === undefined || status === 429 || status >= 500) {
          const detail = error instanceof Error ? error.message.split("\n")[0] : String(error);
          console.warn(`[push] send failed (status ${status ?? "none"}), not counted against the device: ${detail}`);
          return;
        }
        // Anything else the push service said of this endpoint counts, and
        // the endpoint is retired after repeated failures so a dead device
        // does not slow every future send.
        const failures = sub.failureCount + 1;
        if (failures >= 8) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          result.retired++;
        } else {
          await db.pushSubscription
            .update({ where: { id: sub.id }, data: { failureCount: failures } })
            .catch(() => {});
        }
        // The status is often absent — a TLS or DNS failure never gets one —
        // so the message is worth carrying too.
        const detail = error instanceof Error ? error.message.split("\n")[0] : String(error);
        console.warn(`[push] send failed (status ${status ?? "none"}), failures=${failures}: ${detail}`);
      }
    }),
  );

  return result;
}

/* -------------------------------------------------------------------------- */
/* Quiet hours                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Quiet hours are stored as local "HH:MM" strings and compared in minutes so a
 * window that crosses midnight (22:00 → 07:00) works without date arithmetic.
 */
export function inQuietHours(
  quiet: { start: string; end: string } | null | undefined,
  now: Date = new Date(),
  timeZone?: string,
): boolean {
  if (!quiet) return false;
  const start = toMinutes(quiet.start);
  const end = toMinutes(quiet.end);
  if (start === null || end === null || start === end) return false;

  const current = timeZone ? minutesInZone(now, timeZone) : now.getHours() * 60 + now.getMinutes();
  return start < end
    ? current >= start && current < end
    : current >= start || current < end; // wraps past midnight
}

/** Wall-clock minutes since midnight in a zone; the server's clock if the zone is unknown. */
function minutesInZone(now: Date, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? NaN);
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? NaN);
    if (Number.isFinite(hour) && Number.isFinite(minute)) return hour * 60 + minute;
  } catch {
    // An unknown zone name falls through to the server's clock.
  }
  return now.getHours() * 60 + now.getMinutes();
}

function toMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}
