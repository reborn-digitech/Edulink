import "server-only";
import type { createECDH as CreateECDH } from "node:crypto";

/**
 * node:crypto fetched at call time rather than imported: with a middleware in
 * the app, Next also compiles instrumentation.ts for the edge runtime and
 * follows its dynamic import here, and webpack refuses a `node:` scheme it
 * cannot bundle. A type import is erased; the built-in is asked for by name
 * from Node itself (20.16+) only when the check runs, which is only on Node.
 */
function nodeCrypto(): { createECDH: typeof CreateECDH } {
  return process.getBuiltinModule("node:crypto") as { createECDH: typeof CreateECDH };
}

/**
 * Environment checks.
 *
 * Exists because of a bug found the honest way: the VAPID keys in `.env` were
 * empty, and the only symptom was a console.warn nobody reads. Every push
 * notification the app "sent" went nowhere, and every test still passed.
 *
 * So: missing push config is a hard failure in production and a loud, specific
 * warning in development. A feature that silently does nothing is worse than
 * one that refuses to start.
 */

export type EnvProblem = { key: string; message: string; fatal: boolean };

/**
 * The SMTP contract, in one place. `checkEnv` uses it so a deploy that says
 * EMAIL_TRANSPORT=smtp but forgot the host fails AT BOOT, and email.ts uses
 * the same function so the send path and the boot check can never disagree
 * about what "configured" means.
 */
export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string } | null;
  from: string;
};

export function readSmtpConfig():
  | { ok: true; config: SmtpConfig }
  | { ok: false; problems: { key: string; message: string }[] } {
  const problems: { key: string; message: string }[] = [];

  const host = process.env.SMTP_HOST?.trim();
  if (!host) problems.push({ key: "SMTP_HOST", message: "SMTP_HOST is not set — the mail server to hand messages to." });

  const rawPort = process.env.SMTP_PORT?.trim();
  const port = rawPort ? Number(rawPort) : 587;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    problems.push({ key: "SMTP_PORT", message: `SMTP_PORT is "${rawPort}" — expected a port number (587 for STARTTLS, 465 for TLS).` });
  }

  // Implicit TLS on 465 by convention; anything else negotiates STARTTLS.
  const rawSecure = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure = rawSecure ? rawSecure === "true" : port === 465;
  if (rawSecure && rawSecure !== "true" && rawSecure !== "false") {
    problems.push({ key: "SMTP_SECURE", message: `SMTP_SECURE is "${rawSecure}" — use "true" or "false" (or leave it unset: 465 implies true).` });
  }

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!!user !== !!pass) {
    problems.push({ key: "SMTP_USER", message: "SMTP_USER and SMTP_PASS must be set together — one without the other is a typo, not a choice." });
  }

  // "EduLink <no-reply@school.example>" or a bare address; either way an @.
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    problems.push({ key: "EMAIL_FROM", message: 'EMAIL_FROM is not set — the address messages come from, e.g. "EduLink <no-reply@your-domain>".' });
  } else if (!/@/.test(from)) {
    problems.push({ key: "EMAIL_FROM", message: `EMAIL_FROM is "${from}" — that is not an email address.` });
  }

  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, config: { host: host!, port, secure, auth: user && pass ? { user, pass } : null, from: from! } };
}

/**
 * The SSO contract, and it differs from the other three in one way that
 * matters: ABSENCE IS LEGITIMATE. `sso.ts` makes a provider exist only when
 * its variables do, so an installation with no SSO at all is correct and
 * silent. What is NOT correct is a HALF-configured provider — a client id
 * pasted without its secret — because `providerConfig` returns null for that
 * too, so the button simply never appears and nothing anywhere says why.
 * That is the failure this reports: never fatal, always loud.
 *
 * ⚠ THESE NAMES MUST MATCH THE ONES `sso.ts` ACTUALLY READS. A variable
 * renamed there and not here would make this file certify a provider that
 * cannot start; `tests/sso-check.test.ts` reads sso.ts's source and asserts
 * every name below appears in it, the same way the db.$transaction ban is
 * enforced by a grep rather than by hope.
 */
