import type { Metadata } from "next";
import { FirstAidKitIcon, LockKeyIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { familyIncidents } from "@/lib/incidents";
import { maySelfRead } from "@/lib/self-read";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { IncidentBadges, IncidentBodies, IncidentMeta, IncidentNotes } from "@/components/incident-record";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("familyCare.myIncidentsTitle"), robots: { index: false, follow: false } };
}

/**
 * The pupil's own incident log, read-only, from the age the school sets
 * (self-read.ts): each record as the school wrote it, with the follow-up
 * notes — what the guardian's page shows, for the pupil themselves. Below
 * the age it is the "ask a grown-up" empty state.
 */
export default async function StudentIncidentsPage() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const allowed = await maySelfRead(ctx, ctx.membershipId);
  if (!allowed) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("familyCare.myIncidentsTitle")} back={{ href: "/student", label: t("nav.today") }} />
        <EmptyState icon={<LockKeyIcon weight="duotone" className="size-8" />} title={t("familyCare.askGrownUpTitle")} description={t("familyCare.askGrownUpBody")} />
      </div>
    );
  }
  const [{ childName, incidents }, school] = await Promise.all([familyIncidents(ctx, ctx.membershipId), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("familyCare.myIncidentsTitle")} description={t("familyCare.myIncidentsBody")} back={{ href: "/student", label: t("nav.today") }} />
      {incidents.length === 0 ? (
        <EmptyState icon={<FirstAidKitIcon weight="duotone" className="size-8" />} title={t("incidents.noneForChild")} description={t("incidents.noneForChildBody", { name: childName })} />
      ) : (
        <ol className="space-y-4" data-testid="family-incidents">
          {incidents.map((incident) => (
            <li key={incident.id} id={incident.id} className="scroll-mt-24">
              <Card data-testid="family-incident">
                <CardHeader icon={<FirstAidKitIcon weight="duotone" className="size-5" />} title={incident.title} description={<IncidentBadges kind={incident.kind} severity={incident.severity} />} />
                <CardBody className="space-y-5">
                  <IncidentMeta incident={incident} timezone={school.timezone} showReporter={false} />
                  <div className="border-t border-border pt-4">
                    <IncidentBodies incident={incident} />
                  </div>
                  <div className="space-y-3 border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-fg">{t("incidents.notes")}</h3>
                    <IncidentNotes notes={incident.notes} timezone={school.timezone} />
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
