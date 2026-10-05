"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { linkAllExpertsAction, recordGigPaymentAction, recordPayoutAction, retryPaymentAction, saveCompanyAction, saveGigSettingsAction, suspendPayeeAction, switchPaymentsAction } from "./actions";

export type Dial = {
  key: string;
  label: string;
  value: number;
  /** Shown in rupees, kept in paise. */ rupees?: boolean;
};

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
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
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

/** Paid seats on or off: one button, the opposite of what stands; on waits for Route to be ready (the server refuses it too). */
export function PaymentsSwitch({ on, canTurnOn = true }: { on: boolean; canTurnOn?: boolean }) {
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
        disabled={pending || (!on && !canTurnOn)}
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

/** The operator's bulk link: every expert ready for Razorpay Route, and every open review asked after. */
export function LinkAllExperts({ disabled }: { disabled: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pending || disabled}
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await linkAllExpertsAction();
            if (!result.ok) return setError(result.error);
            toast({ tone: "ok", title: result.message });
            router.refresh();
          })
        }
        data-testid="gig-route-link-all"
      >
        {t("gigs.opRouteLinkAll")}
      </Button>
      {error && (
        <span role="alert" className="text-sm font-medium text-danger">
          {error}
        </span>
      )}
    </span>
  );
}

/** A waiting release, transfer or refund, tried now. */
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

export type CompanyFormValues = {
  legalName: string;
  gstin: string;
  address: string;
  stateCode: string;
  sacCode: string;
  invoicePrefix: string;
  gstPercent: number;
};

/** The company on its invoices: legal name, GSTIN, address, state code, SAC, the series prefix and the GST rate on the commission. */
export function CompanyForm({ initial }: { initial: CompanyFormValues }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [v, setV] = useState({
    ...initial,
    gstPercent: String(initial.gstPercent),
  });
  const [error, setError] = useState<string | null>(null);
  const field = (key: keyof typeof v, label: string, extra: Record<string, unknown> = {}) => <TextField key={key} label={label} value={v[key]} autoComplete="off" onChange={(e) => setV((x) => ({ ...x, [key]: e.target.value }))} data-testid={`gig-company-${key}`} {...extra} />;
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const gstPercent = Number(v.gstPercent);
        if (v.gstPercent.trim() === "" || !Number.isInteger(gstPercent)) return setError(t("gigs.refuseGstPercent"));
        startTransition(async () => {
          const result = await saveCompanyAction({ ...v, gstPercent });
          if (!result.ok) return setError(result.error);
          toast({ tone: "ok", title: result.message });
          router.refresh();
        });
      }}
      className="space-y-4"
      data-typing="en"
      data-testid="gig-company"
    >
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {field("legalName", t("gigs.opCompanyName"), { maxLength: 160 })}
        {field("gstin", t("gigs.opCompanyGstin"), { maxLength: 20 })}
        {field("stateCode", t("gigs.opCompanyState"), {
          maxLength: 2,
          inputMode: "numeric",
        })}
        {field("address", t("gigs.opCompanyAddress"), { maxLength: 400 })}
        {field("sacCode", t("gigs.opCompanySac"), {
          maxLength: 8,
          inputMode: "numeric",
        })}
        {field("invoicePrefix", t("gigs.opCompanyPrefix"), { maxLength: 8 })}
        {field("gstPercent", t("gigs.opCompanyGst"), {
          maxLength: 3,
          inputMode: "numeric",
        })}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("gigs.saveSettings")}
      </Button>
    </form>
  );
}

/** One payout to an expert: the reference of the transfer the company has made from its bank, the date, a note. */
export function PayoutForm({ payoutId, name, disabled }: { payoutId: string; name: string; disabled: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await recordPayoutAction({
            payoutId,
            name,
            reference,
            paidAt: paidAt ? new Date(`${paidAt}T12:00:00+05:30`).toISOString() : null,
            note: note || null,
          });
          if (!result.ok) return setError(result.error);
          toast({ tone: "ok", title: result.message });
          setReference("");
          setNote("");
          router.refresh();
        });
      }}
      className="space-y-2"
      data-typing="en"
      data-testid="gig-payout-form"
    >
      <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <TextField label={t("gigs.utr")} value={reference} maxLength={40} autoComplete="off" disabled={disabled} error={error ?? undefined} onChange={(e) => setReference(e.target.value)} data-testid="gig-payout-ref" />
        <TextField label={t("gigs.opPayDate")} type="date" value={paidAt} disabled={disabled} onChange={(e) => setPaidAt(e.target.value)} />
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <TextField label={t("gigs.opPayNote")} className="min-w-0 flex-1" value={note} maxLength={300} autoComplete="off" disabled={disabled} onChange={(e) => setNote(e.target.value)} />
        <Button type="submit" variant="secondary" disabled={pending || disabled} aria-label={t("gigs.opRecordPayoutFor", { name })} data-testid="gig-payout-record">
          {pending ? t("common.saving") : t("gigs.opRecordPayout")}
        </Button>
      </div>
    </form>
  );
}

/** Stop paying one expert, with a reason they read, or pay them again (A3-inventory-8). */
export function SuspendPayee({ expertUserId, name, suspended }: { expertUserId: string; name: string; suspended: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const send = () =>
    startTransition(async () => {
      setError(null);
      const result = await suspendPayeeAction({ expertUserId, name, suspended: !suspended, note: suspended ? undefined : note });
      if (!result.ok) return setError(result.error);
      setNote("");
      toast({ tone: "ok", title: result.message });
      router.refresh();
    });
  return (
    <div className="flex flex-wrap items-end gap-2" data-testid="gig-payee-suspend">
      {!suspended && <TextField label={t("gigs.opPayeeStopReason")} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} className="min-w-[12rem]" />}
      <Button type="button" size="sm" variant={suspended ? "secondary" : "ghost"} disabled={pending} loading={pending} onClick={send}>
        {t(suspended ? "gigs.opPayeeResume" : "gigs.opPayeeStop")}
      </Button>
      {error && (
        <span role="alert" className="text-sm font-medium text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