export const SSO_REQUIRED_VARS = {
  google: ["SSO_GOOGLE_CLIENT_ID", "SSO_GOOGLE_CLIENT_SECRET"],
  microsoft: ["SSO_MICROSOFT_CLIENT_ID", "SSO_MICROSOFT_CLIENT_SECRET"],
  apple: ["SSO_APPLE_CLIENT_ID", "SSO_APPLE_TEAM_ID", "SSO_APPLE_KEY_ID", "SSO_APPLE_PRIVATE_KEY"],
} as const;

export type SsoProviderStatus =
  /** No variable set at all — this installation does not offer this provider. */
  | { provider: string; state: "absent" }
  /** Every variable present. Whether the values WORK is `npm run sso:check`. */
  | { provider: string; state: "configured" }
  /** Some set, some not: a typo wearing the costume of a deliberate choice. */
  | { provider: string; state: "partial"; missing: string[]; present: string[] };

export function ssoStatus(): SsoProviderStatus[] {
  return Object.entries(SSO_REQUIRED_VARS).map(([provider, vars]) => {
    const present = vars.filter((v) => (process.env[v] ?? "").trim() !== "");
    const missing = vars.filter((v) => (process.env[v] ?? "").trim() === "");
    if (present.length === 0) return { provider, state: "absent" as const };
    if (missing.length === 0) return { provider, state: "configured" as const };
    return { provider, state: "partial" as const, missing, present };
  });
}

/**
 * The Web Push contract.
 *
 * ⚠ THE PAIR IS CHECKED AS A PAIR, which is the whole reason this exists as
 * more than a length test. Two keys of the right length from DIFFERENT runs of
 * `npm run vapid` both pass a length check and then fail at every single send
 * with an opaque crypto error — the exact shape of the bug env.ts was written
 * for, one level subtler. A P-256 private key determines its public key, so
 * deriving one from the other and comparing settles it before boot.
 *
 * The subject is not decoration either: RFC 8292 makes it the address a push
 * service contacts about misbehaving traffic, so `mailto:` or `https:` is the
 * spec, and the shipped placeholder — a `.local` address nothing on the
 * internet can reach — is exactly what must not survive to production.
 */
export type VapidConfig = { publicKey: string; privateKey: string; subject: string };

/** The address `.env.example` ships. Fine on a laptop, never in production. */
const PLACEHOLDER_SUBJECT = "mailto:admin@edulink.local";

export function readVapidConfig():
  | { ok: true; config: VapidConfig }
  | { ok: false; problems: { key: string; message: string }[] } {
  const problems: { key: string; message: string }[] = [];

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();

  if (!publicKey || !privateKey) {
    problems.push({
      key: "VAPID",
      message:
        "Web Push is disabled: NEXT_PUBLIC_VAPID_PUBLIC_KEY and/or VAPID_PRIVATE_KEY are empty. Run `npm run vapid` and paste both into .env.",
    });
  } else {
    // A P-256 public key is 65 bytes base64url-encoded (87 chars); the private
    // key is 32 bytes (43 chars). Wrong lengths mean a truncated copy-paste,
    // which fails later with an opaque crypto error.
    if (publicKey.length !== 87) {
      problems.push({
        key: "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
        message: `Expected 87 characters, got ${publicKey.length}. It looks truncated — re-run \`npm run vapid\`.`,
      });
    }
    if (privateKey.length !== 43) {
      problems.push({
        key: "VAPID_PRIVATE_KEY",
        message: `Expected 43 characters, got ${privateKey.length}. It looks truncated — re-run \`npm run vapid\`.`,
      });
    }
    if (publicKey.length === 87 && privateKey.length === 43) {
      let derived: string | null = null;
      try {
        const ecdh = nodeCrypto().createECDH("prime256v1");
        ecdh.setPrivateKey(Buffer.from(privateKey, "base64url"));
        derived = ecdh.getPublicKey().toString("base64url");
      } catch {
        problems.push({ key: "VAPID_PRIVATE_KEY", message: "VAPID_PRIVATE_KEY is not a valid P-256 key — re-run `npm run vapid`." });
      }
      if (derived && derived !== publicKey) {
        problems.push({
          key: "VAPID",
          message:
            "The VAPID keys are not a pair: VAPID_PRIVATE_KEY does not match NEXT_PUBLIC_VAPID_PUBLIC_KEY. Both are the right length, so this is halves from two different `npm run vapid` runs — every push would fail. Paste both lines from one run.",
        });
      }
    }
  }

  const subject = process.env.VAPID_SUBJECT?.trim() || PLACEHOLDER_SUBJECT;
  if (!/^mailto:.+@.+/.test(subject) && !/^https:\/\/.+/.test(subject)) {
    problems.push({
      key: "VAPID_SUBJECT",
      message: `VAPID_SUBJECT is "${subject}" — RFC 8292 wants "mailto:you@your-domain" or "https://your-domain".`,
    });
  }

  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, config: { publicKey: publicKey!, privateKey: privateKey!, subject } };
}

