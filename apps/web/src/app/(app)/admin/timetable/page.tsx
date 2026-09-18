import type { Metadata } from "next";
import { nameCarriesSection } from "@/lib/codes";
import Link from "next/link";
import { CalendarBlankIcon, ClockIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import {
  listPeriods,
  timetableClasses,
  classWeek,
  schoolBusyMap,
  teachingLoad,
} from "@/lib/timetable";
import { db } from "@/lib/db";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { DayPanel } from "./day-panel";
import { GridEditor, type StaffOption } from "./grid-editor";
import { getT } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.timetable") };
}

/**
 * Building the week.
 *
 * TWO STEPS ON ONE PAGE, in the order they happen: the school's day at the top,
 * then a class's grid underneath. Splitting them across two screens would mean
 * setting the bells up and then having to be told where the grid lives — the
 * same argument the calendar page makes for keeping the year and the holidays
 * together.
 *
 * The class is in the URL rather than in component state so that a half-built
 * timetable survives a refresh, and so an admin can keep two classes open in two
 * tabs while they work out who teaches what.
 */
export default async function AdminTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const params = await searchParams;

  const [periods, classes] = await Promise.all([
    listPeriods(ctx.schoolId, { includeArchived: true }),
    timetableClasses(ctx),
  ]);

  // The named class if it is real and in this school, otherwise the first —
  // never a 404, because a class archived since the link was made should land
  // somewhere usable rather than on a dead end. (§7)
  const selected =
    classes.find((klass) => klass.id === params.class) ?? classes[0] ?? null;

  const [grid, staff, busy, load] = selected
    ? await Promise.all([
        classWeek(ctx, selected.id),
        db.membership.findMany({
          where: {
            schoolId: ctx.schoolId,
            role: { in: ["TEACHER", "PRINCIPAL"] },
            status: "ACTIVE",
            leftAt: null,
          },
          select: { id: true, user: { select: { name: true, preferredName: true } } },
          take: 500,
        }),
        schoolBusyMap(ctx, selected.id),
        teachingLoad(ctx),
      ])
    : [null, [], {}, new Map<string, number>()];

  const staffOptions: StaffOption[] = staff
    .map((row) => ({
      membershipId: row.id,
      name: row.user.preferredName ?? row.user.name,
      load: load.get(row.id) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <PageHeader title={t("timetable.title")} description={t("timetable.subtitle")} />

      {/* ---------------- step one: the school day ---------------- */}
      <section aria-labelledby="day-heading">
        <Card>
          <CardHeader
            icon={<ClockIcon weight="duotone" className="size-5" />}
            title={<span id="day-heading">{t("timetable.schoolDay")}</span>}
            description={t("timetable.schoolDayBody")}
          />
          <CardBody>
            <DayPanel periods={periods} />
          </CardBody>
        </Card>
      </section>

      {/* ---------------- step two: the grid ---------------- */}
      <section aria-labelledby="grid-heading" className="space-y-3">
        <h2 id="grid-heading" className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          {t("timetable.classWeek")}
        </h2>

        {classes.length === 0 ? (
          <EmptyState
            icon={<CalendarBlankIcon weight="duotone" className="size-8" />}
            title={t("timetable.noClasses")}
            description={t("timetable.noClassesBody")}
            action={
              <Link
                href="/admin/classes/new"
                className="text-sm font-semibold text-accent-strong underline underline-offset-4"
              >
                {t("timetable.createClass")}
              </Link>
            }
          />
        ) : (
          <>
            {/* Twelve pills read at a glance; thirty do not. Past that the
                picker is a select, which the keyboard and a thumb both like. */}
            {classes.length > 12 ? (
              <form method="get" className="flex flex-wrap items-center gap-2">
                <label className="text-sm font-medium text-fg" htmlFor="class-picker">
                  {t("timetable.chooseClass")}
                </label>
                <select
                  id="class-picker"
                  name="class"
                  defaultValue={selected?.id ?? ""}
                  className="min-h-11 min-w-[14rem] rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg"
                >
                  {classes.map((klass) => (
                    <option key={klass.id} value={klass.id}>
                      {klass.name}
                      {klass.section && !nameCarriesSection(klass.name, klass.section) ? ` ${klass.section}` : ""}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" variant="secondary">
                  {t("timetable.openClass")}
                </Button>
              </form>
            ) : (
            <nav aria-label={t("timetable.chooseClass")} className="flex flex-wrap gap-2">
              {classes.map((klass) => (
                <Link
                  key={klass.id}
                  href={`/admin/timetable?class=${klass.id}`}
                  aria-current={selected?.id === klass.id ? "page" : undefined}
                  className={
                    selected?.id === klass.id
                      ? "rounded-[--radius-md] bg-accent px-3 py-2 text-sm font-semibold text-accent-fg"
                      : "rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm font-medium text-fg-muted hover:border-border-strong hover:text-fg"
                  }
                >
                  {klass.name}
                  {klass.section && !nameCarriesSection(klass.name, klass.section) ? ` ${klass.section}` : ""}
                </Link>
              ))}
            </nav>
            )}

            {selected && grid && (
              <Card>
                <CardHeader
                  title={selected.name}
                  description={
                    selected.room
                      ? t("timetable.usuallyIn", { room: selected.room })
                      : t("timetable.clickASlot")
                  }
                />
                <CardBody>
                  <GridEditor
                    classId={selected.id}
                    className={selected.name}
                    periods={grid.periods}
                    days={grid.days.map((day) => day.weekday)}
                    slots={grid.slots}
                    staff={staffOptions}
                    busy={busy}
                  />
                </CardBody>
              </Card>
            )}
          </>
        )}
      </section>
    </div>
  );
}
