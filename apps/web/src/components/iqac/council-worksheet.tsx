import { itemKey, type CouncilView } from "@edulink/contracts";
import type { Translate } from "@/lib/i18n/dictionary";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { day, keyed } from "@/components/iqac/parts";
import { saveWorksheetAction } from "@/app/(app)/iqac/documents/council-actions";

/**
 * A council's return as it stands (5 Oct 2026): the figures the rows give
 * now, and its worksheet — the BCI's or NCTE's checklist the office answers,
 * or the NBA SAR's criteria, the computed ones with their marks and the
 * qualitative ones the HOD self-assesses and writes. Shared by the IQAC's
 * /iqac/documents/{pci|bci|ncte|nba} and the HOD's /hod/nba.
 */
export function CouncilWorksheet({ t, locale, view, back }: { t: Translate; locale: string; view: CouncilView; back: string }) {
  const tt = keyed(t);
  const ns = view.kind === "BCI_RETURN" ? "bciItem" : view.kind === "NCTE_RETURN" ? "ncteItem" : "nbaItem";
  const nba = view.kind === "NBA_SAR";
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title={t("councilFilings.figuresTitle")} description={t("councilFilings.figuresIntro")} />
        <CardBody className="space-y-3 text-sm">
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2" data-testid="council-figures">
            {Object.entries(view.figures).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-border py-1">
                <dt className="text-fg-muted">{tt("councilFilings.figure." + k)}</dt>
                <dd className="font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          {view.total ? <p className="font-medium">{t("councilFilings.totalLine", { computed: view.total.computed, self: view.total.self, max: view.total.max })}</p> : null}
        </CardBody>
      </Card>

      {view.items.length === 0 ? (
        <p className="text-sm text-fg-muted">{t("councilFilings.noWorksheet")}</p>
      ) : (
        <Card>
          <CardHeader title={nba ? t("councilFilings.criteriaTitle") : t("councilFilings.checklistTitle")} description={view.canEdit ? (view.updatedAt ? t("councilFilings.updatedOn", { date: day(view.updatedAt.slice(0, 10), locale) }) : undefined) : t("councilFilings.readOnly")} />
          <CardBody>
            <form action={saveWorksheetAction} className="space-y-4">
              <input type="hidden" name="back" value={back} />
              <input type="hidden" name="kind" value={view.kind} />
              <input type="hidden" name="year" value={view.year} />
              <input type="hidden" name="departmentId" value={view.departmentId ?? ""} />
              {view.items.map((i) => (
                <fieldset key={i.code} className="space-y-2 border-b border-border pb-4" disabled={!view.canEdit || i.computed}>
                  <legend className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {nba ? <span className="tabular-nums text-fg-muted">{i.code}</span> : null}
                    <span>{tt(`councilFilings.${ns}.${itemKey(i.code)}`)}</span>
                    {i.marks !== null ? <Badge tone="neutral">{t("councilFilings.marksOf", { marks: i.marks })}</Badge> : null}
                    {i.computed ? <Badge tone="ok">{t("councilFilings.computedBadge")}</Badge> : null}
                  </legend>
                  {i.computed ? (
                    <p className="text-sm tabular-nums">{i.score ?? 0}</p>
                  ) : nba ? (
                    <div className="grid gap-3 sm:grid-cols-4">
                      <TextField name={`score.${i.code}`} type="number" min={0} max={i.marks ?? undefined} step="0.5" label={t("councilFilings.scoreField")} defaultValue={i.score ?? ""} />
                      <TextAreaField name={`note.${i.code}`} label={t("councilFilings.narrativeField")} defaultValue={i.note} maxLength={8000} className="sm:col-span-3" />
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-4">
                      <SelectField name={`answer.${i.code}`} label={t("councilFilings.answerField")} defaultValue={i.answer ?? ""}>
                        <option value="">{t("councilFilings.answer.none")}</option>
                        <option value="YES">{t("councilFilings.answer.YES")}</option>
                        <option value="NO">{t("councilFilings.answer.NO")}</option>
                        <option value="NA">{t("councilFilings.answer.NA")}</option>
                      </SelectField>
                      <TextField name={`note.${i.code}`} label={t("councilFilings.noteField")} defaultValue={i.note} maxLength={8000} className="sm:col-span-3" />
                    </div>
                  )}
                </fieldset>
              ))}
              {view.canEdit ? <Button type="submit">{t("councilFilings.saveButton")}</Button> : null}
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
