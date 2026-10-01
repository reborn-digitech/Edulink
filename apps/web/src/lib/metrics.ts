/**
 * In-process counters and the error tracker's seam.
 *
 * WHAT IS COUNTED: requests by route group and status, with a ring of
 * latencies per group for p50 and p95; errors by kind (a refusal is a kind
 * too — a burst of 403s is worth seeing); the outbox's replays (a request
 * that names its queuing owner, X-Edulink-Owner); and, read live rather than
 * counted, how many jobs are overdue. Everything lives in this process's
 * memory, is reset by a restart, and is cheap enough to run on every call:
 * a map lookup, an integer, a write into a fixed ring. Two machines keep two
 * sets; the operator's page says which one answered.
 *
 * WHERE IT IS FED FROM. Every v1 handler ends in `apiFailure` when it fails,
 * so every failure is counted there without touching a handler; successes
 * have no one seam, so `withMetrics` wraps a handler and is applied to the
 * three busiest routes (GET /api/v1/me, GET /api/v1/shared/notifications,
 * POST /api/v1/staff/attendance/register) rather than to all four hundred.
 * `onRequestError` in instrumentation.ts feeds page renders. The counters
 * are therefore honest about what they cover and say so on the page.
 *
 * THIS FILE LOADS IN THE EDGE RUNTIME TOO (instrumentation.ts reaches it),
 * so it imports nothing from node:* at module scope — see the memory note
 * on edge instrumentation. `fetch`, `performance` and `crypto.randomUUID`
 * are on both runtimes.
 *
 * THE ERROR TRACKER. When SENTRY_DSN is set, an unexpected error is posted
 * to Sentry's envelope endpoint by a plain fetch — no SDK, no dependency —
 * with the route, the error's name, message and frames, the person's id and
 * the school's id as tags, and NEVER a request body, header, cookie or query
 * string. Without a DSN the error goes to the server log as it always did.
 */

export type ErrorKind = "unauthenticated" | "forbidden" | "not-found" | "too-large" | "rate-limited" | "unexpected" | "render";

/** How many latencies a group keeps; p95 over 256 is a fair recent picture and the memory is fixed. */
export const RING_SIZE = 256;
/** How many error instants are kept for "errors in the last hour". */
const ERROR_RING = 2048;
const HOUR_MS = 60 * 60 * 1000;

type Group = {
  total: number;
  byStatus: Map<number, number>;
  ring: Float64Array;
  /** How many of the ring's slots are written, up to RING_SIZE. */
  filled: number;
  /** The next slot to write. */
  head: number;
};

type State = {
  since: number;
  groups: Map<string, Group>;
  errors: Map<ErrorKind, number>;
  /** Instants of the server's own failures (unexpected, render), a ring. */
  failures: Float64Array;
  failuresFilled: number;
  failuresHead: number;
  outboxReplays: number;
};

function fresh(now: number): State {
  return { since: now, groups: new Map(), errors: new Map(), failures: new Float64Array(ERROR_RING), failuresFilled: 0, failuresHead: 0, outboxReplays: 0 };
}

/**
 * Held on globalThis so the dev server's module reloads do not reset the
 * counters every time a file is saved; one object per process either way.
 */
const holder = globalThis as unknown as { __relayMetrics?: State };
function state(): State {
  if (!holder.__relayMetrics) holder.__relayMetrics = fresh(Date.now());
  return holder.__relayMetrics;
}

/** For tests: start counting again. */
export function __resetMetrics(now: number = Date.now()): void {
  holder.__relayMetrics = fresh(now);
}

/**
 * The route group of a handler's `where` string: "api/v1/operator/schools/[schoolId]"
 * → "operator"; "api/v1/me" → "me"; anything outside /api/v1 keeps its first
 * two segments ("api/health"). The pattern, never a concrete path.
 */
export function groupOf(where: string): string {
  const parts = where.replace(/^\/+/, "").split("/").filter(Boolean);
  if (parts[0] === "api" && parts[1] === "v1") return parts[2] ?? "v1";
  return parts.slice(0, 2).join("/") || "other";
}

function group(name: string): Group {
  const s = state();
  let g = s.groups.get(name);
  if (!g) {
    g = { total: 0, byStatus: new Map(), ring: new Float64Array(RING_SIZE), filled: 0, head: 0 };
    s.groups.set(name, g);
  }
  return g;
}

/** One request answered: its group, the status it answered with, how long it took. */
export function recordRequest(groupName: string, status: number, ms: number, opts: { replay?: boolean } = {}): void {
  const g = group(groupName);
  g.total++;
  g.byStatus.set(status, (g.byStatus.get(status) ?? 0) + 1);
  g.ring[g.head] = ms;
  g.head = (g.head + 1) % RING_SIZE;
  if (g.filled < RING_SIZE) g.filled++;
  if (opts.replay) state().outboxReplays++;
}

