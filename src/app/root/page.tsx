import Link from "next/link";
import { BuildingsIcon, PlusIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { listSchools } from "@/lib/superuser";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { relativeTime } from "@/lib/dates";

export const metadata = { title: "Schools" };

export default async function RootPage() {
  const session = await requireSuperuser();
  const schools = await listSchools(session);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Schools</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {schools.length === 0
              ? "Nothing here yet"
              : `${schools.length} school${schools.length === 1 ? "" : "s"} on this server`}
          </p>
        </div>
        <Button asChild icon={<PlusIcon weight="bold" />}>
          <Link href="/root/new">Add a school</Link>
        </Button>
      </div>

      {/* Said once, on the page it applies to, rather than only in a comment. */}
      <p className="rounded-[--radius-md] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg-muted">
        You can create schools, correct their details and invite the people who will run them. You
        cannot see inside one — no register, no marks, no messages. That is enforced by the database,
        not by this page.
      </p>

      {schools.length === 0 ? (
        <EmptyState
          icon={<BuildingsIcon weight="duotone" className="size-8" />}
          title="No schools yet"
          description="Add the first one, then invite somebody to administer it."
          action={
            <Button asChild>
              <Link href="/root/new">Add a school</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {schools.map((school) => (
            <li key={school.id}>
              <Card>
                <Link href={`/root/${school.id}`} className="block p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-fg">{school.name}</p>
                      <p className="truncate text-xs text-fg-muted">
                        {[school.city, school.country].filter(Boolean).join(", ") || "No address"} ·
                        joined {relativeTime(school.createdAt)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-fg-subtle">
                        Join code <span className="font-mono font-semibold">{school.code}</span>
                        {school.gradeLow && school.gradeHigh
                          ? ` · grades ${school.gradeLow}–${school.gradeHigh}`
                          : " · no grade range set"}
                      </p>
                    </div>

                    {school.pendingAdminInvites > 0 && (
                      <Badge tone="warn" size="sm">
                        {school.pendingAdminInvites} invite
                        {school.pendingAdminInvites === 1 ? "" : "s"} pending
                      </Badge>
                    )}
                    {!school.gradeLow || !school.gradeHigh ? (
                      <span
                        className="flex items-center gap-1 text-xs font-medium text-warn"
                        title="Without a grade range the admin cannot be offered a list of classes to create"
                      >
                        <WarningIcon weight="bold" className="size-4" />
                        Needs setup
                      </span>
                    ) : null}
                  </div>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
