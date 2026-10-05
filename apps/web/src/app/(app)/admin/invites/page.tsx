import type { Metadata } from "next";
import Link from "next/link";
import { EnvelopeSimpleIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { InviteRowActions } from "./row-actions";
import { isPast, relativeTime } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { TabBar } from "@/components/ui/tabs";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { ROLE_META, SCHOOL_ROLES, type Role, type SchoolRole } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.invitations") };
}

const TABS = [
  { id: "PENDING", labelKey: "invites.pending" },
  { id: "ACCEPTED", labelKey: "invites.accepted" },
  { id: "REVOKED", labelKey: "invites.withdrawn" },
] as const satisfies readonly { id: string; labelKey: TranslationKey }[];

export default async function InvitesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; role?: string; expired?: string }>;
}) {
  const ctx = await requireRole("ADMIN");
  const { status, q: rawQ, role: rawRole, expired } = await searchParams;
  const t = await getT();
  const active = TABS.find((t) => t.id === status)?.id ?? "PENDING";
  const q = rawQ?.trim() ?? "";
  const roleFilter = SCHOOL_ROLES.includes(rawRole as SchoolRole) ? (rawRole as SchoolRole) : null;
  const expiredOnly = active === "PENDING" && expired === "1";

  const [invites, counts] = await Promise.all([
    db.invite.findMany({
      where: {
        schoolId: ctx.schoolId,
        // The "expired" view lists the lapsed ones whether the nightly job has
        // marked them yet or not; the waiting tab and its count never do.
        ...(expiredOnly ? { OR: [{ status: "PENDING", expiresAt: { lt: new Date() } }, { status: "EXPIRED" }] } : { status: active, ...(active === "PENDING" ? { expiresAt: { gte: new Date() } } : {}) }),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.invite.groupBy({
      by: ["status"],
      where: { schoolId: ctx.schoolId, OR: [{ status: { not: "PENDING" } }, { expiresAt: { gte: new Date() } }] },
      _count: true,
    }),
  ]);

  const countFor = (id: string) => counts.find((c) => c.status === id)?._count ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t("nav.people")} description={t("invites.waitingCount", { count: countFor("PENDING") })} />
        <Button asChild icon={<PlusIcon weight="bold" />}>
          <Link href="/admin/invites/new">{t("invites.invitePeople")}</Link>
        </Button>
      </div>

      <TabBar
        ariaLabel={t("nav.people")}
        current="invites"
        tabs={[
          { key: "directory", href: "/admin/people", label: t("people.tabDirectory") },
          { key: "invites", href: "/admin/invites", label: t("people.tabInvites") },
        ]}
      />

      <nav
        className="flex gap-1 rounded-[var(--radius-md)] bg-surface-muted p-1"
        aria-label={t("invites.filter")}
      >
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`/admin/invites?status=${tab.id}${q ? `&q=${encodeURIComponent(q)}` : ""}${roleFilter ? `&role=${roleFilter}` : ""}`}
            aria-current={active === tab.id ? "page" : undefined}
            className={`flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-center text-sm font-medium ${
              active === tab.id ? "bg-surface text-fg shadow-sm" : "text-fg-muted"
            }`}
          >
            {t("invites.tabCount", { label: t(tab.labelKey), count: countFor(tab.id) })}
          </Link>
        ))}
      </nav>

      <DataToolbar
        search={{ value: q, placeholder: t("invites.searchPlaceholder"), label: t("invites.searchPlaceholder") }}
        facets={[
          {
            key: "role",
            label: t("invites.roleFilter"),
            value: roleFilter ?? "",
            options: [{ value: "", label: t("people.everyone") }, ...SCHOOL_ROLES.map((r) => ({ value: r, label: t(ROLE_META[r].pluralKey) }))],
          },
          ...(active === "PENDING"
            ? [{ key: "expired", label: t("invites.expiredFilter"), value: expiredOnly ? "1" : "", options: [{ value: "", label: t("vacancies.filterAll") }, { value: "1", label: t("invites.expiredOnly") }] }]
            : []),
        ]}
        extra={active === "PENDING" ? {} : { status: active }}
        labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
      />

      {invites.length === 0 && (q || roleFilter || expiredOnly) ? (
        <EmptyState title={t("common.noResultsTitle")} description={t("common.noResultsBody")} />
      ) : invites.length === 0 ? (
        <EmptyState
          icon={<EnvelopeSimpleIcon weight="duotone" className="size-8" />}
          title={
            active === "PENDING"
              ? t("invites.nonePending")
              : active === "ACCEPTED"
                ? t("invites.noneAccepted")
                : t("invites.noneWithdrawn")
          }
          description={
            active === "PENDING" ? t("invites.nonePendingBody") : t("invites.noneOtherBody")
          }
          action={
            active === "PENDING" ? (
              <Button asChild>
                <Link href="/admin/invites/new">{t("invites.invitePeople")}</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-2">
          {invites.map((invite) => {
            const expired = isPast(invite.expiresAt);
            return (
              <li key={invite.id}>
                <Card>
                  <div className="flex items-center gap-3 p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
                      <EnvelopeSimpleIcon weight="duotone" className="size-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-fg">
                        {invite.name || invite.email}
                      </p>
                      <p className="truncate text-xs text-fg-muted">
                        {invite.name ? `${invite.email} · ` : ""}
                        {t(ROLE_META[invite.role as Role].labelKey)}
                      </p>
                      <p className="mt-0.5 text-xs text-fg-subtle">
                        {invite.status === "ACCEPTED" && invite.acceptedAt
                          ? t("invites.joinedAgo", {
                              when: relativeTime(invite.acceptedAt),
                            })
                          : expired
                            ? t("invites.expired")
                            : t("invites.expiresIn", {
                                when: relativeTime(invite.expiresAt),
                              })}
                      </p>
                    </div>

                    {invite.status === "PENDING" && (
                      <Badge tone={expired ? "warn" : "neutral"} size="sm">
                        {expired ? t("invites.expired") : t("invites.pending")}
                      </Badge>
                    )}
                    {invite.status === "ACCEPTED" && (
                      <Badge tone="ok" size="sm">
                        {t("invites.joined")}
                      </Badge>
                    )}

                    {invite.status === "PENDING" && (
                      <InviteRowActions
                        inviteId={invite.id}
                        label={invite.name || invite.email || t("invites.thisInvitation")}
                        canResend={Boolean(invite.email)}
                      />
                    )}
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
