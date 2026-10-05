import type { Metadata } from "next";
import { ListBulletsIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { COMPONENT_KIND, SALARY_COMPONENT_CODES, SALARY_FORMULAS, STATUTORY_CODES, type SalaryComponentCode, type SalaryStructureView } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { fieldClass } from "@/components/ui/field-class";
import { listStructures } from "@/lib/payroll";
import { CODE_LABEL_KEY } from "@/lib/payroll-rules";
import { getT } from "@/lib/i18n/server";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import { payrollGate, PayrollTop } from "../shared";
import { saveStructureAction } from "../actions";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("payroll.tabStructures") };
}

const VALUE_FREE = (code: SalaryComponentCode) => code === "BASIC" || code === "ADVANCE" || STATUTORY_CODES.includes(code);

/** One structure's form: a row per code, ticked to include it, with its formula and value. */
function StructureForm({ t, s }: { t: Translate; s: SalaryStructureView | null }) {
  const has = new Map((s?.components ?? []).map((c) => [c.code, c]));
  return (
    <form action={saveStructureAction} className="space-y-3">
      {s ? <input type="hidden" name="id" value={s.id} /> : null}
      <TextField label={t("payroll.fieldStructureName")} name="name" required maxLength={80} defaultValue={s?.name ?? ""} />
      <TableScroll>
        <table className="w-full min-w-[36rem] text-sm">
          <tbody className="divide-y divide-border">
            {SALARY_COMPONENT_CODES.map((code) => {
              const c = has.get(code);
              const free = VALUE_FREE(code);
              const earning = COMPONENT_KIND[code] === "EARNING";
              const pct = c && c.formula !== "FIXED";
              return (
                <tr key={code}>
                  <td className="py-1.5 pr-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name={`on:${code}`} className="size-4" defaultChecked={code === "BASIC" || Boolean(c)} disabled={code === "BASIC"} />
                      <span className="font-medium">{t(CODE_LABEL_KEY[code] as TranslationKey)}</span>
                      <span className="text-xs text-fg-muted">{t(`payroll.kind${COMPONENT_KIND[code]}`)}</span>
                    </label>
                  </td>
                  <td className="py-1.5 pr-2">
                    {code === "OTHER_EARNING" || code === "OTHER_DEDUCTION" ? <input aria-label={t("payroll.fieldLabel")} className={fieldClass()} name={`label:${code}`} maxLength={60} defaultValue={c?.label ?? ""} placeholder={t("payroll.fieldLabel")} /> : null}
                  </td>
                  <td className="py-1.5 pr-2">
                    {free ? (
                      <span className="text-xs text-fg-muted">{code === "BASIC" ? t("payroll.basicFromSalary") : code === "ADVANCE" ? t("payroll.advanceFromRecords") : t("payroll.statutoryRule")}</span>
                    ) : (
                      <select aria-label={t("payroll.fieldFormula")} className={fieldClass()} name={`formula:${code}`} defaultValue={c?.formula ?? "FIXED"}>
                        {SALARY_FORMULAS.filter((f) => !(earning && f === "PERCENT_OF_GROSS")).map((f) => (
                          <option key={f} value={f}>{t(`payroll.formula${f}`)}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="py-1.5">
                    {free ? null : <input aria-label={t("payroll.fieldValue")} className={fieldClass("w-32 text-right")} name={`value:${code}`} inputMode="decimal" defaultValue={c ? (pct ? String(c.value / 100) : (c.value / 100).toFixed(2)) : ""} placeholder={t("payroll.valueHint")} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>
      <p className="text-xs text-fg-muted">{t("payroll.structureHint")}</p>
      {s ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="archived" className="size-4" defaultChecked={s.archived} />
          {t("payroll.fieldArchiveStructure")}
        </label>
      ) : null}
      <Button type="submit">{s ? t("payroll.saveStructure") : t("payroll.addStructure")}</Button>
    </form>
  );
}

/** Salary structures: named sets of components each salary is built on. */
export default async function PayrollStructures({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, on } = await payrollGate(true);
  if (!on) return <ModuleOff page module="PAYROLL" t={t} />;
  const params = await searchParams;
  const { structures } = await listStructures(ctx);
  return (
    <div className="space-y-6">
      <PayrollTop t={t} current="structures" params={params} admin />
      <Card>
        <CardHeader icon={<ListBulletsIcon weight="duotone" className="size-5" />} title={t("payroll.structuresTitle")} description={t("payroll.structuresBody")} />
        <CardBody>
          {structures.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("payroll.structuresNone")} description={t("payroll.structuresNoneBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {structures.map((s) => (
                <li key={s.id} className="py-3">
                  <details>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-sm [&::-webkit-details-marker]:hidden">
                      <span className="font-medium text-fg">{s.name}</span>
                      <span className="text-fg-muted">· {t("payroll.structureUsedBy", { count: s.staffCount })}</span>
                      {s.archived ? <Badge size="sm">{t("payroll.archived")}</Badge> : null}
                      <span className="block w-full text-xs text-fg-muted">{s.components.map((c) => c.label || t(CODE_LABEL_KEY[c.code] as TranslationKey)).join(" · ")}</span>
                    </summary>
                    <div className="mt-3">
                      <StructureForm t={t} s={s} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<PlusIcon weight="bold" className="size-5" />} title={t("payroll.newStructure")} />
        <CardBody>
          <StructureForm t={t} s={null} />
        </CardBody>
      </Card>
    </div>
  );
}
