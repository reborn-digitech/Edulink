import type { Metadata } from "next";
import Link from "next/link";
import { BuildingsIcon, GlobeHemisphereEastIcon, PaletteIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LogoPicker } from "./logo-picker";
import { DetailsForm } from "./details-form";
import { NotifTidyForm } from "./notif-tidy-form";
import { AUTO_READ_AFTER_DAYS, EXPIRE_READ_AFTER_DAYS } from "@/lib/notification-housekeeping";
import { BroomIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.schoolSettings") };
}

export default async function SettingsPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");

  const school = await db.school.findUniqueOrThrow({
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
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {t("settings.codePrefix")}{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 font-semibold text-fg">
            {school.code}
          </code>{" "}
          {t("settings.codeSuffix")}
        </p>
      </div>

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
          icon={<GlobeHemisphereEastIcon weight="duotone" className="size-5" />}
          title={t("explore.directoryTitle")}
          description={t("explore.directoryBody")}
        />
        <CardBody>
          <Link
            href="/admin/directory"
            className="text-sm font-medium text-accent hover:underline"
          >
            {t("checklist.directoryCta")} →
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
