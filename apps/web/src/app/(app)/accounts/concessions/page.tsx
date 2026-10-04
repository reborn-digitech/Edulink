import type { Metadata } from "next";
import { PercentIcon } from "@phosphor-icons/react/ssr";
import { isCollegeKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf } from "@/lib/modules";
import { officeSettings, pendingConcessions } from "@/lib/college-fees";
import { listHeads } from "@/lib/fees";
import { getLocale, getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { Flash, Hidden, NotCollege, Table, money } from "@/components/college-office/parts";
import { concessionAction, decideConcessionAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.navConcessions") };
}

/**
 * CONCESSIONS AT A COLLEGE (4 Oct 2026): granted by the office or the accounts
 * desk with the sanctioning authority named; one worth more than the office's
 * limit waits here for the principal, who approves (it is applied at once) or
 * refuses (it never is).
 */
export default async function ConcessionsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("ACCOUNTS", "ADMIN", "PRINCIPAL");
  const [t, locale, kind] = await Promise.all([getT(), getLocale(), institutionKindOf(ctx.schoolId)]);
  const { ok, error } = await searchParams;
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  const [pending, settings, heads, students] = await Promise.all([
    pendingConcessions(ctx),
    officeSettings(ctx.schoolId),
    listHeads(ctx.schoolId),
    db.membership.findMany({ where: { schoolId: ctx.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null }, orderBy: { user: { name: "asc" } }, take: 1000, select: { id: true, studentCode: true, user: { select: { name: true } } } }),
  ]);
  const back = "/accounts/concessions";
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.navConcessions")} description={t("collegeOffice.concessionsIntro", { amount: money(settings.concessionLimitPaise, locale) })} />
      <Flash ok={ok} error={error} />
      <Card>
        <CardHeader icon={<PercentIcon weight="duotone" className="size-5" />} title={t("collegeOffice.pendingTitle")} />
        <CardBody>
          {pending.items.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("collegeOffice.pendingNone")}</p>
          ) : (
            <Table head={[t("collegeOffice.colName"), t("collegeOffice.colWorth"), t("collegeOffice.colReason"), t("collegeOffice.colAuthority"), t("collegeOffice.colBy"), ""]} testId="pending-concessions">
              {pending.items.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 pr-3">{c.studentName}</td>
                  <td className="py-2 pr-3 tabular-nums">{money(c.valuePaise, locale)}</td>
                  <td className="py-2 pr-3">{c.reason}</td>
                  <td className="py-2 pr-3">{c.authority ?? "—"}</td>
                  <td className="py-2 pr-3">{c.grantedBy}</td>
                  <td className="py-2">
                    {ctx.role === "PRINCIPAL" ? (
                      <div className="flex gap-2">
                        <form action={decideConcessionAction}>
                          <Hidden fields={{ back, concessionId: c.id, approve: "1" }} />
                          <Button type="submit" size="sm">{t("collegeOffice.approve")}</Button>
                        </form>
                        <form action={decideConcessionAction}>
                          <Hidden fields={{ back, concessionId: c.id, approve: "0" }} />
                          <Button type="submit" size="sm" variant="secondary">{t("collegeOffice.refuse")}</Button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-xs text-fg-muted">{t("collegeOffice.waitsForPrincipal")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </CardBody>
      </Card>
      {ctx.role !== "PRINCIPAL" ? (
        <Card>
          <CardHeader title={t("collegeOffice.concessionNew")} />
          <CardBody>
            <form action={concessionAction} className="grid gap-4 sm:grid-cols-2">
              <Hidden fields={{ back }} />
              <SelectField name="studentMembershipId" required label={t("collegeOffice.colName")}>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name} {s.studentCode ? `(${s.studentCode})` : ""}
                  </option>
                ))}
              </SelectField>
              <SelectField name="headId" label={t("collegeOffice.concessionHead")}>
                <option value="">{t("collegeOffice.allHeads")}</option>
                {heads.filter((h) => !h.retiredAt).map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </SelectField>
              <SelectField name="kind" required label={t("collegeOffice.concessionKind")}>
                <option value="PERCENT">{t("collegeOffice.kindPercent")}</option>
                <option value="AMOUNT">{t("collegeOffice.kindAmount")}</option>
              </SelectField>
              <TextField name="value" inputMode="decimal" required label={t("collegeOffice.concessionValue")} hint={t("collegeOffice.concessionValueHint")} />
              <TextField name="reason" required minLength={3} label={t("collegeOffice.colReason")} />
              <TextField name="authority" required minLength={3} label={t("collegeOffice.colAuthority")} hint={t("collegeOffice.authorityHint")} />
              <div className="sm:col-span-2">
                <Button type="submit">{t("collegeOffice.concessionGrant")}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
