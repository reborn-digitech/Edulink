import type { Metadata } from "next";
import { BuildingsIcon, PaletteIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LogoPicker } from "./logo-picker";
import { DetailsForm } from "./details-form";

export const metadata: Metadata = { title: "School settings" };

export default async function SettingsPage() {
  const ctx = await requireRole("ADMIN");

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: {
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
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">School settings</h1>
        <p className="mt-1 text-sm text-fg-muted">
          School code{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 font-semibold text-fg">
            {school.code}
          </code>{" "}
          — this cannot be changed.
        </p>
      </div>

      <Card>
        <CardHeader
          icon={<PaletteIcon weight="duotone" className="size-5" />}
          title="Logo"
          description="Families recognise your school before they read the name"
        />
        <CardBody>
          <LogoPicker schoolName={school.name} logoPath={school.logoPath} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<BuildingsIcon weight="duotone" className="size-5" />}
          title="Details"
          description="Used on invitations and in the directory"
        />
        <CardBody>
          <DetailsForm school={school} />
        </CardBody>
      </Card>
    </div>
  );
}
