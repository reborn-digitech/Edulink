import type { Metadata } from "next";
import Link from "next/link";
import { UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { requireRole } from "@/lib/tenancy";
import { duesList } from "@/lib/fees-reports";
import { formatDateKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";
import { pupilHref } from "../labels";
import { RemindButton } from "./remind-button";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.feeDues") };
}

const STATUSES = ["all", "open", "overdue", "paid"] as const;
type Status = (typeof STATUSES)[number];
const PAGE_SIZE = 50;

/**
 * Every pupil with what is due, paid and overdue. The status is a tab (a
 * URL, so "everyone overdue" can be bookmarked), the class and the search
 * are the toolbar's. Opening a pupil is where the money is taken.
 */
export default async function DuesPage({ searchParams }: { searchParams: Promise<{ status?: string; classId?: string; q?: string; page?: string }> }) {
  const t = await getT();
  const locale = await getLocale();
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const office = ctx.role === "ADMIN";
  const params = await searchParams;
  const status: Status = STATUSES.includes(params.status as Status) ? (params.status as Status) : "all";
  const q = (params.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Math.min(1000, Number.parseInt(params.page ?? "1", 10) || 1));
  const classId = params.classId || undefined;
  const list = await duesList(ctx, { status, classId, q: q || undefined, page, pageSize: PAGE_SIZE });
  const money = (paise: number) => formatPaise(paise, locale);
  const pages = Math.max(1, Math.ceil(list.total / PAGE_SIZE));
  const extra: Record<string, string> = status !== "all" ? { status } : {};
  const href = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ status: status !== "all" ? status : undefined, classId, q: q || undefined, ...next })) if (v) p.set(k, v);
    const qs = p.toString();
    return qs ? `/admin/fees/dues?${qs}` : "/admin/fees/dues";
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t("fees.duesTitle")} description={t("fees.duesIntro")} back={{ href: "/admin/fees", label: t("fees.title") }} actions={office ? <RemindButton disabled={!list.year} /> : undefined} />

      <TabBar
        ariaLabel={t("fees.duesTitle")}
        current={status}
        tabs={[
          { key: "all", href: href({ status: undefined, page: undefined }), label: t("fees.duesFilterAll") },
          { key: "open", href: href({ status: "open", page: undefined }), label: t("fees.duesFilterOpen") },
          { key: "overdue", href: href({ status: "overdue", page: undefined }), label: t("fees.duesFilterOverdue") },
          { key: "paid", href: href({ status: "paid", page: undefined }), label: t("fees.duesFilterPaid") },
        ]}
      />

      <DataToolbar
        search={{ value: q, placeholder: t("fees.duesSearch"), label: t("fees.duesSearch") }}
        facets={[{ key: "classId", label: t("fees.duesClass"), value: classId ?? "", as: "select", options: [{ value: "", label: t("fees.duesAllClasses") }, ...list.classes.map((c) => ({ value: c.id, label: c.name }))] }]}
        extra={extra}
        labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
      />

      {list.rows.length === 0 ? (
        <EmptyState icon={<UsersThreeIcon weight="duotone" className="size-8" />} title={list.year ? t("fees.duesEmpty") : t("fees.noYear")} />
      ) : (
        <TableScroll className="rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t("fees.duesColPupil")}</th>
                <th className="px-4 py-3 font-medium">{t("fees.duesColClass")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("fees.duesColDue")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("fees.duesColPaid")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("fees.duesColOutstanding")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("fees.duesColOverdue")}</th>
                <th className="px-4 py-3 font-medium">{t("fees.duesColNext")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {list.rows.map((r) => (
                <tr key={r.studentMembershipId} className="hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <Link href={pupilHref(r.studentMembershipId)} className="font-medium text-fg hover:underline">
                      {r.name}
                    </Link>
                    {r.studentCode && <span className="ml-2 text-xs text-fg-muted">{r.studentCode}</span>}
                    {r.left && (
                      <Badge tone="danger" size="sm" className="ml-2">
                        {t("fees.duesLeft")}
                      </Badge>
                    )}
                    {!r.hasPlan && !r.left && (
                      <Badge tone="warn" size="sm" className="ml-2">
                        {t("fees.pupilNoPlan")}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{r.className ?? r.gradeLevel ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{money(r.netPaise)}</td>
                  <td className="px-4 py-3 text-right text-ok">{money(r.paidPaise)}</td>
                  <td className="px-4 py-3 text-right font-medium">{money(r.outstandingPaise)}</td>
                  <td className={`px-4 py-3 text-right ${r.overduePaise > 0 ? "font-medium text-danger" : "text-fg-muted"}`}>{money(r.overduePaise)}</td>
                  <td className="px-4 py-3 text-fg-muted">{r.nextDueKey ? formatDateKey(r.nextDueKey, { day: "numeric", month: "short" }, locale) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button asChild={page > 1} variant="secondary" size="sm" disabled={page === 1}>
            {page > 1 ? <Link href={href({ page: String(page - 1) })}>{t("people.previous")}</Link> : <span>{t("people.previous")}</span>}
          </Button>
          <span className="text-sm text-fg-muted">{t("people.pageOf", { page, pages })}</span>
          <Button asChild={page < pages} variant="secondary" size="sm" disabled={page >= pages}>
            {page < pages ? <Link href={href({ page: String(page + 1) })}>{t("people.next")}</Link> : <span>{t("people.next")}</span>}
          </Button>
        </div>
      )}
    </div>
  );
}
