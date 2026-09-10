import { getT } from "@/lib/i18n/server";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { enrolmentExport } from "@/lib/attendance-export";

/**
 * The UDISE+-shaped enrolment summary: a row per grade with class and pupil
 * counts, plus how many pupils have a guardian linked and how many teachers
 * serve the grade — the aggregate numbers an annual return asks for, with no
 * child named in the file at all. Built and audited by the library, shared
 * with the phone's export.
 */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN");
    const file = await enrolmentExport(ctx);
    return new Response(file.csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "no-store, private",
      },
    });
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : 403;
      return new Response((await getT())(error.key, error.vars), { status });
    }
    console.error("[enrolment export]", error);
    return new Response((await getT())("common.somethingWrong"), { status: 500 });
  }
}
