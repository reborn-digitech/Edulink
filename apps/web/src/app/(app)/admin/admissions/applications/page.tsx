import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardTextIcon,
  FunnelIcon,
  UserPlusIcon,
} from "@phosphor-icons/react/ssr";
import { officeApplicationsQuerySchema } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { cyclesView, officeApplications } from "@/lib/admissions";
import { formatDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import {
  ADMISSION_STATUSES,
  ADMISSION_STATUS_KEY,
  ADMISSION_STATUS_TONE,
} from "@/components/admissions/labels";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("admissions.pipelineTitle") };
}

/**
 * The pipeline: every application to the school, newest first, narrowed by
 * cycle, stage or grade through the URL so a filtered list can be shared
 * and comes back on refresh. Each row says what still stands in its way —
 * documents to attach, a sitting not yet booked — before the office opens it.
 */
export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ cycleId?: string; status?: string; grade?: string }>;
}) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const raw = await searchParams;
  const parsed = officeApplicationsQuerySchema.safeParse({
    ...(raw.cycleId ? { cycleId: raw.cycleId } : {}),
    ...(raw.status ? { status: raw.status } : {}),
    ...(raw.grade ? { grade: raw.grade } : {}),
  });
  const query = parsed.success ? parsed.data : {};
  const [view, { items }] = await Promise.all([
    cyclesView(ctx),
    officeApplications(ctx, query),
  ]);
  const select =
    "min-h-11 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admissions.pipelineTitle")}
        description={t("admissions.pipelineIntro")}
        back={{ href: "/admin/admissions", label: t("admissions.title") }}
        actions={
          <Button asChild size="sm" icon={<UserPlusIcon weight="bold" />}>
            <Link href="/admin/admissions/applications/new">
              {t("admissions.walkIn")}
            </Link>
          </Button>
        }
      />

      <Card>
        <CardBody className="space-y-4 pt-5">
          {/* A plain GET so the list it narrows is the server's own and the URL carries the filter. */}
          <form
            method="get"
            action="/admin/admissions/applications"
            className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.7fr)_auto] sm:items-end"
            aria-label={t("common.activeFilters")}
          >
            <label className="block">
              <span className="block text-sm font-medium text-fg">
                {t("admissions.cycleLabel")}
              </span>
              <select
                name="cycleId"
                defaultValue={query.cycleId ?? ""}
                className={`mt-1.5 ${select}`}
              >
                <option value="">{t("admissions.allCycles")}</option>
                {view.cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-fg">
                {t("admissions.stage")}
              </span>
              <select
                name="status"
                defaultValue={query.status ?? ""}
                className={`mt-1.5 ${select}`}
              >
                <option value="">{t("admissions.allStatuses")}</option>
                {ADMISSION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(ADMISSION_STATUS_KEY[s])}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-fg">
                {t("admissions.grade")}
              </span>
              <input
                type="text"
                name="grade"
                defaultValue={query.grade ?? ""}
                maxLength={20}
                autoComplete="off"
                placeholder={t("admissions.allGrades")}
                className={`mt-1.5 ${select}`}
              />
            </label>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              icon={<FunnelIcon weight="bold" />}
              className="sm:mb-0.5"
            >
              {t("admissions.filter")}
            </Button>
          </form>

          {items.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-6"
              icon={<ClipboardTextIcon weight="duotone" className="size-6" />}
              title={t("admissions.noApplications")}
              description={t("admissions.noApplicationsBody")}
            />
          ) : (
            <ul className="divide-y divide-border" data-testid="applications">
              {items.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/admissions/applications/${row.id}`}
                        className="font-semibold text-fg hover:underline"
                      >
                        {row.childName}
                      </Link>
                      <span className="text-xs text-fg-muted">{`${t("admissions.grade")} ${row.gradeApplied}`}</span>
                      <Badge tone={ADMISSION_STATUS_TONE[row.status]} size="sm">
                        {t(ADMISSION_STATUS_KEY[row.status])}
                      </Badge>
                    </p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {[row.serial, row.applicantName, row.cycleName].join(
                        " · ",
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-subtle">
                      {[
                        row.documentsMissing > 0
                          ? t("admissions.documentsMissingCount", {
                              count: row.documentsMissing,
                            })
                          : null,
                        row.testBooked ? t("admissions.testBookedYes") : null,
                        t("admissions.appliedOn", {
                          date: formatDate(new Date(row.createdAt)),
                        }),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/admin/admissions/applications/${row.id}`}>
                      {t("admissions.open")}
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
