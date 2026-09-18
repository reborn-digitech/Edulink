import { afterEach, describe, expect, it } from "vitest";
import { assertEnv, checkEnv } from "./env";

/**
 * Regression suite for a bug found by noticing a stray warning in test output:
 * the VAPID keys in .env were empty strings, so every push notification the app
 * "sent" went nowhere — and all 130 tests still passed, because the only
 * symptom was a console.warn.
 *
 * These tests exist so that failure mode is loud rather than silent.
 */

const KEYS = [
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "DATABASE_URL",
  "NEXT_PUBLIC_APP_URL",
  "EMAIL_TRANSPORT",
  "SMS_TRANSPORT",
  "NODE_ENV",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM",
  "VAPID_SUBJECT",
] as const;

const original = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const key of KEYS) {
    if (original[key] === undefined) delete (process.env as Record<string, string | undefined>)[key];
    else (process.env as Record<string, string | undefined>)[key] = original[key];
  }
});

function set(values: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const [key, value] of Object.entries(values)) {
    (process.env as Record<string, string | undefined>)[key] = value;
  }
}

/**
 * A REAL pair from `npm run vapid`, not 87 and 43 filler characters — the
 * boot check now derives one from the other, so filler no longer passes, and
 * that is the point of the check rather than a nuisance of it.
 */
const GOOD_PUBLIC = "BKQNxEMs_lat-ElQkXtmpfQ5AZc9P0Ay8OkMNbMfKViOHOmcnYv2nFYGXf0vaRRz6XXyCvWJHMIFqydxqCHJn_M";
const GOOD_PRIVATE = "K-K-Hv9Sd51taFimuH_c9likC2Ks-Y4-c6S6S5Szh9I";
/** The public half of a DIFFERENT run — right length, wrong key. */
const OTHER_PUBLIC = "BJxCC0dTfKzaCX8L1MraNIRPtVpFrJmLPRDGKPEz8lRDGCXKvTfUJTuLSt5oyFcVSTFCXQVBTVWmZfDCBDdEjkI";

/** A complete, healthy SMTP block. Tests unset pieces of it deliberately. */
const GOOD_SMTP = {
  SMTP_HOST: "smtp.example.org",
  SMTP_PORT: "587",
  SMTP_SECURE: "false",
  SMTP_USER: "mailer",
  SMTP_PASS: "hunter2",
  EMAIL_FROM: "Relay <no-reply@edulink.example>",
} as const;

/** A complete, healthy Twilio block. */
const GOOD_TWILIO = {
  TWILIO_ACCOUNT_SID: "AC" + "0123456789abcdef".repeat(2),
  TWILIO_AUTH_TOKEN: "sekrit",
  TWILIO_FROM: "+15551234567",
} as const;

function unset(...keys: (typeof KEYS)[number][]) {
  for (const key of keys) delete (process.env as Record<string, string | undefined>)[key];
}

