import { publicFacultySchema } from "@edulink/contracts";
import { publicFaculty } from "@/lib/faculty-profile";
import { apiFailure, ok } from "@/lib/api-v1";

type Params = { params: Promise<{ slug: string }> };

/** GET /api/v1/public/faculty/{slug} — a college's published faculty pages, signed out (5 Oct 2026). An unknown slug is an empty list. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    return ok(publicFacultySchema.parse(await publicFaculty(slug)));
  } catch (error) {
    return apiFailure(error, "api/v1/public/faculty/[slug]");
  }
}
