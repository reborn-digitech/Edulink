import type { Metadata } from "next";
import { ClipboardTextIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { stockTake } from "@/lib/library";
import { formatInZone } from "@/lib/dates";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeskFrame, deskContext } from "@/components/library/desk";
import { COPY_STATUS_KEY } from "@/components/library/parts";
import { stockSeenAction, stockTakeFormAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("library.tabStockTake"), robots: { index: false, follow: false } };
}

/** The stock-take: start it, scan each book on the shelves as seen, read what has not been seen, finish it. */
export default async function LibraryStockTakePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, locale, on, canWrite, timeZone } = await deskContext();
  const { ok, error } = await searchParams;
  if (!on) return <DeskFrame t={t} on={false} current="stocktake" title={t("library.tabStockTake")}>{null}</DeskFrame>;
  const st = await stockTake(ctx);
  const back = "/library/stocktake";
  return (
    <DeskFrame t={t} on current="stocktake" title={t("library.tabStockTake")} description={t("library.stockIntro")} ok={ok} error={error}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label={t("library.stockTotal")} value={st.total} />
        <StatTile label={t("library.stockSeenCount")} value={st.seen} tone="ok" />
        <StatTile label={t("library.stockUnseen")} value={st.startedAt ? st.total - st.seen : "—"} tone={st.startedAt && st.total > st.seen ? "warn" : "neutral"} />
      </div>
      <Card>
        <CardHeader icon={<ClipboardTextIcon weight="duotone" className="size-5" />} title={st.startedAt ? t("library.stockRunning", { since: formatInZone(new Date(st.startedAt), timeZone, { dateStyle: "medium", timeStyle: "short" }, locale) }) : t("library.stockNotRunning")} />
        <CardBody className="space-y-4">
          {canWrite && st.startedAt ? (
            <form action={stockSeenAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="back" value={back} />
              <label className="min-w-0 flex-1 basis-56 text-sm font-medium text-fg">
                {t("library.accession")}
                <input name="accession" required autoFocus autoComplete="off" maxLength={30} className="mt-1.5 block min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3.5 text-[0.9375rem] text-fg" />
              </label>
              <Button type="submit">{t("library.markSeen")}</Button>
            </form>
          ) : null}
          {canWrite ? (
            <form action={stockTakeFormAction}>
              <input type="hidden" name="back" value={back} />
              <input type="hidden" name="action" value={st.startedAt ? "FINISH" : "START"} />
              <Button type="submit" variant={st.startedAt ? "secondary" : "primary"}>
                {st.startedAt ? t("library.finishStock") : t("library.startStock")}
              </Button>
            </form>
          ) : null}
          {st.startedAt && st.unseen.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-fg">{t("library.notSeenYet")}</h3>
              <ul className="mt-2 divide-y divide-border rounded-[var(--radius-md)] border border-border">
                {st.unseen.map((c) => (
                  <li key={c.accession} className="px-4 py-2 text-sm">
                    <span className="font-medium text-fg">{c.accession}</span> <span className="text-fg-muted">· {c.title}{c.rack ? ` · ${t("library.rackShort", { rack: c.rack })}` : ""} · {t(COPY_STATUS_KEY[c.status])}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </DeskFrame>
  );
}
