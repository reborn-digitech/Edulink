import type { Metadata } from "next";
import Link from "next/link";
import { MegaphoneIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { officeCirculars } from "@/lib/circulars";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  // One name for the page in the tab and on it (QA-62).
  return { title: t("circulars.title"), robots: { index: false, follow: false } };
}

const AUDIENCE_KEY: Record<string, TranslationKey> = {
  ALL: "circulars.audienceAll",
  PARENTS: "circulars.audienceParents",
  TEACHERS: "circulars.audienceTeachers",
  STUDENTS: "circulars.audienceStudents",
};

/**
 * The office's list of circulars: every notice that asked for a "seen and
 * understood", newest first, with how far it got. The row opens the notice,
 * where the reach report and the chase live.
 */
export default async function AdminCircularsPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  const [{ rows }, school] = await Promise.all([
    officeCirculars(ctx),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } }),
  ]);
  const when = (iso: string) => formatInZone(new Date(iso), school.timezone, { dateStyle: "medium", timeStyle: "short" }, locale);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("circulars.title")}
        description={t("circulars.intro")}
        actions={
          <Button asChild icon={<PlusIcon weight="bold" />}>
            <Link href="/bulletin/new">{t("circulars.writeOne")}</Link>
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<MegaphoneIcon weight="duotone" className="size-8" />}
          title={t("circulars.none")}
          description={t("circulars.noneBody")}
          action={
            <Link href="/bulletin" className="font-medium text-accent-strong underline underline-offset-2 hover:text-fg">
              {t("circulars.writeOne")}
            </Link>
          }
        />
      ) : (
        <TableScroll className="rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm">
          <table className="w-full text-sm" data-testid="circulars-list">
            <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{t("bulletin.published")}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t("circulars.printTitle")}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t("circulars.columnClass")}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t("circulars.told")}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t("circulars.seen")}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t("circulars.acked")}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t("circulars.remind")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const pct = r.total > 0 ? Math.round((r.acked / r.total) * 100) : 0;
                return (
                  <tr key={r.postId} className="hover:bg-surface-muted">
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-fg-muted">{when(r.publishedAt)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/bulletin/${r.postId}`} className="font-medium text-fg underline underline-offset-2 hover:text-accent-strong">
                        {r.title}
                      </Link>
                      <span className="mt-0.5 block text-xs text-fg-muted">
                        {t(AUDIENCE_KEY[r.audience] ?? "circulars.audienceAll")}
                        {!r.deliveredAt && <> · {t("circulars.notDelivered")}</>}
                      </span>
                      {/* Nobody to tell is said, not left as "0 / 0" (QA-62). */}
                      {r.total === 0 && <span className="mt-0.5 block text-xs text-fg-muted">{t("qaInterface.reachNoFamilies")}</span>}
                    </td>
                    <td className="px-4 py-3 text-fg-muted">{r.className ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">{`${r.told} / ${r.total}`}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">{`${r.seen} / ${r.total}`}</td>
                    <td className="px-4 py-3">
                      <span className="block whitespace-nowrap tabular-nums">{t("circulars.ackedOf", { acked: r.acked, total: r.total })}</span>
                      <span
                        className="mt-1 block h-1.5 w-32 max-w-full overflow-hidden rounded-full bg-surface-sunken"
                        role="progressbar"
                        aria-valuenow={r.acked}
                        aria-valuemin={0}
                        aria-valuemax={r.total}
                        aria-label={t("circulars.acked")}
                      >
                        <span className="block h-full rounded-full bg-ok" style={{ width: `${pct}%` }} />
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-fg-muted">{r.remindedAt ? when(r.remindedAt) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      )}
    </div>
  );
}
