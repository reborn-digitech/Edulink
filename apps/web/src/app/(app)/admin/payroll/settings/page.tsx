import type { Metadata } from "next";
import { GearIcon, ScalesIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { ESI_RATES, PF_RATES, PT_SLABS, PT_STATES } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { settingsOf } from "@/lib/payroll";
import { getT } from "@/lib/i18n/server";
import { payrollGate, PayrollTop } from "../shared";
import { saveSettingsAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("payroll.tabSettings") };
}

/**
 * The statutory switches and the codes the portals know the school by, and
 * the rates themselves as the coded table has them (a dated table in
 * packages/contracts; the school's accountant confirms them).
 */
export default async function PayrollSettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, locale, on } = await payrollGate(true);
  if (!on) return <ModuleOff module="PAYROLL" t={t} />;
  const params = await searchParams;
  const s = await settingsOf(ctx.schoolId);
  const pf = PF_RATES[PF_RATES.length - 1]!;
  const esi = ESI_RATES[ESI_RATES.length - 1]!;
  const mh = PT_SLABS.find((p) => p.state === "MH")!;
  const pct = (bp: number) => `${(bp / 100).toFixed(2).replace(/\.00$/, "")}%`;
  return (
    <div className="space-y-6">
      <PayrollTop t={t} current="settings" params={params} admin />
      <Card>
        <CardHeader icon={<GearIcon weight="duotone" className="size-5" />} title={t("payroll.settingsTitle")} description={t("payroll.settingsBody")} />
        <CardBody>
          <form action={saveSettingsAction} className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pfEnabled" className="size-4" defaultChecked={s.pfEnabled} />{t("payroll.fieldPfEnabled")}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pfOnFullBasic" className="size-4" defaultChecked={s.pfOnFullBasic} />{t("payroll.fieldPfFull")}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="esiEnabled" className="size-4" defaultChecked={s.esiEnabled} />{t("payroll.fieldEsiEnabled")}</label>
            <SelectField label={t("payroll.fieldPtState")} name="ptState" defaultValue={s.ptState}>
              {PT_STATES.map((p) => (
                <option key={p} value={p}>{t(`payroll.pt${p}`)}</option>
              ))}
            </SelectField>
            <TextField label={t("payroll.fieldEmployerName")} name="employerName" maxLength={160} defaultValue={s.employerName} hint={t("payroll.fieldEmployerNameHint")} />
            <TextField label={t("payroll.fieldPfCode")} name="pfEstablishmentCode" maxLength={40} defaultValue={s.pfEstablishmentCode} />
            <TextField label={t("payroll.fieldEsiCode")} name="esiEmployerCode" maxLength={40} defaultValue={s.esiEmployerCode} />
            <div className="sm:col-span-2">
              <Button type="submit">{t("common.save")}</Button>
            </div>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<ScalesIcon weight="duotone" className="size-5" />} title={t("payroll.ratesTitle")} description={t("payroll.ratesBody")} />
        <CardBody>
          <ul className="space-y-2 text-sm">
            <li>{t("payroll.ratePf", { employee: pct(pf.employeeBp), employer: pct(pf.employerBp), eps: pct(pf.epsBp), ceiling: formatPaise(pf.wageCeilingPaise, locale), from: pf.effectiveFrom })}</li>
            <li>{t("payroll.rateEsi", { employee: pct(esi.employeeBp), employer: pct(esi.employerBp), limit: formatPaise(esi.wageLimitPaise, locale), from: esi.effectiveFrom })}</li>
            <li>{t("payroll.ratePtMh", { from: mh.effectiveFrom, men: mh.men.map((x) => `${x.upToPaise === null ? "∞" : formatPaise(x.upToPaise, locale)}: ${formatPaise(x.monthlyPaise, locale)}`).join(", "), women: mh.women.map((x) => `${x.upToPaise === null ? "∞" : formatPaise(x.upToPaise, locale)}: ${formatPaise(x.monthlyPaise, locale)}`).join(", ") })}</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
