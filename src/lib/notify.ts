import "server-only";
import webpush from "web-push";
import { db } from "./db";
import { readJson, writeJson } from "./json";
import { DEFAULT_PREFS, type UserPrefs } from "./session";
import { channel, publish } from "./realtime";
import { translator, type TranslationKey } from "./i18n/dictionary";
import { normaliseLocale } from "./i18n/locales";
import { readVapidConfig } from "./env";
import type { NotificationKind } from "./constants";

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
};

export async function notify(input: NotifyInput): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { id: true, prefs: true, disabledAt: true },
  });
  if (!user || user.disabledAt) return;

  const prefs = readJson<UserPrefs>(user.prefs, DEFAULT_PREFS);

  const t = translator(normaliseLocale(prefs.locale));
  const title = input.titleKey ? t(input.titleKey, input.titleVars) : input.title;
  const body = input.bodyKey ? t(input.bodyKey, input.bodyVars) : (input.body ?? "");

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
    },
  });

  publish([channel.user(input.userId)], { type: "notification", userId: input.userId });

  if (!prefs.channels?.push) return;
  // Quiet hours are the person's evening, not the server's. The school's
  // zone is the best fact we hold about where they are.
  const zone = input.schoolId
    ? (await db.school.findUnique({ where: { id: input.schoolId }, select: { timezone: true } }))?.timezone
    : undefined;
  if (!input.urgent && inQuietHours(prefs.quietHours, new Date(), zone)) return;

  await sendPush(input.userId, {
    title,
    body,
    url: input.url ?? "/notifications",
    tag: `${input.kind}:${row.id}`,
  });
}

/**
 * `Omit` over a union collapses it to the common keys, which would let a
 * caller pass neither `title` nor `titleKey`; distributing keeps the
 * either-or contract intact for `notifyGuardians` builders.
 */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

/** Fan a notification out to every active guardian of a student. */
export async function notifyGuardians(
  studentMembershipId: string,
  build: (childName: string) => DistributiveOmit<NotifyInput, "userId">,
): Promise<void> {
  const guardians = await db.guardianship.findMany({
    where: { studentMembershipId, status: "ACTIVE" },
    include: {
      student: { include: { user: { select: { name: true, preferredName: true } } } },
    },
  });

  const childName =
    guardians[0]?.student.user.preferredName ?? guardians[0]?.student.user.name ?? "Your child";

  await Promise.all(
    guardians.map((g) => notify({ ...build(childName), userId: g.parentUserId })),
  );
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
): Promise<number> {
  if (studentMembershipIds.length === 0) return 0;
  const guardians = await db.guardianship.findMany({
    where: { studentMembershipId: { in: studentMembershipIds }, status: "ACTIVE" },
    select: { parentUserId: true },
    distinct: ["parentUserId"],
  });
  await Promise.all(guardians.map((g) => notify({ ...build(), userId: g.parentUserId })));
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
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
          { TTL: 60 * 60 * 24 },
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
        // Anything else is transient (network, push service 5xx). Count it and
        // retire the endpoint after repeated failures so a dead device does not
        // slow every future send.
        const failures = sub.failureCount + 1;
        result.failed++;
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
