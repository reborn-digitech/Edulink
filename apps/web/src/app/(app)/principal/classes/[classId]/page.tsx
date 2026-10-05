import type { Metadata } from "next";
import { nameCarriesSection } from "@/lib/codes";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ClockCounterClockwiseIcon,
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  CertificateIcon,
  WarningIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import {
  ATTENDANCE_CONCERN_PERCENT,
  parseSpan, windowFor,
  pupilInsights,
  type PupilInsight,
} from "@/lib/insights";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { formatDateKey } from "@/lib/dates";
import { WindowPicker } from "../../window-picker";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";
import { PersonLink } from "@/components/person-link";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.classInsights") };
}

/**
 * One class, pupil by pupil.
 *
 * ALPHABETICAL, ALWAYS, and there is no sort control. Ordering thirty children
 * by their attendance or their marks is a ranking of children, which this app
 * has said in several places it will not build. What a principal actually needs
 * — "who is not getting what they need?" — is answered by FLAGGING the ones
 * below the line, which is a shorter list and a more useful one.
 *
 * Their report cards hang off each row, because "how is this child doing?" is
 * answered by the document their family was sent, not by a number in a table.
 */
export default async function PrincipalClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ days?: string; filter?: string }>;
}) {
  const t = await getT();
  const ctx = await requireRole("PRINCIPAL", "ADMIN");
  const { classId } = await params;
  const { days, filter: rawFilter } = await searchParams;
  const filter = rawFilter === "concern" || rawFilter === "unmarked" ? rawFilter : null;

  const span = parseSpan(days);
  const window = await windowFor(ctx.schoolId, span);

  let data;
  try {
    data = await pupilInsights(ctx, classId, window);
  } catch (error) {
    // A class from another school is a 404, not a 500 — the same catch the
    // report-card builder needed, and for the same reason.
    if (error instanceof AccessError) notFound();
    throw error;
  }

  /**
   * A principal who is ALSO this class's LEAD teacher gets the builder here.
   *
   * A small school's head takes Class 5 on Tuesdays, and `cohort.ts` lets an
   * admin appoint them. Those cards are theirs to write, so the link belongs on
   * the class page they are already looking at. The check is the same shape as
   * the one `assertMayWriteCards` runs, and that function is still the authority
   * — this only decides whether to draw a link. An admin sees it on their own
   * class page, unconditionally, so the condition here is genuinely about being
   * the teacher rather than about the role.
   */
  const lead =
    ctx.membershipId === null
      ? null
      : await db.classTeacher.findFirst({
          where: {
            schoolId: ctx.schoolId,
            classId,
            teacherMembershipId: ctx.membershipId,
            role: "LEAD",
          },
          select: { id: true },
        });

  const concerns = data.pupils.filter(
    (p) => p.attendancePercent !== null && p.attendancePercent < ATTENDANCE_CONCERN_PERCENT,
  );
  const unmarked = data.pupils.filter((p) => !p.hasMarks);
  // The worry lines were a comma-separated paragraph of names; now each is a
  // chip that narrows the roll to those pupils.
  const shownPupils = filter === "concern" ? concerns : filter === "unmarked" ? unmarked : data.pupils;

  return (
    <div className="space-y-5">
      <Link
        href={`/principal?days=${span}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("principal.dashboard")}
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={<>{data.klass.name}
            {data.klass.section && !nameCarriesSection(data.klass.name, data.klass.section) ? ` · ${data.klass.section}` : ""}</>} description={<>{data.pupils.length === 1
              ? t("principal.pupilsOne")
              : t("principal.pupilsMany", { count: data.pupils.length })}{" "}
            ·{" "}
            {t("principal.rangeTo", {
              from: formatDateKey(window.fromDateKey, { day: "numeric", month: "short" }),
              to: formatDateKey(window.toDateKey, { day: "numeric", month: "short" }),
            })}</>} />
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/attendance/history?classId=${classId}`}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-border px-3 py-1.5 text-sm font-medium text-fg hover:bg-surface-muted"
          >
            <ClockCounterClockwiseIcon weight="bold" className="size-4" />
            {t("attendanceHistory.link")}
          </Link>
          <WindowPicker span={span} />
        </div>
      </div>

      {lead && (
        <Card>
          <Link
            href={`/teacher/classes/${classId}/report-cards`}
            className="flex items-center gap-3 p-4"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
              <CertificateIcon weight="duotone" className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-fg">
                {t("principal.writeReportCards")}
              </span>
              <span className="block text-xs text-fg-muted">
                {t("principal.writeReportCardsBody")}
              </span>
            </span>
            <ArrowSquareOutIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
          </Link>
        </Card>
      )}

      {/* ---------------- everybody ---------------- */}
      <Card id="everybody" className="scroll-mt-24">
        <CardHeader
          icon={concerns.length > 0 || unmarked.length > 0 ? <WarningIcon weight="duotone" className="size-5" /> : undefined}
          title={t("principal.everybody")}
          description={filter === "unmarked" ? t("principal.usuallyMarking") : t("principal.alphabetical")}
        />
        <CardBody className="space-y-3">
          {data.pupils.length > 0 && (concerns.length > 0 || unmarked.length > 0) && (
            <DataToolbar
              facets={[
                {
                  key: "filter",
                  label: t("principal.worthALook"),
                  value: filter ?? "",
                  options: [
                    { value: "", label: t("principal.everybody"), count: data.pupils.length },
                    ...(concerns.length > 0 ? [{ value: "concern", label: t("principal.attendanceBelow", { percent: ATTENDANCE_CONCERN_PERCENT }), count: concerns.length }] : []),
                    ...(unmarked.length > 0 ? [{ value: "unmarked", label: t("principal.noMarksRecorded"), count: unmarked.length }] : []),
                  ],
                },
              ]}
              extra={days ? { days } : {}}
              labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
            />
          )}
          {data.pupils.length === 0 ? (
            <EmptyState
              title={t("principal.nobodyOnRoll")}
              description={t("principal.nobodyOnRollBody")}
            />
          ) : (
            <ul className="space-y-1.5">
              {shownPupils.map((pupil) => (
                <PupilRow key={pupil.membershipId} pupil={pupil} t={t} />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/* `t` as a PROP, not a hook — this is a server component, so there is no
   provider above it to read from. The same shape as the leaf date components. */
function PupilRow({ pupil, t }: { pupil: PupilInsight; t: Translate }) {
  const concern =
    pupil.attendancePercent !== null && pupil.attendancePercent < ATTENDANCE_CONCERN_PERCENT;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] bg-surface-muted p-3">
      <span className="min-w-0 flex-1">
        <PersonLink membershipId={pupil.membershipId} name={pupil.name} className="block truncate text-sm font-medium text-fg" />
        <span className="block text-xs text-fg-muted">
          {pupil.attendanceMarks === 0
            ? t("principal.noMarksInWindow")
            : pupil.attendanceMarks === 1
              ? t("principal.markCountOne")
              : t("principal.markCountMany", { count: pupil.attendanceMarks })}
        </span>
      </span>

      <span className="text-right">
        <span className="block text-[0.6875rem] text-fg-muted">{t("principal.attendance")}</span>
        <span
          className={
            concern
              ? "block text-sm font-semibold tabular-nums text-warn"
              : "block text-sm font-semibold tabular-nums text-fg"
          }
        >
          {pupil.attendancePercent === null ? "—" : `${pupil.attendancePercent}%`}
        </span>
      </span>

      <span className="text-right">
        <span className="block text-[0.6875rem] text-fg-muted">{t("principal.progress")}</span>
        <span className="block text-sm font-semibold tabular-nums text-fg">
          {pupil.overallPercent === null ? "—" : `${pupil.overallPercent}%`}
        </span>
      </span>

      {pupil.latestCard ? (
        <Link
          href={`/report-cards/${pupil.latestCard.id}`}
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent-strong hover:underline"
        >
          {pupil.latestCard.title}
          {pupil.latestCard.status === "DRAFT" && (
            <Badge tone="warn" size="sm">
              {t("principal.draft")}
            </Badge>
          )}
          <ArrowSquareOutIcon className="size-3.5" />
        </Link>
      ) : (
        <span className="shrink-0 text-xs text-fg-subtle">{t("principal.noReportCard")}</span>
      )}
    </li>
  );
}
