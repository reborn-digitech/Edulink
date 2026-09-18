import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatCircleDotsIcon, FirstAidKitIcon } from "@phosphor-icons/react/ssr";
import { AccessError, requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { incidentFor } from "@/lib/incidents";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PersonLink } from "@/components/person-link";
import { IncidentBadges, IncidentBodies, IncidentMeta, IncidentNotes } from "@/components/incident-record";
import { getT } from "@/lib/i18n/server";
import { FollowUp } from "./follow-up";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("incidents.metaTitle"), robots: { index: false, follow: false } };
}

/**
 * One incident as the staff read it: the pupil, what happened and what was
 * done as they were written, the follow-up notes, and — while it is open —
 * the note box for any staff member who may see it and the Close button
 * for the office and the head. `incidentFor` is the door: a pupil this
 * teacher does not teach, or another school's record, is a 404.
 */
export default async function IncidentPage({ params }: { params: Promise<{ incidentId: string }> }) {
  const t = await getT();
  const ctx = await requireRole("TEACHER", "ADMIN", "PRINCIPAL");
  const { incidentId } = await params;

  let incident;
  try {
    incident = await incidentFor(ctx, incidentId);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const backHref = ctx.role === "TEACHER" ? "/teacher/incidents" : "/admin/incidents";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title={incident.title}
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <PersonLink membershipId={incident.studentMembershipId} name={incident.studentName} className="font-medium text-fg underline underline-offset-2" />
            {incident.className && <span>· {incident.className}</span>}
            <IncidentBadges kind={incident.kind} severity={incident.severity} />
          </span>
        }
        back={{ href: backHref, label: t("incidents.viewLog") }}
      />

      <Card data-testid="incident">
        <CardHeader icon={<FirstAidKitIcon weight="duotone" className="size-5" />} title={t("incidents.title")} />
        <CardBody className="space-y-5">
          <IncidentMeta incident={incident} timezone={school.timezone} />
          <div className="border-t border-border pt-4">
            <IncidentBodies incident={incident} />
          </div>
        </CardBody>
      </Card>

      <Card data-testid="incident-notes">
        <CardHeader icon={<ChatCircleDotsIcon weight="duotone" className="size-5" />} title={t("incidents.notes")} />
        <CardBody className="space-y-4">
          <IncidentNotes notes={incident.notes} timezone={school.timezone} />
          {(incident.canNote || incident.canClose) && <FollowUp incidentId={incident.id} canNote={incident.canNote} canClose={incident.canClose} />}
        </CardBody>
      </Card>
    </div>
  );
}
