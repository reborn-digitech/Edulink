"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { formatPaise } from "@edulink/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useLocale, useT } from "@/lib/i18n";
import type { BankMatch } from "@/lib/fees-payments";
import { MATCH_PROBLEM_KEY } from "../labels";
import { applyMatchesAction, matchBankAction } from "./actions";
import { TableScroll } from "@/components/ui/table-scroll";

/**
 * Paste the bank statement, see which rows match a waiting claim by UTR
 * and amount, confirm the matches together. The preview writes nothing;
 * only the button does, and each refusal is reported rather than stopping
 * the rest.
 */
export function BankMatcher() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [csv, setCsv] = useState("");
  const [matches, setMatches] = useState<BankMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ paymentId: string; error: string }[]>([]);

  const matched = (matches ?? []).filter((m) => m.problem === null && m.paymentId);
  const matchedIds = [...new Set(matched.map((m) => m.paymentId!))];

  function preview(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFailed([]);
    if (!csv.trim()) return;
    startTransition(async () => {
      const result = await matchBankAction(csv);
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      setMatches(result.matches ?? []);
    });
  }

  function apply() {
    setError(null);
    startTransition(async () => {
      const result = await applyMatchesAction(matchedIds);
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("fees.matchDone", { count: result.confirmed ?? 0 }) });
      setFailed(result.failed ?? []);
      setMatches(null);
      setCsv("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={preview} noValidate className="space-y-3">
        {error && (
          <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <TextAreaField label={t("fees.matchPaste")} rows={6} value={csv} onChange={(e) => setCsv(e.target.value)} className="font-mono text-xs" />
        <Button type="submit" variant="secondary" loading={pending && matches === null} disabled={!csv.trim()}>
          {t("fees.matchGo")}
        </Button>
      </form>

      {failed.length > 0 && (
        <ul className="space-y-1 text-sm text-danger">
          {failed.map((f) => (
            <li key={f.paymentId}>{f.error}</li>
          ))}
        </ul>
      )}

      {matches && (
        <div className="space-y-3">
          <TableScroll className="rounded-[var(--radius-md)] border border-border">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("fees.matchColRow")}</th>
                  <th className="px-3 py-2 font-medium">{t("fees.claimColUtr")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("fees.claimColAmount")}</th>
                  <th className="px-3 py-2 font-medium">{t("fees.matchColResult")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {matches.map((m) => (
                  <tr key={m.row}>
                    <td className="px-3 py-2 tabular-nums text-fg-muted">{m.row}</td>
                    <td className="px-3 py-2 font-mono text-xs">{m.utr || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.amountPaise !== null ? formatPaise(m.amountPaise, locale) : "—"}</td>
                    <td className="px-3 py-2">
                      {m.problem === null ? (
                        <Badge tone="ok" size="sm">{t("fees.matchOk", { name: m.pupilName ?? "" })}</Badge>
                      ) : (
                        <Badge tone={m.problem === "no-claim" || m.problem === "no-utr" ? "neutral" : "warn"} size="sm">
                          {t(MATCH_PROBLEM_KEY[m.problem] ?? "fees.matchNoClaim")}
                          {m.pupilName ? ` · ${m.pupilName}` : ""}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          <Button loading={pending} disabled={matchedIds.length === 0} onClick={apply}>
            {t("fees.matchConfirmAll", { count: matchedIds.length })}
          </Button>
        </div>
      )}
    </div>
  );
}
