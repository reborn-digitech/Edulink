"use client";

import { useState } from "react";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/field";
import { useT } from "@/lib/i18n";

/**
 * The two CSV files. The collections register takes a day range (this month
 * by default); the outstanding list is always "as of today". Both are plain
 * links to route handlers, so the browser downloads them as files.
 */
export function ExportLinks({ fromKey, toKey }: { fromKey: string; toKey: string }) {
  const t = useT();
  const [from, setFrom] = useState(fromKey);
  const [to, setTo] = useState(toKey);
  const ready = Boolean(from && to && from <= to);
  const collectionsHref = `/admin/fees/export/collections?${new URLSearchParams({ fromKey: from, toKey: to })}`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <DateField label={t("fees.exportFrom")} value={from} onChange={(e) => setFrom(e.target.value)} />
        <DateField label={t("fees.exportTo")} value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild={ready} variant="secondary" disabled={!ready} icon={<DownloadSimpleIcon weight="bold" />}>
          {ready ? <a href={collectionsHref}>{t("fees.linkExportCollections")}</a> : <span>{t("fees.linkExportCollections")}</span>}
        </Button>
        <Button asChild={ready} variant="secondary" disabled={!ready} icon={<DownloadSimpleIcon weight="bold" />}>
          {ready ? <a href={`${collectionsHref}&format=xlsx`}>{t("fees.linkExportCollectionsXlsx")}</a> : <span>{t("fees.linkExportCollectionsXlsx")}</span>}
        </Button>
        <Button asChild variant="secondary" icon={<DownloadSimpleIcon weight="bold" />}>
          <a href="/admin/fees/export/outstanding">{t("fees.linkExportOutstanding")}</a>
        </Button>
        <Button asChild variant="secondary" icon={<DownloadSimpleIcon weight="bold" />}>
          <a href="/admin/fees/export/outstanding?format=xlsx">{t("fees.linkExportOutstandingXlsx")}</a>
        </Button>
      </div>
    </div>
  );
}
