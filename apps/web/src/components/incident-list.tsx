import Link from "next/link";
import { FirstAidKitIcon, XIcon } from "@phosphor-icons/react/ssr";
import type { IncidentRow } from "@edulink/contracts";
import { db } from "@/lib/db";
import { listIncidents } from "@/lib/incidents";
import type { ActiveContext } from "@/lib/session";
import { formatInZone } from "@/lib/dates";
import { INCIDENT_KIND_KEY, INCIDENT_SEVERITY_KEY, INCIDENT_SEVERITY_TONE } from "@/lib/incident-labels";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";

const STATUSES = ["OPEN", "CLOSED", "ALL"] as const;
type Status = (typeof STATUSES)[number];

export type IncidentLogParams = { status?: string; student?: string; page?: string };

/**
 * The incident log as a page: Open / Closed / All as tabs (a URL each, so
 * "everything open" can be bookmarked), a pupil filter from the person
 * page, a page of rows, and the way to the next page. One component for
 * the office's whole-school log and a teacher's own-pupils log; the
 * library scopes a teacher, and the page only says which door it is.
 */
export async function IncidentLog({ ctx, basePath, params, teacher }: { ctx: ActiveContext; basePath: string; params: IncidentLogParams; teacher: boolean }) {
  const t = await getT();
  const locale = await getLocale();
  const status: Status = STATUSES.includes(params.status as Status) ? (params.status as Status) : "OPEN";
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const student = params.student && /^c[a-z0-9]{20,}$/.test(params.student) ? params.student : undefined;

  const [list, school, pupil] = await Promise.all([
    listIncidents(ctx, { status, studentMembershipId: student, page }),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId! }, select: { timezone: true } }),
    student
      ? db.membership.findFirst({ where: { id: student, schoolId: ctx.schoolId!, role: "STUDENT" }, select: { user: { select: { name: true, preferredName: true } } } })
      : null,
  ]);
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const href = (next: { status?: Status; page?: number; student?: string | null }) => {
    const p = new URLSearchParams();
    const s = next.status ?? status;
    if (s !== "OPEN") p.set("status", s);
    const who = next.student === undefined ? student : next.student;
    if (who) p.set("student", who);
    if (next.page && next.page > 1) p.set("page", String(next.page));
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const when = (iso: string) => formatInZone(new Date(iso), school.timezone, { dateStyle: "medium", timeStyle: "short" }, locale);
  const pupilName = pupil ? (pupil.user.preferredName ?? pupil.user.name) : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("incidents.viewLog")}
        description={t("incidents.intro")}
        actions={
          student ? (
            <Button asChild variant="secondary" size="sm" icon={<FirstAidKitIcon weight="bold" />}>
              <Link href={`/incidents/new?student=${student}`}>{t("incidents.record")}</Link>
            </Button>
          ) : undefined
        }
      />

      <TabBar
        ariaLabel={t("incidents.title")}
        current={status}
        tabs={[
          { key: "OPEN", href: href({ status: "OPEN", page: 0 }), label: t("incidents.open"), count: list.openCount },
          { key: "CLOSED", href: href({ status: "CLOSED", page: 0 }), label: t("incidents.closed") },
          { key: "ALL", href: href({ status: "ALL", page: 0 }), label: t("incidents.all") },
        ]}
      />

      {student && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
          <Badge tone="accent">{t("incidents.forChild", { name: pupilName ?? list.rows[0]?.studentName ?? "" })}</Badge>
          <Link href={href({ student: null, page: 0 })} className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-fg">
            <XIcon weight="bold" className="size-3.5" aria-hidden="true" />
            {t("common.clearAll")}
          </Link>
        </p>
      )}

      {list.rows.length === 0 ? (
        <EmptyState
          icon={<FirstAidKitIcon weight="duotone" className="size-8" />}
          title={t("incidents.none")}
          description={teacher ? t("incidents.noneTeacherBody") : t("incidents.noneBody")}
        />
      ) : (
        <div className="overflow-x-auto rounded-[--radius-lg] border border-border bg-surface shadow-sm" tabIndex={0}>
          <table className="w-full text-sm" data-testid="incident-log">
            <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t("incidents.occurredAt")}</th>
                <th className="px-4 py-3 font-medium">{t("incidents.pupil")}</th>
                <th className="px-4 py-3 font-medium">{t("person.class")}</th>
                <th className="px-4 py-3 font-medium">{t("incidents.kind")}</th>
                <th className="px-4 py-3 font-medium">{t("incidents.severity")}</th>
                <th className="px-4 py-3 font-medium">{t("incidents.titleField")}</th>
                <th className="px-4 py-3 font-medium">{t("incidents.family")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("incidents.notes")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.rows.map((r: IncidentRow) => (
                <tr key={r.id} className="hover:bg-surface-muted">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-fg-muted">{when(r.occurredAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/incidents/${r.id}`} className="font-medium text-fg underline underline-offset-2 hover:text-accent-strong">
                      {r.studentName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{r.className ?? "—"}</td>
                  <td className="px-4 py-3">{t(INCIDENT_KIND_KEY[r.kind])}</td>
                  <td className="px-4 py-3">
                    <Badge tone={INCIDENT_SEVERITY_TONE[r.severity]} size="sm">
                      {t(INCIDENT_SEVERITY_KEY[r.severity])}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span>{r.title}</span>
                      {r.status === "CLOSED" && (
                        <Badge tone="neutral" size="sm">
                          {t("incidents.closed")}
                        </Badge>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.guardiansNotifiedAt ? (
                      <Badge tone="ok" size="sm">
                        {t("incidents.familyTold", { when: when(r.guardiansNotifiedAt) })}
                      </Badge>
                    ) : (
                      <Badge tone="warn" size="sm">
                        {t("incidents.familyNotTold")}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.noteCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button asChild={page > 1} variant="secondary" size="sm" disabled={page === 1}>
            {page > 1 ? <Link href={href({ page: page - 1 })}>{t("people.previous")}</Link> : <span>{t("people.previous")}</span>}
          </Button>
          <span className="text-sm text-fg-muted">{t("people.pageOf", { page, pages })}</span>
          <Button asChild={page < pages} variant="secondary" size="sm" disabled={page >= pages}>
            {page < pages ? <Link href={href({ page: page + 1 })}>{t("people.next")}</Link> : <span>{t("people.next")}</span>}
          </Button>
        </div>
      )}
    </div>
  );
}
