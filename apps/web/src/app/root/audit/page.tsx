import Link from "next/link";
import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon, FunnelIcon, ScrollIcon, UserMinusIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { listServerAudit } from "@/lib/superuser";
import { actionKey } from "@/lib/safety-labels";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { formatInZone, relativeTime } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("root.serverLog") };
}

const PAGE = 50;

function parseDate(raw: string | undefined, endOfDay = false): Date | undefined {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const d = new Date(`${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * What has been done from outside any school.
 *
 * THE ROWS WERE ALWAYS WRITTEN AND NOTHING READ THEM. Operator actions are
 * audited with no schoolId so they land in no tenant's Safety Centre, which is
 * right — and left the trail with no reader anywhere in the app. This is it.
 *
 * NOT A SCHOOL'S AUDIT LOG, and it cannot become one: the Postgres policy lets a
 * superuser see rows whose schoolId IS NULL and nothing else, so a school's
 * history is as unreachable from this page as its attendance is.
 *
 * FILTERS IN THE URL, like every list on this server: an action, a search, a
 * date range, a page — so an operator can hand a colleague "every school
 * deleted last week" as a link. The one that matters most is "only accounts
 * that still exist": a month of test suites, each minting an operator and
 * deleting it again, leaves a log that is mostly "Deleted user", and that is
 * true but not useful.
 */
export default async function ServerAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; q?: string; from?: string; to?: string; live?: string; page?: string }>;
}) {
  const t = await getT();
  const session = await requireSuperuser();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const live = params.live === "1";

  const result = await listServerAudit(session, {
    action: params.action || undefined,
    q: params.q || undefined,
    from: parseDate(params.from),
    to: parseDate(params.to, true),
    liveActorsOnly: live,
    skip: (page - 1) * PAGE,
    take: PAGE,
  });

  const filtered = Boolean(params.action || params.q || params.from || params.to || live);
  const pages = Math.max(1, Math.ceil(result.total / PAGE));
  const pageHref = (n: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") next.set(k, v);
    if (n > 1) next.set("page", String(n));
    const qs = next.toString();
    return qs ? `/root/audit?${qs}` : "/root/audit";
  };

  // Families first, then every exact action seen, so the menu reads
  // "Operator actions / Oversight actions / — / superuser.school.create …".
  const families = [
    { value: "superuser.", label: t("root.auditFamilySuperuser") },
    { value: "operator.", label: t("root.auditFamilyOperator") },
  ];

  return (
    <div className="space-y-5">
      <Link href="/root" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("root.schools")}
      </Link>

      <PageHeader title={t("root.serverLog")} description={t("root.auditIntro")} />

      <Card className="p-4">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_auto_auto_auto]">
          <label className="block text-xs font-medium text-fg-muted">
            {t("root.auditFilterAction")}
            <select
              name="action"
              defaultValue={params.action ?? ""}
              className="mt-1 min-h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-fg"
            >
              <option value="">{t("root.auditAll")}</option>
              {families.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
              <option disabled>──────────</option>
              {result.actions.map((action) => {
                const key = actionKey(action);
                return (
                  <option key={action} value={action}>
                    {key ? t(key) : action}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="block text-xs font-medium text-fg-muted">
            {t("root.auditSearch")}
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              className="mt-1 min-h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-fg"
            />
          </label>
          <label className="block text-xs font-medium text-fg-muted">
            {t("root.auditFrom")}
            <input type="date" name="from" defaultValue={params.from ?? ""} className="mt-1 min-h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-fg" />
          </label>
          <label className="block text-xs font-medium text-fg-muted">
            {t("root.auditTo")}
            <input type="date" name="to" defaultValue={params.to ?? ""} className="mt-1 min-h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-fg" />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-md)] bg-accent px-4 text-sm font-semibold text-accent-fg hover:opacity-90"
            >
              <FunnelIcon weight="bold" className="size-4" />
              {t("root.auditApply")}
            </button>
            {filtered && (
              <Link href="/root/audit" className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] px-3 text-sm font-medium text-fg-muted hover:text-fg">
                {t("root.auditClear")}
              </Link>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-fg sm:col-span-2 lg:col-span-5">
            <input type="checkbox" name="live" value="1" defaultChecked={live} className="size-4 accent-[var(--accent)]" />
            {t("root.auditLiveOnly")}
          </label>
        </form>
      </Card>

      {result.rows.length === 0 ? (
        <EmptyState
          icon={<ScrollIcon weight="duotone" className="size-8" />}
          title={filtered ? t("root.auditNoMatch") : t("root.nothingRecorded")}
          description={filtered ? undefined : t("root.addingWillAppear")}
        />
      ) : (
        <>
          <p className="text-xs text-fg-muted">
            {t("root.auditShowing", {
              from: result.skip + 1,
              to: Math.min(result.skip + result.rows.length, result.total),
              total: result.total,
            })}
          </p>
          <Card className="overflow-hidden">
            <ul className="divide-y divide-border">
              {result.rows.map((row) => {
                const key = actionKey(row.action);
                const school = typeof row.meta.name === "string" ? row.meta.name : null;
                const email = typeof row.meta.email === "string" ? row.meta.email : null;
                const gone = row.actorUserId !== null && row.actorName === null;
                return (
                  <li key={row.id} className="grid gap-x-4 gap-y-1 p-4 sm:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
                        {key ? t(key) : <code className="font-mono text-xs">{row.action}</code>}
                        {row.targetType && (
                          <Badge tone="neutral" size="sm">
                            {row.targetType}
                          </Badge>
                        )}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg-muted">
                        {row.actorUserId === null ? (
                          <span className="font-medium text-fg">{t("root.systemActor")}</span>
                        ) : gone ? (
                          <span className="inline-flex items-center gap-1 text-fg-subtle" title={t("root.deletedUserHint")}>
                            <UserMinusIcon weight="bold" className="size-3.5" />
                            {t("root.deletedUser")}
                          </span>
                        ) : (
                          <span className="font-medium text-fg">{row.actorName}</span>
                        )}
                        {school && <span>· {school}</span>}
                        {email && <span>· {email}</span>}
                        {row.ip && <span className="font-mono">· {row.ip}</span>}
                      </p>
                    </div>
                    <time
                      dateTime={row.at.toISOString()}
                      title={row.at.toISOString()}
                      className="shrink-0 text-right text-xs text-fg-subtle"
                    >
                      <span className="block text-fg-muted">{relativeTime(row.at)}</span>
                      <span className="block">{formatInZone(row.at, "UTC", { dateStyle: "medium", timeStyle: "short" })} UTC</span>
                    </time>
                  </li>
                );
              })}
            </ul>
          </Card>
          {pages > 1 && (
            <nav aria-label={t("root.serverLog")} className="flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className="inline-flex min-h-11 items-center gap-1 font-medium text-accent-strong hover:underline">
                  <CaretLeftIcon weight="bold" className="size-4" />
                  {t("root.auditPrev")}
                </Link>
              ) : (
                <span />
              )}
              <span className="text-fg-muted">
                {page} / {pages}
              </span>
              {page < pages ? (
                <Link href={pageHref(page + 1)} className="inline-flex min-h-11 items-center gap-1 font-medium text-accent-strong hover:underline">
                  {t("root.auditNext")}
                  <CaretRightIcon weight="bold" className="size-4" />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
