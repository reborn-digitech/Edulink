/**
 * The in-process counters and the error tracker's seam, with no network: the
 * counters count (requests by group and status, p50/p95 from the ring,
 * errors by kind, the hour window, outbox replays through withMetrics);
 * apiFailure feeds them; the Sentry envelope has the shape the endpoint
 * takes — three JSON lines, the DSN's key in the auth header, the ids as
 * tags, nothing of a request — through a fake fetch; and nothing is sent
 * without a DSN, the log line going out as before. The operator's endpoint
 * and /api/health's extension are proved with a ZZ operator of their own.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { operatorMetricsSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { AccessError } from "@/lib/tenancy";
import { apiFailure, BodyTooLarge } from "@/lib/api-v1";
import {
  __resetMetrics,
  envelopeUrl,
  errorsLastHour,
  framesOf,
  groupOf,
  kindOfStatus,
  overallP95,
  parseDsn,
  recordError,
  recordRequest,
  reportError,
  sentryEnvelope,
  sentryEvent,
  snapshot,
  withMetrics,
} from "@/lib/metrics";
import { GET as metricsGet } from "@/app/api/v1/operator/metrics/route";
import { GET as healthGet } from "@/app/api/health/route";

const db = new PrismaClient();
const STAMP = Date.now();
let operatorUserId = "";
let teacherUserId = "";

beforeAll(async () => {
  const [op, teacher] = await Promise.all([
    db.user.create({ data: { name: "ZZ Metrics Operator", email: `zz-metrics-op-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Metrics Teacher", email: `zz-metrics-t-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  operatorUserId = op.id;
  teacherUserId = teacher.id;
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [operatorUserId, teacherUserId] } } });
  await db.user.deleteMany({ where: { id: { in: [operatorUserId, teacherUserId] } } });
  await db.$disconnect();
});

const DSN = "https://abc123@o1.ingest.sentry.io/4509";

describe("the counters", () => {
  it("count requests by group and status with p50 and p95 from the ring, and errors by kind in the hour window", () => {
    const t0 = Date.UTC(2026, 9, 1, 12, 0, 0);
    __resetMetrics(t0);
    for (let i = 1; i <= 100; i++) recordRequest("me", 200, i);
    recordRequest("me", 401, 5);
    recordRequest("shared", 200, 50, { replay: true });
    recordError("forbidden", t0);
    recordError("unexpected", t0 - 2 * 3_600_000); // two hours ago: outside the window
    recordError("unexpected", t0 - 10 * 60_000); // ten minutes ago: inside
    recordError("render", t0);
    const s = snapshot(t0, {});
    expect(s.since).toBe(new Date(t0).toISOString());
    expect(s.requests[0]).toMatchObject({ group: "me", total: 101, byStatus: { "200": 100, "401": 1 }, p50Ms: 50, p95Ms: 95 });
    expect(s.requests[1]).toMatchObject({ group: "shared", total: 1, byStatus: { "200": 1 }, p50Ms: 50, p95Ms: 50 });
    expect(s.errors).toEqual([
      { kind: "unexpected", count: 2 },
      { kind: "forbidden", count: 1 },
      { kind: "render", count: 1 },
    ]);
    expect(s.errorsLastHour).toBe(2);
    expect(errorsLastHour(t0 + 2 * 3_600_000)).toBe(0);
    expect(s.outboxReplays).toBe(1);
    expect(s.errorTracker).toBe(false);
    expect(overallP95()).toBe(95);
    expect(snapshot(t0, { SENTRY_DSN: DSN }).errorTracker).toBe(true);
  });

  it("the ring keeps the last 256 latencies, so an old spike leaves p95", () => {
    __resetMetrics();
    for (let i = 0; i < 10; i++) recordRequest("g", 200, 5000);
    for (let i = 0; i < 256; i++) recordRequest("g", 200, 10);
    expect(snapshot().requests[0]).toMatchObject({ total: 266, p95Ms: 10 });
  });

  it("groupOf names the v1 area and kindOfStatus mirrors apiFailure", () => {
    expect(groupOf("api/v1/operator/schools/[schoolId]")).toBe("operator");
    expect(groupOf("api/v1/me")).toBe("me");
    expect(groupOf("/api/health")).toBe("api/health");
    expect(groupOf("api/attendance")).toBe("api/attendance");
    expect([401, 403, 404, 413, 429, 500].map(kindOfStatus)).toEqual(["unauthenticated", "forbidden", "not-found", "too-large", "rate-limited", "unexpected"]);
  });

  it("withMetrics times a handler, counts what it answered, counts a replay, and counts a throw as 500", async () => {
    __resetMetrics();
    const handler = withMetrics("attendance", async (request: Request) => new Response(null, { status: request.headers.has("x-edulink-owner") ? 200 : 403 }));
    expect((await handler(new Request("http://localhost/api/attendance"))).status).toBe(403);
    expect((await handler(new Request("http://localhost/api/attendance", { headers: { "x-edulink-owner": "u1" } }))).status).toBe(200);
    const thrower = withMetrics("attendance", async () => {
      throw new Error("boom");
    });
    await expect(thrower(new Request("http://localhost/api/attendance"))).rejects.toThrow("boom");
    // A suite calls a GET with no request; the wrapper copes.
    expect((await handler()).status).toBe(403);
    const s = snapshot();
    expect(s.requests[0]).toMatchObject({ group: "attendance", total: 4, byStatus: { "200": 1, "403": 2, "500": 1 } });
    expect(s.outboxReplays).toBe(1);
    expect(s.requests[0]!.p95Ms).not.toBeNull();
  });

  it("apiFailure counts each kind and reports an unexpected error", async () => {
    __resetMetrics();
    __resetCookies();
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect((await apiFailure(new AccessError("access.notSignedIn", "UNAUTHENTICATED"), "api/v1/me")).status).toBe(401);
      expect((await apiFailure(new AccessError("access.notSignedIn"), "api/v1/me")).status).toBe(403);
      expect((await apiFailure(new AccessError("root.noSuchSchool", "NOT_FOUND"), "api/v1/operator/x")).status).toBe(404);
      expect((await apiFailure(new BodyTooLarge(), "api/v1/me")).status).toBe(413);
      expect((await apiFailure(new Error("db is down"), "api/v1/me")).status).toBe(500);
      const s = snapshot();
      expect(s.errors).toEqual(
        expect.arrayContaining([
          { kind: "unauthenticated", count: 1 },
          { kind: "forbidden", count: 1 },
          { kind: "not-found", count: 1 },
          { kind: "too-large", count: 1 },
          { kind: "unexpected", count: 1 },
        ]),
      );
      expect(s.errorsLastHour).toBe(1);
      // Without a DSN the unexpected error is the log line it always was, and nothing else.
      expect(errors.mock.calls.some(([line]) => String(line) === "[api/v1/me] unexpected")).toBe(true);
    } finally {
      errors.mockRestore();
    }
  });
});

describe("the error tracker", () => {
  it("parses a DSN into the envelope endpoint and refuses anything else", () => {
    const dsn = parseDsn(DSN);
    expect(dsn).toMatchObject({ publicKey: "abc123", host: "o1.ingest.sentry.io", projectId: "4509", scheme: "https", path: "" });
    expect(envelopeUrl(dsn!)).toBe("https://o1.ingest.sentry.io/api/4509/envelope/");
    expect(envelopeUrl(parseDsn("https://k@sentry.example.org/relay/77")!)).toBe("https://sentry.example.org/relay/api/77/envelope/");
    expect(parseDsn(undefined)).toBeNull();
    expect(parseDsn("")).toBeNull();
    expect(parseDsn("not a url")).toBeNull();
    expect(parseDsn("https://host/4509")).toBeNull(); // no key
    expect(parseDsn("https://k@host/notanumber")).toBeNull();
    expect(parseDsn("ftp://k@host/1")).toBeNull();
  });

  it("builds an event with the route, the kind, the ids as tags and the frames, and nothing of the request", () => {
    const error = new Error("db is down");
    const event = sentryEvent(error, { where: "api/v1/operator/plans", kind: "unexpected", userId: "u1", schoolId: "s1", method: "POST" }, { APP_COMMIT: "abc", NODE_ENV: "test" }, new Date("2026-10-01T12:00:00.000Z"));
    expect(event.event_id).toMatch(/^[0-9a-f]{32}$/);
    expect(event).toMatchObject({
      timestamp: "2026-10-01T12:00:00.000Z",
      platform: "node",
      level: "error",
      logger: "api/v1/operator/plans",
      release: "abc",
      environment: "test",
      tags: { where: "api/v1/operator/plans", group: "operator", kind: "unexpected", userId: "u1", schoolId: "s1", method: "POST" },
    });
    expect(event.exception.values[0]).toMatchObject({ type: "Error", value: "db is down" });
    expect(event.exception.values[0]!.stacktrace!.frames.length).toBeGreaterThan(0);
    const text = JSON.stringify(event);
    for (const forbidden of ["cookie", "authorization", "body", "query"]) expect(text.toLowerCase()).not.toContain(`"${forbidden}"`);
    // A thrown non-Error is still an event.
    expect(sentryEvent("plain string", { where: "x", kind: "render" }).exception.values[0]).toMatchObject({ type: "Error", value: "plain string" });
    expect(framesOf("    at foo (/srv/app/src/lib/x.ts:10:5)\n    at /srv/app/node_modules/next/dist/y.js:1:2")).toEqual([
      { function: "<anonymous>", filename: "/srv/app/node_modules/next/dist/y.js", lineno: 1, colno: 2, in_app: false },
      { function: "foo", filename: "/srv/app/src/lib/x.ts", lineno: 10, colno: 5, in_app: true },
    ]);
  });

  it("the envelope is three JSON lines whose item length is the payload's bytes", () => {
    const dsn = parseDsn(DSN)!;
    const event = sentryEvent(new Error("x"), { where: "api/v1/me", kind: "unexpected" }, {}, new Date("2026-10-01T12:00:00.000Z"));
    const envelope = sentryEnvelope(event, dsn, new Date("2026-10-01T12:00:01.000Z"));
    const lines = envelope.split("\n");
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[0]!)).toEqual({ event_id: event.event_id, sent_at: "2026-10-01T12:00:01.000Z", dsn: DSN });
    expect(JSON.parse(lines[1]!)).toEqual({ type: "event", content_type: "application/json", length: new TextEncoder().encode(lines[2]!).byteLength });
    expect(JSON.parse(lines[2]!).event_id).toBe(event.event_id);
  });

  it("posts the envelope to the DSN's endpoint with the auth header through the fetch it is given", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fakeFetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(null, { status: 200 });
    }) as typeof fetch;
    const log = vi.fn();
    const posted = await reportError(new Error("boom"), { where: "api/v1/me", kind: "unexpected", userId: "u1", schoolId: "s1" }, { fetch: fakeFetch, env: { SENTRY_DSN: DSN }, log });
    expect(posted).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://o1.ingest.sentry.io/api/4509/envelope/");
    expect(calls[0]!.init.method).toBe("POST");
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers["content-type"]).toBe("application/x-sentry-envelope");
    expect(headers["x-sentry-auth"]).toContain("sentry_key=abc123");
    expect(headers["x-sentry-auth"]).toContain("sentry_version=7");
    const body = String(calls[0]!.init.body);
    const event = JSON.parse(body.split("\n")[2]!);
    expect(event.tags).toMatchObject({ userId: "u1", schoolId: "s1", where: "api/v1/me" });
    expect(log).not.toHaveBeenCalled();
  });

  it("sends nothing without a DSN and logs the line instead; a refused or unreachable endpoint is one log line and no throw", async () => {
    const fakeFetch = vi.fn(async () => new Response(null, { status: 429 })) as unknown as typeof fetch;
    const log = vi.fn();
    expect(await reportError(new Error("boom"), { where: "api/v1/me", kind: "unexpected" }, { fetch: fakeFetch, env: {}, log })).toBe(false);
    expect(fakeFetch).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("[api/v1/me] unexpected", expect.any(Error));

    const refused = vi.fn();
    expect(await reportError(new Error("boom"), { where: "api/v1/me", kind: "unexpected" }, { fetch: fakeFetch, env: { SENTRY_DSN: DSN }, log: refused })).toBe(true);
    expect(refused).toHaveBeenCalledWith("[metrics] error-tracker-status=429", "api/v1/me");

    const down = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;
    const unreachable = vi.fn();
    await expect(reportError(new Error("boom"), { where: "api/v1/me", kind: "unexpected" }, { fetch: down, env: { SENTRY_DSN: DSN }, log: unreachable })).resolves.toBe(true);
    expect(unreachable).toHaveBeenCalledWith("[metrics] error tracker unreachable", "ECONNREFUSED");
  });
});

describe("the operator's endpoint and the health probe", () => {
  it("GET /api/v1/operator/metrics answers the contract to the operator and 403 to a teacher", async () => {
    __resetMetrics();
    recordRequest("me", 200, 12);
    recordError("forbidden");
    __resetCookies();
    await createSession(teacherUserId);
    expect((await metricsGet()).status).toBe(403);
    __resetCookies();
    await createSession(operatorUserId);
    const res = await metricsGet();
    expect(res.status).toBe(200);
    const body = operatorMetricsSchema.parse(await res.json());
    expect(body.requests.find((r) => r.group === "me")).toMatchObject({ total: 1, byStatus: { "200": 1 } });
    // The one recorded above plus the teacher's own 403 a moment ago: apiFailure counted it.
    expect(body.errors).toContainEqual({ kind: "forbidden", count: 2 });
    expect(typeof body.jobsOverdue).toBe("number");
  });

  it("/api/health carries metrics for the operator and nothing extra for anybody else", async () => {
    __resetMetrics();
    recordError("unexpected");
    __resetCookies();
    const anonymous = await (await healthGet()).json();
    expect(anonymous.ok).toBe(true);
    expect(anonymous.metrics).toBeUndefined();
    await createSession(teacherUserId);
    expect((await (await healthGet()).json()).metrics).toBeUndefined();
    __resetCookies();
    await createSession(operatorUserId);
    const mine = await (await healthGet()).json();
    expect(mine.metrics).toEqual({ errorsLastHour: 1, p95Ms: null });
  });
});
