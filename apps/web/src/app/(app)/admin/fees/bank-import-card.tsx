"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPaise } from "@edulink/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { formatDateKey } from "@/lib/dates";
import { useLocale, useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { BankImportLine, BankImportPreview } from "@/lib/fees-bank-import";
import { METHOD_KEY } from "./labels";
import { commitBankImportAction, previewBankImportAction } from "./bank-import-actions";

const EXAMPLE = "Date,Description,Reference,Credit\n01/09/2026,NEFT STU-7K2M-9QDX RAVI,N245261234567890,12500.00\n02/09/2026,CLG CHQ 004512 STU-3PX8-Q2MN,004512,8000";

/**
 * Paste the statement, see what each credit would do, record the matched
 * lines together. The preview writes nothing; only the button does, and a
 * refusal on one line is reported against it rather than stopping the rest.
 */
export function BankImportCard() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<BankImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ line: number; error: string }[]>([]);

  function check(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFailed([]);
    if (!csv.trim()) return;
    startTransition(async () => {
      const result = await previewBankImportAction(csv);
      if (!result.ok || !result.preview) return setError(actionError(t, result, "common.tryAgain"));
      setPreview(result.preview);
    });
  }

  function commit() {
    setError(null);
    startTransition(async () => {
      const result = await commitBankImportAction(csv);
      if (!result.ok || !result.result) return setError(actionError(t, result, "common.tryAgain"));
      const r = result.result;
      toast({ tone: r.recorded + r.confirmed > 0 ? "ok" : "warn", title: t("officeBulk.bankDone", { recorded: r.recorded, confirmed: r.confirmed, unmatched: r.unmatched }) });
      setFailed(r.failed);
      setPreview(null);
      setCsv("");
      router.refresh();
    });
  }

  const matched = preview ? preview.counts.new + preview.counts.claim : 0;

  return (
    <div className="space-y-4" data-testid="bank-import">
      <form onSubmit={check} noValidate className="space-y-3">
        {error && (
          <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <TextAreaField
          label={t("officeBulk.bankLabel")}
          hint={t("officeBulk.bankColumns")}
          rows={6}
          value={csv}
          placeholder={EXAMPLE}
          onChange={(e) => {
            setCsv(e.target.value);
            setPreview(null);
          }}
          className="font-mono text-xs"
        />
        <Button type="submit" variant="secondary" loading={pending && preview === null} disabled={!csv.trim()}>
          {t("officeBulk.bankPreview")}
        </Button>
      </form>

      {failed.length > 0 && (
        <ul className="space-y-1 text-sm text-danger" role="alert">
          {failed.map((f) => (
            <li key={f.line}>{t("officeBulk.bankLineFailed", { line: f.line, error: f.error })}</li>
          ))}
        </ul>
      )}

      {preview && (
        <div className="space-y-3">
          <p className="flex flex-wrap gap-2 text-sm">
            <Badge tone="ok">{t("officeBulk.bankCountNew", { count: preview.counts.new })}</Badge>
            <Badge tone="accent">{t("officeBulk.bankCountClaim", { count: preview.counts.claim })}</Badge>
            <Badge tone="neutral">{t("officeBulk.bankCountAlready", { count: preview.counts.already })}</Badge>
            <Badge tone={preview.counts.unmatched > 0 ? "warn" : "neutral"}>{t("officeBulk.bankCountUnmatched", { count: preview.counts.unmatched })}</Badge>
          </p>
          <div className="overflow-x-auto rounded-[--radius-md] border border-border" tabIndex={0}>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("fees.matchColRow")}</th>
                  <th className="px-3 py-2 font-medium">{t("officeBulk.bankColDate")}</th>
                  <th className="px-3 py-2 font-medium">{t("officeBulk.bankColDescription")}</th>
                  <th className="px-3 py-2 font-medium">{t("officeBulk.bankColReference")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("officeBulk.bankColAmount")}</th>
                  <th className="px-3 py-2 font-medium">{t("officeBulk.bankColOutcome")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.lines.map((l) => (
                  <tr key={l.line}>
                    <td className="px-3 py-2 tabular-nums text-fg-muted">{l.line}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-fg-muted">{l.dateKey ? formatDateKey(l.dateKey, { day: "numeric", month: "short" }, locale) : "—"}</td>
                    <td className="max-w-[18rem] truncate px-3 py-2 text-xs">{l.description || "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{l.reference || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{l.amountPaise !== null ? formatPaise(l.amountPaise, locale) : "—"}</td>
                    <td className="px-3 py-2">
                      <Outcome line={l} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {matched > 0 ? (
            <Button loading={pending} onClick={commit}>
              {t("officeBulk.bankCommit")} ({matched})
            </Button>
          ) : (
            <p className="text-sm text-fg-muted">{t("officeBulk.bankNothingToRecord")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Outcome({ line: l }: { line: BankImportLine }) {
  const t = useT();
  const method = l.method ? t(METHOD_KEY[l.method] ?? "fees.methodBank") : "";
  switch (l.outcome) {
    case "new":
      return (
        <Badge tone="ok" size="sm">
          {t("officeBulk.bankOutcomeNew", { name: l.pupilName ?? "" })} · {method}
        </Badge>
      );
    case "claim":
      return (
        <Badge tone="accent" size="sm">
          {t("officeBulk.bankOutcomeClaim", { name: l.pupilName ?? "" })}
        </Badge>
      );
    case "already":
      return (
        <Badge tone="neutral" size="sm">
          {t("officeBulk.bankOutcomeAlready")}
          {l.pupilName ? ` · ${l.pupilName}` : ""}
        </Badge>
      );
    default:
      return (
        <Badge tone="warn" size="sm">
          {t("officeBulk.bankOutcomeUnmatched")}
          {l.problemKey ? ` · ${t(l.problemKey as TranslationKey)}` : ""}
          {l.pupilName ? ` · ${l.pupilName}` : ""}
        </Badge>
      );
  }
}
