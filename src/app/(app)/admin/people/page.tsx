import type { Metadata } from "next";
import Link from "next/link";
import { DownloadSimpleIcon, UserPlusIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import type { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { DirectoryControls } from "./controls";
import { DirectoryMenu } from "./directory-menu";
import { relativeTime, formatDate } from "@/lib/dates";
import { readJsonArray } from "@/lib/json";
import { getT } from "@/lib/i18n/server";
import { isDeliverableEmail } from "@/lib/login-name";
import { TabBar } from "@/components/ui/tabs";
import { ROLE_META, SCHOOL_ROLES, type SchoolRole } from "@/lib/constants";
import { pendingParentInvites } from "@/lib/parent-link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.schoolDirectory") };
}

const PAGE_SIZE = 50;

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    classId?: string;
    sort?: string;
    page?: string;
    status?: string;
  }>;
}) {
  const ctx = await requireRole("ADMIN");
  const params = await searchParams;
  const t = await getT();

  const query = (params.q ?? "").trim().slice(0, 80);
  const roleFilter = SCHOOL_ROLES.includes(params.role as SchoolRole)
    ? (params.role as SchoolRole)
    : null;
  const sort = params.sort === "recent" ? "recent" : "name";
  // Anything other than the literal "SUSPENDED" means the ordinary view. Not a
  // pass-through of `params.status` into the query — this is user input, and it
  // lands in a WHERE clause.
  // THREE VIEWS, and "LEFT" is not a membership status — it is `leftAt` being
  // set. Kept out of the `status` column deliberately: a pupil who transfers
  // away was ACTIVE right up to the day they went, and rewriting that would
  // lose the difference between "we paused them" and "they moved school".
  const status =
    params.status === "SUSPENDED" ? "SUSPENDED" : params.status === "LEFT" ? "LEFT" : "ACTIVE";
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
    ...(status === "LEFT"
      ? { leftAt: { not: null } }
      : { status, leftAt: null }),
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
              { name: { contains: query, mode: "insensitive" } },
              { preferredName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  // Parents the office has invited and who have not yet accepted, per pupil —
  // shown on the row so nobody sends a second link.
  const parentInvites = await pendingParentInvites(ctx);

  const [members, total, classes, roleCounts, suspendedCount, leftCount] = await Promise.all([
    db.membership.findMany({
      where,
      include: {
        user: { select: { name: true, preferredName: true, email: true, avatarKey: true, birthdate: true } },
        enrollments: {
          where: { status: "ACTIVE" },
          include: { class: { select: { name: true } } },
        },
        classTeachers: { include: { class: { select: { name: true } } } },
        schoolRecord: { select: { id: true, destination: true } },
        staffRecord: true,
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
    db.membership.count({ where: { schoolId: ctx.schoolId, status: "SUSPENDED", leftAt: null } }),
    db.membership.count({ where: { schoolId: ctx.schoolId, leftAt: { not: null } } }),
  ]);

  /**
   * Class names sort like a person reads them, not like the database collates
   * them — "Grade 10" belongs after "Grade 3", and byte order puts it first.
   * Postgres cannot be asked for this per query, so the list is re-sorted here;
   * it is a filter dropdown of at most a few dozen rows.
   */
  const classCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  classes.sort((a, b) => classCollator.compare(a.name, b.name));

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
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("nav.people")}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {roleCounts
              .map((c) =>
                t("people.countOfRole", {
                  count: c._count,
                  // "1 admin", not "1 admins" — the role has a singular.
                  role: t(
                    c._count === 1
                      ? ROLE_META[c.role as SchoolRole].labelKey
                      : ROLE_META[c.role as SchoolRole].pluralKey,
                  ).toLowerCase(),
                }),
              )
              .join(" · ") || t("people.nobodyYet")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" icon={<UserPlusIcon weight="bold" />}>
            <Link href="/admin/intake">{t("intake.fromPeople")}</Link>
          </Button>
          <Button asChild variant="secondary" icon={<DownloadSimpleIcon weight="bold" />}>
            <a href={exportHref}>{t("people.exportCsv")}</a>
          </Button>
        </div>
      </div>

      <TabBar
        ariaLabel={t("nav.people")}
        current="directory"
        tabs={[
          { key: "directory", href: "/admin/people", label: t("people.tabDirectory") },
          { key: "invites", href: "/admin/invites", label: t("people.tabInvites") },
        ]}
      />

      <DirectoryControls
        query={query}
        role={roleFilter}
        classId={classFilter?.id ?? ""}
        sort={sort}
        status={status}
        suspendedCount={suspendedCount}
        leftCount={leftCount}
        classes={classes}
      />

      {status === "SUSPENDED" && (
        <p className="rounded-[--radius-md] border border-warn/30 bg-warn-soft px-4 py-3 text-sm leading-relaxed text-fg">
          {t("people.suspendedNote")}
        </p>
      )}

      {status === "LEFT" && (
        <p className="rounded-[--radius-md] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg">
          {t("people.leftNote")}
        </p>
      )}

      {members.length === 0 ? (
        <EmptyState
          icon={<UsersThreeIcon weight="duotone" className="size-8" />}
          title={
            query || roleFilter || classFilter
              ? t("people.noMatches")
              : t("people.nobodyHereYet")
          }
          description={
            query || roleFilter || classFilter
              ? t("people.noMatchesBody")
              : t("people.nobodyHereBody")
          }
          action={
            query || roleFilter || classFilter ? (
              <Button asChild variant="secondary">
                <Link href="/admin/people">{t("people.clearFilters")}</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/admin/invites/new">{t("people.invitePeople")}</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className="text-xs text-fg-muted" aria-live="polite">
            {t("people.showingRange", {
              from: (page - 1) * PAGE_SIZE + 1,
              to: Math.min(page * PAGE_SIZE, total),
              total,
            })}
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

              // An admin cannot pause themselves, so the control is not
              // offered — a disabled button that always refuses teaches nothing.
              const isSelf = member.id === ctx.membershipId;

              return (
                <li key={member.id}>
                  <Card>
                    <div className="flex flex-wrap items-center gap-3 p-3.5">
                      <Avatar avatarKey={member.user.avatarKey} name={member.user.name} size="md" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-fg">{displayName}</p>
                        {/* Student emails are school-issued but still PII; only
                            admins see this page, and it is never public. */}
                        <p className="truncate text-xs text-fg-muted">
                          {member.title ?? member.user.email ?? t("people.noEmail")}
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
                        {member.leftAt && (
                          <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                            {t("people.leftAgo", {
                              when: relativeTime(member.leftAt),
                            })}
                            {member.schoolRecord?.destination
                              ? ` · ${t("people.wentTo", { where: member.schoolRecord.destination })}`
                              : ""}
                            {member.schoolRecord && (
                              <>
                                {" · "}
                                <Link href={`/certificate/${member.schoolRecord.id}`} className="font-medium text-accent-strong hover:underline">
                                  {t("tc.openDocument")}
                                </Link>
                              </>
                            )}
                          </p>
                        )}
                        {role !== "STUDENT" && member.staffRecord && (member.staffRecord.designation || member.staffRecord.joinedOn) && (
                          <p className="mt-0.5 text-xs text-fg-subtle">
                            {[member.staffRecord.designation, member.staffRecord.joinedOn ? t("staff.joined", { date: formatDate(member.staffRecord.joinedOn) }) : null].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {role === "STUDENT" && !member.leftAt && (
                          <p className="mt-0.5 text-xs text-fg-subtle">
                            {member.user.birthdate
                              ? t("people.born", { date: formatDate(member.user.birthdate) })
                              : t("people.noBirthdate")}
                          </p>
                        )}
                        {role === "STUDENT" &&
                          !member.leftAt &&
                          (parentInvites.get(member.id) ?? []).map((inv) => (
                            <p key={inv.email} className="mt-1 text-xs leading-relaxed text-fg-muted">
                              {t("people.parentInvited", { email: inv.email })}
                            </p>
                          ))}
                        {member.status === "SUSPENDED" && !member.leftAt && (
                          <p className="mt-1 text-xs leading-relaxed text-warn">
                            {t("people.pausedAgo", {
                              when: member.suspendedAt
                                ? relativeTime(member.suspendedAt)
                                : "",
                            })}
                            {member.suspendedReason ? ` · ${member.suspendedReason}` : ""}
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
                        {t(ROLE_META[role].labelKey)}
                      </Badge>

                      {/* Every verb for the row lives behind one kebab. Pupils
                          get the leaving verbs; staff who leave get a
                          reference, not a leaving certificate — see
                          school-record.ts. A staff row that has left offers
                          nothing, and the menu owns that arithmetic. */}
                      {!isSelf && (role === "STUDENT" || !member.leftAt) && (
                        <DirectoryMenu
                          membershipId={member.id}
                          name={displayName}
                          isStudent={role === "STUDENT"}
                          isTeacher={role === "TEACHER"}
                          subjects={subjects}
                          birthdate={member.user.birthdate?.toISOString().slice(0, 10) ?? ""}
                          handleOnly={!isDeliverableEmail(member.user.email)}
                          staffRecord={
                            role === "STUDENT"
                              ? undefined
                              : {
                                  staffNumber: member.staffRecord?.staffNumber ?? "",
                                  designation: member.staffRecord?.designation ?? "",
                                  qualification: member.staffRecord?.qualification ?? "",
                                  joinedOnKey: member.staffRecord?.joinedOn?.toISOString().slice(0, 10) ?? "",
                                  leaveDaysPerYear: member.staffRecord?.leaveDaysPerYear?.toString() ?? "",
                                }
                          }
                          suspended={member.status === "SUSPENDED"}
                          hasLeft={member.leftAt !== null}
                        />
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          {pages > 1 && (
            <nav className="flex items-center justify-between gap-3 pt-2" aria-label={t("people.pagination")}>
              <Button
                asChild={page > 1}
                variant="secondary"
                size="sm"
                disabled={page === 1}
              >
                {page > 1 ? (
                  <Link href={buildHref(params, page - 1)}>{t("people.previous")}</Link>
                ) : (
                  <span>{t("people.previous")}</span>
                )}
              </Button>
              <span className="text-xs text-fg-muted">
                {t("people.pageOf", { page, pages })}
              </span>
              <Button
                asChild={page < pages}
                variant="secondary"
                size="sm"
                disabled={page >= pages}
              >
                {page < pages ? (
                  <Link href={buildHref(params, page + 1)}>{t("people.next")}</Link>
                ) : (
                  <span>{t("people.next")}</span>
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
