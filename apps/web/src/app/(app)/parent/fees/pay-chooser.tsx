"use client";

import { useMemo, useState } from "react";
import { BankIcon, CreditCardIcon, DeviceMobileIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@edulink/i18n";
import { formatDateKey } from "@/lib/dates";
import { useLocale, useT } from "@/lib/i18n";
import { OnlineFlow } from "./online-flow";
import { UpiFlow } from "./upi-flow";

/**
 * "Choose what to pay": the open instalments as checkboxes, all ticked to
 * begin with, a running total, and one button per way this school takes
 * money. The amount shown is the sum of the ticked rows; the amount CHARGED
 * is the server's own sum of the same ids — see startOnlineCheckout.
 */
export type PayableDemand = { id: string; label: string; dueDateKey: string; outstandingPaise: number; overdue: boolean };
export type PayOptions = { online: boolean; upi: { vpa: string; payee: string } | null; bankNote: string | null };

export function PayChooser({ studentMembershipId, demands, options, resumePaymentId = null }: { studentMembershipId: string; demands: PayableDemand[]; options: PayOptions; resumePaymentId?: string | null }) {
  const t = useT();
  const locale = useLocale();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(demands.map((d) => d.id)));
  // A checkout the phone started opens straight away, on its own order.
  const [flow, setFlow] = useState<{ kind: "online" | "upi"; demandIds: string[]; resumePaymentId?: string } | null>(() => (resumePaymentId && options.online ? { kind: "online", demandIds: [], resumePaymentId } : null));

  const total = useMemo(() => demands.filter((d) => selected.has(d.id)).reduce((a, d) => a + d.outstandingPaise, 0), [demands, selected]);
  const allSelected = selected.size === demands.length;
  const noneOffered = !options.online && !options.upi && !options.bankNote;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const chosen = () => demands.filter((d) => selected.has(d.id)).map((d) => d.id);
  const disabled = selected.size === 0 || flow !== null;

  return (
    <div className="space-y-4" data-testid="fees-pay-chooser">
      <ul className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
        <li className="px-3 py-2">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-fg">
            <input
              type="checkbox"
              className="size-5 shrink-0 accent-[var(--accent)]"
              checked={allSelected}
              disabled={flow !== null}
              onChange={() => setSelected(allSelected ? new Set() : new Set(demands.map((d) => d.id)))}
            />
            {t("fees.parentPickAll")}
          </label>
        </li>
        {demands.map((d) => (
          <li key={d.id} className="px-3 py-2" data-testid="fees-pay-demand" data-demand-id={d.id}>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="size-5 shrink-0 accent-[var(--accent)]" checked={selected.has(d.id)} disabled={flow !== null} onChange={() => toggle(d.id)} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-fg">{d.label}</span>
                <span className="block text-xs text-fg-muted">
                  {t("fees.parentDue", { date: formatDateKey(d.dueDateKey, { day: "numeric", month: "short", year: "numeric" }, locale) })}
                  {d.overdue && (
                    <>
                      {" "}
                      <Badge tone="danger" size="sm">
                        {t("fees.overdue")}
                      </Badge>
                    </>
                  )}
                </span>
              </span>
              <span className="text-sm font-semibold tabular-nums text-fg">{formatPaise(d.outstandingPaise, locale)}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-fg-muted">{t("fees.parentTotal")}</span>
        <span className="text-xl font-bold tabular-nums text-fg" data-testid="fees-pay-total">
          {formatPaise(total, locale)}
        </span>
      </div>

      {noneOffered ? (
        <p className="text-sm text-fg-muted">{t("fees.parentSchoolTakesNothing")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.online && (
            <Button icon={<CreditCardIcon weight="bold" />} disabled={disabled} data-testid="fees-pay-online" onClick={() => setFlow({ kind: "online", demandIds: chosen() })}>
              {t("fees.parentPayOnline")}
            </Button>
          )}
          {options.upi && (
            <Button variant={options.online ? "secondary" : "primary"} icon={<DeviceMobileIcon weight="bold" />} disabled={disabled} data-testid="fees-pay-upi" onClick={() => setFlow({ kind: "upi", demandIds: chosen() })}>
              {t("fees.parentPayUpi")}
            </Button>
          )}
        </div>
      )}

      {flow?.kind === "online" && <OnlineFlow key={flow.resumePaymentId ?? flow.demandIds.join(",")} studentMembershipId={studentMembershipId} demandIds={flow.demandIds} resumePaymentId={flow.resumePaymentId ?? null} onClose={() => setFlow(null)} />}
      {flow?.kind === "upi" && <UpiFlow key={flow.demandIds.join(",")} studentMembershipId={studentMembershipId} demandIds={flow.demandIds} onClose={() => setFlow(null)} />}

      {options.bankNote && (
        <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border bg-surface-muted p-3.5 text-sm">
          <BankIcon weight="duotone" className="mt-0.5 size-5 shrink-0 text-fg-muted" />
          <div className="min-w-0">
            <p className="font-medium text-fg">{t("fees.parentPayBank")}</p>
            <p className="mt-0.5 text-xs text-fg-muted">{t("fees.parentPayBankHint")}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-fg">{options.bankNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}
