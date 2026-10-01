import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { familyAgenda, AGENDA_DEFAULT_DAYS } from "@/lib/agenda";
import { AgendaList } from "@/components/agenda/agenda-list";
import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.agenda") };
}

/** The pupil's next fortnight: exams, work due, sessions, closures and (when the school allows) fee dates, each a link. */
export default async function StudentAgendaPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const { days: daysParam } = await searchParams;
  const days = daysParam === "30" ? 30 : AGENDA_DEFAULT_DAYS;
  const agenda = await familyAgenda(ctx, { days });

  return (
    <div className="space-y-5">
      <Link href="/student" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("nav.today")}
      </Link>
      <PageHeader title={t("agenda.title")} description={t("agenda.introPupil", { days: agenda.days })} />
      <TabBar
        ariaLabel={t("agenda.title")}
        current={days === 30 ? "30" : "14"}
        tabs={[
          { key: "14", href: "/student/agenda", label: t("agenda.days14") },
          { key: "30", href: "/student/agenda?days=30", label: t("agenda.days30") },
        ]}
      />
      <AgendaList agenda={agenda} />
    </div>
  );
}
