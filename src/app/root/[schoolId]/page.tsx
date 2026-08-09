import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, BuildingsIcon, TrashIcon, UserPlusIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { getSchool, listAdminInvites } from "@/lib/superuser";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/dates";
import { SchoolForm } from "../school-form";
import { InvitePanel } from "./invite-panel";
import { RemoveSchool } from "./remove-school";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("root.schoolMeta"), robots: { index: false, follow: false } };
}

export default async function SchoolPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const t = await getT();
  const session = await requireSuperuser();
  const { schoolId } = await params;

  const school = await getSchool(session, schoolId);
  if (!school) notFound();

  const invites = await listAdminInvites(session, schoolId);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/root"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("root.allSchools")}
      </Link>

      <div>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {school.name}
          {school.removedAt && (
            <Badge tone="danger" size="sm">
              {t("root.removedBadge")}
            </Badge>
          )}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {school.removedAt ? (
            t("root.removedAgo", { when: relativeTime(school.removedAt) })
          ) : (
            <>
              {t("root.joinCode")}{" "}
              <span className="font-mono font-semibold text-fg">{school.code}</span> ·{" "}
              {school.timezone}
            </>
          )}
        </p>
      </div>

      {/* A removed school keeps its page — the operator may still need to read
          what it was — but every door that would grow it again is gone. */}
      {school.removedAt ? (
        <p className="rounded-[--radius-md] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg-muted">
          {t("root.removeExplainer")}
        </p>
      ) : (
        <>
      <Card>
        <CardHeader
          title={t("root.lookInside")}
          description={t("root.insideRecorded")}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href={`/root/${schoolId}/inside`}>{t("root.lookInsideCta")}</Link>
            </Button>
          }
        />
      </Card>

      <Card>
        <CardHeader
          icon={<UserPlusIcon weight="duotone" className="size-5" />}
          title={t("root.whoRuns")}
          description={t("root.inviteNotAccount")}
        />
        <CardBody>
          <InvitePanel schoolId={school.id} invites={invites} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<BuildingsIcon weight="duotone" className="size-5" />}
          title={t("root.details")}
          description={t("root.detailsDescription")}
        />
        <CardBody>
          <SchoolForm
            schoolId={school.id}
            initial={{
              name: school.name,
              contactEmail: school.contactEmail,
              contactPhone: school.contactPhone,
              website: school.website,
              addressLine: school.addressLine,
              city: school.city,
              region: school.region,
              postalCode: school.postalCode,
              country: school.country,
              gradeLow: school.gradeLow,
              gradeHigh: school.gradeHigh,
              timezone: school.timezone,
              brandPrimary: school.brandPrimary,
            }}
          />
        </CardBody>
      </Card>

      {/* The logo is uploaded by the school's own admin in School settings, not
          here. An operator setting a school's logo would be deciding how somebody
          else's school looks, and the upload path is already built and authorised
          on that side. */}
      <p className="text-xs leading-relaxed text-fg-muted">{t("root.logoNote")}</p>

      <Card className="border-danger/40">
        <CardHeader
          icon={<TrashIcon weight="duotone" className="size-5 text-danger" />}
          title={t("root.removeTitle")}
          description={t("root.removeExplainer")}
        />
        <CardBody>
          <RemoveSchool schoolId={school.id} schoolName={school.name} />
        </CardBody>
      </Card>
        </>
      )}
    </div>
  );
}
