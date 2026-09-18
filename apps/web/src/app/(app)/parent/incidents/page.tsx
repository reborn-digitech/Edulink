import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, FirstAidKitIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { familyIncidents } from "@/lib/incidents";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { IncidentBadges, IncidentBodies, IncidentMeta, IncidentNotes } from "@/components/incident-record";
import { ChildSwitcher } from "../child-switcher";
import { ChildLeftBanner } from "../child-left";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("incidents.metaTitle"), robots: { index: false, follow: false } };
}

/**
 * The family's side of the incident log: the child in the switcher, and
 * every incident the school recorded about them, newest first, as the
 * school wrote it — read-only, with the follow-up notes. The notification
 * the school sent lands at `?child=…&incident=<id>`, so each card carries
 * the incident's id as its anchor and the one named is ringed. Access is
 * the guardianship: `familyIncidents` refuses a child who is not theirs.
 */
export default async function ParentIncidentsPage({ searchParams }: { searchParams: Promise<{ child?: string; incident?: string }> }) {
  const session = await requireParent();
  const t = await getT();
  const { child: requested, incident: highlighted } = await searchParams;

  const { children } = await listContexts(session.user.id);
  const selectedId = requested && children.some((c) => c.studentMembershipId === requested) ? requested : children[0]!.studentMembershipId;
  const selected = children.find((c) => c.studentMembershipId === selectedId);

  const { childName, incidents } = await familyIncidents(session, selectedId);
  const school = await db.membership.findUniqueOrThrow({ where: { id: selectedId }, select: { school: { select: { name: true, timezone: true } } } });

  return (
    <div className="space-y-5">
      <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("parent.overview")}
      </Link>

      {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/incidents" />}
      {selected?.leftAt ? (
        <ChildLeftBanner child={{ studentMembershipId: selected.studentMembershipId, studentUserId: selected.studentUserId, name: selected.name, schoolName: selected.schoolName, leftAt: selected.leftAt }} />
      ) : null}

      <PageHeader title={t("incidents.forChild", { name: childName })} description={school.school.name} />

      <p className="max-w-prose text-sm leading-relaxed text-fg-muted">{t("incidents.parentIntro", { name: childName })}</p>

      {incidents.length === 0 ? (
        <EmptyState icon={<FirstAidKitIcon weight="duotone" className="size-8" />} title={t("incidents.noneForChild")} description={t("incidents.noneForChildBody", { name: childName })} />
      ) : (
        <ol className="space-y-4" data-testid="family-incidents">
          {incidents.map((incident) => {
            const ringed = highlighted === incident.id;
            return (
              <li key={incident.id} id={incident.id} className="scroll-mt-24">
                <Card className={ringed ? "ring-2 ring-accent" : undefined} data-testid="family-incident">
                  <CardHeader
                    icon={<FirstAidKitIcon weight="duotone" className="size-5" />}
                    title={incident.title}
                    description={<IncidentBadges kind={incident.kind} severity={incident.severity} />}
                  />
                  <CardBody className="space-y-5">
                    <IncidentMeta incident={incident} timezone={school.school.timezone} showReporter={false} />
                    <div className="border-t border-border pt-4">
                      <IncidentBodies incident={incident} />
                    </div>
                    <div className="space-y-3 border-t border-border pt-4">
                      <h3 className="text-sm font-semibold text-fg">{t("incidents.notes")}</h3>
                      <IncidentNotes notes={incident.notes} timezone={school.school.timezone} />
                    </div>
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
