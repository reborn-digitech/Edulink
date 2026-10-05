import { NextResponse } from "next/server";
import { readBounded, WEBHOOK_BODY_LIMIT } from "@/lib/api-v1";
import { receivePunches } from "@/lib/attendance-devices";

/**
 * POST /api/v1/punch/{schoolId} — an attendance device's signed punches (R-2,
 * 5 Oct 2026). No session and no cookie: the device is found under the school
 * in the path, and the body is believed only after its HMAC checks with that
 * device's own key (lib/attendance-devices.ts `receivePunches`, the signature
 * in lib/punch-signature.ts). 401 for anything that is not the key holder's,
 * 413 for a body past 64 KB, 422 for a body that is not a batch, 200 with
 * each punch's outcome otherwise — a resent batch included.
 */
export async function POST(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  const raw = await readBounded(request, WEBHOOK_BODY_LIMIT);
  if (raw === null) return NextResponse.json({ code: "TOO_LARGE" }, { status: 413 });
  try {
    const answer = await receivePunches(schoolId, request.headers, raw);
    return NextResponse.json(answer.body, { status: answer.status, headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[api/v1/punch]", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
