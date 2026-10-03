import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { listFines } from "@/lib/library";
import { DeskFrame, deskContext } from "@/components/library/desk";
import { FineList, money } from "@/components/library/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("library.tabFines"), robots: { index: false, follow: false } };
}

/**
 * Fines: what is still due, or every one. A pupil's fine on the fee ledger is
 * paid there with the fees; a counter due is settled at the office's counter
 * and recorded here by the office. Waiving needs a reason and is audited.
 */
export default async function LibraryFinesPage({ searchParams }: { searchParams: Promise<{ all?: string; ok?: string; error?: string }> }) {
  const { ctx, t, locale, on, canWrite } = await deskContext();
  const { all, ok, error } = await searchParams;
  if (!on) return <DeskFrame t={t} on={false} current="fines" title={t("library.tabFines")}>{null}</DeskFrame>;
  const fines = await listFines(ctx, all ? "ALL" : "DUE");
  const back = all ? "/library/fines?all=1" : "/library/fines";
  return (
    <DeskFrame t={t} on current="fines" title={t("library.tabFines")} description={t("library.finesIntro", { amount: money(fines.duePaise, locale) })} ok={ok} error={error}>
      <p className="text-sm">
        <Link href={all ? "/library/fines" : "/library/fines?all=1"} className="font-medium text-accent-strong hover:underline">
          {all ? t("library.showDue") : t("library.showAll")}
        </Link>
      </p>
      <FineList fines={fines.items} t={t} locale={locale} back={back} desk={canWrite} canSettle={ctx.role === "ADMIN"} showMember title={all ? t("library.allFines") : t("library.dueFines")} />
    </DeskFrame>
  );
}
