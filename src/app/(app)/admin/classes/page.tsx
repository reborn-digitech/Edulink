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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.classes") };
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const { archived } = await searchParams;
  const showArchived = archived === "1";

  const classes = await db.class.findMany({
    where: {
      schoolId: ctx.schoolId,
      archivedAt: showArchived ? { not: null } : null,
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
  const leaderless = classes.filter(
    (k) => !k.archivedAt && k._count.enrollments > 0 && !k.teachers.some((ct) => ct.role === "LEAD"),
  );

  return (
    <div className="space-y-5">
      {leaderless.length > 0 && !showArchived && (
        <p className="flex items-start gap-2 rounded-[--radius-md] border border-warn/30 bg-warn-soft px-4 py-3 text-sm leading-relaxed text-fg">
          <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
          <span>
            {leaderless.length === 1
              ? t("classes.leaderlessOne", { name: leaderless[0]!.name })
              : t("classes.leaderlessMany", { count: leaderless.length, names: leaderless.map((k) => k.name).join(", ") })}{" "}
            {t("classes.leaderlessWhy")}
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("classes.title")}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {showArchived
              ? t("classes.archivedCount", { count: classes.length })
              : classes.length === 1
                ? t("classes.activeCountOne")
                : t("classes.activeCountMany", { count: classes.length })}
          </p>
        </div>
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
            href="/admin/classes"
            aria-current={!showArchived ? "page" : undefined}
            className={`flex-1 rounded-[--radius-sm] px-3 py-2 text-center text-sm font-medium ${
              !showArchived ? "bg-surface text-fg shadow-sm" : "text-fg-muted"
            }`}
          >
            {t("classes.active")}
          </Link>
          <Link
            href="/admin/classes?archived=1"
            aria-current={showArchived ? "page" : undefined}
            className={`flex-1 rounded-[--radius-sm] px-3 py-2 text-center text-sm font-medium ${
              showArchived ? "bg-surface text-fg shadow-sm" : "text-fg-muted"
            }`}
          >
            {t("classes.archivedTab", { count: archivedCount })}
          </Link>
        </nav>
      )}

      {classes.length === 0 ? (
        <EmptyState
          icon={<ChalkboardTeacherIcon weight="duotone" className="size-8" />}
          title={showArchived ? t("classes.nothingArchived") : t("classes.noClassesYet")}
          description={
            showArchived ? t("classes.nothingArchivedBody") : t("classes.noClassesBody")
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
            const teacherNames = klass.teachers.map(
              (t) => t.teacher.user.preferredName ?? t.teacher.user.name,
            );
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
                        {teacherNames.length > 0 ? (
                          teacherNames.join(", ")
                        ) : (
                          <span className="text-warn">{t("classes.noTeacherAssigned")}</span>
                        )}{" "}
                        ·{" "}
                        <Link
                          href={`/admin/classes/${klass.id}`}
                          className="font-medium text-accent-strong hover:underline"
                        >
                          {t("classes.staffingLink")}
                        </Link>
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