describe("checkEnv — VAPID", () => {
  it("passes with well-formed keys", () => {
    set({
      NODE_ENV: "production",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC,
      VAPID_PRIVATE_KEY: GOOD_PRIVATE,
      DATABASE_URL: "postgres://x",
      NEXT_PUBLIC_APP_URL: "https://edulink.example",
      EMAIL_TRANSPORT: "smtp",
      SMS_TRANSPORT: "twilio",
      // A real subject: the shipped placeholder is refused in production, and
      // this case claims to be a healthy production configuration.
      VAPID_SUBJECT: "mailto:ops@edulink.example",
      ...GOOD_SMTP,
      ...GOOD_TWILIO,
    });
    expect(checkEnv()).toEqual([]);
  });

  it("flags EMPTY keys — the exact bug that shipped", () => {
    set({
      NODE_ENV: "development",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "",
      VAPID_PRIVATE_KEY: "",
      DATABASE_URL: "postgresql://u@localhost:5432/edulink_dev",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    const problems = checkEnv();
    expect(problems.some((p) => p.key === "VAPID")).toBe(true);
  });

  it("treats whitespace-only keys as empty", () => {
    set({
      NODE_ENV: "development",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "   ",
      VAPID_PRIVATE_KEY: "\t",
      DATABASE_URL: "postgresql://u@localhost:5432/edulink_dev",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    expect(checkEnv().some((p) => p.key === "VAPID")).toBe(true);
  });

  it("catches a truncated paste by length", () => {
    set({
      NODE_ENV: "development",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "x".repeat(40),
      VAPID_PRIVATE_KEY: GOOD_PRIVATE,
      DATABASE_URL: "postgresql://u@localhost:5432/edulink_dev",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    const problems = checkEnv();
    expect(problems.some((p) => p.key === "NEXT_PUBLIC_VAPID_PUBLIC_KEY")).toBe(true);
  });

  it("is fatal once deployed, but only a warning locally", () => {
    const base = {
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "",
      VAPID_PRIVATE_KEY: "",
      DATABASE_URL: "postgresql://u@localhost:5432/edulink_dev",
    };

    set({ ...base, NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "http://localhost:3000" });
    expect(checkEnv().find((p) => p.key === "VAPID")!.fatal).toBe(false);

    // A local production build is still local — see isDeployed().
    set({ ...base, NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "http://localhost:3200" });
    expect(checkEnv().find((p) => p.key === "VAPID")!.fatal).toBe(false);

    set({
      ...base,
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://edulink.example",
      EMAIL_TRANSPORT: "smtp",
    });
    expect(checkEnv().find((p) => p.key === "VAPID")!.fatal).toBe(true);
  });
});

describe("checkEnv — deployment footguns", () => {
  it("refuses plain http in production", () => {
    set({
      NODE_ENV: "production",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC,
      VAPID_PRIVATE_KEY: GOOD_PRIVATE,
      DATABASE_URL: "postgres://x",
      NEXT_PUBLIC_APP_URL: "http://edulink.example",
      EMAIL_TRANSPORT: "smtp",
    });
    const problem = checkEnv().find((p) => p.key === "NEXT_PUBLIC_APP_URL");
    expect(problem?.fatal).toBe(true);
    expect(problem?.message).toMatch(/HTTPS/);
  });

  it("allows http on localhost, which is exempt from the secure-context rule", () => {
    set({
      NODE_ENV: "production",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC,
      VAPID_PRIVATE_KEY: GOOD_PRIVATE,
      DATABASE_URL: "postgres://x",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      EMAIL_TRANSPORT: "smtp",
    });
    expect(checkEnv().some((p) => p.key === "NEXT_PUBLIC_APP_URL")).toBe(false);
  });

  it("does NOT block a local production build — the documented way to test the SW", () => {
    // `next start` sets NODE_ENV=production on a laptop. Treating that as a
    // deployment made the app refuse to boot for its own verification steps.
    for (const url of ["http://localhost:3200", "http://127.0.0.1:3000", "http://[::1]:3000"]) {
      set({
        NODE_ENV: "production",
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC,
        VAPID_PRIVATE_KEY: GOOD_PRIVATE,
        DATABASE_URL: "postgresql://u@localhost:5432/edulink_dev",
        NEXT_PUBLIC_APP_URL: url,
        EMAIL_TRANSPORT: "devbox",
      });
      expect(checkEnv(), `origin ${url}`).toEqual([]);
    }
  });

  it("treats a production build with NO configured origin as deployed", () => {
    set({
      NODE_ENV: "production",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC,
      VAPID_PRIVATE_KEY: GOOD_PRIVATE,
      DATABASE_URL: "postgres://x",
      NEXT_PUBLIC_APP_URL: "",
      EMAIL_TRANSPORT: "devbox",
    });
    const problems = checkEnv();
    expect(problems.some((p) => p.key === "EMAIL_TRANSPORT" && p.fatal)).toBe(true);
  });

  it("is not fooled by a hostname that merely starts with localhost", () => {
    set({
      NODE_ENV: "production",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC,
      VAPID_PRIVATE_KEY: GOOD_PRIVATE,
      DATABASE_URL: "postgres://x",
      NEXT_PUBLIC_APP_URL: "https://localhost.evil.example",
      EMAIL_TRANSPORT: "devbox",
    });
    expect(checkEnv().some((p) => p.key === "EMAIL_TRANSPORT" && p.fatal)).toBe(true);
  });

  it("⚠ refuses the devbox SMS transport in production", () => {
    /**
     * THE SAME FAILURE AS THE EMAIL ONE, and it arrived with password reset by
     * mobile number. "No text was actually sent" has no symptom a deployment
     * notices — except a parent who cannot get into their account and cannot
     * tell whether the code is late or was never sent.
     */
    set({
      NODE_ENV: "production",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC,
      VAPID_PRIVATE_KEY: GOOD_PRIVATE,
      DATABASE_URL: "postgres://x",
      NEXT_PUBLIC_APP_URL: "https://edulink.example",
      EMAIL_TRANSPORT: "smtp",
      SMS_TRANSPORT: "devbox",
    });
    expect(checkEnv().some((p) => p.key === "SMS_TRANSPORT" && p.fatal)).toBe(true);
  });

  it("says nothing about either transport in development", () => {
    set({
      NODE_ENV: "development",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC,
      VAPID_PRIVATE_KEY: GOOD_PRIVATE,
      DATABASE_URL: "postgres://x",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      EMAIL_TRANSPORT: "devbox",
      SMS_TRANSPORT: "devbox",
    });
    // The dev mailbox is how both flows are exercised at all.
    expect(checkEnv().some((p) => p.key === "SMS_TRANSPORT")).toBe(false);
    expect(checkEnv().some((p) => p.key === "EMAIL_TRANSPORT")).toBe(false);
  });

  it("refuses the devbox email transport in production", () => {
    set({
      NODE_ENV: "production",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC,
      VAPID_PRIVATE_KEY: GOOD_PRIVATE,
      DATABASE_URL: "postgres://x",
      NEXT_PUBLIC_APP_URL: "https://edulink.example",
      EMAIL_TRANSPORT: "devbox",
    });
    const problem = checkEnv().find((p) => p.key === "EMAIL_TRANSPORT");
    expect(problem?.fatal).toBe(true);
  });

  it("does not complain about devbox in development", () => {
    set({
      NODE_ENV: "development",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC,
      VAPID_PRIVATE_KEY: GOOD_PRIVATE,
      DATABASE_URL: "postgresql://u@localhost:5432/edulink_dev",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      EMAIL_TRANSPORT: "devbox",
    });
    expect(checkEnv()).toEqual([]);
  });

  it("always treats a missing DATABASE_URL as fatal", () => {
    set({
      NODE_ENV: "development",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC,
      VAPID_PRIVATE_KEY: GOOD_PRIVATE,
      DATABASE_URL: "",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    expect(checkEnv().find((p) => p.key === "DATABASE_URL")?.fatal).toBe(true);
  });
});

describe("assertEnv", () => {
  it("throws when anything is fatal", () => {
    set({
      NODE_ENV: "production",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "",
      VAPID_PRIVATE_KEY: "",
      DATABASE_URL: "postgres://x",
      NEXT_PUBLIC_APP_URL: "https://edulink.example",
      EMAIL_TRANSPORT: "smtp",
    });
    expect(() => assertEnv()).toThrow(/Refusing to start/);
  });

  it("does not throw for warnings alone", () => {
    set({
      NODE_ENV: "development",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "",
      VAPID_PRIVATE_KEY: "",
      DATABASE_URL: "postgresql://u@localhost:5432/edulink_dev",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    expect(() => assertEnv()).not.toThrow();
  });

  it("passes cleanly on this repo's real .env", () => {
    // Guards against the checked-in .env drifting back to empty keys.
    expect(() => assertEnv()).not.toThrow();
    expect(checkEnv()).toEqual([]);
  });
});

describe("⚠ checkEnv — the SMTP contract, validated at boot", () => {
  const deployed = {
    NODE_ENV: "production",
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC,
    VAPID_PRIVATE_KEY: GOOD_PRIVATE,
    DATABASE_URL: "postgres://x",
    NEXT_PUBLIC_APP_URL: "https://edulink.example",
    EMAIL_TRANSPORT: "smtp",
    SMS_TRANSPORT: "twilio",
  } as const;

  it("⚠ saying smtp without a host refuses to boot a deployment — every gap named at once", () => {
    set({ ...deployed, ...GOOD_SMTP });
    unset("SMTP_HOST", "EMAIL_FROM");
    const problems = checkEnv();
    expect(problems.find((p) => p.key === "SMTP_HOST")?.fatal).toBe(true);
    expect(problems.find((p) => p.key === "EMAIL_FROM")?.fatal).toBe(true);
  });

  it("the same gaps are loud but not fatal on a laptop", () => {
    set({ ...deployed, ...GOOD_SMTP, NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "http://localhost:3000" });
    unset("SMTP_HOST");
    const problem = checkEnv().find((p) => p.key === "SMTP_HOST");
    expect(problem).toBeTruthy();
    expect(problem!.fatal).toBe(false);
  });

  it("catches the half-typed credential pair and the nonsense port", () => {
    set({ ...deployed, ...GOOD_SMTP, SMTP_PORT: "yes please" });
    unset("SMTP_PASS");
    const problems = checkEnv();
    expect(problems.some((p) => p.key === "SMTP_PORT")).toBe(true);
    expect(problems.some((p) => p.key === "SMTP_USER")).toBe(true);
  });

  it("a from line without an @ is not an address", () => {
    set({ ...deployed, ...GOOD_SMTP, EMAIL_FROM: "the school office" });
    expect(checkEnv().some((p) => p.key === "EMAIL_FROM")).toBe(true);
  });

  it("devbox reads none of it — an empty SMTP block is not devbox's problem", () => {
    set({ ...deployed, NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "http://localhost:3000", EMAIL_TRANSPORT: "devbox" });
    unset("SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM");
    expect(checkEnv().some((p) => p.key.startsWith("SMTP") || p.key === "EMAIL_FROM")).toBe(false);
  });
});

describe("⚠ checkEnv — the Twilio contract, validated at boot", () => {
  const deployed = {
    NODE_ENV: "production",
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC,
    VAPID_PRIVATE_KEY: GOOD_PRIVATE,
    DATABASE_URL: "postgres://x",
    NEXT_PUBLIC_APP_URL: "https://edulink.example",
    EMAIL_TRANSPORT: "smtp",
    SMS_TRANSPORT: "twilio",
  } as const;

  it("⚠ saying twilio with nothing behind it refuses to boot, naming every gap", () => {
    set({ ...deployed, ...GOOD_SMTP });
    unset("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM");
    const problems = checkEnv();
    for (const key of ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM"]) {
      expect(problems.find((p) => p.key === key)?.fatal, key).toBe(true);
    }
  });

  it("⚠ catches the API Key SID pasted where the Account SID goes — a 401 with no explanation otherwise", () => {
    set({ ...deployed, ...GOOD_SMTP, ...GOOD_TWILIO, TWILIO_ACCOUNT_SID: "SK" + "0123456789abcdef".repeat(2) });
    const problem = checkEnv().find((p) => p.key === "TWILIO_ACCOUNT_SID");
    expect(problem).toBeTruthy();
    expect(problem!.message).toMatch(/AC/);
  });

  it("takes a Messaging Service SID as a sender — the India route — but not free text", () => {
    set({ ...deployed, ...GOOD_SMTP, ...GOOD_TWILIO, TWILIO_FROM: "MG" + "0123456789abcdef".repeat(2) });
    expect(checkEnv().some((p) => p.key === "TWILIO_FROM")).toBe(false);

    set({ ...deployed, ...GOOD_SMTP, ...GOOD_TWILIO, TWILIO_FROM: "Relay" });
    expect(checkEnv().some((p) => p.key === "TWILIO_FROM")).toBe(true);

    // A local number without the country code is the other classic.
    set({ ...deployed, ...GOOD_SMTP, ...GOOD_TWILIO, TWILIO_FROM: "9876543210" });
    expect(checkEnv().some((p) => p.key === "TWILIO_FROM")).toBe(true);
  });

  it("the same gaps are loud but not fatal on a laptop, and devbox reads none of it", () => {
    set({ ...deployed, ...GOOD_SMTP, NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "http://localhost:3000" });
    unset("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM");
    expect(checkEnv().find((p) => p.key === "TWILIO_FROM")?.fatal).toBe(false);

    set({ ...deployed, ...GOOD_SMTP, NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "http://localhost:3000", SMS_TRANSPORT: "devbox" });
    unset("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM");
    expect(checkEnv().some((p) => p.key.startsWith("TWILIO"))).toBe(false);
  });
});

describe("⚠ checkEnv — the VAPID pair, checked as a pair", () => {
  const deployed = {
    NODE_ENV: "production",
    DATABASE_URL: "postgres://x",
    NEXT_PUBLIC_APP_URL: "https://edulink.example",
    EMAIL_TRANSPORT: "smtp",
    SMS_TRANSPORT: "twilio",
    VAPID_SUBJECT: "mailto:ops@edulink.example",
  } as const;

  it("⚠ two right-length halves from DIFFERENT runs are refused — every push would fail", () => {
    set({
      ...deployed,
      ...GOOD_SMTP,
      ...GOOD_TWILIO,
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: OTHER_PUBLIC,
      VAPID_PRIVATE_KEY: GOOD_PRIVATE,
    });
    const problem = checkEnv().find((p) => p.key === "VAPID");
    expect(problem, "a mismatched pair must be caught").toBeTruthy();
    expect(problem!.message).toMatch(/not a pair/);
    expect(problem!.fatal).toBe(true);
  });

  it("the matching pair passes, and length is still checked first", () => {
    set({ ...deployed, ...GOOD_SMTP, ...GOOD_TWILIO, NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC, VAPID_PRIVATE_KEY: GOOD_PRIVATE });
    expect(checkEnv()).toEqual([]);

    set({ ...deployed, ...GOOD_SMTP, ...GOOD_TWILIO, NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC, VAPID_PRIVATE_KEY: "tooshort" });
    const problems = checkEnv();
    expect(problems.some((p) => p.key === "VAPID_PRIVATE_KEY")).toBe(true);
    // Not ALSO reported as a mismatch: one paste error, one message.
    expect(problems.some((p) => p.key === "VAPID" && /not a pair/.test(p.message))).toBe(false);
  });

  it("⚠ refuses the shipped placeholder subject in production — nothing can reach a .local address", () => {
    set({ ...deployed, ...GOOD_SMTP, ...GOOD_TWILIO, NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC, VAPID_PRIVATE_KEY: GOOD_PRIVATE, VAPID_SUBJECT: "mailto:admin@edulink.local" });
    const problem = checkEnv().find((p) => p.key === "VAPID_SUBJECT");
    expect(problem?.fatal).toBe(true);
    expect(problem!.message).toMatch(/placeholder/);

    // Same placeholder on a laptop is nobody's problem.
    set({ ...deployed, ...GOOD_SMTP, ...GOOD_TWILIO, NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC, VAPID_PRIVATE_KEY: GOOD_PRIVATE, VAPID_SUBJECT: "mailto:admin@edulink.local", NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "http://localhost:3000" });
    expect(checkEnv().some((p) => p.key === "VAPID_SUBJECT")).toBe(false);
  });

  it("holds RFC 8292 on the subject: mailto: or https:, not a bare address", () => {
    const base = { ...deployed, ...GOOD_SMTP, ...GOOD_TWILIO, NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC, VAPID_PRIVATE_KEY: GOOD_PRIVATE };
    set({ ...base, VAPID_SUBJECT: "ops@edulink.example" });
    expect(checkEnv().some((p) => p.key === "VAPID_SUBJECT")).toBe(true);

    set({ ...base, VAPID_SUBJECT: "https://edulink.example/contact" });
    expect(checkEnv().some((p) => p.key === "VAPID_SUBJECT")).toBe(false);
  });
});
