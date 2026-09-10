import { NextResponse } from "next/server";
import { apiErrorSchema, fileLinkSchema } from "@edulink/contracts";
import { authorizeFileRead } from "@/lib/files";
import { signFileLink } from "@/lib/file-links";
import { AccessError } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/files/{fileId}/link — a five-minute link that opens one file
 * outside the app (a pupil's PDF in the phone's browser). The same read rule
 * as the file route decides, for the signed-in person; a file they may not
 * read is a 404, exactly as the file route answers, so ids cannot be probed.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { fileId } = await params;
    const access = await authorizeFileRead(fileId, ctx);
    if (!access.allowed) throw new AccessError("notFound.title", "NOT_FOUND");
    const link = signFileLink(fileId);
    if (!link) {
      // Production with neither FILE_LINK_SECRET nor VAPID_PRIVATE_KEY: the phone falls back to the web page.
      const t = await getT();
      return NextResponse.json(apiErrorSchema.parse({ error: t("common.tryAgainMoment"), code: "SERVER" }), { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    return ok(fileLinkSchema.parse({ url: `/api/files/${encodeURIComponent(fileId)}?t=${link.token}`, expiresAt: link.expiresAt.toISOString() }));
  } catch (error) {
    return apiFailure(error, "api/v1/files/link");
  }
}
