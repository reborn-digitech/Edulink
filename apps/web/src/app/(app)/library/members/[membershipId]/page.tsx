import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WarningOctagonIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { memberView } from "@/lib/library";
import { AccessError } from "@/lib/tenancy";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeskFrame, deskContext } from "@/components/library/desk";
import { FineList, LoanList, ReservationList, money } from "@/components/library/parts";
import { raiseFineAction } from "../../actions";
import { fieldClass } from "@/components/ui/field-class";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.libraryName"), robots: { index: false, follow: false } };
}

/** One member at the desk: what they hold (renew), what they owe (waive, settle), their queue, and a fine for a damaged or lost book. */
export default async function LibraryMemberPage({ params, searchParams }: { params: Promise<{ membershipId: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, locale, on, canWrite } = await deskContext();
  const { membershipId } = await params;
  const { ok, error } = await searchParams;
  const backLink = { href: "/library", label: t("library.tabDesk") };
  if (!on) return <DeskFrame t={t} on={false} current={null} title={t("modules.libraryName")} back={backLink}>{null}</DeskFrame>;
  const view = await memberView(ctx, membershipId).catch((e) => {
    if (e instanceof AccessError) notFound();
    throw e;
  });
  const m = view.member;
  const back = `/library/members/${membershipId}`;
  const open = view.loans.filter((l) => !l.returnedAt);
  return (
    <DeskFrame t={t} on current={null} title={m.name} description={[m.className, m.cardNumber ? t("library.card", { card: m.cardNumber }) : null, t("library.holding", { count: m.onLoan, limit: m.limit }), m.owedPaise ? t("library.owes", { amount: money(m.owedPaise, locale) }) : null].filter(Boolean).join(" · ")} ok={ok} error={error} back={backLink}>
      <LoanList loans={open} t={t} locale={locale} back={back} title={t("library.onLoanTitle")} desk={canWrite} showMember={false} />
      <FineList fines={view.fines} t={t} locale={locale} back={back} desk={canWrite} canSettle={ctx.role === "ADMIN"} showMember={false} title={t("library.finesTitle")} />
      <ReservationList items={view.reservations} t={t} back={back} title={t("library.reservationsTitle")} desk={false} canCancel={canWrite} />
      {canWrite && open.length > 0 ? (
        <Card>
          <CardHeader icon={<WarningOctagonIcon weight="duotone" className="size-5" />} title={t("library.raiseFine")} description={t("library.raiseFineHint")} />
          <CardBody>
            <ActionForm action={raiseFineAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="back" value={back} />
              <label className="min-w-0 flex-1 basis-48 text-sm font-medium text-fg">
                {t("library.whichBook")}
                <select name="issueId" required className={fieldClass("mt-1.5 block")}>
                  {open.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} · {l.accession}
                    </option>
                  ))}
                </select>
              </label>
              <label className="min-w-0 basis-36 text-sm font-medium text-fg">
                {t("library.fineReason")}
                <select name="reason" required className={fieldClass("mt-1.5 block")}>
                  <option value="DAMAGE">{t("library.reasonDAMAGE")}</option>
                  <option value="LOST">{t("library.reasonLOST")}</option>
                </select>
              </label>
              <label className="min-w-0 basis-32 text-sm font-medium text-fg">
                {t("library.amountRupees")}
                <input name="amount" required inputMode="decimal" maxLength={10} className={fieldClass("mt-1.5 block")} />
              </label>
              <Button type="submit" variant="danger">
                {t("library.raiseFineButton")}
              </Button>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
    </DeskFrame>
  );
}
