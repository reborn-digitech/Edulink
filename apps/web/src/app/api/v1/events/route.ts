import { db } from "@/lib/db";
import { getSession, type ActiveContext } from "@/lib/session";
import { channel, subscribe } from "@/lib/realtime";
import { AccessError, teacherClassIds } from "@/lib/tenancy";
import { studentsGuardiansMaySee } from "@/lib/student-consent";
import { forOwnSchools, forUser } from "@/lib/tenant-context";

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
    // The child's channel carries their grades, their remark threads and their bus (grading.ts, remarks.ts,
    // transport.ts): an adult college student's guardian hears it only while all three grants are on (TA-240).
    let heard = children.map((child) => child.studentMembershipId);
    for (const grant of ["RESULTS", "MESSAGES", "HOSTEL_TRANSPORT"] as const) heard = await studentsGuardiansMaySee(heard, grant);
    for (const id of heard) channels.push(channel.student(id));
    return channels;
  }
  // A teacher hears their own classes and the threads they are party to,
  // not the whole school: the school channel carries every pupil's grade,
  // register and remark ids, which the office and the head may hear and a
  // teacher of two classes has no business with (the review of 2026-10-01).
  if (ctx.role === "TEACHER" && ctx.schoolId && ctx.membershipId) {
    channels.push(channel.staff(ctx.membershipId));
    for (const classId of await teacherClassIds(ctx.schoolId, ctx.membershipId)) channels.push(channel.class(classId));
    return channels;
  }
  // The office and the head hear the school. Named, not "everyone else": a
  // driver, the library's desk, a warden or an alumnus hears their own
  // channel only until their module says otherwise.
  if ((ctx.role === "ADMIN" || ctx.role === "PRINCIPAL") && ctx.schoolId && ctx.membershipId) channels.push(channel.school(ctx.schoolId));
  return channels;
}

/**
 * The channels the session would be given now, read from a timer after the request has been answered: the tenant
 * is bound here from the person's own rows (forUser, then their schools) rather than left to the request's cookie.
 */
async function channelsNow(ctx: ActiveContext): Promise<string[]> {
  const schools =
    ctx.role === "PARENT"
      ? (await forUser(ctx.user.id, () => db.guardianship.findMany({ where: { parentUserId: ctx.user.id, status: "ACTIVE" }, select: { studentSchoolId: true } }))).map((g) => g.studentSchoolId)
      : ctx.schoolId
        ? [ctx.schoolId]
        : [];
  return forOwnSchools(ctx.user.id, schools, () => channelsFor(ctx));
}

/**
 * Open streams per session, so one tab cannot hold a hundred, and the
 * session each stream was opened under, checked again every keep-alive:
 * a stream once outlived "sign out everywhere" until its tab was closed.
 */
const open = new Map<string, number>();
const STREAMS_PER_SESSION = 4;
const RECHECK_EVERY_TICKS = 2;
/** Keep-alive every 25 s; a test shortens it (EVENTS_KEEPALIVE_MS) to see the recheck happen. */
const KEEPALIVE_MS = Number(process.env.EVENTS_KEEPALIVE_MS) > 0 ? Number(process.env.EVENTS_KEEPALIVE_MS) : 25_000;

export async function GET(request: Request) {
  // The session's gate may refuse a module role here (role-gate.ts): a 403, not a 500.
  const ctx = await getSession().catch((error: unknown) => {
    if (error instanceof AccessError) return "refused" as const;
    throw error;
  });
  if (ctx === "refused") return new Response(null, { status: 403 });
  if (!ctx) return new Response(null, { status: 401 });
  if (request.signal.aborted) return new Response(null, { status: 204 });
  if ((open.get(ctx.sessionId) ?? 0) >= STREAMS_PER_SESSION) return new Response(null, { status: 429 });
  open.set(ctx.sessionId, (open.get(ctx.sessionId) ?? 0) + 1);
  // Once, whichever of abort, cancel and the session check comes first.
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    const n = (open.get(ctx.sessionId) ?? 1) - 1;
    if (n <= 0) open.delete(ctx.sessionId);
    else open.set(ctx.sessionId, n);
  };

  /**
   * THE ABORT LISTENER GOES ON BEFORE THE NEXT AWAIT. A page that opens the
   * stream and closes it at once — React's development double-mount does
   * exactly that, and so does a tab closed while the page loads — aborts
   * the request while `channelsFor` is still reading the database. A
   * listener attached only once the stream started never heard that abort,
   * the slot was never released, and four such opens locked the session out
   * of live updates (429) until the server restarted. Until the stream
   * starts, closing is only letting the slot go; `start` upgrades it.
   */
  let close: () => void = release;
  request.signal.addEventListener("abort", () => close());

  const channels = await channelsFor(ctx);
  if (request.signal.aborted) {
    close();
    return new Response(null, { status: 204 });
  }

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
      close = () => {
        stop();
        if (ticker) clearInterval(ticker);
        release();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      let ticks = 0;
      ticker = setInterval(() => {
        send(": keep-alive\n\n");
        if (++ticks % RECHECK_EVERY_TICKS !== 0) return;
        // Still a live session? Revoked, expired or disabled, the stream ends here rather than with the tab.
        void db.session.findFirst({ where: { id: ctx.sessionId, revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true } }).then(async (row) => {
          if (!row) {
            send(`event: session.ended\ndata: {}\n\n`);
            close();
            return;
          }
          // Still the same channels? A guardian whose link to a child ended, a grant taken back or a class handed on
          // stops hearing it here rather than with the tab (TA-433): the stream ends and the client opens a new one,
          // whose channels are worked out afresh. A set that only grew is left until then.
          const now = await channelsNow(ctx).catch(() => null);
          if (now && channels.some((c) => !now.includes(c))) {
            send(`event: channels.changed\ndata: {}\n\n`);
            close();
          }
        });
      }, KEEPALIVE_MS);
      // Aborted between the check above and here: the listener ran the old, slot-only close.
      if (request.signal.aborted) close();
    },
    cancel() {
      close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive", "X-Accel-Buffering": "no" },
  });
}
