import type { Metadata } from "next";
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Timetable</h1>
        <p className="mt-1 text-sm text-fg-muted">
          The school day, then the week for each class. Teachers and pupils see their own.
        </p>
      </div>

      {/* ---------------- step one: the school day ---------------- */}
      <section aria-labelledby="day-heading">
        <Card>
          <CardHeader
            icon={<ClockIcon weight="duotone" className="size-5" />}
            title={<span id="day-heading">The school day</span>}
            description="When the bells go. Shared by every class — lessons are slotted into these."
          />
          <CardBody>
            <DayPanel periods={periods} />
          </CardBody>
        </Card>
      </section>

      {/* ---------------- step two: the grid ---------------- */}
      <section aria-labelledby="grid-heading" className="space-y-3">
        <h2 id="grid-heading" className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          A class's week
        </h2>

        {classes.length === 0 ? (
          <EmptyState
            icon={<CalendarBlankIcon weight="duotone" className="size-8" />}
            title="No classes yet"
            description="A timetable needs classes to put lessons in."
            action={
              <Link
                href="/admin/classes/new"
                className="text-sm font-semibold text-accent-strong underline underline-offset-4"
              >
                Create a class
              </Link>
            }
          />
        ) : (
          <>
            <nav aria-label="Choose a class" className="flex flex-wrap gap-2">
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
                  {klass.section ? ` ${klass.section}` : ""}
                </Link>
              ))}
            </nav>

            {selected && grid && (
              <Card>
                <CardHeader
                  title={selected.name}
                  description={
                    selected.room
                      ? `Usually in ${selected.room}. Click a slot to set the lesson.`
                      : "Click a slot to set the lesson."
                  }
                />
                <CardBody>
                  <GridEditor
                    classId={selected.id}
                    className={selected.name}
                    periods={grid.periods}
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
