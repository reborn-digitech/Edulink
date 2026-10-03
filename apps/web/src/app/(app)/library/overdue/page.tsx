import type { Metadata } from "next";
import { BellRingingIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { overdueLoans } from "@/lib/library";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeskFrame, deskContext } from "@/components/library/desk";
import { LoanList } from "@/components/library/parts";
import { noticesAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("library.tabOverdue"), robots: { index: false, follow: false } };
}

/** Every loan past its due day, and one button that tells each borrower (and a pupil's guardians) — once a day. */
export default async function LibraryOverduePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, locale, on, canWrite } = await deskContext();
  const { ok, error } = await searchParams;
  if (!on) return <DeskFrame t={t} on={false} current="overdue" title={t("library.tabOverdue")}>{null}</DeskFrame>;
  const overdue = await overdueLoans(ctx);
  return (
    <DeskFrame t={t} on current="overdue" title={t("library.tabOverdue")} description={t("library.overdueIntro")} ok={ok} error={error}>
      {canWrite && overdue.items.length > 0 ? (
        <Card>
          <CardHeader icon={<BellRingingIcon weight="duotone" className="size-5" />} title={t("library.noticesTitle")} description={t("library.noticesHint")} />
          <CardBody>
            <form action={noticesAction}>
              <input type="hidden" name="back" value="/library/overdue" />
              <Button type="submit">{t("library.sendNotices")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
      <LoanList loans={overdue.items} t={t} locale={locale} back="/library/overdue" title={t("library.overdueCount", { count: overdue.items.length })} desk={false} showMember />
    </DeskFrame>
  );
}
