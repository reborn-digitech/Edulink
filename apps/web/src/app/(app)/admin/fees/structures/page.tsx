import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, StackIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { requireRole } from "@/lib/tenancy";
import { listStructures } from "@/lib/fees";
import { db } from "@/lib/db";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";
import { SelfEnrolToggle } from "./self-enrol-toggle";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.feeStructures") };
}

/**
 * What a grade pays this year, in instalments. Draft, published and archived
 * each get a badge; archived ones sit behind a tab so the working list is the
 * short one. The principal reads; the office writes.
 */
export default async function FeeStructuresPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const t = await getT();
  const locale = await getLocale();
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const office = ctx.role === "ADMIN";
  const { show } = await searchParams;
  const includeArchived = show === "archived";
  const [all, heads] = await Promise.all([listStructures(ctx, { includeArchived: true }), db.feeHead.count({ where: { schoolId: ctx.schoolId, retiredAt: null } })]);
  const structures = includeArchived ? all.filter((s) => s.archivedAt) : all.filter((s) => !s.archivedAt);
  const archivedCount = all.filter((s) => s.archivedAt).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("fees.structuresTitle")}
        description={t("fees.structuresIntro")}
        back={{ href: "/admin/fees", label: t("fees.title") }}
        actions={
          office && heads > 0 ? (
            <Button asChild icon={<PlusIcon weight="bold" />}>
              <Link href="/admin/fees/structures/new">{t("fees.structureNew")}</Link>
            </Button>
          ) : undefined
        }
      />

      {office && heads === 0 && (
        <p className="rounded-[var(--radius-md)] border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          {t("fees.structureNoHeads")}{" "}
          <Link href="/admin/fees/heads" className="font-semibold underline underline-offset-4">
            {t("fees.linkHeads")}
          </Link>
        </p>
      )}

      {archivedCount > 0 && (
        <TabBar
          ariaLabel={t("fees.structuresTitle")}
          current={includeArchived ? "archived" : "live"}
          tabs={[
            { key: "live", href: "/admin/fees/structures", label: t("fees.linkStructures"), count: all.length - archivedCount },
            { key: "archived", href: "/admin/fees/structures?show=archived", label: t("fees.structureArchived"), count: archivedCount },
          ]}
        />
      )}

      {structures.length === 0 ? (
        <EmptyState icon={<StackIcon weight="duotone" className="size-8" />} title={t("fees.structuresEmpty")} description={office && heads > 0 ? t("fees.setUpStructuresHint") : undefined} />
      ) : (
        <TableScroll className="rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t("fees.structureName")}</th>
                <th className="px-4 py-3 font-medium">{t("fees.structureGrade")}</th>
                <th className="px-4 py-3 font-medium">{t("fees.structureYear")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("fees.structureInstalments")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("fees.structureTotal")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("fees.structurePupils")}</th>
                <th className="px-4 py-3 text-center font-medium" title={t("fees.selfEnrolHint")}>{t("fees.selfEnrolColumn")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {structures.map((s) => (
                <tr key={s.id} className="hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <Link href={`/admin/fees/structures/${s.id}`} className="flex flex-wrap items-center gap-2 font-medium text-fg hover:underline">
                      {s.name}
                      {s.archivedAt ? (
                        <Badge tone="neutral" size="sm">{t("fees.structureArchived")}</Badge>
                      ) : s.publishedAt ? (
                        <Badge tone="ok" size="sm">{t("fees.structurePublished")}</Badge>
                      ) : (
                        <Badge tone="warn" size="sm">{t("fees.structureDraft")}</Badge>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{s.gradeLevel ?? t("fees.structureAllGrades")}</td>
                  <td className="px-4 py-3 text-fg-muted">{s.yearName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.instalments}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{formatPaise(s.totalPaise, locale)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.pupils}</td>
                  <td className="px-4 py-3 text-center">
                    {s.publishedAt && !s.archivedAt ? (
                      <SelfEnrolToggle structureId={s.id} open={s.selfEnrol} canEdit={office} name={s.name} />
                    ) : (
                      <span className="text-xs text-fg-subtle">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}
    </div>
  );
}
