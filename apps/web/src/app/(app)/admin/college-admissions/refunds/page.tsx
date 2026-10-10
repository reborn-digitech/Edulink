import type { Metadata } from "next";
import Link from "next/link";
import { isCollegeKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { refundExceptions } from "@/lib/head-approvals";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { Flash, Hidden, NotCollege, day, money } from "@/components/college-office/parts";
import { decideRefundExceptionAction } from "./actions";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeDesks.refundsTitle") };
}

const STATUS_KEY: Record<string, TranslationKey> = { ASKED: "collegeDesks.statusASKED", APPROVED: "collegeDesks.statusAPPROVED", REFUSED: "collegeDesks.statusREFUSED" };

/**
 * REFUNDS OUTSIDE THE SLAB (5 Oct 2026, head-approvals.ts): what the office
 * asked on cancelled seats beyond what the slab gives, with its reason, those
 * waiting first; the principal approves or refuses here. The office asks
 * from the cancelled seat's own page.
 */
export default async function RefundExceptionsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
  const [t, locale, kind] = await Promise.all([getT(), getLocale(), institutionKindOf(ctx.schoolId)]);
  const sp = await searchParams;
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  if (!(await isModuleOn(ctx.schoolId, "ADMISSIONS"))) return <ModuleOff page module="ADMISSIONS" t={t} college />;
  const list = await refundExceptions(ctx);
  const back = "/admin/college-admissions/refunds";
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeDesks.refundsTitle")} description={t("collegeDesks.refundsIntro")} />
      <Flash ok={sp.ok} error={sp.error} />
      <Card>
        <CardBody className="p-0">
          {list.items.length === 0 ? (
            <EmptyState
              title={t("collegeDesks.refundsNone")}
              description={t("collegeDesks.refundsNoneBody")}
              action={
                // The applications page sends the accounts desk straight back here (its way in is this page), so the button would loop.
                ctx.role === "ACCOUNTS" ? undefined : (
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/admin/college-admissions">{t("collegeDesks.refundsOpen")}</Link>
                  </Button>
                )
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {list.items.map((r) => (
                <li key={r.applicationId} className="space-y-2 px-5 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link className="font-medium text-accent-strong underline" href={`/admin/college-admissions/${r.applicationId}`}>
                      {r.applicantName}
                    </Link>
                    <Badge tone={r.status === "APPROVED" ? "ok" : r.status === "REFUSED" ? "danger" : "warn"}>{t(STATUS_KEY[r.status]!)}</Badge>
                  </div>
                  <p className="text-fg-muted">{t("collegeDesks.refundRow", { amount: money(r.askedPaise, locale), slab: money(r.slabPaise, locale), name: r.askedByName, date: day(r.askedAt.slice(0, 10), locale) })}</p>
                  <p className="text-fg">{r.reason}</p>
                  {r.note ? <p className="text-fg-muted">{r.note}</p> : null}
                  {list.canDecide && r.status === "ASKED" ? (
                    <ActionForm action={decideRefundExceptionAction} className="flex flex-wrap items-end gap-2">
                      <Hidden fields={{ back, applicationId: r.applicationId }} />
                      <TextField name="note" maxLength={600} label={t("collegeDesks.decisionNote")} />
                      <Button type="submit" size="sm" name="decision" value="APPROVE">{t("collegeDesks.approve")}</Button>
                      <Button type="submit" size="sm" variant="secondary" name="decision" value="REFUSE">{t("collegeDesks.refuse")}</Button>
                    </ActionForm>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
