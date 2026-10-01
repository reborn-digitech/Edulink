import { calendarFeed } from "@/lib/expert-kyc";
import { getT } from "@/lib/i18n/server";
import { consume } from "@/lib/rate-limit";

/**
 * GET /api/v1/expert/calendar.ics?token=… — the expert's times as an
 * iCalendar feed, for a calendar application that holds no session: the
 * token in the URL is the whole authorisation, and a rotated one answers
 * 404 like a token that never existed. School names and session kinds
 * only; no pupil is named (decision 0002). Budgeted by token so a feed URL
 * that leaks cannot be polled into a load, and never cached by a proxy.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const gate = await consume(`ics:${token.slice(0, 64)}`, 60, 3_600_000);
  if (!gate.allowed) return new Response(null, { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds), "Cache-Control": "no-store" } });
  const t = await getT();
  const feed = await calendarFeed(token, t);
  if (feed === null) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(feed, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="relay-expert.ics"',
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
