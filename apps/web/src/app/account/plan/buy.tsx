"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPaise } from "@edulink/i18n";
import type { GigCheckout, PassCheckout, PassOffer, PassPeriod } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { SeatCheckout, type CheckoutDoors } from "@/components/gigs/seat-checkout";
import { useLocale, useT } from "@/lib/i18n";

/**
 * BUYING A PASS (plans-pay, 17 October 2026; src/lib/pass-orders.ts): the period, the plan's price with its GST and
 * the total, then Pay — the order at the company's gateway, opened in the seat flow's own panel (the gateway's script,
 * or the devbox wait), on the pass's own doors. The card details are typed on the gateway's page, never here.
 */
async function post<T>(path: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const response = await fetch(path, { method: "POST", credentials: "include", headers: { accept: "application/json", "content-type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const json = (await response.json().catch(() => null)) as ({ error?: unknown } & T) | null;
  if (!response.ok) return { ok: false, error: typeof json?.error === "string" ? json.error : `HTTP ${response.status}` };
  return { ok: true, data: json as T };
}

/** A pass's checkout in the shape the seat panel opens. */
const asPanelOrder = (c: PassCheckout): GigCheckout => ({ paymentId: c.paymentId, bookingId: c.paymentId, orderId: c.orderId, keyId: c.keyId, amountPaise: c.amountPaise, currency: c.currency, transport: c.transport, title: c.title, pupilName: c.holderName, payerName: c.payerName, payerEmail: c.payerEmail });

export function BuyPass({ offer }: { offer: PassOffer }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [period, setPeriod] = useState<PassPeriod>(offer.prices.find((p) => p.period === "YEAR") ? "YEAR" : (offer.prices[0]?.period ?? "MONTH"));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<GigCheckout | null>(null);
  const price = offer.prices.find((p) => p.period === period) ?? offer.prices[0];
  const money = (paise: number) => formatPaise(paise, locale, { always: true });
  const doors: CheckoutDoors = {
    status: (id) => `/api/v1/account/pass/orders/${encodeURIComponent(id)}`,
    confirm: () => "/api/v1/account/pass/confirm",
    confirmBody: (id) => ({ orderId: id }),
    title: t("passes.payTitle"),
    doneText: t("passes.payDone"),
    note: t("passes.cardNote"),
  };

  if (checkout)
    return (
      <SeatCheckout
        checkout={checkout}
        doors={doors}
        onClose={() => {
          setCheckout(null);
          router.refresh();
        }}
      />
    );
  if (!price) return null;
  return (
    <div className="space-y-3" data-testid="pass-buy" data-plan={offer.plan}>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg">{t("passes.choosePeriod")}</legend>
        <div className="flex flex-wrap gap-2">
          {offer.prices.map((p) => (
            <label key={p.period} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm text-fg has-[:checked]:border-accent">
              <input type="radio" name={`period-${offer.plan}-${offer.holder.userId}`} value={p.period} checked={period === p.period} onChange={() => setPeriod(p.period)} />
              <span>{p.period === "MONTH" ? t("passes.periodMonth") : t("passes.periodYear")}</span>
              <span className="tabular-nums text-fg-muted">{money(p.totalPaise)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-sm tabular-nums text-fg" data-testid="pass-price">
        {t("passes.priceLine", { amount: money(price.amountPaise), gst: money(price.gstPaise), total: money(price.totalPaise) })}
      </p>
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <Button
        type="button"
        disabled={pending}
        data-testid="pass-pay"
        onClick={async () => {
          setPending(true);
          setError(null);
          const result = await post<{ checkout: PassCheckout }>("/api/v1/account/pass/checkout", { plan: offer.plan, period, ...(offer.holder.studentMembershipId ? { studentMembershipId: offer.holder.studentMembershipId } : {}) });
          setPending(false);
          if (!result.ok) return setError(result.error);
          setCheckout(asPanelOrder(result.data.checkout));
        }}
      >
        {t("passes.payButton", { total: money(price.totalPaise) })}
      </Button>
      <p className="text-xs text-fg-muted">{t("passes.cardNote")}</p>
    </div>
  );
}

/** "Ask your parent": a pupil under eighteen never sees Pay; their guardians are told in the app, once a day at most. */
export function AskGuardian() {
  const t = useT();
  const [pending, setPending] = useState(false);
  const [said, setSaid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2" data-testid="pass-ask">
      <p className="text-sm text-fg-muted">{t("passes.askBody")}</p>
      {said ? (
        <p className="text-sm text-ok" role="status">
          {said}
        </p>
      ) : (
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError(null);
            const result = await post<{ told: number; already: boolean }>("/api/v1/account/pass/ask", { plan: "STUDENT" });
            setPending(false);
            if (!result.ok) return setError(result.error);
            setSaid(result.data.told > 0 ? t("passes.asked") : result.data.already ? t("passes.askedAlready") : t("passes.askedNobody"));
          }}
        >
          {t("passes.askButton")}
        </Button>
      )}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
