import type { Metadata } from "next";
import { ChartBarIcon, DownloadSimpleIcon, GearIcon, InfoIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { placementAnalytics } from "@/lib/placement-analytics";
import { placementSettings } from "@/lib/placement";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { BAND_KEY, CellFrame, LINK, SECTOR_KEY, TABLE, TD, TH, cellContext, lpa } from "@/components/placement/parts";
import { publishSeasonAction, saveSettingsAction } from "../actions";
import { TableScroll } from "@/components/ui/table-scroll";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("placement.tabAnalytics"), robots: { index: false, follow: false } };
}

/**
 * The placement table in the shapes the filings ask for: NBA's index over
 * three years (X placed, Y higher studies, Z entrepreneurs over N), NIRF's
 * median salary with the companies and their counts, and the cell's own
 * rates — by programme, by category, by salary band and by sector. Computed
 * from the rows on every read; the published season rows beside them. The
 * IQAC reads it too.
 */
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ batch?: string; ok?: string; error?: string }> }) {
  const { ctx, t, on, college, canWrite } = await cellContext();
  const { batch, ok, error } = await searchParams;
  if (!on) return <CellFrame t={t} on={false} college={college} current="analytics" title={t("placement.tabAnalytics")}>{null}</CellFrame>;
  const wanted = batch && /^\d{4}$/.test(batch) ? Number(batch) : undefined;
  const [{ tables, seasons }, settings] = await Promise.all([placementAnalytics(ctx, wanted), placementSettings(ctx.schoolId)]);
  const top = tables[0]!;
  const back = "/placement/analytics";
  const ex = (kind: string) => `/api/v1/placement/analytics/export?kind=${kind}&batchYear=${top.batchYear}`;
  return (
    <CellFrame t={t} on college={college} current={ctx.role === "IQAC" ? null : "analytics"} title={t("placement.tabAnalytics")} description={t("placement.analyticsIntro")} ok={ok} error={error}>
      <Card>
        <CardHeader icon={<ChartBarIcon weight="duotone" className="size-5" />} title={t("placement.yearsTitle")} description={t("placement.yearsIntro")} />
        <CardBody className="p-0">
          <TableScroll>
            <table className={TABLE}>
              <thead>
                <tr className="border-b border-border">
                  <th className={TH}>{t("placement.colBatch")}</th>
                  <th className={TH}>{t("placement.colN")}</th>
                  <th className={TH}>{t("placement.colX")}</th>
                  <th className={TH}>{t("placement.colY")}</th>
                  <th className={TH}>{t("placement.colZ")}</th>
                  <th className={TH}>{t("placement.colIndex")}</th>
                  <th className={TH}>{t("placement.colMedian")}</th>
                  <th className={TH}>{t("placement.colOffers")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tables.map((r) => (
                  <tr key={r.batchYear}>
                    <td className={TD}>{r.batchYear}</td>
                    <td className={TD}>{r.finalYear}</td>
                    <td className={TD}>{r.placed}</td>
                    <td className={TD}>{r.higherStudies}</td>
                    <td className={TD}>{r.entrepreneurs}</td>
                    <td className={TD}>{r.placementIndex === null ? "—" : r.placementIndex.toFixed(2)}</td>
                    <td className={TD}>{r.medianSalaryRupees === null ? "—" : lpa(r.medianSalaryRupees, t)}</td>
                    <td className={TD}>
                      {r.offers}
                      {r.offersPerStudent !== null ? <div className="text-xs text-fg-muted">{t("placement.perStudent", { n: r.offersPerStudent })}</div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          <div className="flex flex-wrap gap-4 border-t border-border p-5 text-sm">
            <a className={LINK} href={ex("NBA")}>
              <DownloadSimpleIcon className="mr-1 inline size-4" aria-hidden />
              {t("placement.exportNba")}
            </a>
            <a className={LINK} href={ex("NIRF")}>
              <DownloadSimpleIcon className="mr-1 inline size-4" aria-hidden />
              {t("placement.exportNirf")}
            </a>
            <a className={LINK} href={ex("OFFERS")}>
              <DownloadSimpleIcon className="mr-1 inline size-4" aria-hidden />
              {t("placement.exportOffers")}
            </a>
          </div>
        </CardBody>
      </Card>
      {/* What the figures mean (G4-24, risks batch): the three rules the counts and the eligibility lists follow, in words. */}
      <Card data-testid="placement-definitions">
        <CardHeader icon={<InfoIcon weight="duotone" className="size-5" />} title={t("risksWeb.placementDefsTitle")} />
        <CardBody>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-fg-muted">
            <li>{t("risksWeb.placementDefPlaced")}</li>
            <li>{t("risksWeb.placementDefOneOffer", { ratio: settings.dreamRatio })}</li>
            <li>{t(settings.allowGenderRule ? "risksWeb.placementDefGenderOn" : "risksWeb.placementDefGenderOff")}</li>
          </ul>
        </CardBody>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("placement.byCompanyTitle", { batch: top.batchYear })} />
          <CardBody className="space-y-1 text-sm">
            {top.byCompany.length === 0 ? <p className="text-fg-muted">{t("placement.noOffersYet")}</p> : null}
            {top.byCompany.map((c) => (
              <div key={c.company} className="flex justify-between gap-3">
                <span>{c.company}</span>
                <span className="text-fg-muted">
                  {t("placement.offersN", { count: c.offers })}
                  {c.medianRupees !== null ? ` · ${lpa(c.medianRupees, t)}` : ""}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("placement.bandsTitle")} />
          <CardBody className="space-y-1 text-sm">
            {top.bands.map((b) => (
              <div key={b.band} className="flex justify-between">
                <span>{t(BAND_KEY[b.band]!)}</span>
                <span>{b.count}</span>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("placement.byProgrammeTitle")} />
          <CardBody className="space-y-1 text-sm">
            {top.byProgramme.map((p) => (
              <div key={p.programmeId} className="flex justify-between gap-3">
                <span>{p.programmeName || t("placement.noProgramme")}</span>
                <span>{t("placement.placedOf", { placed: p.placed, of: p.finalYear })}</span>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("placement.byCategoryTitle")} />
          <CardBody className="space-y-1 text-sm">
            {top.byCategory.map((p) => (
              <div key={p.category} className="flex justify-between gap-3">
                <span>{p.category || t("placement.noCategory")}</span>
                <span>{t("placement.placedOf", { placed: p.placed, of: p.finalYear })}</span>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("placement.bySectorTitle")} />
          <CardBody className="space-y-1 text-sm">
            {top.bySector.map((s) => (
              <div key={s.sector} className="flex justify-between gap-3">
                <span>{t(SECTOR_KEY[s.sector]!)}</span>
                <span>{t("placement.sectorLine", { companies: s.companies, offers: s.offers })}</span>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("placement.seasonsTitle")} description={t("placement.seasonsIntro")} />
          <CardBody className="space-y-2 text-sm">
            {seasons.length === 0 ? <p className="text-fg-muted">{t("placement.noSeasons")}</p> : null}
            {seasons.map((s) => (
              <div key={s.batchYear} className="flex justify-between gap-3">
                <span>{s.batchYear}</span>
                <span className="text-fg-muted">{t("placement.seasonLine", { placed: s.placed, higher: s.higherStudies, entrepreneurs: s.entrepreneurs, on: s.computedAt.slice(0, 10) })}</span>
              </div>
            ))}
            {canWrite ? (
              <ActionForm action={publishSeasonAction} className="flex flex-wrap items-end gap-2 pt-2">
                <input type="hidden" name="back" value={back} />
                <TextField label={t("placement.fieldBatchYear")} name="batchYear" type="number" defaultValue={top.batchYear} required />
                <Button type="submit" size="sm">
                  {t("placement.publishSeason")}
                </Button>
              </ActionForm>
            ) : null}
          </CardBody>
        </Card>
      </div>
      {canWrite ? (
        <Card>
          <CardHeader icon={<GearIcon weight="duotone" className="size-5" />} title={t("placement.settingsTitle")} />
          <CardBody>
            <ActionForm action={saveSettingsAction} className="grid gap-4 sm:grid-cols-3 sm:items-end">
              <input type="hidden" name="back" value={back} />
              <TextField label={t("placement.fieldSeasonBatch")} name="seasonBatchYear" type="number" defaultValue={settings.seasonBatchYear} required />
              <TextField label={t("placement.fieldDreamRatio")} name="dreamRatio" type="number" step="0.05" min="1" max="5" defaultValue={settings.dreamRatio} required hint={t("placement.fieldDreamRatioHint")} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="allowGenderRule" defaultChecked={settings.allowGenderRule} />
                {t("placement.fieldAllowGender")}
              </label>
              <Button type="submit" size="sm" className="sm:justify-self-start">
                {t("placement.saveSettings")}
              </Button>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
    </CellFrame>
  );
}
