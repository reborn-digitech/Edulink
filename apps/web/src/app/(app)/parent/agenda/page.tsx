import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { familyAgenda, AGENDA_DEFAULT_DAYS } from "@/lib/agenda";
import { AgendaList } from "@/components/agenda/agenda-list";
import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";
import { ChildSwitcher } from "../child-switcher";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.agenda") };
}

/** A child's next fortnight for their guardian — one child at a time, as the other parent pages do — each row a link. */
export default async function ParentAgendaPage({ searchParams }: { searchParams: Promise<{ child?: string; childId?: string; days?: string }> }) {
  const session = await requireParent();
  const t = await getT();
  const { child: childParam, childId: childIdParam, days: daysParam } = await searchParams;
  const days = daysParam === "30" ? 30 : AGENDA_DEFAULT_DAYS;
  const requested = childParam ?? childIdParam;
  // A child that is not this guardian's falls back to the first, as the other parent pages do.
  const agenda = await familyAgenda(session, { student: requested, days }).catch(() => familyAgenda(session, { days }));
  const selectedId = agenda.student.studentMembershipId;
  const base = `/parent/agenda?child=${selectedId}`;

  return (
    <div className="space-y-5">
      <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("parent.overview")}
      </Link>
      {agenda.children.length > 1 && <ChildSwitcher pupils={agenda.children.map((c) => ({ ...c, leftAt: c.leftAt ? new Date(c.leftAt) : null }))} selectedId={selectedId} basePath="/parent/agenda" />}
      <PageHeader title={t("agenda.title")} description={t("agenda.intro", { name: agenda.student.name, days: agenda.days })} />
      <TabBar
        ariaLabel={t("agenda.title")}
        current={days === 30 ? "30" : "14"}
        tabs={[
          { key: "14", href: base, label: t("agenda.days14") },
          { key: "30", href: `${base}&days=30`, label: t("agenda.days30") },
        ]}
      />
      <AgendaList agenda={agenda} role="PARENT" />
    </div>
  );
}