/** True when the subject is still the one .env.example ships. */
export function isPlaceholderVapidSubject(): boolean {
  return (process.env.VAPID_SUBJECT?.trim() || PLACEHOLDER_SUBJECT) === PLACEHOLDER_SUBJECT;
}

/**
 * The Twilio contract, read the same way and for the same reason: one
 * function, so the boot check and `sms.ts` can never disagree about what
 * "configured" means.
 *
 * `from` is EITHER an E.164 number or a Messaging Service SID (MG…). Both are
 * things Twilio accepts in the same field, and a deployment sending to India
 * will use the latter — see the DLT note in sms.ts.
 */
export type TwilioConfig = { accountSid: string; authToken: string; from: string };

export function readTwilioConfig():
  | { ok: true; config: TwilioConfig }
  | { ok: false; problems: { key: string; message: string }[] } {
  const problems: { key: string; message: string }[] = [];

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  if (!accountSid) {
    problems.push({ key: "TWILIO_ACCOUNT_SID", message: "TWILIO_ACCOUNT_SID is not set — the account the messages are billed to." });
  } else if (!/^AC[0-9a-f]{32}$/i.test(accountSid)) {
    // Catches the commonest paste error of all: the API Key SID (SK…) or a
    // truncated copy, both of which fail later as an opaque 401.
    problems.push({ key: "TWILIO_ACCOUNT_SID", message: `TWILIO_ACCOUNT_SID is "${accountSid.slice(0, 6)}…" — expected an Account SID: "AC" followed by 32 hex characters.` });
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!authToken) {
    problems.push({ key: "TWILIO_AUTH_TOKEN", message: "TWILIO_AUTH_TOKEN is not set." });
  }

  const from = process.env.TWILIO_FROM?.trim();
  if (!from) {
    problems.push({ key: "TWILIO_FROM", message: 'TWILIO_FROM is not set — either a sending number in E.164 ("+15551234567") or a Messaging Service SID ("MG…").' });
  } else if (!/^\+[1-9]\d{6,14}$/.test(from) && !/^MG[0-9a-f]{32}$/i.test(from)) {
    problems.push({ key: "TWILIO_FROM", message: `TWILIO_FROM is "${from}" — expected E.164 (starting +) or a Messaging Service SID (MG…).` });
  }

  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, config: { accountSid: accountSid!, authToken: authToken!, from: from! } };
}

/**
 * A production BUILD served from localhost is the documented way to test the
 * service worker, offline mode and push — `next start` sets NODE_ENV=production
 * even on a laptop. Treating that as a real deployment made the app refuse to
 * boot for its own verification workflow, so "deployed" means production build
 * AND a non-localhost origin.
 */
/**
 * The app-release contract: the kill switch the phone reads at every start.
 *
 * NOTHING IS REFUSED UNTIL AN OPERATOR SAYS SO. Every variable has a default —
 * a minimum of 0.0.0 admits every build ever shipped, the latest defaults to
 * the minimum, the store links and the message to null — so an installation
 * that has never heard of these variables answers the phone truthfully and
 * refuses nobody. Read here, beside SMTP and VAPID, for the same reason those
 * are: `appVersionPolicy()` in app-release.ts and `checkEnv` below read ONE
 * function, so a value the boot check accepts is a value the endpoint serves,
 * and a value it flags is one the endpoint has already fallen back from.
 *
 * NEVER FATAL. A typo in a version string must not stop the server that
 * serves the web app too; it is said at boot, and the malformed value is
 * treated as unset so the phone is not locked out by a stray character.
 */
