/**
 * TA-425 (testing analysis of 13 November 2026, Low, Security): the SSO state cookie was never cleared. The start
 * route sets it on path /api/sso and the callback's `cookies.delete` expired a cookie on path "/", a different
 * one, so the state, nonce and verifier stayed in the browser for the rest of their ten minutes. The callback now
 * expires the cookie on the path it was set on, with the start's attributes (Apple's None+Secure included).
 *
 * No database row is written: the cases are the provider's "cancel", answered before anything is looked up.
 */
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET as callbackGet } from "@/app/api/sso/[provider]/callback/route";
import { SSO_COOKIE } from "@/lib/sso";

async function cancelled(provider: string): Promise<string[]> {
  const res = await callbackGet(new NextRequest(`http://localhost/api/sso/${provider}/callback?error=access_denied`), { params: Promise.resolve({ provider }) });
  expect(res.status).toBeGreaterThanOrEqual(300);
  return res.headers.getSetCookie().filter((line) => line.startsWith(`${SSO_COOKIE}=`));
}

describe("TA-425: the SSO state cookie is cleared where it was set", () => {
  it("TA-425: the callback's Set-Cookie for the state names Path=/api/sso and expires it", async () => {
    const lines = await cancelled("google");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/Path=\/api\/sso/i);
    expect(lines[0]).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  });

  it("TA-425: Apple's is cleared with SameSite=None and Secure, as it was set", async () => {
    const [line] = await cancelled("apple");
    expect(line).toMatch(/Path=\/api\/sso/i);
    expect(line).toMatch(/SameSite=None/i);
    expect(line).toMatch(/Secure/i);
  });
});
