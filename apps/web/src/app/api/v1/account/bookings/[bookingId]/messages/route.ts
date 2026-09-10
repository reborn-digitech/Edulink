import { accountBookingMessageSchema, okSchema } from "@edulink/contracts";
import { postMessage } from "@/lib/experts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** POST /api/v1/account/bookings/{bookingId}/messages — the web's send: the expert or the booking school's staff write; the lib's gate is the page's. */
export async function POST(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { bookingId } = await params;
    const parsed = accountBookingMessageSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await postMessage(ctx, bookingId, parsed.data.body);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/bookings/[bookingId]/messages");
  }
}
