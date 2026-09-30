"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { recordGigPaymentAction, saveGigSettingsAction } from "./actions";

type Dials = { rateRupees: number; freeCount: number; monthlyCap: number; budgetRupees: number; dailyLimit: number; pendingLimit: number };

/** The six numbers the operator holds: the rate, the unpaid first ones, a teacher's month, the budget and the sending limits. */
export function SettingsForm({ initial }: { initial: Dials }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [dials, setDials] = useState<Record<keyof Dials, string>>(() => Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, String(v)])) as Record<keyof Dials, string>);
  const [error, setError] = useState<string | null>(null);
  const fields: [keyof Dials, string][] = [
    ["rateRupees", t("gigs.setRate")],
    ["freeCount", t("gigs.setFree")],
    ["monthlyCap", t("gigs.setCap")],
    ["budgetRupees", t("gigs.setBudget")],
    ["dailyLimit", t("gigs.setDaily")],
    ["pendingLimit", t("gigs.setPending")],
  ];

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const numbers = Object.fromEntries(Object.entries(dials).map(([k, v]) => [k, Number(v)])) as Dials;
        if (Object.values(numbers).some((n) => !Number.isFinite(n))) return setError(t("gigs.refuseSetting"));
        startTransition(async () => {
          const result = await saveGigSettingsAction(numbers);
          if (!result.ok) return setError(result.error);
          toast({ tone: "ok", title: result.message });
          router.refresh();
        });
      }}
      className="space-y-4"
      data-testid="gig-settings"
    >
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-typing="en">
        {fields.map(([key, label]) => (
          <TextField key={key} label={label} inputMode="numeric" autoComplete="off" value={dials[key]} onChange={(e) => setDials((d) => ({ ...d, [key]: e.target.value }))} data-testid={`gig-set-${key}`} />
        ))}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("gigs.saveSettings")}
      </Button>
    </form>
  );
}

/** One contributor's payment: the reference of the transfer the operator has made from the company's bank. */
export function PaymentForm({ userId, name, disabled }: { userId: string; name: string; disabled: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [utr, setUtr] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await recordGigPaymentAction({ userId, utr });
          if (!result.ok) return setError(result.error);
          toast({ tone: "ok", title: result.message });
          setUtr("");
          router.refresh();
        });
      }}
      className="space-y-2"
      data-typing="en"
    >
      <div className="flex flex-wrap items-end gap-2">
        <TextField label={t("gigs.utr")} className="min-w-0 flex-1" value={utr} maxLength={40} autoComplete="off" disabled={disabled} error={error ?? undefined} onChange={(e) => setUtr(e.target.value)} />
        <Button type="submit" variant="secondary" disabled={pending || disabled} aria-label={t("gigs.recordPaymentFor", { name })}>
          {pending ? t("common.saving") : t("gigs.recordPayment")}
        </Button>
      </div>
    </form>
  );
}