/** The kind of an error, by status: apiFailure's mapping, so the two agree. */
export function kindOfStatus(status: number): ErrorKind {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  if (status === 413) return "too-large";
  if (status === 429) return "rate-limited";
  return "unexpected";
}

/** One failure: its kind. The server's own failures are also timed, for "errors in the last hour". */
export function recordError(kind: ErrorKind, now: number = Date.now()): void {
  const s = state();
  s.errors.set(kind, (s.errors.get(kind) ?? 0) + 1);
  if (kind === "unexpected" || kind === "render") {
    s.failures[s.failuresHead] = now;
    s.failuresHead = (s.failuresHead + 1) % ERROR_RING;
    if (s.failuresFilled < ERROR_RING) s.failuresFilled++;
  }
}

/** The server's own failures (unexpected, render) in the hour before `now`. */
export function errorsLastHour(now: number = Date.now()): number {
  const s = state();
  let n = 0;
  for (let i = 0; i < s.failuresFilled; i++) if (now - s.failures[i]! <= HOUR_MS) n++;
  return n;
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return Math.round(sorted[index]! * 10) / 10;
}

function latencies(g: Group): number[] {
  return Array.from(g.ring.subarray(0, g.filled));
}

/** p95 across every group's ring together. */
export function overallP95(): number | null {
  const all: number[] = [];
  for (const g of state().groups.values()) all.push(...latencies(g));
  return percentile(all, 95);
}

export type MetricsSnapshot = {
  since: string;
  at: string;
  requests: { group: string; total: number; byStatus: Record<string, number>; p50Ms: number | null; p95Ms: number | null }[];
  errors: { kind: string; count: number }[];
  errorsLastHour: number;
  p95Ms: number | null;
  outboxReplays: number;
  errorTracker: boolean;
};

/** Everything, as the operator's page and the phone read it. */
export function snapshot(now: number = Date.now(), env: Record<string, string | undefined> = process.env): MetricsSnapshot {
  const s = state();
  const requests = [...s.groups.entries()]
    .map(([name, g]) => {
      const byStatus: Record<string, number> = {};
      for (const [status, count] of [...g.byStatus.entries()].sort((a, b) => a[0] - b[0])) byStatus[String(status)] = count;
      const values = latencies(g);
      return { group: name, total: g.total, byStatus, p50Ms: percentile(values, 50), p95Ms: percentile(values, 95) };
    })
    .sort((a, b) => b.total - a.total || a.group.localeCompare(b.group));
  const errors = [...s.errors.entries()].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind));
  return {
    since: new Date(s.since).toISOString(),
    at: new Date(now).toISOString(),
    requests,
    errors,
    errorsLastHour: errorsLastHour(now),
    p95Ms: overallP95(),
    outboxReplays: s.outboxReplays,
    errorTracker: parseDsn(env.SENTRY_DSN) !== null,
  };
}

/**
 * Times a route handler and counts what it answered. A thrown error is
 * counted as a 500 and rethrown — apiFailure inside the handler is what
 * turns most errors into a response before they reach here. A request that
 * names its queuing owner is an outbox replay.
 */
export function withMetrics<A extends unknown[]>(groupName: string, handler: (request: Request, ...args: A) => Promise<Response>): (request?: Request, ...args: A) => Promise<Response> {
  return async (request?: Request, ...args: A) => {
    const t0 = performance.now();
    // A suite calls a GET with no request at all; Next never does.
    const replay = request?.headers.has("x-edulink-owner") ?? false;
    request ??= new Request("http://localhost/");
    try {
      const response = await handler(request, ...args);
      recordRequest(groupName, response.status, performance.now() - t0, { replay });
      return response;
    } catch (error) {
      recordRequest(groupName, 500, performance.now() - t0, { replay });
      throw error;
    }
  };
}

/* -------------------------------------------------------------------------- */
/* The error tracker                                                           */
/* -------------------------------------------------------------------------- */

export type ParsedDsn = { publicKey: string; host: string; projectId: string; scheme: string; path: string; dsn: string };

/** `https://key@host[:port]/[path/]projectId`, or null for anything else. Never logged. */
export function parseDsn(raw: string | undefined | null): ParsedDsn | null {
  const dsn = raw?.trim();
  if (!dsn) return null;
  let url: URL;
  try {
    url = new URL(dsn);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(url.protocol) || !url.username) return null;
  const segments = url.pathname.split("/").filter(Boolean);
  const projectId = segments.pop();
  if (!projectId || !/^\d+$/.test(projectId)) return null;
  const path = segments.length ? `/${segments.join("/")}` : "";
  return { publicKey: url.username, host: url.host, projectId, scheme: url.protocol.replace(":", ""), path, dsn };
}

/** Where an envelope goes, for a DSN. */
export function envelopeUrl(dsn: ParsedDsn): string {
  return `${dsn.scheme}://${dsn.host}${dsn.path}/api/${dsn.projectId}/envelope/`;
}

