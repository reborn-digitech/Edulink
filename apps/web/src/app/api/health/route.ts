import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { errorsLastHour, overallP95 } from "@/lib/metrics";

/**
 * What an uptime monitor asks every minute.
 *
 * Answers 200 when the process is up AND the database answers, 503 when it
 * does not — a server that renders its login page over a dead database is
 * "up" to a TCP probe and down to every person. Nothing personal in the body:
 * no school, no counts of anything, no hostname. The commit is whatever the
 * deploy put in APP_COMMIT so a monitor can tell which release it is looking
 * at; absent locally.
 *
 * Signed-out on purpose, so the monitor needs no credentials that could leak.
 * The sweep pins it at 200 for the anonymous actor.
 *
 * To the OPERATOR alone — a session that carries the superuser flag — the
 * body also says how this process is doing: the server's own failures in
 * the last hour and the p95 latency over the counted routes
 * (src/lib/metrics.ts). Anybody else gets the body above, unchanged.
 */
export const dynamic = "force-dynamic";

/**
 * THE PROCESS'S AGE, NOT THE MODULE'S (R-30, 5 Oct 2026, risks batch). This
 * was `Date.now() - started` with `started` taken when this module was
 * evaluated, and `next dev` evaluates a route's module again whenever a file in
 * its import graph changes (db.ts, session.ts, metrics.ts and theirs) or after
 * it has sat unused: the streams sweep saw 14,478 s fall to 4,447 s with no
 * restart, and on 5 Oct an edit to db.ts took it to 0 while the server's
 * process (same pid, 39 minutes old) went on. `process.uptime()` is the
 * process's own clock, which only a real restart resets.
 */

export async function GET() {
  const t0 = Date.now();
  let database: "ok" | "down" = "ok";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }
  const databaseMs = Date.now() - t0;
  let metrics: { errorsLastHour: number; p95Ms: number | null } | undefined;
  try {
    const session = database === "ok" ? await getSession() : null;
    if (session?.user.isSuperuser) metrics = { errorsLastHour: errorsLastHour(), p95Ms: overallP95() };
  } catch {
    // A monitor's probe carries no session; a broken one must not break the probe.
  }
  const body = {
    ok: database === "ok",
    database,
    databaseMs,
    uptimeSeconds: Math.round(process.uptime()),
    commit: process.env.APP_COMMIT ?? null,
    ...(metrics ? { metrics } : {}),
  };
  return NextResponse.json(body, {
    status: body.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
