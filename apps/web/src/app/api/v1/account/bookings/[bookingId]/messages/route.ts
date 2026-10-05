import { accountBookingMessageSchema, okSchema } from "@edulink/contracts";
import { postMessage } from "@/lib/experts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { AccessError } from "@/lib/tenancy";

/** POST /api/v1/account/bookings/{bookingId}/messages — the web's send: the expert or the booking school's staff write; the lib's gate is the page's. */
/** The sides of a booking (api-catalog/account.ts BOOKING_SIDES): the school's office or teacher, and the expert. */
const BOOKING_SIDES = ["ADMIN", "TEACHER", "EXPERT"];

export async function POST(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { bookingId } = await params;
    // Role before the id or the body: a side the door is not for is refused 403 (the catalog's BOOKING_SIDES), whatever the id says.
    if (!BOOKING_SIDES.includes(ctx.role ?? "")) throw new AccessError("access.wrongRoleForThisAction");
    const parsed = accountBookingMessageSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await postMessage(ctx, bookingId, parsed.data.body);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/bookings/[bookingId]/messages");
  }
}
