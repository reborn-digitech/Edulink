import { enquiryOpenedSchema, enquiryReplyBodySchema } from "@edulink/contracts";
import { replyToEnquiry } from "@/lib/enquiries";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { asNotFound, refused } from "../../../helpers";

/** POST /api/v1/shared/enquiries/{enquiryId}/reply — either side replies; the lib decides who may, and a closed thread refuses. */
export async function POST(request: Request, { params }: { params: Promise<{ enquiryId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { enquiryId } = await params;
    const parsed = enquiryReplyBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await asNotFound(() => replyToEnquiry(ctx, enquiryId, parsed.data.body));
    if (!result.ok) return refused(result.errorKey);
    return ok(enquiryOpenedSchema.parse({ enquiryId: result.enquiryId }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/shared/enquiries/[enquiryId]/reply");
  }
}