export const APP_RELEASE_VARS = [
  "APP_MIN_VERSION_IOS",
  "APP_MIN_VERSION_ANDROID",
  "APP_LATEST_VERSION_IOS",
  "APP_LATEST_VERSION_ANDROID",
  "APP_STORE_URL_IOS",
  "APP_STORE_URL_ANDROID",
  "APP_UPDATE_MESSAGE",
] as const;

export type AppReleaseConfig = {
  minimum: { ios: string; android: string };
  latest: { ios: string; android: string };
  storeUrls: { ios: string | null; android: string | null };
  message: string | null;
};

/** "1.4.2" or "1.4": digits and dots, nothing else — what the phone compares part by part. */
const DOTTED_VERSION = /^\d+\.\d+(\.\d+)?$/;

/** Part-by-part comparison of two dotted versions: negative when a < b. */
function compareVersions(a: string, b: string): number {
  const as = a.split(".").map(Number);
  const bs = b.split(".").map(Number);
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    const diff = (as[i] ?? 0) - (bs[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function readAppReleaseConfig(): { config: AppReleaseConfig; problems: { key: string; message: string }[] } {
  const problems: { key: string; message: string }[] = [];
  const raw = (key: (typeof APP_RELEASE_VARS)[number]) => process.env[key]?.trim() || "";

  const version = (key: (typeof APP_RELEASE_VARS)[number], fallback: string): string => {
    const value = raw(key);
    if (!value) return fallback;
    if (DOTTED_VERSION.test(value)) return value;
    problems.push({ key, message: `${key} is "${value}" — expected a dotted version like "1.4.2". Treated as unset until it is fixed.` });
    return fallback;
  };
  const url = (key: (typeof APP_RELEASE_VARS)[number]): string | null => {
    const value = raw(key);
    if (!value) return null;
    if (/^https?:\/\/\S+$/.test(value)) return value;
    problems.push({ key, message: `${key} is "${value}" — expected an https:// store link. Treated as unset until it is fixed.` });
    return null;
  };
  const latestOf = (key: (typeof APP_RELEASE_VARS)[number], minimum: string): string => {
    const value = version(key, minimum);
    if (compareVersions(value, minimum) < 0) {
      problems.push({ key, message: `${key} is "${value}", older than the minimum the API still serves (${minimum}). The latest cannot be older than the oldest; answering ${minimum}.` });
      return minimum;
    }
    return value;
  };

  const minimum = { ios: version("APP_MIN_VERSION_IOS", "0.0.0"), android: version("APP_MIN_VERSION_ANDROID", "0.0.0") };
  const latest = { ios: latestOf("APP_LATEST_VERSION_IOS", minimum.ios), android: latestOf("APP_LATEST_VERSION_ANDROID", minimum.android) };
  const storeUrls = { ios: url("APP_STORE_URL_IOS"), android: url("APP_STORE_URL_ANDROID") };
  const message = raw("APP_UPDATE_MESSAGE") || null;
  return { config: { minimum, latest, storeUrls, message }, problems };
}

function isDeployed(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  if (!url) return true; // no origin configured at all: assume the worst
  return !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(url);
}

/**
 * Where uploads go. Nothing set means this machine's disk under STORAGE_DIR,
 * which is right on a laptop and on one machine with a volume. A bucket is
 * five variables, ALL-OR-NOTHING like an SSO provider: a half-set block is
 * not a choice, it is a typo — and, unlike SSO, the consequence of ignoring
 * it is silent: uploads would land on a disk the next deploy throws away. So
 * `checkEnv` makes a half-set bucket fatal when deployed.
 *
 *   STORAGE_BUCKET                 the bucket name
 *   STORAGE_S3_ENDPOINT            https://s3.ap-south-1.amazonaws.com, https://<account>.r2.cloudflarestorage.com, …
 *   STORAGE_S3_REGION              ap-south-1 for AWS, "auto" for R2, the endpoint's region for B2
 *   STORAGE_S3_ACCESS_KEY_ID
 *   STORAGE_S3_SECRET_ACCESS_KEY
 *   STORAGE_S3_PREFIX              optional, "edulink/" to share a bucket
 *   STORAGE_S3_PATH_STYLE          optional, "false" for virtual-hosted addressing; path-style otherwise
 */
/**
 * The key that seals every school's gateway secrets (secret-box.ts). Absent
 * means no school can save a gateway account — the settings page says so —
 * and nothing else stops working: a school taking fees by UPI id or at the
 * counter never needs it. 32 bytes, base64; `openssl rand -base64 32`.
 */
export function readFeesSecretKey(): { ok: true; key: Buffer } | { ok: false; problem: string } {
  const raw = process.env.FEES_SECRET_KEY?.trim();
  if (!raw) return { ok: false, problem: "FEES_SECRET_KEY is not set — the key that seals each school's gateway secrets. Generate one with `openssl rand -base64 32`." };
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) return { ok: false, problem: `FEES_SECRET_KEY decodes to ${key.length} bytes — expected 32 (base64 of \`openssl rand -base64 32\`).` };
  return { ok: true, key };
}

/**
 * How online fee orders reach a gateway. "devbox" (the local default) mints
 * local order ids and /dev/payments settles them, so the whole checkout runs
 * with no account anywhere; "razorpay" talks to the real API with each
 * school's own keys; "off" is what a deployed server gets when it names
 * neither — online payment unavailable, everything else unchanged.
 */
export type FeesGatewayTransport = "devbox" | "razorpay" | "off";
export function readFeesGatewayTransport(): FeesGatewayTransport {
  if (process.env.FEES_GATEWAY_TRANSPORT === "razorpay") return "razorpay";
  // A deployed server never mints pretend orders: with no real transport
  // named, online payment is simply OFF — the settings page says so and the
  // checkout refuses — and UPI-id and counter payments carry on. Not a boot
  // failure, because a school taking fees at the counter never needs this.
  return isDeployed() ? "off" : "devbox";
}

export const STORAGE_BUCKET_VARS = ["STORAGE_BUCKET", "STORAGE_S3_ENDPOINT", "STORAGE_S3_REGION", "STORAGE_S3_ACCESS_KEY_ID", "STORAGE_S3_SECRET_ACCESS_KEY"] as const;

export type StorageConfig = {
  dir: string;
  bucket: { bucket: string; endpoint: string; region: string; accessKeyId: string; secretAccessKey: string; prefix: string; pathStyle: boolean } | null;
  problems: { key: string; message: string }[];
};

export function readStorageConfig(): StorageConfig {
  const dir = process.env.STORAGE_DIR?.trim() || "./storage";
  const values = Object.fromEntries(STORAGE_BUCKET_VARS.map((k) => [k, process.env[k]?.trim() ?? ""])) as Record<(typeof STORAGE_BUCKET_VARS)[number], string>;
  const set = STORAGE_BUCKET_VARS.filter((k) => values[k]);
  if (set.length === 0) return { dir, bucket: null, problems: [] };
  const problems: { key: string; message: string }[] = [];
  for (const k of STORAGE_BUCKET_VARS) {
    if (!values[k]) problems.push({ key: k, message: `${k} is not set, but ${set[0]} is — a bucket needs all five of ${STORAGE_BUCKET_VARS.join(", ")}. Uploads are going to the disk at ${dir} until it does.` });
  }
  let endpoint = values.STORAGE_S3_ENDPOINT;
  if (endpoint && !/^https?:\/\//.test(endpoint)) problems.push({ key: "STORAGE_S3_ENDPOINT", message: `STORAGE_S3_ENDPOINT is "${endpoint}" — expected a URL such as https://s3.ap-south-1.amazonaws.com.` });
  if (endpoint && /^http:\/\//.test(endpoint) && !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(endpoint) && isDeployed()) {
    problems.push({ key: "STORAGE_S3_ENDPOINT", message: "STORAGE_S3_ENDPOINT is http:// — every upload and its credentials would cross the network in the clear." });
  }
  if (problems.length) return { dir, bucket: null, problems };
  endpoint = endpoint.replace(/\/+$/, "");
  const prefixRaw = process.env.STORAGE_S3_PREFIX?.trim().replace(/^\/+/, "") ?? "";
  const prefix = prefixRaw && !prefixRaw.endsWith("/") ? `${prefixRaw}/` : prefixRaw;
  const pathStyle = (process.env.STORAGE_S3_PATH_STYLE?.trim().toLowerCase() ?? "true") !== "false";
  return {
    dir,
    bucket: { bucket: values.STORAGE_BUCKET, endpoint, region: values.STORAGE_S3_REGION, accessKeyId: values.STORAGE_S3_ACCESS_KEY_ID, secretAccessKey: values.STORAGE_S3_SECRET_ACCESS_KEY, prefix, pathStyle },
    problems: [],
  };
}

export function checkEnv(): EnvProblem[] {
  const problems: EnvProblem[] = [];
  const isProd = isDeployed();

  const vapid = readVapidConfig();
  if (!vapid.ok) {
    for (const problem of vapid.problems) problems.push({ ...problem, fatal: isProd });
  }

  // A real deployment pushing under the shipped placeholder is telling every
  // push service to contact an address on the local network. Warned about
  // separately from the malformed case, because the value is well-formed —
  // it is simply nobody's.
  if (isProd && isPlaceholderVapidSubject()) {
    problems.push({
      key: "VAPID_SUBJECT",
      message:
        `VAPID_SUBJECT is still the shipped placeholder (${PLACEHOLDER_SUBJECT}) — a .local address no push service can reach. Set it to an address somebody reads.`,
      fatal: true,
    });
  }

  if (!process.env.DATABASE_URL?.trim()) {
    problems.push({ key: "DATABASE_URL", message: "DATABASE_URL is not set.", fatal: true });
  }

  // A half-set bucket: fatal when deployed (the disk it falls back to is the
  // one the next deploy throws away), loud on a laptop.
  const storage = readStorageConfig();
  for (const problem of storage.problems) problems.push({ ...problem, fatal: isProd });

  // The jobs runner without the owner connection would run every job under
  // the app role, and every cross-tenant sweep would quietly find nothing.
  if (process.env.JOBS_RUNNER === "1") {
    if (!process.env.DATABASE_ADMIN_URL?.trim()) {
      problems.push({ key: "DATABASE_ADMIN_URL", message: "JOBS_RUNNER=1 but DATABASE_ADMIN_URL is not set — a job is operator work and reaches every tenant, so the runner must connect as the owner.", fatal: true });
    }
    const host = process.env.HOSTNAME?.trim();
    if (isProd && host !== "127.0.0.1" && host !== "localhost") {
      problems.push({ key: "HOSTNAME", message: `JOBS_RUNNER=1 with HOSTNAME=${host || "(unset, 0.0.0.0)"} — a server on the owner connection must listen on loopback only. Set HOSTNAME=127.0.0.1.`, fatal: true });
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) {
    problems.push({
      key: "NEXT_PUBLIC_APP_URL",
      message:
        "NEXT_PUBLIC_APP_URL is not set. Magic links and invitation emails will point at localhost.",
      fatal: isProd,
    });
  } else if (isProd && appUrl.startsWith("http://") && !appUrl.includes("localhost")) {
    problems.push({
      key: "NEXT_PUBLIC_APP_URL",
      message:
        "NEXT_PUBLIC_APP_URL is http:// in production. Service workers, push and installability all require HTTPS.",
      fatal: true,
    });
  }

  const emailTransport = process.env.EMAIL_TRANSPORT ?? "devbox";
  if (isProd && emailTransport === "devbox") {
    // Only fires for a genuinely deployed origin — a local production build
    // keeps the dev mailbox, which is how the email flows get tested at all.
    problems.push({
      key: "EMAIL_TRANSPORT",
      message:
        'EMAIL_TRANSPORT is "devbox" in production: no email will actually be sent, and /dev/mailbox is disabled. Set EMAIL_TRANSPORT=smtp and the SMTP_* variables.',
      fatal: true,
    });
  }

  // Saying "smtp" is a promise; a boot that cannot keep it must say so NOW,
  // not at the first parent's password reset. Fatal when deployed, loud
  // locally — the VAPID rule.
  if (emailTransport === "smtp") {
    const smtp = readSmtpConfig();
    if (!smtp.ok) {
      for (const problem of smtp.problems) problems.push({ ...problem, fatal: isProd });
    }
  }

  /**
   * THE SAME GATE FOR TEXT MESSAGES, and it was missing.
   *
   * The email one has been here since v1 because "no email is actually sent"
   * has no symptom a deployment would notice. Password reset by mobile number
   * made that exactly true of SMS as well — and worse, because the person
   * affected is locked out of their account and has no way to tell whether the
   * code is late or was never sent. Fatal for the same reason: a school
   * discovering this from a parent who cannot get in has discovered it too late.
   */
  const smsTransport = process.env.SMS_TRANSPORT ?? "devbox";
  if (isProd && smsTransport === "devbox") {
    problems.push({
      key: "SMS_TRANSPORT",
      message:
        'SMS_TRANSPORT is "devbox" in production: no text will actually be sent, so password reset by mobile number silently goes nowhere. Set SMS_TRANSPORT=twilio and the TWILIO_* variables.',
      fatal: true,
    });
  }

  // Fees: a key that is set must be a key. Nothing else is required — a
  // school on UPI id or the counter alone never touches a gateway, and a
  // deployed server with no transport named simply has online payment off
  // (readFeesGatewayTransport).
  if (process.env.FEES_SECRET_KEY !== undefined) {
    const feesKey = readFeesSecretKey();
    if (!feesKey.ok) problems.push({ key: "FEES_SECRET_KEY", message: feesKey.problem, fatal: isProd });
  }

  // The same promise as the SMTP block: saying "twilio" and meaning it.
  if (smsTransport === "twilio") {
    const twilio = readTwilioConfig();
    if (!twilio.ok) {
      for (const problem of twilio.problems) problems.push({ ...problem, fatal: isProd });
    }
  }

  /**
   * A half-configured provider is never fatal — refusing to boot over an
   * optional feature would be worse than the bug — but it is always said,
   * because the symptom otherwise is a button that is simply not there.
   */
  for (const status of ssoStatus()) {
    if (status.state !== "partial") continue;
    problems.push({
      key: `SSO_${status.provider.toUpperCase()}`,
      message: `SSO for ${status.provider} is half-configured: ${status.present.join(", ")} set, ${status.missing.join(", ")} missing. The sign-in button will not appear at all. Set the rest, or clear them to turn the provider off deliberately.`,
      fatal: false,
    });
  }

  /**
   * The phone's kill switch, read from the same function the endpoint reads.
   * Never fatal — see readAppReleaseConfig — but always said, because the
   * symptom of a malformed minimum is otherwise an update screen that never
   * appears, discovered the day an old build must be turned off.
   */
  for (const problem of readAppReleaseConfig().problems) problems.push({ ...problem, fatal: false });

  return problems;
}

/**
 * Call once at startup. Throws on anything fatal so a misconfigured deploy
 * fails at boot rather than at the first parent who does not get told their
 * child was absent.
 */
export function assertEnv(): void {
  const problems = checkEnv();
  if (problems.length === 0) return;

  for (const problem of problems) {
    const line = `[env] ${problem.key}: ${problem.message}`;
    if (problem.fatal) console.error(line);
    else console.warn(line);
  }

  const fatal = problems.filter((p) => p.fatal);
  if (fatal.length > 0) {
    throw new Error(
      `Refusing to start: ${fatal.length} environment problem(s). ${fatal.map((p) => p.key).join(", ")}`,
    );
  }
}
