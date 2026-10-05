import { SealCheckIcon, SealWarningIcon } from "@phosphor-icons/react/ssr";
import type { BenchmarkStatus, Benchmarks } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { TableScroll } from "@/components/ui/table-scroll";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import { signBenchmarksAction } from "@/app/(app)/iqac/actions";

/**
 * "PROVISIONAL" ON EVERY NAAC AND NIRF FIGURE (G4-15, risks batch 5 Oct 2026): until the college's IQAC coordinator
 * signs the benchmark list the figures are measured against (lib/iqac-benchmarks.ts), the pages that print a predicted
 * grade, a gap or a band say so beside the "not a score" sentence; once signed, who signed and when.
 */
export function BenchmarkLabel({ t, status }: { t: Translate; status: BenchmarkStatus | null | undefined }) {
  if (!status) return null;
  return (
    <span className="mt-1.5 flex flex-wrap items-center gap-2" data-testid={status.provisional ? "benchmarks-provisional" : "benchmarks-signed"}>
      <Badge tone={status.provisional ? "warn" : "ok"} size="sm">
        {t(status.provisional ? "risksWeb.benchmarkProvisional" : "risksWeb.benchmarkSignedBadge")}
      </Badge>
      <span>{status.sentence}</span>
    </span>
  );
}

/** The list itself, as the coordinator reads it before signing; the sign-off for the IQAC coordinator alone. */
export function BenchmarkListCard({ t, view, back }: { t: Translate; view: Benchmarks; back: string }) {
  return (
    <Card id="benchmarks" className="scroll-mt-20" data-testid="benchmark-list">
      <CardHeader icon={view.provisional ? <SealWarningIcon weight="duotone" className="size-5" /> : <SealCheckIcon weight="duotone" className="size-5" />} title={t("risksWeb.benchmarkListTitle")} description={t("risksWeb.benchmarkListIntro")} />
      <CardBody className="space-y-4">
        <BenchmarkLabel t={t} status={view} />
        <details>
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-accent-strong">{t("risksWeb.benchmarkShowList", { naac: view.naac.length, nirf: view.nirfBands.length })}</summary>
          <div className="mt-2 grid gap-4 lg:grid-cols-2">
            <TableScroll>
              <table className="w-full text-left text-sm">
                <thead className="text-fg-muted">
                  <tr>
                    <th className="py-1.5 pr-3 font-medium">{t("risksWeb.benchmarkColFormula")}</th>
                    <th className="py-1.5 pr-3 font-medium">{t("risksWeb.benchmarkColBenchmark")}</th>
                  </tr>
                </thead>
                <tbody>
                  {view.naac.map((r) => (
                    <tr key={r.formula} className="border-t border-border">
                      <td className="py-1.5 pr-3 font-mono text-xs">{r.formula}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{r.benchmark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
            <TableScroll>
              <table className="w-full text-left text-sm">
                <thead className="text-fg-muted">
                  <tr>
                    <th className="py-1.5 pr-3 font-medium">{t("risksWeb.benchmarkColBand")}</th>
                    <th className="py-1.5 pr-3 font-medium">{t("risksWeb.benchmarkColFrom")}</th>
                  </tr>
                </thead>
                <tbody>
                  {view.nirfBands.map((b) => (
                    <tr key={b.code} className="border-t border-border">
                      <td className="py-1.5 pr-3">{t(`insights.nirfBand.${b.code}` as TranslationKey)}</td>
                      <td className="py-1.5 pr-3 tabular-nums">{b.min}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </div>
        </details>
        {view.canSign && view.provisional ? (
          <ActionForm action={signBenchmarksAction}>
            <input type="hidden" name="back" value={back} />
            <input type="hidden" name="version" value={view.version} />
            <ConfirmSubmit size="sm" confirm={t("risksWeb.benchmarkSignConfirm")} data-testid="benchmarks-sign">
              {t("risksWeb.benchmarkSign")}
            </ConfirmSubmit>
          </ActionForm>
        ) : null}
      </CardBody>
    </Card>
  );
}
