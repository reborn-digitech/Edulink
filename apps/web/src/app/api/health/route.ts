import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
 */
export const dynamic = "force-dynamic";

const started = Date.now();

export async function GET() {
  const t0 = Date.now();
  let database: "ok" | "down" = "ok";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }
  const body = {
    ok: database === "ok",
    database,
    databaseMs: Date.now() - t0,
    uptimeSeconds: Math.round((Date.now() - started) / 1000),
    commit: process.env.APP_COMMIT ?? null,
  };
  return NextResponse.json(body, {
    status: body.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
