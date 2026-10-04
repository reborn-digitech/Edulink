import type { Metadata } from "next";
import Link from "next/link";
import { FilePdfIcon, HandCoinsIcon, ListBulletsIcon, ReceiptIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { TextField } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { TableScroll } from "@/components/ui/table-scroll";
import { ModuleOff } from "@/components/module-off";
import { ModuleFlash, LINK, NUM, TD, TH } from "@/components/module-flash";
import { requireUser } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { myPayslips } from "@/lib/payroll";
import { CODE_LABEL_KEY } from "@/lib/payroll-rules";
import { SCHOOL_STAFF_ROLES } from "@/lib/staff-records";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { askAdvanceAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("payroll.myTitle") };
}

/**
 * My own payslips at the school I am signed in to: each locked month with
 * its PDF (in my language), the structure I am paid on — mine, not anyone
 * else's — my yearly statement, and my advances with a way to ask for one.
 * Any member of staff, the module roles too; under /account because it is
 * the person's own, so a driver whose transport module is off still reads it.
 */
export default async function MyPayslipsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireUser();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const params = await searchParams;
  const staff = ctx.schoolId && ctx.role && (SCHOOL_STAFF_ROLES as readonly string[]).includes(ctx.role);
  if (!staff) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("payroll.myTitle")} />
        <EmptyState title={t("payroll.notStaffTitle")} description={t("payroll.notStaffBody")} action={<Button asChild size="sm"><Link href="/account">{t("nav.account")}</Link></Button>} />
      </div>
    );
  }
  if (!(await isModuleOn(ctx.schoolId, "PAYROLL"))) return <ModuleOff module="PAYROLL" t={t} />;
  const mine = await myPayslips(ctx);
  const money = (p: number) => formatPaise(p, locale, { always: true });
  const month = (m: string) => {
    const [y, mm] = m.split("-").map(Number) as [number, number];
    return new Intl.DateTimeFormat(locale === "en" ? "en-IN" : `${locale}-IN`, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, mm - 1, 1)));
  };
  const waiting = mine.advances.some((a) => a.status === "REQUESTED");
  return (
    <div className="space-y-6">
      <PageHeader title={t("payroll.myTitle")} description={t("payroll.myIntro")} />
      <ModuleFlash t={t} params={params} />
      <Card>
        <CardHeader icon={<ReceiptIcon weight="duotone" className="size-5" />} title={t("payroll.mySlips")} action={mine.years[0] ? <Link className={LINK} href={`/account/payslips/statement?year=${mine.years[0]}`}>{t("payroll.statement")}</Link> : undefined} />
        <CardBody>
          {mine.slips.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("payroll.mySlipsNone")} description={t("payroll.mySlipsNoneBody")} />
          ) : (
            <TableScroll>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className={TH}>{t("payroll.colMonth")}</th>
                  <th scope="col" className={`${TH} text-right`}>{t("payroll.colGross")}</th>
                  <th scope="col" className={`${TH} text-right`}>{t("payroll.colDeductions")}</th>
                  <th scope="col" className={`${TH} text-right`}>{t("payroll.colNet")}</th>
                  <th scope="col" className={TH}><span className="sr-only">{t("payroll.slipPdf")}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mine.slips.map((s) => (
                  <tr key={s.month}>
                    <th scope="row" className={`${TD} text-left font-medium`}>{month(s.month)}</th>
                    <td className={NUM}>{money(s.grossPaise)}</td>
                    <td className={NUM}>{money(s.deductionsPaise)}</td>
                    <td className={`${NUM} font-semibold`}>{money(s.netPaise)}</td>
                    <td className={TD}>
                      <a className={`${LINK} inline-flex items-center gap-1`} href={`/api/v1/account/payslips/${s.month}/pdf`} target="_blank" rel="noreferrer">
                        <FilePdfIcon className="size-4" aria-hidden="true" />
                        {t("payroll.slipPdf")}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<ListBulletsIcon weight="duotone" className="size-5" />} title={t("payroll.myStructure")} description={mine.structure ? t("payroll.myStructureBody", { name: mine.structure.name, from: mine.structure.effectiveFrom }) : undefined} />
        <CardBody>
          {!mine.structure ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("payroll.myStructureNone")} description={t("payroll.myStructureNoneBody")} />
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {mine.structure.components.map((c) => (
                  <tr key={c.code}>
                    <td className={TD}>{c.label || t(CODE_LABEL_KEY[c.code] as TranslationKey)} <span className="text-xs text-fg-muted">{t(`payroll.kind${c.kind}`)}</span></td>
                    <td className={NUM}>{c.monthlyPaise ? money(c.monthlyPaise) : t("payroll.byTheRules")}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className={TD}>{t("payroll.monthlyGross")}</td>
                  <td className={NUM}>{money(mine.structure.monthlyGrossPaise)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<HandCoinsIcon weight="duotone" className="size-5" />} title={t("payroll.myAdvances")} description={t("payroll.myAdvancesBody")} />
        <CardBody className="space-y-4">
          {mine.advances.length ? (
            <ul className="divide-y divide-border text-sm">
              {mine.advances.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{money(a.amountPaise)} · {a.reason}{a.status === "RECORDED" ? ` · ${t("payroll.outstanding", { amount: money(a.outstandingPaise) })}` : ""}</span>
                  <Badge size="sm" tone={a.status === "RECORDED" ? "ok" : a.status === "REQUESTED" ? "accent" : "neutral"}>{t(`payroll.advance${a.status}`)}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
          {waiting ? (
            <p className="text-sm text-fg-muted">{t("payroll.advanceWaitingYou")}</p>
          ) : (
            <form action={askAdvanceAction} className="grid gap-3 sm:grid-cols-3">
              <TextField label={t("payroll.fieldAmount")} name="amount" inputMode="decimal" required />
              <TextField label={t("payroll.fieldReason")} name="reason" required maxLength={300} className="sm:col-span-2" />
              <div>
                <Button type="submit">{t("payroll.askAdvance")}</Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