export type ErrorReport = {
  /** The handler's `where`: the route pattern, never a concrete path. */
  where: string;
  kind: ErrorKind;
  userId?: string | null;
  schoolId?: string | null;
  method?: string;
};

type Frame = { function?: string; filename?: string; lineno?: number; colno?: number; in_app?: boolean };

/** V8's "at fn (file:line:col)" lines as Sentry frames, innermost last as Sentry wants them. */
export function framesOf(stack: string | undefined): Frame[] {
  if (!stack) return [];
  const frames: Frame[] = [];
  for (const line of stack.split("\n")) {
    const m = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?\s*$/.exec(line);
    if (!m) continue;
    const filename = m[2]!;
    frames.push({ function: m[1] ?? "<anonymous>", filename, lineno: Number(m[3]), colno: Number(m[4]), in_app: !filename.includes("node_modules") });
  }
  return frames.reverse();
}

export type SentryEvent = {
  event_id: string;
  timestamp: string;
  platform: "node";
  level: "error";
  logger: string;
  release?: string;
  environment?: string;
  server_name?: string;
  exception: { values: { type: string; value: string; stacktrace?: { frames: Frame[] } }[] };
  tags: Record<string, string>;
};

function eventId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/**
 * The event for one error: what finds the failure (route, method, kind, the
 * commit) and who it happened to (ids, never names or addresses). Nothing
 * from the request itself.
 */
export function sentryEvent(error: unknown, report: ErrorReport, env: Record<string, string | undefined> = process.env, now: Date = new Date()): SentryEvent {
  const err = error instanceof Error ? error : null;
  const tags: Record<string, string> = { where: report.where, group: groupOf(report.where), kind: report.kind };
  if (report.method) tags.method = report.method;
  if (report.userId) tags.userId = report.userId;
  if (report.schoolId) tags.schoolId = report.schoolId;
  const frames = framesOf(err?.stack);
  return {
    event_id: eventId(),
    timestamp: now.toISOString(),
    platform: "node",
    level: "error",
    logger: report.where,
    ...(env.APP_COMMIT ? { release: env.APP_COMMIT } : {}),
    ...(env.NODE_ENV ? { environment: env.NODE_ENV } : {}),
    ...(env.FLY_MACHINE_ID ? { server_name: env.FLY_MACHINE_ID } : {}),
    exception: {
      values: [{ type: err?.name ?? "Error", value: err?.message ?? String(error), ...(frames.length ? { stacktrace: { frames } } : {}) }],
    },
    tags,
  };
}

/**
 * Sentry's envelope: a header line naming the event and the DSN, an item
 * header naming the type and length, and the event — three JSON lines.
 */
export function sentryEnvelope(event: SentryEvent, dsn: ParsedDsn, sentAt: Date = new Date()): string {
  const payload = JSON.stringify(event);
  const header = JSON.stringify({ event_id: event.event_id, sent_at: sentAt.toISOString(), dsn: dsn.dsn });
  const item = JSON.stringify({ type: "event", content_type: "application/json", length: new TextEncoder().encode(payload).byteLength });
  return `${header}\n${item}\n${payload}`;
}

export type ReportDeps = { fetch?: typeof fetch; env?: Record<string, string | undefined>; now?: () => Date; log?: (line: string, error: unknown) => void };

/**
 * Posts one error to the tracker when SENTRY_DSN is set; otherwise one line
 * on the server log, as before. Never throws and never waits on the network
 * for the response that failed: the post is fired and its own failure is
 * one log line. Returns whether a post was attempted, for the tests.
 */
export async function reportError(error: unknown, report: ErrorReport, deps: ReportDeps = {}): Promise<boolean> {
  const env = deps.env ?? process.env;
  const log = deps.log ?? ((line, err) => console.error(line, err));
  const dsn = parseDsn(env.SENTRY_DSN);
  if (!dsn) {
    log(`[${report.where}] unexpected`, error);
    return false;
  }
  const doFetch = deps.fetch ?? fetch;
  const now = deps.now ? deps.now() : new Date();
  try {
    const event = sentryEvent(error, report, env, now);
    const body = sentryEnvelope(event, dsn, now);
    const posted = doFetch(envelopeUrl(dsn), {
      method: "POST",
      headers: {
        "content-type": "application/x-sentry-envelope",
        // The scheme word and the key=value list, as the envelope endpoint reads them.
        "x-sentry-auth": ["Sentry", `sentry_version=7, sentry_key=${dsn.publicKey}, sentry_client=relay-metrics/1.0`].join(" "),
      },
      body,
    });
    // Awaited in tests through the returned promise; in a handler the
    // response is not waited on, and a refused post is one log line.
    await posted.then(
      (res) => {
        if (!res.ok) log(`[metrics] error-tracker-status=${res.status}`, report.where);
      },
      (err) => log("[metrics] error tracker unreachable", err instanceof Error ? err.message : err),
    );
    return true;
  } catch (err) {
    log("[metrics] error tracker post failed", err instanceof Error ? err.message : err);
    return false;
  }
}
