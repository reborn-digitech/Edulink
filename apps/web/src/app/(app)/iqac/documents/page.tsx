import type { Metadata } from "next";
import { COLLEGE_FILING_KINDS, SIGNED_FILINGS } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { listCycles } from "@/lib/iqac";
import { listFilings } from "@/lib/iqac-filings";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { DeskNav, IqacFlash, NotAScore, day, keyed } from "@/components/iqac/parts";
import { filedAction, generateFilingAction, submitFilingAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.documentsTitle"), robots: { index: false, follow: false } };
}

/**
 * The filings (module IQAC, 4 Oct 2026): generate any of the seven from the
 * live records, download it, send a NAAC document to the principal, and mark
 * it filed on the portal. Each row shows its fingerprint (the SHA-256 of what
 * the file is made from) and the headline figures it printed.
 */
export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("IQAC", "ADMIN", "PRINCIPAL");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const tt = keyed(t);
  const { ok, error } = await searchParams;
  const kind = await institutionKindOf(ctx.schoolId);
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("iqac.documentsTitle")} />
        <ModuleOff module="IQAC" t={t} college={isCollegeKind(kind)} />
      </div>
    );
  }
  const [filings, cycles] = await Promise.all([listFilings(ctx), listCycles(ctx)]);
  const now = new Date();
  const year = now.getUTCMonth() >= 5 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const back = "/iqac/documents";
  return (
    <div className="space-y-5">
      <PageHeader title={t("iqac.documentsTitle")} description={t("iqac.documentsIntro")} />
      <DeskNav t={t} here={back} />
      <IqacFlash ok={ok} error={error} />
      <NotAScore t={t} />
      {filings.canGenerate ? (
        <Card>
          <CardHeader title={t("iqac.generateTitle")} />
          <CardBody>
            <form action={generateFilingAction} className="grid gap-3 sm:grid-cols-4 sm:items-end">
              <input type="hidden" name="back" value={back} />
              <SelectField name="kind" label={t("iqac.kindField")} defaultValue="AQAR">
                {COLLEGE_FILING_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {tt("iqac.filingKind." + k)}
                  </option>
                ))}
              </SelectField>
              <TextField name="year" type="number" min={2000} max={2100} required label={t("iqac.yearField")} hint={t("iqac.yearHint")} defaultValue={year - 1} />
              <SelectField name="cycleId" label={t("iqac.cycleTitle")} defaultValue={cycles.items[0]?.id ?? ""}>
                <option value="">—</option>
                {cycles.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.windowFrom} – {c.windowTo}
                  </option>
                ))}
              </SelectField>
              <Button type="submit">{t("iqac.generateButton")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
      {filings.items.length === 0 ? (
        <EmptyState title={t("iqac.noFilings")} />
      ) : (
        <div className="space-y-3">
          {filings.items.map((f) => (
            <Card key={f.id} data-testid={`filing-${f.id}`}>
              <CardHeader
                title={[tt("iqac.filingKind." + f.kind), " · ", f.year, "-", (String((f.year + 1) % 100).padStart(2, "0"))].join("")}
                description={[day(f.generatedAt.slice(0, 10), locale), " · ", f.format, " · ", t("iqac.hashLabel"), " ", f.hash.slice(0, 16)].join("")}
                action={<Badge tone={f.status === "FILED" || f.status === "SIGNED_OFF" ? "ok" : f.status === "RETURNED" ? "warn" : "neutral"}>{tt("iqac.filingStatus." + f.status)}</Badge>}
              />
              <CardBody className="space-y-3 text-sm">
                <p className="text-fg-muted">
                  {Object.entries(f.figures)
                    .slice(0, 12)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                </p>
                {f.principalNote ? <p>{t("iqac.principalNoteLabel", { note: f.principalNote })}</p> : null}
                {f.signedOffAt ? <p>{t("iqac.signedOn", { date: day(f.signedOffAt.slice(0, 10), locale) })}</p> : null}
                <div className="flex flex-wrap items-end gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <a href={`/api/v1/iqac/filings/${f.id}/file`}>{t("iqac.download")}</a>
                  </Button>
                  {filings.canGenerate && SIGNED_FILINGS.includes(f.kind) && (f.status === "DRAFT" || f.status === "RETURNED") ? (
                    <form action={submitFilingAction}>
                      <input type="hidden" name="back" value={back} />
                      <input type="hidden" name="filingId" value={f.id} />
                      <Button type="submit" size="sm">
                        {t("iqac.submitButton")}
                      </Button>
                    </form>
                  ) : null}
                  {filings.canGenerate && f.status !== "FILED" && (!SIGNED_FILINGS.includes(f.kind) || f.status === "SIGNED_OFF") ? (
                    <form action={filedAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="back" value={back} />
                      <input type="hidden" name="filingId" value={f.id} />
                      <TextField name="file" type="file" label={t("iqac.ackField")} accept="application/pdf,image/*" />
                      <Button type="submit" size="sm" variant="soft">
                        {t("iqac.filedButton")}
                      </Button>
                    </form>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
