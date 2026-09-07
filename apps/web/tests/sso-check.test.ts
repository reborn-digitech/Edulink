import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SSO_REQUIRED_VARS, ssoStatus, checkEnv } from "@/lib/env";
import { SSO_PROVIDERS, beginSso, ssoRedirectUri } from "@/lib/sso";

/**
 * The SSO configuration report, and the one thing that could quietly make it
 * lie.
 */

const ALL = Object.values(SSO_REQUIRED_VARS).flat();
const original = Object.fromEntries(ALL.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const key of ALL) {
    if (original[key] === undefined) delete (process.env as Record<string, string | undefined>)[key];
    else (process.env as Record<string, string | undefined>)[key] = original[key];
  }
});

function set(values: Record<string, string>) {
  for (const [k, v] of Object.entries(values)) (process.env as Record<string, string | undefined>)[k] = v;
}
function clearAll() {
  for (const key of ALL) delete (process.env as Record<string, string | undefined>)[key];
}

describe("⚠ the variable names cannot drift from the ones SSO actually reads", () => {
  /**
   * A grep, deliberately — the same shape as this repo's ban on
   * `db.$transaction`. A variable renamed in sso.ts and not in env.ts would
   * make the boot check and `sso:check` certify a provider that cannot start,
   * and no runtime test would notice because both files would agree with
   * themselves.
   */
  it("every name env.ts requires is read by sso.ts", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/sso.ts"), "utf8");
    const unread = ALL.filter((name) => !source.includes(name));
    expect(unread, `named in env.ts but never read in sso.ts: ${unread.join(", ")}`).toEqual([]);
  });

  it("covers exactly the providers SSO offers", () => {
    expect(Object.keys(SSO_REQUIRED_VARS).sort()).toEqual([...SSO_PROVIDERS].sort());
  });
});

describe("ssoStatus", () => {
  it("absent is a valid installation, not a fault", () => {
    clearAll();
    expect(ssoStatus().every((s) => s.state === "absent")).toBe(true);
    // …and nothing is reported about it.
    expect(checkEnv().some((p) => p.key.startsWith("SSO_"))).toBe(false);
  });

  it("⚠ half-configured is reported — the button silently never appears otherwise", () => {
    clearAll();
    set({ SSO_GOOGLE_CLIENT_ID: "x.apps.googleusercontent.com" }); // secret forgotten
    const google = ssoStatus().find((s) => s.provider === "google")!;
    expect(google.state).toBe("partial");
    expect(google.state === "partial" && google.missing).toEqual(["SSO_GOOGLE_CLIENT_SECRET"]);

    const problem = checkEnv().find((p) => p.key === "SSO_GOOGLE");
    expect(problem).toBeTruthy();
    // Never fatal: refusing to boot over an optional feature would be worse.
    expect(problem!.fatal).toBe(false);
    expect(problem!.message).toMatch(/will not appear/);
  });

  it("a whitespace-only value counts as missing, not as set", () => {
    clearAll();
    set({ SSO_GOOGLE_CLIENT_ID: "id", SSO_GOOGLE_CLIENT_SECRET: "   " });
    const google = ssoStatus().find((s) => s.provider === "google")!;
    expect(google.state).toBe("partial");
  });

  it("fully configured is reported as configured, and Apple needs all four", () => {
    clearAll();
    set({ SSO_GOOGLE_CLIENT_ID: "id", SSO_GOOGLE_CLIENT_SECRET: "secret" });
    expect(ssoStatus().find((s) => s.provider === "google")!.state).toBe("configured");

    set({ SSO_APPLE_CLIENT_ID: "com.example.app", SSO_APPLE_TEAM_ID: "T", SSO_APPLE_KEY_ID: "K" });
    // The private key is still missing — the fragile one.
    const apple = ssoStatus().find((s) => s.provider === "apple")!;
    expect(apple.state).toBe("partial");
    expect(apple.state === "partial" && apple.missing).toEqual(["SSO_APPLE_PRIVATE_KEY"]);
  });
});

describe("⚠ the redirect URI is built once, and is what the provider actually receives", () => {
  /**
   * It must be byte-identical at start and at callback or the exchange is
   * rejected, and identical to what is registered or the person is refused
   * after typing their password. It used to be the same expression written
   * out three times — two routes and the checking tool — so nothing stopped
   * one of them drifting and the tool then certifying a string the app did
   * not send.
   */
  it("no route builds its own copy any more", () => {
    for (const file of [
      "src/app/api/sso/[provider]/start/route.ts",
      "src/app/api/sso/[provider]/callback/route.ts",
    ]) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source, `${file} must call ssoRedirectUri`).toContain("ssoRedirectUri(");
      expect(source, `${file} still assembles the path by hand`).not.toMatch(/\/api\/sso\/\$\{[^}]+\}\/callback/);
    }
  });

  it("trailing slashes on the origin cannot produce two different strings", () => {
    expect(ssoRedirectUri("https://edulink.example/", "google")).toBe(
      ssoRedirectUri("https://edulink.example", "google"),
    );
    expect(ssoRedirectUri("  https://edulink.example  ", "google")).toBe(
      "https://edulink.example/api/sso/google/callback",
    );
  });

  it("⚠ the URI the tool prints is the one that reaches the provider", () => {
    // Not a claim about the string: the authorize URL is built by beginSso,
    // and its redirect_uri parameter is read back out.
    process.env.SSO_GOOGLE_CLIENT_ID = "1234.apps.googleusercontent.com";
    process.env.SSO_GOOGLE_CLIENT_SECRET = "secret";
    const uri = ssoRedirectUri("https://edulink.example", "google");
    const begun = beginSso("google", uri);
    expect(begun, "google should be configured for this test").toBeTruthy();
    const sent = new URL(begun!.authorizeUrl).searchParams.get("redirect_uri");
    expect(sent).toBe(uri);
  });
});
