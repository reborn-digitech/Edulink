import type { Metadata } from "next";
import { requireParent } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { isModuleOn } from "@/lib/modules";
import { AccessError } from "@/lib/access-error";
import { getLocale, getT } from "@/lib/i18n/server";
import { myExams } from "@/lib/exam-cell-after";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { CellOff } from "@/components/exam-cell/parts";
import { MyExamsView } from "@/components/exam-cell/mine";
import { ChildSwitcher } from "../child-switcher";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("examCell.parentTitle"), robots: { index: false, follow: false } };
}

/** A child's college results, for the guardian: everything for a minor; for an adult, only while they grant RESULTS. Read only. */
export default async function ParentResultsPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const session = await requireParent();
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const { child } = await searchParams;
  const { children } = await listContexts(session.user.id);
  const selected = children.find((c) => c.studentMembershipId === child) ?? children[0];
  if (!selected) return <EmptyState title={t("examCell.parentNoChild")} />;
  const switcher = children.length > 1 ? <ChildSwitcher pupils={children} selectedId={selected.studentMembershipId} basePath="/parent/results" /> : null;
  if (!(await isModuleOn(selected.schoolId, "EXAMS"))) return <CellOff t={t} college />;
  const data = await myExams(session, selected.studentMembershipId).catch((error: unknown) => {
    if (error instanceof AccessError) return error;
    throw error;
  });
  if (data instanceof AccessError)
    return (
      <div className="space-y-5">
        <PageHeader title={t("examCell.parentTitle")} />
        {switcher}
        <EmptyState title={t("examCell.parentNotGranted")} description={t(data.key, data.vars)} />
      </div>
    );
  return <MyExamsView data={data} t={t} locale={locale} back="/parent/results" switcher={switcher} title={t("examCell.parentTitle")} />;
}
