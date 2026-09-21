import { getT } from "@/lib/i18n/server";
import { exportResponse } from "@/lib/export-file";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { cbseCandidatesExport, msbshseCandidatesExport, udiseEnrolmentExport, udiseStudentsExport, udiseTeachersExport } from "@/lib/filings";

/**
 * /admin/filings/export/{kind}?grade=&format= — the five filing sheets as a
 * download, CSV or workbook. Built and audited by the library, shared with
 * the phone's /api/v1/office/filings/export/{kind}.
 */
export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { kind } = await params;
    const grade = new URL(request.url).searchParams.get("grade")?.trim().slice(0, 20) ?? "";
    const file =
      kind === "udise-students" ? await udiseStudentsExport(ctx)
      : kind === "udise-enrolment" ? await udiseEnrolmentExport(ctx)
      : kind === "udise-teachers" ? await udiseTeachersExport(ctx)
      : kind === "cbse-candidates" && grade ? await cbseCandidatesExport(ctx, grade)
      : kind === "msbshse-candidates" && grade ? await msbshseCandidatesExport(ctx, grade)
      : null;
    // An unknown sheet or a board sheet without its grade: nothing to say but the status.
    if (!file) return new Response(null, { status: 404 });
    return exportResponse(request, file);
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : 403;
      return new Response((await getT())(error.key, error.vars), { status });
    }
    console.error("[filings export]", error);
    return new Response((await getT())("common.somethingWrong"), { status: 500 });
  }
}
