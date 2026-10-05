import { NewspaperIcon } from "@phosphor-icons/react/ssr";
import { PERIODICAL_FREQUENCIES, type PeriodicalView } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { isoToDisplayDate } from "@/lib/dates";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import { addVolumeAction, removeVolumeAction, saveSubscriptionAction } from "@/app/(app)/library/actions";

/**
 * A PERIODICAL'S SUBSCRIPTION AND VOLUMES at the desk (G4-21, risks batch 5 Oct 2026): how often it comes and the days
 * the subscription runs, and each volume and issue received with its day, newest first. The desk (LIBRARIAN, ADMIN)
 * writes; the head reads. A book has neither (library-periodicals.ts refuses them).
 */
export function PeriodicalPanel({ view, back, today, t }: { view: PeriodicalView; back: string; today: string; t: Translate }) {
  const freq = (f: string) => t(`risksWeb.freq_${f}` as TranslationKey);
  return (
    <Card data-testid="periodical-panel">
      <CardHeader
        icon={<NewspaperIcon weight="duotone" className="size-5" />}
        title={t("risksWeb.periodicalTitle")}
        description={view.frequency ? t(view.active ? "risksWeb.subscriptionActive" : "risksWeb.subscriptionInactive", { frequency: freq(view.frequency), from: view.subscriptionFrom ? isoToDisplayDate(view.subscriptionFrom) : "—", until: view.subscriptionUntil ? isoToDisplayDate(view.subscriptionUntil) : "—" }) : t("risksWeb.subscriptionNone")}
      />
      <CardBody className="space-y-5">
        {view.canEdit ? (
          <ActionForm action={saveSubscriptionAction} className="grid gap-4 sm:grid-cols-3 sm:items-end">
            <input type="hidden" name="titleId" value={view.titleId} />
            <input type="hidden" name="back" value={back} />
            <SelectField name="frequency" label={t("risksWeb.fieldFrequency")} required defaultValue={view.frequency ?? "MONTHLY"}>
              {PERIODICAL_FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {freq(f)}
                </option>
              ))}
            </SelectField>
            <DateField name="subscriptionFrom" label={t("risksWeb.fieldSubscriptionFrom")} defaultValue={view.subscriptionFrom ?? ""} />
            <DateField name="subscriptionUntil" label={t("risksWeb.fieldSubscriptionUntil")} defaultValue={view.subscriptionUntil ?? ""} />
            <div className="sm:col-span-3">
              <Button type="submit" variant="secondary">
                {t("risksWeb.saveSubscription")}
              </Button>
            </div>
          </ActionForm>
        ) : null}

        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
            {t("risksWeb.volumesTitle")} <Badge size="sm">{view.volumes.length}</Badge>
          </h3>
          {view.volumes.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("risksWeb.volumesNone")}</p>
          ) : (
            <ul className="divide-y divide-border rounded-[var(--radius-md)] border border-border" data-testid="periodical-volumes">
              {view.volumes.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                  <span className="text-sm text-fg">
                    {t("risksWeb.volumeLine", { volume: v.volume, issue: v.issue || "—", date: isoToDisplayDate(v.receivedOn) })}
                  </span>
                  {view.canEdit ? (
                    <ActionForm action={removeVolumeAction}>
                      <input type="hidden" name="titleId" value={view.titleId} />
                      <input type="hidden" name="volumeId" value={v.id} />
                      <input type="hidden" name="back" value={back} />
                      <ConfirmSubmit size="sm" variant="ghost" confirm={t("risksWeb.volumeRemoveConfirm", { volume: v.volume, issue: v.issue || "—" })}>
                        {t("risksWeb.volumeRemove")}
                      </ConfirmSubmit>
                    </ActionForm>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {view.canEdit ? (
            <ActionForm action={addVolumeAction} className="flex flex-wrap items-end gap-3 pt-2">
              <input type="hidden" name="titleId" value={view.titleId} />
              <input type="hidden" name="back" value={back} />
              <TextField name="volume" label={t("risksWeb.fieldVolume")} required maxLength={20} className="w-32" />
              <TextField name="issue" label={t("risksWeb.fieldIssue")} maxLength={20} className="w-32" />
              <DateField name="receivedOn" label={t("risksWeb.fieldReceivedOn")} required defaultValue={today} />
              <Button type="submit" variant="secondary">
                {t("risksWeb.volumeAdd")}
              </Button>
            </ActionForm>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
