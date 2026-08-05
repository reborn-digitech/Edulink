import Link from "next/link";
import { ArrowLeftIcon, ScrollIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { listServerAudit } from "@/lib/superuser";
import { describeAction } from "@/lib/safety-labels";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { relativeTime } from "@/lib/dates";
import { getLocale } from "@/lib/i18n/server";

export const metadata = { title: "Server log" };

/**
 * What has been done from outside any school.
 *
 * THE ROWS WERE ALWAYS WRITTEN AND NOTHING READ THEM. Operator actions are
 * audited with no schoolId so they land in no tenant's Safety Centre, which is
 * right — and left the trail with no reader anywhere in the app. This is it.
 *
 * NOT A SCHOOL'S AUDIT LOG, and it cannot become one: the Postgres policy lets a
 * superuser see rows whose schoolId IS NULL and nothing else, so a school's
 * history is as unreachable from this page as its register is. Server-side
 * rendered with no filter box, unlike the Safety Centre's — this log grows by a
 * handful of rows a month, not a hundred a day.
 */
export default async function ServerAuditPage() {
  const locale = await getLocale();
  const session = await requireSuperuser();
  const rows = await listServerAudit(session, { take: 300 });

  return (
    <div className="space-y-5">
      <Link
        href="/root"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        Schools
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Server log</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Everything done from outside a school — schools added, details corrected, administrators
          invited. A school&rsquo;s own history stays inside that school.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<ScrollIcon weight="duotone" className="size-8" />}
          title="Nothing recorded yet"
          description="Adding a school or inviting an administrator will appear here."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {rows.map((row) => {
              const school = typeof row.meta.name === "string" ? row.meta.name : null;
              const email = typeof row.meta.email === "string" ? row.meta.email : null;
              return (
                <li key={row.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-4">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-fg">
                      {describeAction(row.action)}
                    </span>
                    <span className="block text-xs text-fg-muted">
                      {row.actorName}
                      {school ? ` · ${school}` : ""}
                      {email ? ` · ${email}` : ""}
                      {row.ip ? ` · ${row.ip}` : ""}
                    </span>
                  </span>
                  <time
                    dateTime={row.at.toISOString()}
                    title={row.at.toISOString()}
                    className="shrink-0 text-xs text-fg-subtle"
                  >
                    {relativeTime(row.at, undefined, locale)}
                  </time>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
