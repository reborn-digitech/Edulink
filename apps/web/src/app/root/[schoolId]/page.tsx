import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, BuildingsIcon, ChartBarIcon, EraserIcon, LifebuoyIcon, ShieldCheckIcon, TagIcon, TrashIcon, UserPlusIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { getSchool, listAdminInvites, listSchoolAdmins } from "@/lib/superuser";
import { listPlans, schoolUsage } from "@/lib/plans";
import { PlanPanel } from "./plan-panel";
import { SupportPanel } from "./support-panel";
import { UsageCard } from "../usage-card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SchoolForm } from "../school-form";
import { InvitePanel } from "./invite-panel";
import { RemoveSchool } from "./remove-school";
import { RestoreSchool } from "./restore-school";
import { VerifySchool } from "./verify-school";
import { DeleteSchool } from "./delete-school";
import { getT, getRelativeTime } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("root.schoolMeta"), robots: { index: false, follow: false } };
}

export default async function SchoolPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const t = await getT();
  const relativeTime = await getRelativeTime();
  const session = await requireSuperuser();
  const { schoolId } = await params;

  const school = await getSchool(session, schoolId);
  if (!school) notFound();

  const invites = await listAdminInvites(session, schoolId);
  const [admins, plans, usage] = school.removedAt ? [[], [], null] : await Promise.all([listSchoolAdmins(session, schoolId), listPlans(session), schoolUsage(schoolId)]);

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
          {!school.removedAt && !school.verifiedAt && (
            <Badge tone="warn" size="sm">
              {t("root.stateUnverified")}
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
        <div className="space-y-4">
          <p className="rounded-[--radius-md] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg-muted">
            {t("root.removeExplainer")}
          </p>
          <p className="text-sm leading-relaxed text-fg-muted">{t("root.restoreExplainer")}</p>
          <RestoreSchool schoolId={school.id} />
        </div>
      ) : (
        <>
      {/* First on the page while the school waits: it is the one thing here
          that somebody else is waiting on. */}
      <Card className={school.verifiedAt ? undefined : "border-warn/50"}>
        <CardHeader
          icon={<ShieldCheckIcon weight="duotone" className="size-5" />}
          title={t("root.verifyTitle")}
          description={
            school.verifiedAt
              ? `${t("root.verifiedAgo", { when: relativeTime(school.verifiedAt) })} · ${t("root.verifiedExplainer")}`
              : t("root.verifyExplainer")
          }
        />
        <CardBody>
          <VerifySchool schoolId={school.id} verified={Boolean(school.verifiedAt)} />
        </CardBody>
      </Card>

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

      {/* Help for a locked-out office, without becoming it: the three doors
          are aimed at people the school already made its admins, and each
          lands in the school's own Safety Centre. */}
      <Card>
        <CardHeader icon={<LifebuoyIcon weight="duotone" className="size-5" />} title={t("root.support")} description={t("root.supportIntro")} />
        <CardBody>
          <SupportPanel
            schoolId={school.id}
            admins={admins.map((a) => ({ ...a, lastSeenAt: a.lastSeenAt?.toISOString() ?? null }))}
            pending={invites.filter((i) => i.status === "PENDING").map((i) => ({ id: i.id, email: i.email, role: i.role }))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<TagIcon weight="duotone" className="size-5" />}
          title={t("root.planTitle")}
          description={school.planSince ? `${t("root.planSinceAgo", { when: relativeTime(school.planSince) })} · ${t("root.planExplainer")}` : t("root.planExplainer")}
        />
        <CardBody>
          <PlanPanel schoolId={school.id} planId={school.planId} plans={plans.map((p) => ({ id: p.id, code: p.code, name: p.name }))} />
        </CardBody>
      </Card>

      {usage && (
        <Card>
          <CardHeader icon={<ChartBarIcon weight="duotone" className="size-5" />} title={t("root.usage")} description={usage.computedAt ? t("root.usageComputedAgo", { when: relativeTime(usage.computedAt) }) : t("root.usageNotSampled")} />
          <CardBody>
            <UsageCard usage={usage} />
          </CardBody>
        </Card>
      )}

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

      {/* The shredder — a separate card so the two irreversibilities are not
          one button apart. Removal keeps every account and certificate and
          can be undone; this keeps nothing and cannot. */}
      <Card className="border-danger/60">
        <CardHeader
          icon={<EraserIcon weight="duotone" className="size-5 text-danger" />}
          title={t("root.deleteTitle")}
          description={t("root.deleteExplainer")}
        />
        <CardBody>
          <DeleteSchool schoolId={school.id} schoolName={school.name} />
        </CardBody>
      </Card>
        </>
      )}
    </div>
  );
}
