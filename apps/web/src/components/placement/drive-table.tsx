import Link from "next/link";
import type { DriveSummary } from "@edulink/contracts";
import type { Translate } from "@/lib/i18n/dictionary";
import { DRIVE_KIND_KEY, LINK, TABLE, TD, TH, packageRange, statusBadge } from "./parts";

/** The drives as a table: title (to the drive), company, kind and host, package, status, applicants and offers. */
export function DriveTable({ drives, t, hrefOf = (d) => `/placement/drives/${d.id}` }: { drives: DriveSummary[]; t: Translate; hrefOf?: (d: DriveSummary) => string }) {
  return (
    <div className="overflow-x-auto">
      <table className={TABLE}>
        <thead>
          <tr className="border-b border-border">
            <th className={TH}>{t("placement.colDrive")}</th>
            <th className={TH}>{t("placement.colCompany")}</th>
            <th className={TH}>{t("placement.colPackage")}</th>
            <th className={TH}>{t("placement.colStatus")}</th>
            <th className={TH}>{t("placement.colApplicants")}</th>
            <th className={TH}>{t("placement.colOffers")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {drives.map((d) => (
            <tr key={d.id}>
              <td className={TD}>
                <Link className={LINK} href={hrefOf(d)}>
                  {d.title}
                </Link>
                <div className="text-xs text-fg-muted">
                  {t(DRIVE_KIND_KEY[d.kind]!)}
                  {d.hosted ? "" : ` · ${t("placement.hostedBy", { name: d.hostName })}`}
                </div>
              </td>
              <td className={TD}>
                {d.companyName}
                {d.companyVerified ? "" : <div className="text-xs text-warn">{t("placement.unverified")}</div>}
              </td>
              <td className={TD}>{packageRange(d.packageMinRupees, d.packageMaxRupees, t)}</td>
              <td className={TD}>{statusBadge(d.status, t)}</td>
              <td className={TD}>{d.applicants}</td>
              <td className={TD}>{d.offers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
