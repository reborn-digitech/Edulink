import { db } from "@/lib/db";
import { getSession, type ActiveContext } from "@/lib/session";
import { channel, subscribe } from "@/lib/realtime";

/**
 * GET /api/v1/events — server-sent events for this session.
 *
 * The realtime bus already existed (lib/realtime.ts) and was published to;
 * nothing subscribed from outside the process until now. The app opens this
 * on foreground and closes it on background, relying on push meanwhile. A
 * comment line every 25 s keeps proxies from closing an idle stream.
 * Signed-out is 401 with an empty body, not a stream.
 *
 * WHO HEARS WHAT. The school channel carries every register, every grade
 * and every remark thread in the school, and it used to be handed to any
 * session with a school on it — a parent's included, once a school id had
 * been stored against one. Staff get the school's stream. A pupil hears
 * about themselves; a parent hears about their children; neither is
 * subscribed to a school-wide channel at all.
 */
export const dynamic = "force-dynamic";

async function channelsFor(ctx: ActiveContext): Promise<string[]> {
  const channels = [channel.user(ctx.user.id)];
  if (ctx.role === "STUDENT") {
    if (ctx.membershipId) channels.push(channel.student(ctx.membershipId));
    return channels;
  }
  if (ctx.role === "PARENT") {
    const children = await db.guardianship.findMany({
      where: { parentUserId: ctx.user.id, status: "ACTIVE" },
      select: { studentMembershipId: true },
    });
    for (const child of children) channels.push(channel.student(child.studentMembershipId));
    return channels;
  }
  if (ctx.schoolId && ctx.membershipId) channels.push(channel.school(ctx.schoolId));
  return channels;
}

export async function GET(request: Request) {
  const ctx = await getSession();
  if (!ctx) return new Response(null, { status: 401 });

  const channels = await channelsFor(ctx);

  const encoder = new TextEncoder();
  let stop = () => {};
  let ticker: ReturnType<typeof setInterval> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (line: string) => {
        try {
          controller.enqueue(encoder.encode(line));
        } catch {
          /* closed */
        }
      };
      send(`event: ready\ndata: ${JSON.stringify({ channels })}\n\n`);
      stop = subscribe(channels, (event) => send(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
      ticker = setInterval(() => send(": keep-alive\n\n"), 25_000);
      request.signal.addEventListener("abort", () => {
        stop();
        if (ticker) clearInterval(ticker);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      stop();
      if (ticker) clearInterval(ticker);
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive", "X-Accel-Buffering": "no" },
  });
}
