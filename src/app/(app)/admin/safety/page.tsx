import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { getSession } from "@/lib/session";
import { listReports, listAudit, openReportCount } from "@/lib/safety";
import { EmptyState } from "@/components/ui/states";
import { ReportCard } from "./report-card";
import { AuditTable } from "./audit-table";

export const metadata: Metadata = { title: "Safety centre" };

const TABS = [
  { id: "open", label: "To deal with" },
  { id: "closed", label: "Resolved" },
  { id: "audit", label: "Audit log" },
] as const;

export default async function SafetyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireRole("ADMIN");
  const session = (await getSession())!;
  const { tab } = await searchParams;
  const active = TABS.find((t) => t.id === tab)?.id ?? "open";

  const [openCount, groups, closed, auditRows] = await Promise.all([
    openReportCount(session),
    active === "open" ? listReports(session, "OPEN") : Promise.resolve([]),
    active === "closed"
      ? Promise.all([listReports(session, "ACTIONED"), listReports(session, "DISMISSED")]).then(
          ([actioned, dismissed]) =>
            [...actioned, ...dismissed].sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime()),
        )
      : Promise.resolve([]),
    active === "audit" ? listAudit(session, { take: 200 }) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Safety centre</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {openCount === 0
            ? "Nothing needs your attention"
            : `${openCount} ${openCount === 1 ? "thing" : "things"} to deal with`}
        </p>
      </div>

      <nav className="flex gap-1 rounded-[--radius-md] bg-surface-muted p-1" aria-label="Section">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/safety?tab=${t.id}`}
            aria-current={active === t.id ? "page" : undefined}
            className={`flex-1 rounded-[--radius-sm] px-3 py-2 text-center text-sm font-medium ${
              active === t.id ? "bg-surface text-fg shadow-sm" : "text-fg-muted"
            }`}
          >
            {t.label}
            {t.id === "open" && openCount > 0 ? ` (${openCount})` : ""}
          </Link>
        ))}
      </nav>

      {active === "open" &&
        (groups.length === 0 ? (
          <EmptyState
            icon={<ShieldCheckIcon weight="duotone" className="size-8" />}
            title="Nothing reported"
            description="When someone reports a post, a comment or a person, it arrives here — with the most serious reasons first."
          />
        ) : (
          <>
            <p className="text-xs leading-relaxed text-fg-muted">
              Grouped by what was reported, so three people reporting the same thing is one
              decision. Anything flagged as unkind or unsafe sorts to the top.
            </p>
            <ul className="space-y-3">
              {groups.map((group) => (
                <li key={`${group.targetType}:${group.targetId}`}>
                  <ReportCard group={group} />
                </li>
              ))}
            </ul>
          </>
        ))}

      {active === "closed" &&
        (closed.length === 0 ? (
          <EmptyState title="Nothing resolved yet" description="Reports you have dealt with appear here." />
        ) : (
          <ul className="space-y-3">
            {closed.map((group) => (
              <li key={`${group.targetType}:${group.targetId}:${group.status}`}>
                <ReportCard group={group} readOnly />
              </li>
            ))}
          </ul>
        ))}

      {active === "audit" &&
        (auditRows.length === 0 ? (
          <EmptyState title="Nothing logged yet" description="Actions taken in your school appear here." />
        ) : (
          <>
            <p className="text-xs leading-relaxed text-fg-muted">
              Append-only, and scoped to your school. This is how you answer &ldquo;who changed
              this?&rdquo; after the fact, so nothing in EduLink can edit or delete it.
            </p>
            <AuditTable rows={auditRows} />
          </>
        ))}
    </div>
  );
}
