/**
 * The start of the phone's SSO hand-off: `?client=app` must carry the PKCE
 * challenge of a verifier the app keeps, and the challenge rides in the
 * state cookie to the callback, which fixes the one-time code to it.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as start } from "@/app/api/sso/[provider]/start/route";
import { SSO_COOKIE } from "@/lib/sso";
import { pkceChallengeOf } from "@/lib/auth-tokens";

const saved = { id: process.env.SSO_GOOGLE_CLIENT_ID, secret: process.env.SSO_GOOGLE_CLIENT_SECRET };
beforeAll(() => {
  process.env.SSO_GOOGLE_CLIENT_ID = "zz-client.apps.googleusercontent.com";
  process.env.SSO_GOOGLE_CLIENT_SECRET = "zz-secret";
});
afterAll(() => {
  if (saved.id === undefined) delete process.env.SSO_GOOGLE_CLIENT_ID;
  else process.env.SSO_GOOGLE_CLIENT_ID = saved.id;
  if (saved.secret === undefined) delete process.env.SSO_GOOGLE_CLIENT_SECRET;
  else process.env.SSO_GOOGLE_CLIENT_SECRET = saved.secret;
});

const go = (query: string) => start(new NextRequest(`http://localhost:3000/api/sso/google/start${query}`), { params: Promise.resolve({ provider: "google" }) });
const cookieOf = (response: Response) => {
  const value = (response as unknown as { cookies: { get(name: string): { value: string } | undefined } }).cookies.get(SSO_COOKIE)?.value;
  return value ? (JSON.parse(value) as Record<string, unknown>) : null;
};
const CHALLENGE = pkceChallengeOf("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk");

describe("the phone's SSO hand-off, at its start", () => {
  it("⚠ the app must say whose challenge it is: none, a short one, or one with a character outside the alphabet is a 400 and nothing is begun", async () => {
    for (const query of ["?client=app", "?client=app&challenge=short", `?client=app&challenge=${CHALLENGE.slice(0, 42)}%2B`, `?client=app&challenge=${CHALLENGE}x`]) {
      const response = await go(query);
      expect(response.status, query).toBe(400);
      expect(cookieOf(response), query).toBeNull();
    }
  });

  it("with a challenge, goes to the provider with the app's marker and the challenge in the state cookie", async () => {
    const response = await go(`?client=app&challenge=${CHALLENGE}`);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("accounts.google.com");
    // The challenge is the app's; it is not sent to the provider, whose own PKCE is the server's.
    expect(response.headers.get("location")).not.toContain(CHALLENGE);
    expect(cookieOf(response)).toMatchObject({ p: "google", c: "app", ch: CHALLENGE });
  });

  it("a browser's own sign-in asks for no challenge and carries neither marker", async () => {
    const response = await go("");
    expect(response.status).toBe(307);
    const cookie = cookieOf(response);
    expect(cookie).toMatchObject({ p: "google" });
    expect(cookie).not.toHaveProperty("c");
    expect(cookie).not.toHaveProperty("ch");
    // A challenge nobody asked for is not kept.
    expect(cookieOf(await go(`?challenge=${CHALLENGE}`))).not.toHaveProperty("ch");
  });
});
