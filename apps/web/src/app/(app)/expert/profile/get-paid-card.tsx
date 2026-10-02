"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WalletIcon } from "@phosphor-icons/react";
import { expertPayoutSchema, type ExpertPayout } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const STATUS_KEY: Record<ExpertPayout["payout"]["status"], TranslationKey> = { NONE: "gigs.payoutNONE", ACTIVE: "gigs.payoutACTIVE", SUSPENDED: "gigs.payoutSUSPENDED" };
const STATUS_TONE: Record<ExpertPayout["payout"]["status"], "neutral" | "danger" | "ok"> = { NONE: "neutral", ACTIVE: "ok", SUSPENDED: "danger" };

/**
 * "Get paid": where the company pays the expert from its own bank (decision
 * 0004, second amendment of 2 October 2026) — a name, a UPI id or a bank
 * account with its IFSC, the GST state, a GSTIN if any. The account number
 * is sealed on the server and never comes back: the card shows its last
 * four digits. Active once KYC is verified; the card says so until then.
 */
export function GetPaidCard({ initial }: { initial: ExpertPayout }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState(initial);
  const [editing, setEditing] = useState(!initial.payout.payeeName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const payout = state.payout;
  const [form, setForm] = useState({ payeeName: payout.payeeName ?? "", upiId: payout.upiId ?? "", bankAccount: "", ifsc: payout.ifsc ?? "", gstStateCode: payout.gstStateCode ?? "", gstin: payout.gstin ?? "" });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { payeeName: form.payeeName, upiId: form.upiId || null, bankAccount: form.bankAccount || null, ifsc: form.ifsc || null, gstStateCode: form.gstStateCode, gstin: form.gstin || null };
      const response = await fetch("/api/v1/expert/payout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(json?.error ?? t("common.tryAgainMoment"));
      const next = expertPayoutSchema.parse(json);
      setState(next);
      setForm((f) => ({ ...f, bankAccount: "" }));
      setEditing(false);
      toast({ tone: "ok", title: t("gigs.payoutLinked") });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.tryAgainMoment"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card data-testid="expert-get-paid">
      <CardHeader icon={<WalletIcon weight="duotone" className="size-5" />} title={t("gigs.getPaidTitle")} description={t("gigs.getPaidBody")} action={<Badge tone={STATUS_TONE[payout.status]}>{t(STATUS_KEY[payout.status])}</Badge>} />
      <CardBody className="space-y-3">
        {payout.note && <p className="text-sm text-fg-muted">{t("gigs.payoutNote", { note: payout.note })}</p>}
        {!state.gate.kycVerified && <p className="text-sm text-fg-muted">{t("gigs.payoutNeedKyc")}</p>}
        {payout.transport === "off" && <p className="text-sm text-fg-muted">{t("gigs.payoutOff")}</p>}
        {!editing && payout.payeeName && (
          <div className="space-y-1 text-sm text-fg" data-testid="payee-summary">
            <p className="font-medium">{payout.payeeName}</p>
            {payout.upiId && <p className="font-mono text-xs">{t("gigs.payeeUpiLine", { upiId: payout.upiId })}</p>}
            {payout.bankLast4 && <p className="font-mono text-xs">{t("gigs.payeeBankLine", { last4: payout.bankLast4, ifsc: payout.ifsc ?? "" })}</p>}
            <p className="text-xs text-fg-muted">
              {t("gigs.opPayeeState", { code: payout.gstStateCode ?? "" })}
              {payout.gstin ? ` · ${t("gigs.opPayeeGstin", { gstin: payout.gstin })}` : ""}
            </p>
          </div>
        )}
        {editing && (
          <form noValidate onSubmit={(e) => void save(e)} className="space-y-3" data-typing="en" data-testid="payee-form">
            <p className="text-xs text-fg-muted">{t("gigs.payeeHow")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label={t("gigs.payeeLabelName")} value={form.payeeName} maxLength={80} autoComplete="name" onChange={set("payeeName")} data-testid="payee-name" />
              <TextField label={t("gigs.payeeUpi")} value={form.upiId} maxLength={300} autoComplete="off" onChange={set("upiId")} data-testid="payee-upi" />
              <TextField label={t("gigs.payeeBankAccount")} value={form.bankAccount} maxLength={30} inputMode="numeric" autoComplete="off" onChange={set("bankAccount")} data-testid="payee-bank" placeholder={payout.bankLast4 ? `•••• ${payout.bankLast4}` : undefined} />
              <TextField label={t("gigs.payeeIfsc")} value={form.ifsc} maxLength={20} autoComplete="off" onChange={set("ifsc")} data-testid="payee-ifsc" />
              <TextField label={t("gigs.payeeState")} hint={t("gigs.payeeStateHint")} value={form.gstStateCode} maxLength={2} inputMode="numeric" autoComplete="off" onChange={set("gstStateCode")} data-testid="payee-state" />
              <TextField label={t("gigs.payeeGstin")} value={form.gstin} maxLength={20} autoComplete="off" onChange={set("gstin")} data-testid="payee-gstin" />
            </div>
            {error && (
              <p role="alert" className="text-sm font-medium text-danger">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy} data-testid="payee-save">
                {t("gigs.payoutLink")}
              </Button>
              {payout.payeeName && (
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </form>
        )}
        <div className="flex flex-wrap gap-2">
          {!editing && (
            <Button type="button" variant="secondary" onClick={() => setEditing(true)} data-testid="payee-edit">
              {t("common.edit")}
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link href="/expert/earnings">{t("gigs.earningsTitle")}</Link>
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
