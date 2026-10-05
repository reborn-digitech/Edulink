import type { Metadata } from "next";
import { StackIcon } from "@phosphor-icons/react/ssr";
import { COLLEGE_CATEGORIES, isCollegeKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf } from "@/lib/modules";
import { listCollegeStructures, officeSettings } from "@/lib/college-fees";
import { listHeads } from "@/lib/fees";
import { getLocale, getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { CATEGORY_KEY, Flash, Hidden, NotCollege, Table, day, money } from "@/components/college-office/parts";
import { officeSettingsAction, raiseDemandsAction, structureAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.navStructures") };
}

/**
 * FEE STRUCTURES BY PROGRAMME, YEAR AND CATEGORY (4 Oct 2026): each as the fee
 * regulating authority approved it, with its approval reference, one or two
 * terms with amounts by head and the late-fee slabs; then every active
 * student put on theirs with a demand for each term (raising again changes
 * nothing). The office's concession limit sits here too.
 */
export default async function StructuresPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("ACCOUNTS", "ADMIN", "PRINCIPAL");
  const [t, locale, kind] = await Promise.all([getT(), getLocale(), institutionKindOf(ctx.schoolId)]);
  const { ok, error } = await searchParams;
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  const [list, heads, programmes, settings] = await Promise.all([listCollegeStructures(ctx), listHeads(ctx.schoolId), db.programme.findMany({ where: { schoolId: ctx.schoolId, archivedAt: null }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }), officeSettings(ctx.schoolId)]);
  const name = new Map(programmes.map((p) => [p.id, `${p.code} · ${p.name}`]));
  const canWrite = ctx.role !== "PRINCIPAL";
  const back = "/accounts/structures";
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.navStructures")} description={t("collegeOffice.structuresIntro", { year: list.year?.name ?? "—" })} />
      <Flash ok={ok} error={error} />
      <Card>
        <CardHeader icon={<StackIcon weight="duotone" className="size-5" />} title={t("collegeOffice.structuresTitle")} />
        <CardBody>
          {list.structures.length === 0 ? (
            <EmptyState title={t("collegeOffice.structuresEmpty")} description={t("collegeOffice.structuresEmptyBody")} action={<Button asChild size="sm"><a href="#new-structure">{t("collegeOffice.structureNew")}</a></Button>} />
          ) : (
            <Table head={[t("collegeOffice.colProgramme"), t("collegeOffice.colYear"), t("collegeOffice.colCategory"), t("collegeOffice.colApproval"), t("collegeOffice.colTerms"), t("collegeOffice.colTotal"), t("collegeOffice.colStudents")]} testId="college-structures">
              {list.structures.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 pr-3">{name.get(s.programmeId) ?? "—"}</td>
                  <td className="py-2 pr-3">{s.yearOfStudy}</td>
                  <td className="py-2 pr-3">{t(CATEGORY_KEY(s.category))}</td>
                  <td className="py-2 pr-3">{s.approvalRef ?? "—"}</td>
                  <td className="py-2 pr-3">{s.terms.map((x) => `${x.label} (${day(x.dueDateKey, locale)}): ${money(x.totalPaise, locale)}`).join("; ")}</td>
                  <td className="py-2 pr-3 tabular-nums">{money(s.totalPaise, locale)}</td>
                  <td className="py-2 pr-3 tabular-nums">{s.students}</td>
                </tr>
              ))}
            </Table>
          )}
          {canWrite ? (
            <form action={raiseDemandsAction} className="mt-4">
              <Hidden fields={{ back }} />
              <Button type="submit" variant="primary">{t("collegeOffice.raiseDemands")}</Button>
              <p className="mt-2 text-xs text-fg-muted">{t("collegeOffice.raiseDemandsHint")}</p>
            </form>
          ) : null}
        </CardBody>
      </Card>
      {canWrite ? (
        <Card id="new-structure">
          <CardHeader title={t("collegeOffice.structureNew")} description={t("collegeOffice.structureNewIntro")} />
          <CardBody>
            {heads.length === 0 || programmes.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("collegeOffice.structureNeeds")}</p>
            ) : (
              <form action={structureAction} className="grid gap-4 sm:grid-cols-2">
                <Hidden fields={{ back }} />
                <SelectField name="programmeId" required label={t("collegeOffice.colProgramme")}>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} · {p.name}
                    </option>
                  ))}
                </SelectField>
                <TextField name="yearOfStudy" type="number" min={1} max={6} required defaultValue={1} label={t("collegeOffice.colYear")} />
                <SelectField name="category" required label={t("collegeOffice.colCategory")}>
                  {COLLEGE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(CATEGORY_KEY(c))}
                    </option>
                  ))}
                </SelectField>
                <TextField name="approvalRef" required minLength={3} label={t("collegeOffice.colApproval")} hint={t("collegeOffice.approvalHint")} />
                <TextField name="name" required minLength={2} className="sm:col-span-2" label={t("collegeOffice.structureName")} />
                {[1, 2].map((n) => (
                  <fieldset key={n} className="grid gap-3 rounded-[var(--radius-md)] border border-border p-3 sm:col-span-2 sm:grid-cols-3">
                    <legend className="px-1 text-sm font-medium">{t("collegeOffice.termN", { n })}</legend>
                    <TextField name={`term${n}Label`} required={n === 1} label={t("collegeOffice.termLabel")} defaultValue={n === 1 ? t("collegeOffice.termOdd") : t("collegeOffice.termEven")} />
                    <TextField name={`term${n}Due`} type="date" required={n === 1} label={t("collegeOffice.termDue")} />
                    <div className="sm:col-span-3 grid gap-3 sm:grid-cols-3">
                      {heads.filter((h) => !h.retiredAt).map((h) => (
                        <TextField key={h.id} name={`term${n}_${h.id}`} inputMode="decimal" label={[h.name, h.code].join(" · ")} />
                      ))}
                    </div>
                  </fieldset>
                ))}
                {heads.filter((h) => !h.retiredAt).map((h) => (
                  <input key={h.id} type="hidden" name="headId" value={h.id} />
                ))}
                {[1, 2].map((n) => (
                  <div key={n} className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                    <TextField name={`slab${n}Days`} type="number" min={1} max={365} label={t("collegeOffice.slabDays", { n })} />
                    <TextField name={`slab${n}Amount`} inputMode="decimal" label={t("collegeOffice.slabAmount", { n })} />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <Button type="submit">{t("collegeOffice.structureSave")}</Button>
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardHeader title={t("collegeOffice.limitTitle")} description={t("collegeOffice.limitIntro", { amount: money(settings.concessionLimitPaise, locale) })} />
        {ctx.role === "ADMIN" ? (
          <CardBody>
            <form action={officeSettingsAction} className="flex flex-wrap items-end gap-3">
              <Hidden fields={{ back }} />
              <TextField name="limit" inputMode="decimal" required label={t("collegeOffice.limitLabel")} defaultValue={(settings.concessionLimitPaise / 100).toFixed(2)} />
              <Button type="submit" variant="secondary">{t("collegeOffice.save")}</Button>
            </form>
          </CardBody>
        ) : null}
      </Card>
    </div>
  );
}
