import type { Metadata } from "next";
import {
  ChartLineUpIcon,
  WarningIcon,
  CheckCircleIcon,
  BellRingingIcon,
  DownloadSimpleIcon,
  ClockCounterClockwiseIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { absenceFlags, attendanceTrend } from "@/lib/attendance-intel";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getT } from "@/lib/i18n/server";
import { alertGuardiansAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("attendanceIntel.title") };
}

/**
 * The register read for the child, not the day: an eight-week trend, the
 * children who are quietly slipping (below 75%, or absent three registers
 * running), and the statutory exports. Telling a family is one deliberate,
 * audited tap per child — never automatic, never bulk.
 */
export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ note?: string; error?: string }>;
}) {
  const ctx = await requireRole("ADMIN");
  const t = await getT();
  const { note, error } = await searchParams;

  const [trend, flags, classes] = await Promise.all([
    attendanceTrend(ctx),
    absenceFlags(ctx),
    db.class.findMany({
      where: { schoolId: ctx.schoolId!, archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  // Bars scale across the RANGE the data actually spans, not from zero —
  // school attendance lives between 75% and 100%, and zero-anchored bars
  // rendered 81% and 100% visually identical. A floor of 12px keeps the
  // lowest week a bar rather than a sliver.
  const percents = trend.map((p) => p.percent).filter((p): p is number => p !== null);
  const lowest = percents.length > 0 ? Math.min(...percents) : 0;
  const span = Math.max(1, (percents.length > 0 ? Math.max(...percents) : 0) - lowest);
  const barHeight = (percent: number | null) =>
    percent === null ? 4 : 12 + ((percent - lowest) / span) * 84;
  const thisMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {t("attendanceIntel.title")}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">{t("attendanceIntel.intro")}</p>
        </div>
        <Button asChild variant="secondary" size="sm" icon={<ClockCounterClockwiseIcon weight="bold" />}>
          <Link href="/attendance/history">{t("attendanceHistory.link")}</Link>
        </Button>
      </div>

      {error && (
        <Card>
          <CardBody className="flex items-center gap-2 text-sm text-danger">
            <WarningIcon weight="fill" className="size-4 shrink-0" />
            {error}
          </CardBody>
        </Card>
      )}
      {note && (
        <Card>
          <CardBody className="flex items-center gap-2 text-sm text-ok">
            <CheckCircleIcon weight="fill" className="size-4 shrink-0" />
            {note}
          </CardBody>
        </Card>
      )}

      {/* ---- eight weeks of the whole school ---- */}
      <Card>
        <CardHeader
          icon={<ChartLineUpIcon weight="duotone" className="size-5" />}
          title={t("attendanceIntel.trendTitle")}
          description={t("attendanceIntel.trendHint")}
        />
        <CardBody>
          <div className="flex items-end gap-2" role="img" aria-label={t("attendanceIntel.trendTitle")}>
            {trend.map((point, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold tabular-nums text-fg">
                  {point.percent === null ? "—" : `${point.percent}%`}
                </span>
                <div
                  className="w-full rounded-t-md bg-accent-soft"
                  style={{ height: `${barHeight(point.percent)}px` }}
                />
                <span className="text-[10px] text-fg-muted">{point.label}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* ---- the children slipping ---- */}
      <Card>
        <CardHeader
          icon={<BellRingingIcon weight="duotone" className="size-5" />}
          title={t("attendanceIntel.flagsTitle")}
          description={t("attendanceIntel.flagsHint")}
        />
        <CardBody className="p-0">
          {flags.length === 0 ? (
            <p className="px-5 py-6 text-sm text-fg-muted">{t("attendanceIntel.flagsEmpty")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {flags.map((flag) => (
                <li
                  key={flag.studentMembershipId}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-fg">
                      {flag.name}
                      {flag.className && (
                        <span className="ml-2 text-xs text-fg-muted">{flag.className}</span>
                      )}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {flag.chronic && (
                        <Badge tone="danger" size="sm">
                          {t("attendanceIntel.chronicChip", { percent: flag.percent })}
                        </Badge>
                      )}
                      {flag.consecutive && (
                        <Badge tone="warn" size="sm">
                          {t("attendanceIntel.runChip", { n: flag.currentRun })}
                        </Badge>
                      )}
                      <span className="text-xs text-fg-muted">
                        {t("attendanceIntel.marksCount", { n: flag.marks })}
                      </span>
                    </div>
                  </div>
                  <form action={alertGuardiansAction}>
                    <input type="hidden" name="studentMembershipId" value={flag.studentMembershipId} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="secondary"
                      disabled={flag.guardianCount === 0}
                      icon={<BellRingingIcon weight="bold" />}
                    >
                      {flag.guardianCount === 0
                        ? t("attendanceIntel.noGuardians")
                        : t("attendanceIntel.notify")}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* ---- the statutory exports ---- */}
      <Card>
        <CardHeader
          icon={<DownloadSimpleIcon weight="duotone" className="size-5" />}
          title={t("attendanceIntel.exportsTitle")}
          description={t("attendanceIntel.exportsHint")}
        />
        <CardBody className="space-y-4">
          <form action="/admin/attendance/export/register" method="get" className="flex flex-wrap items-end gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-fg">{t("bulletin.classField")}</span>
              <select
                name="classId"
                required
                className="rounded-lg border border-border bg-surface px-3 py-2 text-fg"
              >
                {classes.map((klass) => (
                  <option key={klass.id} value={klass.id}>
                    {klass.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-fg">{t("attendanceIntel.fieldMonth")}</span>
              <input
                type="month"
                name="month"
                defaultValue={thisMonth}
                required
                className="rounded-lg border border-border bg-surface px-3 py-2 text-fg"
              />
            </label>
            <Button type="submit" variant="secondary" icon={<DownloadSimpleIcon weight="bold" />}>
              {t("attendanceIntel.exportRegister")}
            </Button>
          </form>

          <form action="/admin/attendance/export/enrolment" method="get">
            <Button type="submit" variant="secondary" icon={<DownloadSimpleIcon weight="bold" />}>
              {t("attendanceIntel.exportEnrolment")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
