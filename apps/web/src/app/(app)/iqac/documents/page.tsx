import type { Metadata } from "next";
import Link from "next/link";
import { SIGNED_FILINGS, type CollegeFilingKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { listCycles } from "@/lib/iqac";
import { listFilings } from "@/lib/iqac-filings";
import { councilOverview } from "@/lib/council-filings";
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
 *
 * BY STREAM (5 Oct 2026): a card per filing, those the college's streams
 * bring first and open, the others greyed with the streams that would bring
 * them; the councils' returns (PCI, BCI, NCTE, NBA) link to their figures and
 * worksheet; the councils not built yet (NMC, DCI, INC, COA, ICAR) are said
 * so with the preset's sentences. The form offers only the filings that
 * apply, and a department for the NBA SAR.
 */

/** The council returns with a page of their own: figures and worksheet. */
const COUNCIL_PAGE: Partial<Record<CollegeFilingKind, string>> = { PCI_INSPECTION: "pci", BCI_RETURN: "bci", NCTE_RETURN: "ncte", NBA_SAR: "nba" };
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
  const [filings, cycles, council] = await Promise.all([listFilings(ctx), listCycles(ctx), councilOverview(ctx)]);
  const applies = council.items.filter((i) => i.applies).map((i) => i.kind);
  const deptName = new Map(council.nbaDepartments.map((d) => [d.id, `${d.code} ${d.name}`]));
  const streamNames = (list: readonly string[]) => list.map((s) => tt(`streams.${s}.name`)).join(", ");
  const now = new Date();
  const year = now.getUTCMonth() >= 5 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const back = "/iqac/documents";
  // A figure's words where the councils' pages have them (an NBA report's "students"), else its metric number (the AQAR's "2.1.1").
  const figureLabel = (k: string) => {
    const said = tt(`councilFilings.figure.${k}`);
    return said === `councilFilings.figure.${k}` ? k : said;
  };
  return (
    <div className="space-y-5">
      <PageHeader title={t("iqac.documentsTitle")} description={t("iqac.documentsIntro")} />
      <DeskNav t={t} here={back} />
      <IqacFlash ok={ok} error={error} />
      <NotAScore t={t} />
      <Card>
        <CardHeader title={t("councilFilings.streamsTitle")} description={t("councilFilings.streamsIntro")} />
        <CardBody>
          <ul className="grid gap-3 sm:grid-cols-2" data-testid="filing-cards">
            {[...council.items].sort((a, b) => Number(b.applies) - Number(a.applies)).map((item) => (
              <li key={item.kind} data-testid={`filing-card-${item.kind}`} data-applies={item.applies ? "1" : "0"} className={`space-y-2 rounded-[--radius-md] border p-3 text-sm ${item.applies ? "border-border" : "border-dashed border-border bg-surface-muted text-fg-muted"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{tt("iqac.filingKind." + item.kind)}</span>
                  {item.applies ? <Badge tone="ok">{t("councilFilings.yours")}</Badge> : null}
                </div>
                <p className="text-fg-muted">{tt("councilFilings.what." + item.kind)}</p>
                {item.applies ? null : <p>{t("councilFilings.bringsLine", { streams: streamNames(item.streams) })}</p>}
                {item.applies && COUNCIL_PAGE[item.kind] ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/iqac/documents/${COUNCIL_PAGE[item.kind]}`}>{t("councilFilings.openWorksheet")}</Link>
                  </Button>
                ) : null}
                {/* NIRF's actionable insights (5 Oct 2026): what moves the estimate, on its own page. */}
                {item.applies && item.kind === "NIRF" ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/iqac/documents/nirf">{t("insights.nirfTitle")}</Link>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t("councilFilings.notBuiltTitle")} description={t("councilFilings.notBuiltIntro")} />
        <CardBody>
          <ul className="space-y-3 text-sm" data-testid="councils-not-built">
            {council.notBuilt.map((n) => (
              <li key={n.stream} className={`space-y-1 ${n.here ? "" : "text-fg-muted"}`}>
                <div className="flex flex-wrap items-center gap-2 font-medium">
                  <span>{t("councilFilings.notBuiltLine", { stream: tt(`streams.${n.stream}.name`), councils: n.councils.join(", ") })}</span>
                  {n.here ? <Badge tone="warn">{t("councilFilings.yourStream")}</Badge> : null}
                </div>
                {n.items.map((code) => (
                  <p key={code} className="text-fg-muted">
                    {tt(`streams.notBuilt.${code}`)}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
      {filings.canGenerate ? (
        <Card id="generate">
          <CardHeader title={t("iqac.generateTitle")} />
          <CardBody>
            <form action={generateFilingAction} className="grid gap-3 sm:grid-cols-4 sm:items-end">
              <input type="hidden" name="back" value={back} />
              <SelectField name="kind" label={t("iqac.kindField")} defaultValue="AQAR">
                {applies.map((k) => (
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
              {council.nbaDepartments.length ? (
                <SelectField name="departmentId" label={t("councilFilings.departmentField")} hint={t("councilFilings.departmentHint")} defaultValue="">
                  <option value="">—</option>
                  {council.nbaDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} · {d.name}
                    </option>
                  ))}
                </SelectField>
              ) : null}
              <Button type="submit">{t("iqac.generateButton")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
      {filings.items.length === 0 ? (
        <EmptyState
          title={t("iqac.noFilings")}
          action={
            filings.canGenerate ? (
              <Button asChild size="sm" variant="secondary">
                <a href="#generate">{t("iqac.generateTitle")}</a>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filings.items.map((f) => (
            <Card key={f.id} data-testid={`filing-${f.id}`}>
              <CardHeader
                title={[tt("iqac.filingKind." + f.kind), f.departmentId ? ` · ${deptName.get(f.departmentId) ?? ""}` : "", " · ", f.year, "-", (String((f.year + 1) % 100).padStart(2, "0"))].join("")}
                description={[day(f.generatedAt.slice(0, 10), locale), " · ", f.format, " · ", t("iqac.hashLabel"), " ", f.hash.slice(0, 16)].join("")}
                action={<Badge tone={f.status === "FILED" || f.status === "SIGNED_OFF" ? "ok" : f.status === "RETURNED" ? "warn" : "neutral"}>{tt("iqac.filingStatus." + f.status)}</Badge>}
              />
              <CardBody className="space-y-3 text-sm">
                <p className="text-fg-muted">
                  {Object.entries(f.figures)
                    .slice(0, 12)
                    .map(([k, v]) => `${figureLabel(k)}: ${v}`)
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
