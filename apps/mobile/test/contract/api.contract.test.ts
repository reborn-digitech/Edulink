/**
 * The API client against the real API.
 *
 * Skipped unless EDULINK_API_BASE is set; CI sets it to the sweep job's
 * `next start` and mints the tokens with the web's `npm run zz:token`. Every
 * call here goes through @edulink/api-client exactly as the app's screens do,
 * so a drift between the OpenAPI document and the client fails here first.
 */
import { createApiClient } from "@edulink/api-client";
import { meSchema, sessionsListSchema } from "@edulink/contracts";

const BASE = process.env.EDULINK_API_BASE;
const TOKENS = { TEACHER: process.env.EDULINK_TOKEN_TEACHER, PARENT: process.env.EDULINK_TOKEN_PARENT, STUDENT: process.env.EDULINK_TOKEN_STUDENT };
const describeIf = BASE ? describe : describe.skip;

function client(token: string | null) {
  return createApiClient({ baseUrl: BASE ?? "http://localhost:3000", getToken: () => token, getLocale: () => "en" });
}

describeIf("the app's client against /api/v1", () => {
  it("signed out: /me is 401 in the contract's envelope", async () => {
    const res = await client(null).get("/api/v1/me");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res).toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });

  for (const [role, token] of Object.entries(TOKENS)) {
    const itIf = token ? it : it.skip;
    itIf(`${role}: /me parses with the contract, the device list marks this session`, async () => {
      const me = await client(token!).get("/api/v1/me");
      expect(me.ok).toBe(true);
      if (me.ok) expect(meSchema.parse(me.data).active.role).toBe(role);
      const sessions = await client(token!).get("/api/v1/me/sessions");
      expect(sessions.ok).toBe(true);
      if (sessions.ok) expect(sessionsListSchema.parse(sessions.data).sessions.some((s) => s.current)).toBe(true);
    });
  }

  it("TEACHER: today, the register's classes and the inbox answer 200", async () => {
    const token = TOKENS.TEACHER;
    if (!token) return;
    for (const path of ["/api/v1/staff/today", "/api/v1/staff/attendance/classes", "/api/v1/shared/inbox", "/api/v1/shared/notifications?limit=5"]) {
      const res = await client(token).get(path);
      expect({ path, ok: res.ok }).toEqual({ path, ok: true });
    }
  });

  it("PARENT: children and the overview answer 200; a teacher's endpoint is 403", async () => {
    const token = TOKENS.PARENT;
    if (!token) return;
    expect((await client(token).get("/api/v1/family/children")).ok).toBe(true);
    expect((await client(token).get("/api/v1/family/overview")).ok).toBe(true);
    const refused = await client(token).get("/api/v1/staff/today");
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.status).toBe(403);
  });
});
