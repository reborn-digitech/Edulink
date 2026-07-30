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
  "NODE_ENV",
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

const GOOD_PUBLIC = "x".repeat(87);
const GOOD_PRIVATE = "y".repeat(43);

describe("checkEnv — VAPID", () => {
  it("passes with well-formed keys", () => {
    set({
      NODE_ENV: "production",
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: GOOD_PUBLIC,
      VAPID_PRIVATE_KEY: GOOD_PRIVATE,
      DATABASE_URL: "postgres://x",
      NEXT_PUBLIC_APP_URL: "https://edulink.example",
      EMAIL_TRANSPORT: "smtp",
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
