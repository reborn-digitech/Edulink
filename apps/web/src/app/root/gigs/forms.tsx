"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { recordGigPaymentAction, retryPaymentAction, saveGigSettingsAction, switchPaymentsAction } from "./actions";

export type Dial = { key: string; label: string; value: number; /** Shown in rupees, kept in paise. */ rupees?: boolean };

/** A group of the operator's dials, whole numbers, saved together; the dials of the other groups are left as they are. */
export function SettingsForm({ dials, testId }: { dials: Dial[]; testId: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(dials.map((d) => [d.key, String(d.rupees ? d.value / 100 : d.value)])));
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const patch: Record<string, number> = {};
        for (const d of dials) {
          const n = Number(values[d.key]);
          if (values[d.key]!.trim() === "" || !Number.isFinite(n)) return setError(t("gigs.refuseSetting"));
          patch[d.key] = d.rupees ? Math.round(n * 100) : n;
        }
        startTransition(async () => {
          const result = await saveGigSettingsAction(patch);
          if (!result.ok) return setError(result.error);
          toast({ tone: "ok", title: result.message });
          router.refresh();
        });
      }}
      className="space-y-4"
      data-testid={testId}
    >
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-typing="en">
        {dials.map((d) => (
          <TextField key={d.key} label={d.label} inputMode="numeric" autoComplete="off" value={values[d.key] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [d.key]: e.target.value }))} data-testid={`gig-set-${d.key}`} />
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

/** Paid seats on or off: one button, the opposite of what stands. */
export function PaymentsSwitch({ on }: { on: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="gig-payments-switch" data-on={on ? "yes" : "no"}>
      <span className="text-sm font-medium text-fg">{on ? t("gigs.opSwitchOn") : t("gigs.opSwitchOff")}</span>
      <Button
        type="button"
        size="sm"
        variant={on ? "danger" : "primary"}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await switchPaymentsAction(!on);
            if (!result.ok) return setError(result.error);
            toast({ tone: "ok", title: result.message });
            router.refresh();
          })
        }
        data-testid="gig-payments-toggle"
      >
        {on ? t("gigs.opTurnOff") : t("gigs.opTurnOn")}
      </Button>
      {error && (
        <span role="alert" className="text-sm font-medium text-danger">
          {error}
        </span>
      )}
    </div>
  );
}

/** A waiting release or refund, tried now. */
export function RetryPayment({ paymentId }: { paymentId: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await retryPaymentAction(paymentId);
            if (!result.ok) return setError(result.error);
            toast({ tone: "ok", title: result.message });
            router.refresh();
          })
        }
        data-testid="gig-payment-retry"
      >
        {t("gigs.opRetry")}
      </Button>
      {error && (
        <span role="alert" className="text-sm font-medium text-danger">
          {error}
        </span>
      )}
    </span>
  );
}
