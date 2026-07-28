import type { Metadata } from "next";
import Link from "next/link";
import { DownloadSimpleIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import type { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { DirectoryControls } from "./controls";
import { readJsonArray } from "@/lib/json";
import { ROLE_META, SCHOOL_ROLES, type SchoolRole } from "@/lib/constants";

export const metadata: Metadata = { title: "School directory" };

const PAGE_SIZE = 50;

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; classId?: string; sort?: string; page?: string }>;
}) {
  const ctx = await requireRole("ADMIN");
  const params = await searchParams;

  const query = (params.q ?? "").trim().slice(0, 80);
  const roleFilter = SCHOOL_ROLES.includes(params.role as SchoolRole)
    ? (params.role as SchoolRole)
    : null;
  const sort = params.sort === "recent" ? "recent" : "name";
  // Page is user input; clamp it rather than trusting it into a skip.
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));

  const classFilter = params.classId
    ? await db.class.findFirst({
        where: { id: params.classId, schoolId: ctx.schoolId },
        select: { id: true, name: true },
      })
    : null;

  // schoolId first and always — the filters below only ever narrow it. (§6)
  const where: Prisma.MembershipWhereInput = {
    schoolId: ctx.schoolId,
    status: "ACTIVE",
    leftAt: null,
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(classFilter
      ? {
          OR: [
            { enrollments: { some: { classId: classFilter.id, status: "ACTIVE" } } },
            { classTeachers: { some: { classId: classFilter.id } } },
          ],
        }
      : {}),
    ...(query
      ? {
          user: {
            OR: [
              { name: { contains: query } },
              { preferredName: { contains: query } },
              { email: { contains: query } },
            ],
          },
        }
      : {}),
  };

  const [members, total, classes, roleCounts] = await Promise.all([
    db.membership.findMany({
      where,
      include: {
        user: { select: { name: true, preferredName: true, email: true, avatarKey: true } },
        enrollments: {
          where: { status: "ACTIVE" },
          include: { class: { select: { name: true } } },
        },
        classTeachers: { include: { class: { select: { name: true } } } },
      },
      orderBy:
        sort === "recent" ? { joinedAt: "desc" } : [{ user: { name: "asc" } }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.membership.count({ where }),
    db.class.findMany({
      where: { schoolId: ctx.schoolId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.membership.groupBy({
      by: ["role"],
      where: { schoolId: ctx.schoolId, status: "ACTIVE", leftAt: null },
      _count: true,
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const exportHref = `/admin/people/export?${new URLSearchParams({
    ...(query ? { q: query } : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(classFilter ? { classId: classFilter.id } : {}),
  })}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Directory</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {roleCounts.map((c) => `${c._count} ${ROLE_META[c.role as SchoolRole].plural.toLowerCase()}`).join(" · ") ||
              "Nobody yet"}
          </p>
        </div>
        <Button asChild variant="secondary" icon={<DownloadSimpleIcon weight="bold" />}>
          <a href={exportHref}>Export CSV</a>
        </Button>
      </div>

      <DirectoryControls
        query={query}
        role={roleFilter}
        classId={classFilter?.id ?? ""}
        sort={sort}
        classes={classes}
      />

      {members.length === 0 ? (
        <EmptyState
          icon={<UsersThreeIcon weight="duotone" className="size-8" />}
          title={query || roleFilter || classFilter ? "Nobody matches those filters" : "Nobody here yet"}
          description={
            query || roleFilter || classFilter
              ? "Try a different spelling, or clear the filters to see everyone."
              : "Invite teachers and students, and they will appear here as they join."
          }
          action={
            query || roleFilter || classFilter ? (
              <Button asChild variant="secondary">
                <Link href="/admin/people">Clear filters</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/admin/invites/new">Invite people</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className="text-xs text-fg-muted" aria-live="polite">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>

          <ul className="space-y-2">
            {members.map((member) => {
              const displayName = member.user.preferredName ?? member.user.name;
              const role = member.role as SchoolRole;
              const classNames = [
                ...member.enrollments.map((e) => e.class.name),
                ...member.classTeachers.map((t) => t.class.name),
              ];
              const subjects = readJsonArray<string>(member.subjects);

              return (
                <li key={member.id}>
                  <Card>
                    <div className="flex items-center gap-3 p-3.5">
                      <Avatar avatarKey={member.user.avatarKey} name={member.user.name} size="md" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-fg">{displayName}</p>
                        {/* Student emails are school-issued but still PII; only
                            admins see this page, and it is never public. */}
                        <p className="truncate text-xs text-fg-muted">
                          {member.title ?? member.user.email ?? "No email"}
                        </p>
                        {classNames.length > 0 && (
                          <p className="mt-0.5 truncate text-xs text-fg-subtle">
                            {classNames.join(" · ")}
                          </p>
                        )}
                        {subjects.length > 0 && (
                          <p className="mt-0.5 truncate text-xs text-fg-subtle">
                            {subjects.join(", ")}
                          </p>
                        )}
                      </div>

                      {role === "STUDENT" && member.studentCode && (
                        <Badge tone="neutral" size="sm" className="hidden font-mono sm:inline-flex">
                          {member.studentCode}
                        </Badge>
                      )}
                      <Badge
                        tone={role === "ADMIN" ? "accent" : role === "TEACHER" ? "info" : "ok"}
                        size="sm"
                      >
                        {ROLE_META[role].label}
                      </Badge>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          {pages > 1 && (
            <nav className="flex items-center justify-between gap-3 pt-2" aria-label="Pagination">
              <Button
                asChild={page > 1}
                variant="secondary"
                size="sm"
                disabled={page === 1}
              >
                {page > 1 ? (
                  <Link href={buildHref(params, page - 1)}>Previous</Link>
                ) : (
                  <span>Previous</span>
                )}
              </Button>
              <span className="text-xs text-fg-muted">
                Page {page} of {pages}
              </span>
              <Button
                asChild={page < pages}
                variant="secondary"
                size="sm"
                disabled={page >= pages}
              >
                {page < pages ? (
                  <Link href={buildHref(params, page + 1)}>Next</Link>
                ) : (
                  <span>Next</span>
                )}
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function buildHref(params: Record<string, string | undefined>, page: number): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") next.set(key, value);
  }
  next.set("page", String(page));
  return `/admin/people?${next}`;
}
