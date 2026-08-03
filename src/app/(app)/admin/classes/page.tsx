import type { Metadata } from "next";
import Link from "next/link";
import { ChalkboardTeacherIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { ClassRowActions } from "./row-actions";

export const metadata: Metadata = { title: "Classes" };

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
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
      _count: { select: { enrollments: true } },
    },
    orderBy: { name: "asc" },
  });

  const archivedCount = await db.class.count({
    where: { schoolId: ctx.schoolId, archivedAt: { not: null } },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Classes</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {showArchived
              ? `${classes.length} archived`
              : `${classes.length} active class${classes.length === 1 ? "" : "es"}`}
          </p>
        </div>
        <Button asChild icon={<PlusIcon weight="bold" />}>
          <Link href="/admin/classes/new">New class</Link>
        </Button>
      </div>

      {archivedCount > 0 && (
        <nav className="flex gap-1 rounded-[--radius-md] bg-surface-muted p-1" aria-label="Filter">
          <Link
            href="/admin/classes"
            aria-current={!showArchived ? "page" : undefined}
            className={`flex-1 rounded-[--radius-sm] px-3 py-2 text-center text-sm font-medium ${
              !showArchived ? "bg-surface text-fg shadow-sm" : "text-fg-muted"
            }`}
          >
            Active
          </Link>
          <Link
            href="/admin/classes?archived=1"
            aria-current={showArchived ? "page" : undefined}
            className={`flex-1 rounded-[--radius-sm] px-3 py-2 text-center text-sm font-medium ${
              showArchived ? "bg-surface text-fg shadow-sm" : "text-fg-muted"
            }`}
          >
            Archived ({archivedCount})
          </Link>
        </nav>
      )}

      {classes.length === 0 ? (
        <EmptyState
          icon={<ChalkboardTeacherIcon weight="duotone" className="size-8" />}
          title={showArchived ? "Nothing archived" : "No classes yet"}
          description={
            showArchived
              ? "Archived classes keep all their attendance and grade history, and can be restored at any time."
              : "A class is where attendance, assignments and grades live. Create your first one and you will get a join code students can use straight away."
          }
          action={
            !showArchived ? (
              <Button asChild>
                <Link href="/admin/classes/new">Create a class</Link>
              </Button>
            ) : (
              <Button asChild variant="secondary">
                <Link href="/admin/classes">Back to active</Link>
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
                        {klass.section ? ` · ${klass.section}` : ""}
                      </Link>
                      <p className="truncate text-xs text-fg-muted">
                        {klass._count.enrollments} student
                        {klass._count.enrollments === 1 ? "" : "s"}
                        {klass.subject ? ` · ${klass.subject}` : ""}
                        {klass.room ? ` · Room ${klass.room}` : ""}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-fg-subtle">
                        {teacherNames.length > 0 ? (
                          teacherNames.join(", ")
                        ) : (
                          <span className="text-warn">No teacher assigned</span>
                        )}{" "}
                        ·{" "}
                        <Link
                          href={`/admin/classes/${klass.id}`}
                          className="font-medium text-accent-strong hover:underline"
                        >
                          staffing
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
