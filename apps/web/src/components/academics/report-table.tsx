import type { z } from "zod";
import type { attendanceReportSchema } from "@edulink/contracts";
import { EmptyState } from "@/components/ui/states";
import { NUM, TD, TH } from "@/components/module-flash";
import { StandingBadge } from "./parts";
import type { Translate } from "@/lib/i18n/dictionary";

type Rows = z.infer<typeof attendanceReportSchema>["rows"];

/** Students by course: lectures held and attended, the percentage against the rule, and when a defaulter notice last went. */
export function AttendanceReportTable({ t, rows, formatAt }: { t: Translate; rows: Rows; formatAt: (iso: string) => string }) {
  if (rows.length === 0) return <EmptyState className="border-0 bg-transparent py-4" title={t("academics.reportNone")} description={t("academics.reportNoneBody")} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className={TH}>{t("academics.colStudent")}</th>
            <th scope="col" className={TH}>{t("academics.colCourse")}</th>
            <th scope="col" className={`${TH} text-right`}>{t("academics.colAttended")}</th>
            <th scope="col" className={`${TH} text-right`}>{t("academics.colPercent")}</th>
            <th scope="col" className={TH}>{t("academics.colStanding")}</th>
            <th scope="col" className={TH}>{t("academics.colNotice")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={`${r.offeringId}|${r.studentMembershipId}`}>
              <td className={TD}>{r.name}</td>
              <td className={TD}>{r.courseCode}</td>
              <td className={NUM}>{t("academics.attendedOf", { attended: r.attended, held: r.held })}</td>
              <td className={NUM}>{r.percent === null ? "—" : `${r.percent}%`}</td>
              <td className={TD}>
                <StandingBadge t={t} a={r} />
              </td>
              <td className={TD}>{r.lastNoticeAt ? formatAt(r.lastNoticeAt) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
