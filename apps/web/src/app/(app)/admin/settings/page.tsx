import type { Metadata } from "next";
import Link from "next/link";
import { BuildingsIcon, GlobeHemisphereEastIcon, PaletteIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { readOwnProfileSettings, listContactCandidates } from "@/lib/school-profile";
import { Badge } from "@/components/ui/badge";
import { DirectoryForm } from "../directory/form";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LogoPicker } from "./logo-picker";
import { DetailsForm } from "./details-form";
import { NotifTidyForm } from "./notif-tidy-form";
import { TeachingWeekForm } from "./teaching-week-form";
import { SelfReadAgeForm } from "./self-read-age-form";
import { parseTeachingDays } from "@/lib/dates";
import { AUTO_READ_AFTER_DAYS, EXPIRE_READ_AFTER_DAYS } from "@/lib/notification-housekeeping";
import { BroomIcon, CalendarCheckIcon, CertificateIcon, ChartBarIcon, EyeIcon, GlobeIcon, PuzzlePieceIcon } from "@phosphor-icons/react/ssr";
import { isCollegeKind } from "@/lib/institution";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { officeUsage } from "@/lib/plans";
import { UsageCard } from "@/app/root/usage-card";
// meta-posting (16 Oct 2026)
import { ShareNetworkIcon } from "@phosphor-icons/react/ssr";
// end meta-posting

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.schoolSettings") };
}

export default async function SettingsPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");

  // The directory profile used to be its own page behind a card here whose
  // whole body was a link — a route that existed to hold one form. The form
  // lives on this page now, with the other three.
  const [school, directory, freshCandidates, usage] = await Promise.all([
    db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: {
      notifAutoReadDays: true,
      notifExpireDays: true,
      name: true,
      code: true,
      logoPath: true,
      brandPrimary: true,
      contactEmail: true,
      contactPhone: true,
      website: true,
      addressLine: true,
      city: true,
      region: true,
      postalCode: true,
      country: true,
      gradeLow: true,
      gradeHigh: true,
      timezone: true,
      teachingDays: true,
      selfReadAge: true,
      kind: true,
    },
    }),
    readOwnProfileSettings(ctx),
    listContactCandidates(ctx),
    // The school's own month against its plan (A3-inventory-8): the GET /office/usage door's read, on the office's page.
    officeUsage(ctx),
  ]);
  const candidates =
    directory.admissionsContactMembershipId &&
    directory.contactName &&
    !freshCandidates.some((c) => c.membershipId === directory.admissionsContactMembershipId)
      ? [{ membershipId: directory.admissionsContactMembershipId, name: directory.contactName, role: "" }, ...freshCandidates]
      : freshCandidates;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t("settings.title")} description={<>{t("settings.codePrefix")}{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 font-semibold text-fg">
            {school.code}
          </code>{" "}
          {t("settings.codeSuffix")}</>} />

      {/* The optional modules (3 Oct 2026) have their own page: one switch each. */}
      <Card>
        <CardHeader
          icon={<PuzzlePieceIcon weight="duotone" className="size-5" />}
          title={t("modules.settingsCardTitle")}
          description={t("modules.settingsCardBody")}
        />
        <CardBody>
          <Link href="/admin/settings/modules" className="font-semibold text-accent-strong underline underline-offset-4">
            {t("modules.open")}
          </Link>
        </CardBody>
      </Card>

      {/* The global feed's kind filter (4 Oct 2026): schools', colleges' or both institutions' posts. */}
      <Card>
        <CardHeader icon={<GlobeIcon weight="duotone" className="size-5" />} title={t("feedKinds.cardTitle")} description={t("feedKinds.settingsCardBody")} />
        <CardBody>
          <Link href="/admin/settings/feed" className="font-semibold text-accent-strong underline underline-offset-4">
            {t("feedKinds.open")}
          </Link>
        </CardBody>
      </Card>

      {/* meta-posting (16 Oct 2026): the school's Facebook Page and Instagram account, for posting school-wide posts there too. */}
      <Card>
        <CardHeader icon={<ShareNetworkIcon weight="duotone" className="size-5" />} title={t("social.settingsCardTitle")} description={t("social.settingsCardBody")} />
        <CardBody>
          <Link href="/admin/settings/social" className="font-semibold text-accent-strong underline underline-offset-4">
            {t("social.settingsCardOpen")}
          </Link>
        </CardBody>
      </Card>
      {/* end meta-posting */}

      {/* A college's regulator references (4 Oct 2026); a school has none. */}
      {isCollegeKind(school.kind) && (
        <Card>
          <CardHeader icon={<CertificateIcon weight="duotone" className="size-5" />} title={t("college.profileCardTitle")} description={t("college.profileSettingsBody")} />
          <CardBody>
            <Link href="/admin/settings/college" className="font-semibold text-accent-strong underline underline-offset-4">
              {t("college.profileOpen")}
            </Link>
          </CardBody>
        </Card>
      )}

      <Card id="usage">
        <CardHeader icon={<ChartBarIcon weight="duotone" className="size-5" />} title={t("settings.usageTitle")} description={t("settings.usageBody")} />
        <CardBody>
          <UsageCard usage={usage} office />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<BuildingsIcon weight="duotone" className="size-5" />}
          title={t("settings.details")}
          description={t("settings.detailsBody")}
        />
        <CardBody>
          <DetailsForm school={school} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<PaletteIcon weight="duotone" className="size-5" />}
          title={t("settings.logo")}
          description={t("settings.logoBody")}
        />
        <CardBody>
          <LogoPicker schoolName={school.name} logoPath={school.logoPath} />
        </CardBody>
      </Card>

      <Card id="teaching-week">
        <CardHeader
          icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
          title={t("substitutions.weekTitle")}
          description={t("substitutions.weekIntro")}
        />
        <CardBody>
          <TeachingWeekForm initialDays={parseTeachingDays(school.teachingDays)} />
        </CardBody>
      </Card>

      <Card id="self-read-age">
        <CardHeader
          icon={<EyeIcon weight="duotone" className="size-5" />}
          title={t("familyCare.selfReadTitle")}
          description={t("familyCare.selfReadBody")}
        />
        <CardBody>
          <SelfReadAgeForm initialAge={school.selfReadAge} />
        </CardBody>
      </Card>

      <Card id="directory">
        <CardHeader
          icon={<GlobeHemisphereEastIcon weight="duotone" className="size-5" />}
          title={t("explore.directoryTitle")}
          description={t("explore.directoryBody")}
          action={
            <span className="flex items-center gap-2">
              <Badge tone={directory.published ? "ok" : "neutral"} size="sm">
                {directory.published ? t("explore.publishedBadge") : t("explore.unpublishedBadge")}
              </Badge>
              {directory.published && (
                <Link href={`/explore/${ctx.schoolId}`} className="text-sm font-medium text-accent hover:underline">
                  {t("explore.title")} →
                </Link>
              )}
            </span>
          }
        />
        <CardBody>
          <DirectoryForm
            initialAbout={directory.about}
            initialContactId={directory.admissionsContactMembershipId}
            contactStillValid={directory.contactStillValid}
            published={directory.published}
            candidates={candidates}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<BroomIcon weight="duotone" className="size-5" />}
          title={t("notif.tidyTitle")}
        />
        <CardBody>
          <NotifTidyForm
            initialAutoRead={school.notifAutoReadDays}
            initialExpire={school.notifExpireDays}
            defaults={{ read: AUTO_READ_AFTER_DAYS, expire: EXPIRE_READ_AFTER_DAYS }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
