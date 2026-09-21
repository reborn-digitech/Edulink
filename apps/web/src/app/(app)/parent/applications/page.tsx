import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  BuildingsIcon,
  ClipboardTextIcon,
} from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { familyApplications } from "@/lib/admissions";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import {
  ADMISSION_STATUS_KEY,
  ADMISSION_STATUS_TONE,
  nextStepKey,
} from "@/components/admissions/labels";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("admissions.myApplications"),
    robots: { index: false, follow: false },
  };
}

/**
 * Every application this guardian has made, at every school, with the next
 * step named on each. A guardian account with no child yet is exactly who
 * applies, so the gate is the account and its role — not a guardianship.
 */
export default async function ParentApplicationsPage() {
  const ctx = await requireUser();
  if (ctx.role !== "PARENT") redirect("/switch");
  const t = await getT();
  const { items } = await familyApplications(ctx);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/parent"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("parent.overview")}
      </Link>
      <PageHeader
        title={t("admissions.myApplications")}
        description={t("admissions.myApplicationsIntro")}
        actions={
          <Button
            asChild
            variant="secondary"
            size="sm"
            icon={<BuildingsIcon weight="bold" />}
          >
            <Link href="/explore">{t("admissions.findSchools")}</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader
          icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
          title={t("admissions.myApplications")}
        />
        <CardBody>
          {items.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-6"
              icon={<ClipboardTextIcon weight="duotone" className="size-6" />}
              title={t("admissions.noneYet")}
              description={t("admissions.noneYetBody")}
              action={
                <Button
                  asChild
                  size="sm"
                  icon={<BuildingsIcon weight="bold" />}
                >
                  <Link href="/explore">{t("admissions.findSchools")}</Link>
                </Button>
              }
            />
          ) : (
            <ul
              className="divide-y divide-border"
              data-testid="family-applications"
            >
              {items.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/parent/applications/${row.id}`}
                        className="font-semibold text-fg hover:underline"
                      >
                        {row.childName}
                      </Link>
                      <Badge tone={ADMISSION_STATUS_TONE[row.status]} size="sm">
                        {t(ADMISSION_STATUS_KEY[row.status])}
                      </Badge>
                    </p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {[
                        row.schoolName,
                        row.cycleName,
                        `${t("admissions.grade")} ${row.gradeApplied}`,
                        row.serial,
                      ].join(" · ")}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-subtle">
                      {[
                        t(
                          nextStepKey(row.status, {
                            documents: row.documentsMissing > 0,
                            booking: false,
                          }),
                        ),
                        t("admissions.appliedOn", {
                          date: formatDate(new Date(row.createdAt)),
                        }),
                      ].join(" · ")}
                    </p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/parent/applications/${row.id}`}>
                      {t("admissions.viewApplication")}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
