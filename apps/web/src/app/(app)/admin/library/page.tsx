import type { Metadata } from "next";
import Link from "next/link";
import { GearSixIcon } from "@phosphor-icons/react/ssr";
import { formatPaise, type Locale } from "@edulink/i18n";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { librarySettingsFor } from "@/lib/library";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { Flash } from "@/components/library/parts";
import { saveSettingsAction } from "../../library/actions";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("library.settingsTitle"), robots: { index: false, follow: false } };
}

/**
 * The library's rules (module LIBRARY, 3 Oct 2026), the office's to set and
 * the head's to read: how many books a pupil and a member of staff may hold
 * and for how long, how many renewals, the overdue fine per day, and the fee
 * head a pupil's fine is charged under. With no head, fines are dues the
 * office settles at its own counter; money never passes through Shalaghar.
 */
export default async function AdminLibraryPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const { ok, error } = await searchParams;
  if (!(await isModuleOn(ctx.schoolId, "LIBRARY"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("library.settingsTitle")} />
        <ModuleOff module="LIBRARY" t={t} />
      </div>
    );
  }
  const s = await librarySettingsFor(ctx);
  const readOnly = !s.canEdit;
  return (
    <div className="space-y-5">
      <PageHeader
        title={t("library.settingsTitle")}
        description={t("library.settingsIntro")}
        actions={
          <Button asChild variant="secondary">
            <Link href="/library">{t("library.openDesk")}</Link>
          </Button>
        }
      />
      <Flash ok={ok} error={error} />
      <Card>
        <CardHeader icon={<GearSixIcon weight="duotone" className="size-5" />} title={t("library.rulesTitle")} description={readOnly ? t("common.officeSetsThis") : undefined} />
        <CardBody>
          <ActionForm action={saveSettingsAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="back" value="/admin/library" />
            <fieldset disabled={readOnly} className="contents">
              <TextField name="pupilLimit" type="number" min={0} max={20} required label={t("library.pupilLimit")} defaultValue={s.pupilLimit} />
              <TextField name="pupilLoanDays" type="number" min={1} max={120} required label={t("library.pupilLoanDays")} defaultValue={s.pupilLoanDays} />
              <TextField name="staffLimit" type="number" min={0} max={50} required label={t("library.staffLimit")} defaultValue={s.staffLimit} />
              <TextField name="staffLoanDays" type="number" min={1} max={365} required label={t("library.staffLoanDays")} defaultValue={s.staffLoanDays} />
              <TextField name="maxRenewals" type="number" min={0} max={10} required label={t("library.maxRenewals")} defaultValue={s.maxRenewals} />
              <TextField name="fine" inputMode="decimal" required label={t("library.finePerDay")} hint={t("library.finePerDayHint", { amount: formatPaise(s.finePerDayPaise, locale as Locale) })} defaultValue={(s.finePerDayPaise / 100).toFixed(2)} />
              <SelectField name="fineHeadId" label={t("library.fineHead")} hint={t("library.fineHeadHint")} defaultValue={s.fineHeadId ?? ""} className="sm:col-span-2">
                <option value="">{t("library.fineHeadNone")}</option>
                {s.fineHeads.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.code})
                  </option>
                ))}
              </SelectField>
              {readOnly ? null : (
                <div className="sm:col-span-2">
                  <Button type="submit">{t("library.saveRules")}</Button>
                </div>
              )}
            </fieldset>
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );
}
