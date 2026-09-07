import type { Metadata } from "next";
import { nameCarriesSection } from "@/lib/codes";
import Link from "next/link";
import { ChalkboardTeacherIcon, PlusIcon, GraduationCapIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { ClassRowActions } from "./row-actions";
import { getT } from "@/lib/i18n/server";
import { PersonLink } from "@/components/person-link";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.classes") };
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string; q?: string; sort?: string; filter?: string }>;
}) {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const { archived, q: rawQ, sort: rawSort, filter } = await searchParams;
  const showArchived = archived === "1";
  const carry = `${rawQ ? `&q=${encodeURIComponent(rawQ)}` : ""}${rawSort && rawSort !== "name" ? `&sort=${rawSort}` : ""}`;
  const q = rawQ?.trim() ?? "";
  const sort = rawSort === "size" ? "size" : "name";
  const leaderlessOnly = filter === "leaderless";

  const allClasses = await db.class.findMany({
    where: {
      schoolId: ctx.schoolId,
      archivedAt: showArchived ? { not: null } : null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { subject: { contains: q, mode: "insensitive" } },
              { room: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      teachers: { include: { teacher: { include: { user: { select: { name: true, preferredName: true } } } } } },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { name: "asc" },
  });

  const archivedCount = await db.class.count({
    where: { schoolId: ctx.schoolId, archivedAt: { not: null } },
  });

  /**
   * Classes running with nobody in charge. Promotion creates next year's
   * classes with no teachers on purpose (guessing would re-add somebody the
   * school moved out), and a teacher leaving orphans theirs — but nothing
   * ever ASKED afterwards, so the stand-in machinery quietly made the admin
   * guardian of every affected pupil and the login screen called them
   * "Parent of 11". A functional audit walked into exactly that. The banner
   * is the ask.
   */
  const leaderless = allClasses.filter(
    (k) => !k.archivedAt && k._count.enrollments > 0 && !k.teachers.some((ct) => ct.role === "LEAD"),
  );
  // "Grade 10" sorted before "Grade 3" in byte order; a numeric collator
  // reads the number as a number, the way the office does.
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  const classes = (leaderlessOnly ? leaderless : allClasses).sort((a, b) =>
    sort === "size" ? b._count.enrollments - a._count.enrollments || collator.compare(a.name, b.name) : collator.compare(a.name, b.name),
  );

  return (
    <div className="space-y-5">

      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("classes.title")} description={showArchived
              ? t("classes.archivedCount", { count: classes.length })
              : allClasses.length === 1
                ? t("classes.activeCountOne")
                : t("classes.activeCountMany", { count: allClasses.length })} />
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" icon={<GraduationCapIcon weight="bold" />}>
            <Link href="/admin/promotion">{t("promotion.link")}</Link>
          </Button>
          <Button asChild icon={<PlusIcon weight="bold" />}>
            <Link href="/admin/classes/new">{t("classes.newClass")}</Link>
          </Button>
        </div>
      </div>

      {archivedCount > 0 && (
        <nav className="flex gap-1 rounded-[--radius-md] bg-surface-muted p-1" aria-label={t("classes.filter")}>
          <Link
            href={carry ? `/admin/classes?${carry.slice(1)}` : "/admin/classes"}
            aria-current={!showArchived ? "page" : undefined}
            className={`flex-1 rounded-[--radius-sm] px-3 py-2 text-center text-sm font-medium ${
              !showArchived ? "bg-surface text-fg shadow-sm" : "text-fg-muted"
            }`}
          >
            {t("classes.active")}
          </Link>
          <Link
            href={`/admin/classes?archived=1${carry}`}
            aria-current={showArchived ? "page" : undefined}
            className={`flex-1 rounded-[--radius-sm] px-3 py-2 text-center text-sm font-medium ${
              showArchived ? "bg-surface text-fg shadow-sm" : "text-fg-muted"
            }`}
          >
            {t("classes.archivedTab", { count: archivedCount })}
          </Link>
        </nav>
      )}

      {!showArchived && (allClasses.length > 0 || q || leaderlessOnly) && (
        <DataToolbar
          search={{ value: q, placeholder: t("classes.searchPlaceholder"), label: t("classes.searchPlaceholder") }}
          sort={{
            label: t("common.sortBy"),
            value: sort,
            defaultValue: "name",
            options: [
              { value: "name", label: t("common.byName") },
              { value: "size", label: t("classes.sortSize") },
            ],
          }}
          facets={
            leaderless.length > 0 || leaderlessOnly
              ? [
                  {
                    key: "filter",
                    label: t("classes.filter"),
                    value: leaderlessOnly ? "leaderless" : "",
                    options: [
                      { value: "", label: t("classes.active") },
                      { value: "leaderless", label: t("classes.filterLeaderless"), count: leaderless.length },
                    ],
                  },
                ]
              : []
          }
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
      )}
      {leaderlessOnly && leaderless.length > 0 && (
        <p className="flex items-start gap-2 text-sm leading-relaxed text-fg-muted">
          <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
          <span>{t("classes.leaderlessWhy")}</span>
        </p>
      )}

      {classes.length === 0 ? (
        <EmptyState
          icon={<ChalkboardTeacherIcon weight="duotone" className="size-8" />}
          title={q || leaderlessOnly ? t("common.noResultsTitle") : showArchived ? t("classes.nothingArchived") : t("classes.noClassesYet")}
          description={
            q || leaderlessOnly ? t("common.noResultsBody") : showArchived ? t("classes.nothingArchivedBody") : t("classes.noClassesBody")
          }
          action={
            !showArchived ? (
              <Button asChild>
                <Link href="/admin/classes/new">{t("classes.createClass")}</Link>
              </Button>
            ) : (
              <Button asChild variant="secondary">
                <Link href="/admin/classes">{t("classes.backToActive")}</Link>
              </Button>
            )
          }
        />
      ) : (
        <ul className="space-y-2">
          {classes.map((klass) => {
            const teacherRows = klass.teachers.map((ct) => ({
              membershipId: ct.teacherMembershipId,
              name: ct.teacher.user.preferredName ?? ct.teacher.user.name,
            }));
            return (
              <li key={klass.id}>
                <Card className="overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <span
                      aria-hidden="true"
                      className="h-11 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: klass.color ?? "var(--accent)" }}
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/classes/${klass.id}`}
                        className="truncate font-semibold text-fg hover:underline"
                      >
                        {klass.name}
                        {klass.section && !nameCarriesSection(klass.name, klass.section) ? ` · ${klass.section}` : ""}
                      </Link>
                      <p className="truncate text-xs text-fg-muted">
                        {klass._count.enrollments === 1
                          ? t("classes.studentsOne")
                          : t("classes.studentsMany", { count: klass._count.enrollments })}
                        {klass.subject ? ` · ${klass.subject}` : ""}
                        {klass.room ? ` · ${t("classes.room", { room: klass.room })}` : ""}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-fg-subtle">
                        {teacherRows.length > 0 ? (
                          teacherRows.map((row, i) => (
                            <span key={row.membershipId}>
                              {i > 0 && ", "}
                              <PersonLink membershipId={row.membershipId} name={row.name} />
                            </span>
                          ))
                        ) : (
                          <span className="text-warn">{t("classes.noTeacherAssigned")}</span>
                        )}
                      </p>
                    </div>

                    {!showArchived && (
                      <Badge tone="accent" size="sm" className="hidden font-mono sm:inline-flex">
                        {klass.joinCode}
                      </Badge>
                    )}

                    <ClassRowActions
                      classId={klass.id}
                      className={klass.name}
                      joinCode={klass.joinCode}
                      archived={showArchived}
                      enrollmentCount={klass._count.enrollments}
                    />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
