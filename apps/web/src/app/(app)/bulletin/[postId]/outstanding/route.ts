import { getT } from "@/lib/i18n/server";
import { exportResponse } from "@/lib/export-file";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { circularReach } from "@/lib/circulars";
import { toCsv } from "@/lib/csv";
import { audit } from "@/lib/audit";
import { REACH_STATE_KEY } from "../reach-labels";

/**
 * The waiting list of a circular as a file: one row per outstanding family
 * and guardian — the pupil, the class, who to ring and how far they got —
 * for the office to work through by telephone. Who may read it is settled
 * in `circularReach`: the office, the head and the class teachers of the
 * post's own school, and a teacher's rows carry no phone number. CSV, or
 * ?format=xlsx for the workbook.
 */
export async function GET(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  try {
    const ctx = await requireApiUser();
    const t = await getT();
    const reach = await circularReach(ctx, postId);
    const headers = [t("circulars.columnFamily"), t("circulars.columnClass"), t("circulars.columnGuardian"), t("circulars.columnPhone"), t("circulars.columnState")];
    const rows: Record<string, unknown>[] = [];
    for (const group of reach.groups) {
      const className = group.className || t("circulars.audienceTeachers");
      for (const family of group.outstanding) {
        const guardians = family.guardians.length > 0 ? family.guardians : [null];
        for (const g of guardians) {
          rows.push({
            [headers[0]!]: family.studentName,
            [headers[1]!]: className,
            [headers[2]!]: g?.name ?? "",
            [headers[3]!]: g?.phone ?? "",
            [headers[4]!]: t(REACH_STATE_KEY[g?.state ?? family.state]),
          });
        }
      }
    }
    await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "circular.export", targetType: "Post", targetId: postId, meta: { rows: rows.length } });
    return exportResponse(request, { filename: `circular-outstanding-${postId}.csv`, csv: toCsv(rows, headers) });
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : error.code === "NOT_FOUND" ? 404 : 403;
      return new Response((await getT())(error.key, error.vars), { status });
    }
    console.error("[circular outstanding export]", error);
    return new Response((await getT())("common.somethingWrong"), { status: 500 });
  }
}
