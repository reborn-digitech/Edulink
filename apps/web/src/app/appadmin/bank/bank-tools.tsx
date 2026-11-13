"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { CopySimpleIcon, DownloadSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { readSpreadsheet, SPREADSHEET_ACCEPT } from "@/lib/spreadsheet-client";
import { BANK_COLUMNS } from "@/lib/bank-csv";
import { useT } from "@/lib/i18n";
import { commitBankImportAction, previewBankImportAction, type ImportOutcome } from "../content-actions";

/**
 * The bank's sheet tools on /appadmin/bank: the export (the subject filter in
 * force goes with it), the duplicates report, and the import — a file or a
 * paste, previewed before a row is written, with every row that would not go
 * through named by line and reason.
 */
export function BankTools({ subject }: { subject: string | null }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const [pending, startTransition] = useTransition();
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  const exportHref = (format: "csv" | "xlsx") => `/api/v1/appadmin/bank/export${query}${query ? "&" : "?"}format=${format}`;

  async function pick(file: File | null) {
    if (!file) return;
    const text = await readSpreadsheet(file);
    if (text === null) {
      toast({ tone: "danger", title: t("bankImport.fileUnreadable") });
      return;
    }
    setCsv(text);
    setFileName(file.name);
    setOutcome(null);
  }

  function run(commit: boolean) {
    startTransition(async () => {
      const result = commit ? await commitBankImportAction(csv) : await previewBankImportAction(csv);
      setOutcome(result);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("root.didNotWork") });
        return;
      }
      if (commit) {
        toast({ tone: "ok", title: t("bankImport.written", { count: result.preview?.written ?? 0 }) });
        router.refresh();
      }
    });
  }

  const preview = outcome?.ok ? outcome.preview : undefined;
  const willWrite = preview ? preview.create + preview.update : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader title={t("bankImport.exportTitle")} description={subject ? t("bankImport.exportSubjectHint", { subject }) : t("bankImport.exportHint")} />
        <CardBody className="flex flex-wrap gap-2 pt-0">
          <Button asChild variant="secondary" size="sm" icon={<DownloadSimpleIcon weight="bold" />}>
            <a href={exportHref("csv")}>{t("filings.downloadCsv")}</a>
          </Button>
          <Button asChild variant="secondary" size="sm" icon={<DownloadSimpleIcon weight="bold" />}>
            <a href={exportHref("xlsx")}>{t("filings.downloadXlsx")}</a>
          </Button>
          <Button asChild variant="ghost" size="sm" icon={<CopySimpleIcon weight="bold" />}>
            <Link href="/appadmin/bank/duplicates">{t("bankImport.duplicatesLink")}</Link>
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("bankImport.importTitle")} description={t("bankImport.importHint", { columns: BANK_COLUMNS.join(", ") })} />
        <CardBody className="space-y-3 pt-0">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-fg">{t("bankImport.fileLabel")}</span>
            <input
              type="file"
              accept={SPREADSHEET_ACCEPT}
              className="block w-full text-sm text-fg-muted file:mr-3 file:rounded-[var(--radius-sm)] file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-fg"
              onChange={(e) => void pick(e.target.files?.[0] ?? null)}
            />
            {fileName && <span className="mt-1 block text-xs text-fg-muted">{fileName}</span>}
          </label>
          <TextAreaField
            label={t("bankImport.pasteLabel")}
            hint={t("bankImport.pasteHint")}
            value={csv}
            rows={5}
            onChange={(e) => {
              setCsv(e.target.value);
              setFileName(null);
              setOutcome(null);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={!csv.trim()} loading={pending && !preview} onClick={() => run(false)}>
              {t("bankImport.preview")}
            </Button>
            <Button size="sm" icon={<UploadSimpleIcon weight="bold" />} disabled={!preview || willWrite === 0} loading={pending && Boolean(preview)} onClick={() => run(true)}>
              {t("bankImport.commit", { count: willWrite })}
            </Button>
          </div>

          {preview && (
            <div className="space-y-2 rounded-[var(--radius-sm)] border border-border bg-surface-muted/60 p-3 text-sm" aria-live="polite">
              <p className="font-medium text-fg">
                {outcome?.preview && outcome.preview.written > 0
                  ? t("bankImport.resultWritten", { written: outcome.preview.written })
                  : t("bankImport.resultPreview", { parsed: preview.parsed, create: preview.create, update: preview.update, translations: preview.translations })}
              </p>
              {preview.unknownTopics.length > 0 && (
                <p className="text-fg-muted">{t("bankImport.unknownTopics", { slugs: preview.unknownTopics.join(", ") })}</p>
              )}
              {preview.problems.length > 0 && (
                <div>
                  <p className="text-fg-muted">{t("bankImport.problemsHeading", { count: preview.problems.length })}</p>
                  <ul className="mt-1 max-h-48 space-y-0.5 overflow-y-auto">
                    {preview.problems.map((p, i) => (
                      <li key={i} className="text-xs text-fg-muted">
                        {t("bankImport.problemLine", { line: p.line })} · {p.reason}
                        {p.value ? ` · ${p.value}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
