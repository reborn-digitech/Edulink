import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { pushSubscribeSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { readJson } from "@/lib/api-v1";

/** A subscription's JSON is a few hundred bytes. */
const PUSH_BODY_LIMIT = 16 * 1024;

/**
 * Push subscription registration.
 *
 * This route existing is what makes Web Push work at all. Without it,
 * `sendPush` finds zero subscriptions for every user and returns silently —
 * the service worker's push handler, the VAPID keys and the whole notification
 * pipeline are all present and all dead. That was the state until this file
 * existed, and nothing failed loudly to say so.
 *
 * A route handler rather than a server action because it is called from
 * client-side code holding a `PushSubscription` object, and it needs to be
 * callable again on every load to refresh an endpoint the browser rotated.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // TA-423: a subscription is a few hundred bytes; read to a cap, by what arrives (a body past it is no body).
  const body = await readJson(request, PUSH_BODY_LIMIT).catch(() => null);
  if (!body) return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });

  const parsed = pushSubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "That is not a valid push subscription." }, { status: 422 });
  }

  const { endpoint, keys } = parsed.data;
  const userAgent = request.headers.get("user-agent")?.slice(0, 400) ?? null;

  // The endpoint is globally unique. Upserting means a returning device updates
  // its keys rather than accumulating a row per visit — and a device that was
  // handed to a different user re-binds to that user instead of quietly pushing
  // one family's notifications to another's phone.
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent,
    },
    update: {
      userId: session.user.id,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent,
      failureCount: 0,
      lastUsedAt: new Date(),
    },
  });

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "push.subscribe",
  });

  return NextResponse.json({ ok: true });
}

/** Removes this device's subscription — the "turn push off" path. */
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = (await readJson(request, PUSH_BODY_LIMIT).catch(() => null)) as { endpoint?: unknown } | null;
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null;
  if (!endpoint) return NextResponse.json({ error: "endpoint is required." }, { status: 400 });

  // Scoped by userId: one user cannot unsubscribe another's device by guessing
  // an endpoint.
  const result = await db.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });

  return NextResponse.json({ ok: true, removed: result.count });
}

/** Whether THIS device is registered — lets the UI show real state, not a guess. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const endpoint = new URL(request.url).searchParams.get("endpoint");
  const total = await db.pushSubscription.count({ where: { userId: session.user.id } });

  if (!endpoint) return NextResponse.json({ subscribed: false, devices: total });

  const mine = await db.pushSubscription.findFirst({
    where: { endpoint, userId: session.user.id },
    select: { id: true },
  });

  return NextResponse.json({ subscribed: Boolean(mine), devices: total });
}
