import { enquiriesPageSchema, enquiryOpenedSchema, enquiryOpenBodySchema } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import { listEnquiries, openEnquiry } from "@/lib/enquiries";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { refused } from "../helpers";

/** GET /api/v1/shared/enquiries — what I asked, and (for staff) what my school was asked. */
export async function GET() {
  try {
    const ctx = await requireApiSession();
    if (!ctx.role) throw new AccessError("access.wrongRoleForThisAction");
    const { sent, inbox } = await listEnquiries(ctx);
    const out = (rows: typeof sent) => rows.map((e) => ({ ...e, lastMessageAt: e.lastMessageAt.toISOString() }));
    return ok(enquiriesPageSchema.parse({ sent: out(sent), inbox: out(inbox) }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/enquiries");
  }
}

/**
 * POST /api/v1/shared/enquiries — a parent asks a school about admission, a
 * teacher asks about a vacancy. An open thread with the same school absorbs
 * the message rather than starting a twin.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = enquiryOpenBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await openEnquiry(ctx, parsed.data);
    if (!result.ok) return refused(result.errorKey);
    return ok(enquiryOpenedSchema.parse({ enquiryId: result.enquiryId }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/shared/enquiries");
  }
}
