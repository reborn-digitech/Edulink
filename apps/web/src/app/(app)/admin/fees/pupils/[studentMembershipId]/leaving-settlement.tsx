"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeavingSettlementView, SettlementChoice } from "@edulink/contracts";
import { formatPaise, type Locale } from "@edulink/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { formatDateKey } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { settleOnLeavingAction } from "./settlement-actions";

const DESK_KEY: Record<string, TranslationKey> = { ACCOUNTS: "collegeOffice.deskACCOUNTS", LIBRARY: "collegeOffice.deskLIBRARY", HOSTEL: "collegeOffice.deskHOSTEL", LAB: "collegeOffice.deskLAB" };

/**
 * SETTLE ON LEAVING (R-61 Q2, 10 Oct 2026), on the leaver's ledger page. Three
 * lists — cancelled by the departure (read-only), still owed (a choice per
 * line while the office may still settle), still out (read-only) — and one
 * button. Once settled the choices are shown as a record with who and when.
 * The principal and the accounts desk read the same card without the form.
 */
export function LeavingSettlementCard({ view, office, locale }: { view: LeavingSettlementView; office: boolean; locale: Locale }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [choices, setChoices] = useState<Record<string, SettlementChoice>>(() => Object.fromEntries(view.owed.filter((l) => l.choice).map((l) => [l.demandId, l.choice!])));
  const [error, setError] = useState<string | null>(null);
  const money = (paise: number) => formatPaise(paise, locale);
  const day = (key: string) => formatDateKey(key, { day: "numeric", month: "short", year: "numeric" }, locale);
  const decided = view.owed.every((l) => choices[l.demandId]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await settleOnLeavingAction(view.studentMembershipId, { lines: view.owed.map((l) => ({ demandId: l.demandId, choice: choices[l.demandId] })) });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("ownerDecisions.settleTitle") });
      router.refresh();
    });
  }

  return (
    <Card data-testid="leaving-settlement">
      <CardHeader title={t("ownerDecisions.settleTitle")} description={view.canSettle ? t("ownerDecisions.settleIntro") : t("ownerDecisions.settleIntroRead")} />
      <CardBody className="space-y-5">
        {!view.leftOnKey ? (
          <p className="text-sm text-fg-muted">{t("ownerDecisions.notLeftYet")}</p>
        ) : (
          <>
            <p className="text-sm text-fg-muted">{t("ownerDecisions.leftOn", { date: day(view.leftOnKey) })}</p>

            <section>
              <h3 className="text-sm font-semibold text-fg">{t("ownerDecisions.cancelledByDeparture")}</h3>
              <p className="text-xs text-fg-muted">{t("ownerDecisions.cancelledByDepartureHint")}</p>
              {view.cancelled.length === 0 ? (
                <p className="mt-1 text-sm text-fg-muted">{t("ownerDecisions.nothingCancelled")}</p>
              ) : (
                <ul className="mt-2 divide-y divide-border" data-testid="settlement-cancelled">
                  {view.cancelled.map((c) => (
                    <li key={c.demandId} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
                      <span className="text-fg">{c.label} <span className="text-fg-muted">{day(c.dueDateKey)}</span></span>
                      <span className="tabular-nums text-fg-muted line-through">{money(c.netPaise)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="text-sm font-semibold text-fg">{t("ownerDecisions.stillOwed")}</h3>
              {view.owed.length === 0 ? (
                <p className="mt-1 text-sm text-fg-muted">{t("ownerDecisions.nothingOwed")}</p>
              ) : (
                <ul className="mt-2 divide-y divide-border" data-testid="settlement-owed">
                  {view.owed.map((l) => (
                    <li key={l.demandId} className="space-y-2 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-fg">{l.label}</span>
                          <span className="text-fg-muted">{day(l.dueDateKey)}</span>
                          {l.later && <Badge tone="warn" size="sm">{t("ownerDecisions.laterBadge")}</Badge>}
                        </span>
                        <span className="tabular-nums text-fg">{t("ownerDecisions.balanceOf", { amount: money(l.balancePaise), net: money(l.netPaise), paid: money(l.paidPaise) })}</span>
                      </div>
                      {view.canSettle && office ? (
                        <div className="flex flex-wrap gap-4" role="radiogroup" aria-label={l.label}>
                          {(["CANCEL", "KEEP"] as const).map((choice) => (
                            <label key={choice} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-fg">
                              <input type="radio" name={`choice-${l.demandId}`} value={choice} checked={choices[l.demandId] === choice} onChange={() => setChoices((c) => ({ ...c, [l.demandId]: choice }))} className="size-4 accent-[var(--accent)]" />
                              {t(choice === "CANCEL" ? "ownerDecisions.choiceCancel" : "ownerDecisions.choiceKeep")}
                            </label>
                          ))}
                        </div>
                      ) : l.choice ? (
                        <Badge tone={l.choice === "CANCEL" ? "ok" : "warn"} size="sm">{t(l.choice === "CANCEL" ? "ownerDecisions.choiceCancel" : "ownerDecisions.choiceKeep")}</Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {view.items.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-fg">{t("ownerDecisions.itemsOut")}</h3>
                <ul className="mt-1 text-sm text-fg" data-testid="settlement-items">
                  {view.items.map((i) => (
                    <li key={i.desk}>{t("ownerDecisions.itemsOutLine", { desk: DESK_KEY[i.desk] ? t(DESK_KEY[i.desk]!) : i.desk, count: i.itemsOut })}</li>
                  ))}
                </ul>
                <p className="text-xs text-fg-muted">{t("ownerDecisions.itemsOutHint")}</p>
              </section>
            )}

            {view.settled ? (
              <p className="text-sm text-fg-muted" data-testid="settlement-settled">
                {t("ownerDecisions.settledOn", { date: day(view.settled.decidedAt.slice(0, 10)), name: view.settled.decidedBy ?? "—" })} {t("ownerDecisions.settledSummary", { cancelled: money(view.settled.cancelledPaise), kept: money(view.settled.keptPaise) })}
              </p>
            ) : view.canSettle && office ? (
              <div className="space-y-2">
                <Button type="button" loading={pending} disabled={!decided} onClick={submit} data-testid="settlement-submit">
                  {t("ownerDecisions.settleButton")}
                </Button>
                {error && <p className="text-sm text-danger" role="alert">{error}</p>}
              </div>
            ) : null}
          </>
        )}
      </CardBody>
    </Card>
  );
}
