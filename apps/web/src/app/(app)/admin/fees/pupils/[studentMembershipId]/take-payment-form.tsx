"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPaise, parseRupees } from "@edulink/i18n";
import { Button } from "@/components/ui/button";
import { CheckboxField, DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { COUNTER_METHODS, type FeeMethod } from "@/lib/constants";
import { useLocale, useT } from "@/lib/i18n";
import { METHOD_KEY, receiptHref } from "../../labels";
import { recordPaymentAction } from "./actions";

export type OpenDemand = { id: string; label: string; dueDateKey: string; outstandingPaise: number };

const newClientId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/**
 * The counter: cash, cheque, bank transfer or UPI paid at the desk. The
 * amount is typed in rupees; the demands it settles are oldest-first unless
 * the office ticks the ones it means. A clientId is minted once per mount,
 * so a double tap on a slow connection records one payment and returns the
 * same receipt; it is re-minted after a success for the next family.
 */
export function TakePaymentForm({ studentMembershipId, openDemands, todayKey }: { studentMembershipId: string; openDemands: OpenDemand[]; todayKey: string }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [clientId, setClientId] = useState(newClientId);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<FeeMethod>("CASH");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [paidAtKey, setPaidAtKey] = useState(todayKey);
  const [chosen, setChosen] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const chosenTotal = openDemands.filter((d) => chosen.includes(d.id)).reduce((a, d) => a + d.outstandingPaise, 0);
  const needsReference = method !== "CASH";

  function toggle(id: string) {
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const amountPaise = parseRupees(amount);
    if (amountPaise === null || amountPaise < 100) return setError(t("fees.refuseAmount"));
    if (needsReference && !reference.trim()) return setError(t("fees.refuseReference"));
    startTransition(async () => {
      const result = await recordPaymentAction({ studentMembershipId, amountPaise, method, reference: reference.trim() || null, note: note.trim() || null, demandIds: chosen.length ? chosen : undefined, clientId, paidAtKey: paidAtKey || null });
      if (!result.ok || !result.receiptId) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      const receiptId = result.receiptId;
      toast({ tone: "ok", title: t("fees.takeDone", { serial: result.serial ?? "" }), action: { label: t("fees.receiptOpen"), onClick: () => router.push(receiptHref(receiptId)) } });
      setClientId(newClientId());
      setAmount("");
      setReference("");
      setNote("");
      setChosen([]);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4" data-testid="fee-take-form">
      {error && (
        <p role="alert" data-testid="fee-take-error" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("fees.takeAmount")} required inputMode="decimal" data-testid="fee-take-amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <SelectField label={t("fees.takeMethod")} data-testid="fee-take-method" value={method} onChange={(e) => setMethod(e.target.value as FeeMethod)}>
          {COUNTER_METHODS.map((m) => (
            <option key={m} value={m}>
              {t(METHOD_KEY[m]!)}
            </option>
          ))}
        </SelectField>
        <TextField label={t("fees.takeReference")} data-testid="fee-take-reference" required={needsReference} hint={t("fees.takeReferenceHint")} maxLength={60} value={reference} onChange={(e) => setReference(e.target.value)} />
        <DateField label={t("fees.takeDate")} value={paidAtKey} max={todayKey} onChange={(e) => setPaidAtKey(e.target.value)} />
      </div>
      <TextAreaField label={t("fees.takeNote")} rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("common.optional")} />

      {openDemands.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-fg">
            {t("fees.takeFor")} <span className="font-normal text-fg-muted">— {chosen.length === 0 ? t("fees.takeForOldest") : formatPaise(chosenTotal, locale)}</span>
          </legend>
          {openDemands.map((d) => {
            const label = [d.label, formatPaise(d.outstandingPaise, locale)].join(" · ");
            return <CheckboxField key={d.id} label={label} description={d.dueDateKey} checked={chosen.includes(d.id)} onChange={() => toggle(d.id)} />;
          })}
          {chosen.length > 0 && chosenTotal > 0 && (
            <Button type="button" variant="link" size="sm" onClick={() => setAmount(String(chosenTotal / 100))}>
              {formatPaise(chosenTotal, locale)}
            </Button>
          )}
        </fieldset>
      )}

      <Button type="submit" block loading={pending} data-testid="fee-take-go">
        {t("fees.takeGo")}
      </Button>
    </form>
  );
}
