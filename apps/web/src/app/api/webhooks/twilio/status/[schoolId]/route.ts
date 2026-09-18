import { NextResponse } from "next/server";
import { readTwilioConfig } from "@/lib/env";
import { recordProviderStatus, twilioSignatureValid } from "@/lib/messaging";

/**
 * POST /api/webhooks/twilio/status/{schoolId} — Twilio telling us what
 * became of a text: queued, sent, delivered, undelivered, failed.
 *
 * THE SCHOOL IS IN THE PATH, as with the gateway webhook, so the row can be
 * found under one tenant; the signature is checked with the account's auth
 * token before anything is read, and a sid we never sent is answered 200
 * and ignored — a retry would change nothing. Form-encoded, as Twilio posts.
 */
export async function POST(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  const config = readTwilioConfig();
  if (!config.ok) return NextResponse.json({ code: "NO_TWILIO" }, { status: 404 });
  const raw = await request.text();
  const form = Object.fromEntries(new URLSearchParams(raw)) as Record<string, string>;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const url = `${base}/api/webhooks/twilio/status/${schoolId}`;
  if (!twilioSignatureValid(config.config.authToken, url, form, request.headers.get("x-twilio-signature"))) return NextResponse.json({ code: "BAD_SIGNATURE" }, { status: 401 });
  const sid = form.MessageSid ?? form.SmsSid;
  const status = form.MessageStatus ?? form.SmsStatus;
  if (!sid || !status) return NextResponse.json({ code: "NO_SID" }, { status: 400 });
  const known = await recordProviderStatus(schoolId, { sid, status, errorCode: form.ErrorCode ?? null, errorMessage: form.ErrorMessage ?? null });
  return NextResponse.json({ ok: true, known });
}
