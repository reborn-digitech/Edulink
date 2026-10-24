"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WalletIcon } from "@phosphor-icons/react";
import { expertPayoutSchema, expertRouteLinkedSchema, type ExpertPayout } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { formatUtcMoment } from "@/lib/dates";
import type { TranslationKey } from "@/lib/i18n/dictionary";

type Route = ExpertPayout["payout"]["route"];
const STATUS_KEY: Record<ExpertPayout["payout"]["status"], TranslationKey> = {
  NONE: "gigs.payoutNONE",
  ACTIVE: "gigs.payoutACTIVE",
  SUSPENDED: "gigs.payoutSUSPENDED",
};
const STATUS_TONE: Record<ExpertPayout["payout"]["status"], "neutral" | "danger" | "ok"> = { NONE: "neutral", ACTIVE: "ok", SUSPENDED: "danger" };
const ROUTE_KEY: Record<Route["status"], TranslationKey> = {
  NONE: "gigs.routeStatusNONE",
  REQUESTED: "gigs.routeStatusREQUESTED",
  UNDER_REVIEW: "gigs.routeStatusUNDER_REVIEW",
  NEEDS_CLARIFICATION: "gigs.routeStatusNEEDS_CLARIFICATION",
  ACTIVATED: "gigs.routeStatusACTIVATED",
  SUSPENDED: "gigs.routeStatusSUSPENDED",
};
const ROUTE_TONE: Record<Route["status"], "neutral" | "info" | "warn" | "ok" | "danger"> = {
  NONE: "neutral",
  REQUESTED: "info",
  UNDER_REVIEW: "info",
  NEEDS_CLARIFICATION: "warn",
  ACTIVATED: "ok",
  SUSPENDED: "danger",
};

/**
 * "Get paid" (decision 0004, third amendment of 2 October 2026): what the
 * expert's Razorpay Route linked account is made from — the name on their
 * PAN and bank, the bank account and IFSC, the PAN, an address, a mobile,
 * the GST state and a GSTIN if any — and then the link itself. The account
 * number and the PAN are sealed on the server and never come back: the card
 * shows the last four of each. Once linked, the name, PAN and address are
 * Razorpay's and the fields are shut; a new bank account can be saved and
 * sent again. The badge says where Razorpay's review stands.
 */
