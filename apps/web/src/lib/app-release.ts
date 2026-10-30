import "server-only";
import { randomBytes } from "node:crypto";
import type { z } from "zod";
import type { appReportBodySchema, appVersionSchema } from "@edulink/contracts";
import { audit } from "./audit";
import { notify } from "./notify";
import { headPageHolders } from "./duties";
import { readAppReleaseConfig } from "./env";
import { APP_REPORTS, consume } from "./rate-limit";
import type { ActiveContext } from "./session";

/**
 * The release: what the phone asks at every start, and what it sends back
 * when something went wrong.
 *
 * Two doors. GET /api/v1/app/version is the KILL SWITCH — the oldest build
 * the API still serves, per platform, and where the newer one is — read from
 * environment variables so turning a broken build off is a deploy of
 * configuration, not of code. POST /api/v1/app/report is "Report a problem"
 * and the app's own crash report, landing as AUDIT ROWS so a school's safety
 * centre lists them beside every other event, and — for a problem a person
 * chose to report — as a notification to the school's admins.
 */

/** The release half of GET /api/v1/app/version; the route adds the sign-in providers (sso.ts). */
export type AppVersionPolicy = Omit<z.infer<typeof appVersionSchema>, "ssoProviders">;
export type AppReportBody = z.infer<typeof appReportBodySchema>;

/**
 * The policy as configured. A malformed value has already been reported by
 * `checkEnv` and is answered as unset here, so a stray character in a
 * version string cannot lock every phone out.
 */
export function appVersionPolicy(): AppVersionPolicy {
  return readAppReleaseConfig().config;
}

/* -------------------------------------------------------------------------- */
/* Reports                                                                     */
/* -------------------------------------------------------------------------- */

/** The audit actions a report writes, so the safety centre's filter can find them. */
export const APP_REPORT_ACTIONS = { PROBLEM: "APP_PROBLEM_REPORTED", CRASH: "APP_CRASH_REPORTED" } as const;

/** How much of the message the audit row keeps: enough to read, not a novel. */
const MESSAGE_IN_AUDIT = 500;

/**
 * "APP-7K3M2Q": six characters a person can read out to the office over the
 * phone without an argument about whether that was a zero or an O — the
 * alphabet has neither, nor 1 and I. 32^6 is a billion, so a collision in a
 * school's lifetime is not a concern, and the reference is a handle for a
 * conversation rather than a key to a row (the id is that).
 */
const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newReference(): string {
  const bytes = randomBytes(6);
  let out = "APP-";
  for (let i = 0; i < 6; i++) out += REFERENCE_ALPHABET[bytes[i]! % REFERENCE_ALPHABET.length];
  return out;
}

/** Thrown when a person has sent more reports than the hour allows; the handler answers 429. */
export class ReportRateLimited extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    // A token, not a sentence: the handler answers the person in their own
    // language and this message only ever reaches a log.
    super(`app-report retryAfterSeconds=${retryAfterSeconds}`);
    this.name = "ReportRateLimited";
  }
}

export type AppReportResult = { reportId: string; reference: string };

/**
 * Records one report from the app.
 *
 * The audit row is the record: action per kind, the session's active school
 * (null for a guardian, who has none — the row is then unattributed and no
 * school lists it), the person as actor, and in meta the screen, the device,
 * the message trimmed, whether a stack came with it, and the reference. The
 * stack itself is NOT stored: it is up to 8 KB of file paths and it is the
 * person's phone, not the school's record; the boolean says a crash report
 * had one, which is what an operator reading the log needs to know.
 *
 * Every ADMIN of the school hears about a PROBLEM — one person chose to say
 * something and somebody should read it. A CRASH is audited and nobody is
 * told: a build that crashes on start would otherwise page every admin once
 * per phone per morning, and the kill switch above is the answer to that,
 * not a notification.
 *
 * TEN AN HOUR PER PERSON, counted before anything is written. A report is
 * cheap to send and a crash loop sends one per start; the limit keeps a
 * misbehaving phone from filling a school's audit log while leaving a person
 * who genuinely has several things to say well within it.
 */
export async function recordAppReport(ctx: ActiveContext, body: AppReportBody): Promise<AppReportResult> {
  const gate = await consume(`app-report:${ctx.user.id}`, APP_REPORTS.limit, APP_REPORTS.windowMs);
  if (!gate.allowed) throw new ReportRateLimited(gate.retryAfterSeconds);

  const reference = newReference();
  const message = body.message.length > MESSAGE_IN_AUDIT ? `${body.message.slice(0, MESSAGE_IN_AUDIT - 1)}…` : body.message;
  const reportId = await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: APP_REPORT_ACTIONS[body.kind],
    targetType: "app",
    meta: {
      reference,
      screen: body.screen ?? null,
      device: body.device,
      message,
      stackPresent: Boolean(body.stack),
    },
  });
  // audit() swallows its own failures so a lost line never fails a teacher's
  // save; here the line IS the thing being saved, so a lost one is a failure.
  if (!reportId) throw new Error("The app report could not be recorded");

  if (body.kind === "PROBLEM" && ctx.schoolId) {
    // Who reads the safety centre's audit tab: the head and the admins holding the head's pages (owner-batch-item9).
    const readers = await headPageHolders(ctx.schoolId);
    const name = ctx.user.preferredName ?? ctx.user.name;
    await Promise.all(
      readers.map((userId) =>
        notify({
          userId,
          schoolId: ctx.schoolId,
          kind: "SYSTEM",
          titleKey: "notifTitle.appProblem",
          titleVars: { name },
          bodyKey: "notifBody.appProblem",
          bodyVars: { name, reference },
          url: "/admin/safety?tab=audit",
          meta: { reportId, reference },
          urgent: false,
        }),
      ),
    );
  }

  return { reportId, reference };
}