/** `earnings`: the earnings page is there to link to (QA-61: it is the app's 404 while expert sessions are switched off). */
export function GetPaidCard({ initial, earnings = true }: { initial: ExpertPayout; earnings?: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState(initial);
  const [editing, setEditing] = useState(!initial.payout.payeeName);
  const [busy, setBusy] = useState<"save" | "link" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const payout = state.payout;
  const route = payout.route;
  const [form, setForm] = useState({
    payeeName: payout.payeeName ?? "",
    bankAccount: "",
    ifsc: payout.ifsc ?? "",
    pan: "",
    addressLine: payout.addressLine ?? "",
    city: payout.city ?? "",
    postalCode: payout.postalCode ?? "",
    phone: payout.phone ?? "",
    gstStateCode: payout.gstStateCode ?? "",
    gstin: payout.gstin ?? "",
  });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function send<T>(url: string, body: unknown, parse: (json: unknown) => T): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (!response.ok) throw new Error(json?.error ?? t("common.tryAgainMoment"));
    return parse(json);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy("save");
    setError(null);
    try {
      const body = {
        ...form,
        bankAccount: form.bankAccount || null,
        ifsc: form.ifsc || null,
        pan: form.pan || null,
        gstin: form.gstin || null,
      };
      setState(await send("/api/v1/expert/payout", body, (json) => expertPayoutSchema.parse(json)));
      setForm((f) => ({ ...f, bankAccount: "", pan: "" }));
      setEditing(false);
      toast({ tone: "ok", title: t("gigs.payoutLinked") });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.tryAgainMoment"));
    } finally {
      setBusy(null);
    }
  }

  async function link() {
    setBusy("link");
    setError(null);
    try {
      const next = await send("/api/v1/expert/payout/link", undefined, (json) => expertRouteLinkedSchema.parse(json));
      setState({ payout: next.payout, gate: next.gate });
      toast({ tone: "ok", title: t("gigs.routeSent") });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.tryAgainMoment"));
    } finally {
      setBusy(null);
    }
  }

  // ONE LINKED STATE (QA-62): Razorpay's ACTIVATED is "ready to be paid" only when the payout is; linked with the
  // papers still to be checked, the header says not ready yet and the route says linked, not "Not linked yet" over
  // "Linked with Razorpay: ready to be paid".
  const routeKey: TranslationKey = route.status === "ACTIVATED" && payout.status !== "ACTIVE" ? "qaInterface.routeLinkedOnly" : ROUTE_KEY[route.status];
  const statusKey: TranslationKey = payout.status === "NONE" && route.linked ? "qaInterface.payoutLinkedNotReady" : STATUS_KEY[payout.status];
  const linkLabel: TranslationKey = !route.linked ? "gigs.routeLink" : route.needsResend ? "gigs.routeResend" : "gigs.routeCheck";
  const canLink = payout.transport !== "off" && payout.status !== "SUSPENDED" && route.readyToLink && !editing;

  return (
    <Card data-testid="expert-get-paid">
      <CardHeader icon={<WalletIcon weight="duotone" className="size-5" />} title={t("gigs.getPaidTitle")} description={t("gigs.getPaidBody")} action={<Badge tone={STATUS_TONE[payout.status]}>{t(statusKey)}</Badge>} />
      <CardBody className="space-y-3">
        {payout.note && <p className="text-sm text-fg-muted">{t("gigs.payoutNote", { note: payout.note })}</p>}
        {!state.gate.kycVerified && <p className="text-sm text-fg-muted">{t("gigs.payoutNeedKyc")}</p>}
        {payout.transport === "off" && <p className="text-sm text-fg-muted">{t("gigs.payoutOff")}</p>}
        {!editing && payout.payeeName && (
          <div className="space-y-1 text-sm text-fg" data-testid="payee-summary">
            <p className="font-medium">{payout.payeeName}</p>
            {payout.bankLast4 && (
              <p className="font-mono text-xs">
                {t("gigs.payeeBankLine", {
                  last4: payout.bankLast4,
                  ifsc: payout.ifsc ?? "",
                })}
              </p>
            )}
            {payout.panLast4 && <p className="font-mono text-xs">{t("gigs.payeePanLine", { last4: payout.panLast4 })}</p>}
            {payout.addressLine && <p className="text-xs text-fg-muted">{[payout.addressLine, payout.city, payout.postalCode].filter(Boolean).join(", ")}</p>}
            <p className="text-xs text-fg-muted">
              {t("gigs.opPayeeState", { code: payout.gstStateCode ?? "" })}
              {payout.gstin ? ` · ${t("gigs.opPayeeGstin", { gstin: payout.gstin })}` : ""}
            </p>
          </div>
        )}
        {payout.payeeName && (
          <div className="space-y-1 rounded-[var(--radius-md)] border border-border p-3" data-testid="route-status">
            <Badge tone={ROUTE_TONE[route.status]}>{t(routeKey)}</Badge>
            {route.needsResend && <p className="text-sm text-warn">{t("gigs.routeNeedsResend")}</p>}
            {route.requirements.map((r) => (
              <p key={`${r.field}-${r.reason}`} className="text-xs text-fg-muted">
                {t("gigs.routeRequirement", { field: r.field })}
              </p>
            ))}
            {route.error && <p className="text-xs text-danger">{t("gigs.routeErrorLine", { error: route.error })}</p>}
            {route.checkedAt && (
              <p className="text-xs text-fg-muted">
                {t("gigs.routeCheckedLine", {
                  // Not toLocaleString: the server and the browser printed it in two locales and hydration failed (A3-states-7).
                  date: formatUtcMoment(new Date(route.checkedAt)),
                })}
              </p>
            )}
            {!route.linked && !state.gate.kycVerified && <p className="text-xs text-fg-muted">{t("gigs.routeWaitsForKyc")}</p>}
          </div>
        )}
        {editing && (
          <form noValidate onSubmit={(e) => void save(e)} className="space-y-3" data-typing="en" data-testid="payee-form">
            <p className="text-xs text-fg-muted">{t("gigs.payeeHow")}</p>
            {route.locked && <p className="text-xs text-fg-muted">{t("gigs.routeLocked")}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label={t("gigs.payeeLabelName")} value={form.payeeName} maxLength={80} autoComplete="name" disabled={route.locked} onChange={set("payeeName")} data-testid="payee-name" />
              <TextField label={t("gigs.payeePan")} hint={payout.panLast4 ? t("gigs.payeeKeepBlank") : t("gigs.payeePanHint")} value={form.pan} maxLength={12} autoComplete="off" disabled={route.locked} onChange={set("pan")} data-testid="payee-pan" placeholder={payout.panLast4 ? `•••••••${payout.panLast4}` : undefined} />
              <TextField label={t("gigs.payeeBankAccount")} hint={payout.bankLast4 ? t("gigs.payeeKeepBlank") : undefined} value={form.bankAccount} maxLength={30} inputMode="numeric" autoComplete="off" onChange={set("bankAccount")} data-testid="payee-bank" placeholder={payout.bankLast4 ? `•••• ${payout.bankLast4}` : undefined} />
              <TextField label={t("gigs.payeeIfsc")} value={form.ifsc} maxLength={20} autoComplete="off" onChange={set("ifsc")} data-testid="payee-ifsc" />
              <TextField label={t("gigs.payeeAddress")} value={form.addressLine} maxLength={100} autoComplete="street-address" disabled={route.locked} onChange={set("addressLine")} data-testid="payee-address" />
              <TextField label={t("gigs.payeeCity")} value={form.city} maxLength={60} autoComplete="address-level2" disabled={route.locked} onChange={set("city")} data-testid="payee-city" />
              <TextField label={t("gigs.payeePostalCode")} value={form.postalCode} maxLength={6} inputMode="numeric" autoComplete="postal-code" disabled={route.locked} onChange={set("postalCode")} data-testid="payee-postal" />
              <TextField label={t("gigs.payeeMobile")} value={form.phone} maxLength={14} inputMode="tel" autoComplete="tel" onChange={set("phone")} data-testid="payee-phone" />
              <TextField label={t("gigs.payeeState")} hint={t("gigs.payeeStateHint")} value={form.gstStateCode} maxLength={2} inputMode="numeric" autoComplete="off" disabled={route.locked} onChange={set("gstStateCode")} data-testid="payee-state" />
              <TextField label={t("gigs.payeeGstin")} value={form.gstin} maxLength={20} autoComplete="off" onChange={set("gstin")} data-testid="payee-gstin" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy === "save"} data-testid="payee-save">
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
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {payout.payeeName && !editing && (
            <Button type="button" onClick={() => void link()} loading={busy === "link"} disabled={!canLink} data-testid="route-link">
              {t(linkLabel)}
            </Button>
          )}
          {!editing && (
            <Button type="button" variant="secondary" onClick={() => setEditing(true)} data-testid="payee-edit">
              {t("common.edit")}
            </Button>
          )}
          {earnings && (
            <Button asChild variant="ghost">
              <Link href="/expert/earnings">{t("gigs.earningsTitle")}</Link>
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
