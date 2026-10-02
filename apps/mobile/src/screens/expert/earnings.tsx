import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expertEarningsSchema, expertPayoutSchema, expertRouteLinkedSchema, type ExpertPayout, type GigPaidGate } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Loading, Stat, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { bytesApi, shareBytes } from "@/lib/download";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatInstant, Note, Pill } from "@/screens/family/shared";
import { money } from "@/screens/shared/fees";
import { MENTORING_OFFER_DAYS, PAYMENT_STATUS } from "@/screens/shared/gigs";

/**
 * The expert's side of paid seats (decision 0004, third amendment of
 * 2 October 2026) — the web's "Get paid" card and /expert/earnings: what
 * their Razorpay Route linked account is made from (the name on their PAN
 * and bank, the bank account and IFSC, the PAN, an address, a mobile, the
 * GST state, a GSTIN if any; the account number and the PAN are sealed on
 * the server and come back as their last four only), the link with Razorpay
 * and where its review stands, the four conditions before a workshop seat
 * may be priced as a checklist, and what is on hold, released to their bank
 * and refunded seat by seat with the fee the company collected, its
 * commission, the GST on it and the net — the payouts (Razorpay's releases,
 * and the company's hand-recorded transfers from before Route), and each
 * tax invoice as a PDF through the share sheet.
 */
export const PAYOUT_KEY = ["expert", "payout"] as const;
export const EARNINGS_KEY = ["expert", "earnings"] as const;
const PAYOUT_STATUS: Record<ExpertPayout["payout"]["status"], { label: TranslationKey; tone: "muted" | "danger" | "ok" }> = { NONE: { label: "gigs.payoutNONE", tone: "muted" }, ACTIVE: { label: "gigs.payoutACTIVE", tone: "ok" }, SUSPENDED: { label: "gigs.payoutSUSPENDED", tone: "danger" } };

/** The four conditions, ticked or not, with the operator's switch above them when it is off. */
export function PaidGateList({ gate }: { gate: GigPaidGate }) {
  const t = useT();
  const th = useTheme();
  const rows: [boolean, string][] = [
    [gate.kycVerified, t("gigs.gateKyc")],
    [gate.payoutActive, t("gigs.gatePayout")],
    [gate.mentoringOffer, t("gigs.gateMentoring", { days: MENTORING_OFFER_DAYS })],
    [gate.dutyDone, gate.dutyDone ? t("gigs.gateDuty") : t("gigs.gateDutyOwed", { count: gate.oneToOnesOwed })],
  ];
  return (
    <View style={{ gap: th.space[1] }}>
      {!gate.paymentsOn ? (
        <Text variant="sm" tone="muted">
          {t("gigs.gateOff")}
        </Text>
      ) : null}
      {rows.map(([done, label]) => (
        <Text key={label} variant="sm" tone={done ? "muted" : "fg"}>
          {`${done ? "✓" : "○"} ${label}`}
        </Text>
      ))}
    </View>
  );
}

type PayeeForm = { payeeName: string; bankAccount: string; ifsc: string; pan: string; addressLine: string; city: string; postalCode: string; phone: string; gstStateCode: string; gstin: string };
const EMPTY_FORM: PayeeForm = { payeeName: "", bankAccount: "", ifsc: "", pan: "", addressLine: "", city: "", postalCode: "", phone: "", gstStateCode: "", gstin: "" };
type RouteStatus = ExpertPayout["payout"]["route"]["status"];
/** Where Razorpay's review of the expert's linked account stands, as the web card's badge. */
export const ROUTE_STATUS: Record<RouteStatus, { label: TranslationKey; tone: "muted" | "accent" | "warn" | "ok" | "danger" }> = {
  NONE: { label: "gigs.routeStatusNONE", tone: "muted" },
  REQUESTED: { label: "gigs.routeStatusREQUESTED", tone: "accent" },
  UNDER_REVIEW: { label: "gigs.routeStatusUNDER_REVIEW", tone: "accent" },
  NEEDS_CLARIFICATION: { label: "gigs.routeStatusNEEDS_CLARIFICATION", tone: "warn" },
  ACTIVATED: { label: "gigs.routeStatusACTIVATED", tone: "ok" },
  SUSPENDED: { label: "gigs.routeStatusSUSPENDED", tone: "danger" },
};

/**
 * "Get paid": what the expert's Razorpay Route linked account is made from,
 * saved by them, and then the link itself. Once linked, the name, PAN and
 * address are Razorpay's and their boxes are shut; a new bank account can be
 * saved and sent again.
 */
export function GetPaidCard() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: PAYOUT_KEY, queryFn: async () => expertPayoutSchema.parse(unwrap(await api().get("/api/v1/expert/payout"))) });
  const [editing, setEditing] = useState<PayeeForm | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: async (form: PayeeForm) => {
      const result = await api().post("/api/v1/expert/payout", { payeeName: form.payeeName, bankAccount: form.bankAccount || null, ifsc: form.ifsc || null, pan: form.pan || null, addressLine: form.addressLine, city: form.city, postalCode: form.postalCode, phone: form.phone, gstStateCode: form.gstStateCode, gstin: form.gstin || null });
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return expertPayoutSchema.parse(result.data);
    },
    onMutate: () => setSaid(null),
    onSuccess: (next) => {
      qc.setQueryData(PAYOUT_KEY, next);
      setEditing(null);
      setSaid(t("gigs.payoutLinked"));
      void qc.invalidateQueries({ queryKey: ["gigs", "slots"] });
    },
  });
  const link = useMutation({
    mutationFn: async () => {
      const result = await api().post("/api/v1/expert/payout/link");
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return expertRouteLinkedSchema.parse(result.data);
    },
    onMutate: () => setSaid(null),
    onSuccess: (next) => {
      qc.setQueryData(PAYOUT_KEY, { payout: next.payout, gate: next.gate });
      setSaid(t("gigs.routeSent"));
      void qc.invalidateQueries({ queryKey: ["gigs", "slots"] });
    },
  });
  const d = query.data;
  const payout = d?.payout;
  const route = payout?.route;
  const startEditing = () => {
    setSaid(null);
    setEditing({ ...EMPTY_FORM, payeeName: payout?.payeeName ?? "", ifsc: payout?.ifsc ?? "", addressLine: payout?.addressLine ?? "", city: payout?.city ?? "", postalCode: payout?.postalCode ?? "", phone: payout?.phone ?? "", gstStateCode: payout?.gstStateCode ?? "", gstin: payout?.gstin ?? "" });
  };
  const form = editing ?? (d && !payout?.payeeName ? EMPTY_FORM : null);
  const set = (key: keyof PayeeForm) => (value: string) => setEditing((f) => ({ ...(f ?? EMPTY_FORM), [key]: value }));
  const locked = Boolean(route?.locked);
  const linkLabel: TranslationKey = !route?.linked ? "gigs.routeLink" : route.needsResend ? "gigs.routeResend" : "gigs.routeCheck";
  const canLink = Boolean(payout && route && payout.transport !== "off" && payout.status !== "SUSPENDED" && route.readyToLink && !form);
  const failed = save.error ?? link.error;
  return (
    <Card title={t("gigs.getPaidTitle")} action={payout ? <Pill label={t(PAYOUT_STATUS[payout.status].label)} tone={PAYOUT_STATUS[payout.status].tone} /> : undefined}>
      <Text variant="sm" tone="muted">
        {t("gigs.getPaidBody")}
      </Text>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {failed && (save.isError || link.isError) ? <Failed message={failed.message} /> : null}
      {said && !editing ? (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok" accessibilityLiveRegion="polite">
            {said}
          </Text>
        </Note>
      ) : null}
      {d && payout && route ? (
        <View style={{ gap: th.space[2] }}>
          {payout.note ? (
            <Text variant="sm" tone="muted">
              {t("gigs.payoutNote", { note: payout.note })}
            </Text>
          ) : null}
          {!d.gate.kycVerified ? (
            <Text variant="sm" tone="muted">
              {t("gigs.payoutNeedKyc")}
            </Text>
          ) : null}
          {payout.transport === "off" ? (
            <Text variant="sm" tone="muted">
              {t("gigs.payoutOff")}
            </Text>
          ) : null}
          {!form && payout.payeeName ? (
            <View style={{ gap: th.space[1] }}>
              <Text variant="sm" bold>
                {payout.payeeName}
              </Text>
              {payout.bankLast4 ? (
                <Text variant="xs" tone="muted">
                  {t("gigs.payeeBankLine", { last4: payout.bankLast4, ifsc: payout.ifsc ?? "" })}
                </Text>
              ) : null}
              {payout.panLast4 ? (
                <Text variant="xs" tone="muted">
                  {t("gigs.payeePanLine", { last4: payout.panLast4 })}
                </Text>
              ) : null}
              {payout.addressLine ? (
                <Text variant="xs" tone="muted">
                  {[payout.addressLine, payout.city, payout.postalCode].filter(Boolean).join(", ")}
                </Text>
              ) : null}
              <Text variant="xs" tone="muted">
                {[t("gigs.opPayeeState", { code: payout.gstStateCode ?? "" }), payout.gstin ? t("gigs.opPayeeGstin", { gstin: payout.gstin }) : null].filter(Boolean).join(" · ")}
              </Text>
            </View>
          ) : null}
          {payout.payeeName ? (
            <View style={{ gap: th.space[1], padding: th.space[3], borderWidth: 1, borderColor: th.border, borderRadius: th.radius.md }}>
              <Pill label={t(ROUTE_STATUS[route.status].label)} tone={ROUTE_STATUS[route.status].tone} />
              {route.needsResend ? (
                <Text variant="sm" tone="warn">
                  {t("gigs.routeNeedsResend")}
                </Text>
              ) : null}
              {route.requirements.map((r) => (
                <Text key={`${r.field}-${r.reason}`} variant="xs" tone="muted">
                  {t("gigs.routeRequirement", { field: r.field })}
                </Text>
              ))}
              {route.error ? (
                <Text variant="xs" tone="danger">
                  {t("gigs.routeErrorLine", { error: route.error })}
                </Text>
              ) : null}
              {route.checkedAt ? (
                <Text variant="xs" tone="muted">
                  {t("gigs.routeCheckedLine", { date: formatInstant(route.checkedAt, locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }, "Asia/Kolkata") })}
                </Text>
              ) : null}
              {!route.linked && !d.gate.kycVerified ? (
                <Text variant="xs" tone="muted">
                  {t("gigs.routeWaitsForKyc")}
                </Text>
              ) : null}
            </View>
          ) : null}
          {form ? (
            <View style={{ gap: th.space[2] }}>
              <Text variant="xs" tone="muted">
                {t("gigs.payeeHow")}
              </Text>
              {locked ? (
                <Text variant="xs" tone="muted">
                  {t("gigs.routeLocked")}
                </Text>
              ) : null}
              <Field label={t("gigs.payeeLabelName")} value={form.payeeName} onChangeText={set("payeeName")} maxLength={80} autoComplete="name" editable={!locked} />
              <Field label={t("gigs.payeePan")} hint={payout.panLast4 ? t("gigs.payeeKeepBlank") : t("gigs.payeePanHint")} value={form.pan} onChangeText={set("pan")} maxLength={12} autoCapitalize="characters" autoComplete="off" editable={!locked} placeholder={payout.panLast4 ? `•••••••${payout.panLast4}` : undefined} />
              <Field label={t("gigs.payeeBankAccount")} hint={payout.bankLast4 ? t("gigs.payeeKeepBlank") : undefined} value={form.bankAccount} onChangeText={set("bankAccount")} maxLength={30} keyboardType="number-pad" autoComplete="off" placeholder={payout.bankLast4 ? `•••• ${payout.bankLast4}` : undefined} />
              <Field label={t("gigs.payeeIfsc")} value={form.ifsc} onChangeText={set("ifsc")} maxLength={20} autoCapitalize="characters" autoComplete="off" />
              <Field label={t("gigs.payeeAddress")} value={form.addressLine} onChangeText={set("addressLine")} maxLength={100} autoComplete="street-address" editable={!locked} />
              <Field label={t("gigs.payeeCity")} value={form.city} onChangeText={set("city")} maxLength={60} autoComplete="postal-address-locality" editable={!locked} />
              <Field label={t("gigs.payeePostalCode")} value={form.postalCode} onChangeText={set("postalCode")} maxLength={6} keyboardType="number-pad" autoComplete="postal-code" editable={!locked} />
              <Field label={t("gigs.payeeMobile")} value={form.phone} onChangeText={set("phone")} maxLength={14} keyboardType="phone-pad" autoComplete="tel" />
              <Field label={t("gigs.payeeState")} hint={t("gigs.payeeStateHint")} value={form.gstStateCode} onChangeText={set("gstStateCode")} maxLength={2} keyboardType="number-pad" editable={!locked} />
              <Field label={t("gigs.payeeGstin")} value={form.gstin} onChangeText={set("gstin")} maxLength={20} autoCapitalize="characters" autoComplete="off" />
              <Button label={t("gigs.payoutLink")} busy={save.isPending} onPress={() => save.mutate(form)} />
              {payout.payeeName ? <Button label={t("common.cancel")} variant="ghost" onPress={() => setEditing(null)} /> : null}
            </View>
          ) : null}
          {!form && payout.payeeName ? (
            <>
              <Button label={t(linkLabel)} busy={link.isPending} disabled={!canLink} onPress={() => link.mutate()} />
              <Button label={t("common.edit")} variant="secondary" onPress={startEditing} />
            </>
          ) : null}
          <Text variant="sm" bold>
            {t("gigs.gateTitle")}
          </Text>
          <PaidGateList gate={d.gate} />
        </View>
      ) : null}
    </Card>
  );
}

/** Earnings: on hold, released (or due and paid by hand before Route) and refunded; seat by seat with the three figures, payout by payout, and the invoices. */
export function EarningsCard() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const query = useQuery({ queryKey: EARNINGS_KEY, queryFn: async () => expertEarningsSchema.parse(unwrap(await api().get("/api/v1/expert/earnings"))) });
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const d = query.data;
  const when = (iso: string) => formatInstant(iso, locale, { day: "numeric", month: "short" }, "Asia/Kolkata");
  const openInvoice = async (invoiceId: string, number: string) => {
    setPdfBusy(invoiceId);
    setPdfError(null);
    const fallback = t("common.somethingWrong");
    const got = await bytesApi.get(`/api/v1/expert/invoices/${encodeURIComponent(invoiceId)}/pdf`, fallback);
    const error = got.ok ? await shareBytes(got, `${number}.pdf`, fallback) : got.error;
    setPdfError(error);
    setPdfBusy(null);
  };
  return (
    <Card title={t("gigs.earningsTitle")}>
      <Text variant="sm" tone="muted">
        {t("gigs.earningsIntro")}
      </Text>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {pdfError ? <Failed message={pdfError} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Stat label={t("gigs.earningsHeld")} value={money(d.heldPaise, locale)} tone="warn" />
            {d.duePaise > 0 ? <Stat label={t("gigs.earningsDue")} value={money(d.duePaise, locale)} tone="accent" /> : null}
            <Stat label={t("gigs.earningsReleased")} value={money(d.releasedPaise + d.paidOutPaise, locale)} tone="ok" />
            <Stat label={t("gigs.earningsRefunded")} value={money(d.refundedPaise, locale)} />
          </View>
          {d.rows.length === 0 ? (
            <Text variant="sm" tone="muted">
              {t("gigs.earningsNone")}
            </Text>
          ) : (
            d.rows.map((r) => (
              <View key={r.paymentId} style={{ gap: th.space[1], paddingVertical: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
                <Text variant="base" bold>
                  {r.title}
                </Text>
                <Text variant="xs" tone="muted">
                  {[
                    when(r.startsAt),
                    r.schoolName,
                    r.status === "REFUNDED" ? t("gigs.refundLine", { amount: money(r.amountPaise, locale) }) : t("gigs.earningsFigures", { net: money(r.netPaise, locale), amount: money(r.amountPaise, locale), commission: money(r.commissionPaise, locale), gst: money(r.gstPaise, locale) }),
                    (r.status === "HELD" || r.status === "PAID") && r.holdUntil ? t("gigs.holdUntilLine", { date: when(r.holdUntil) }) : null,
                    r.status === "DUE" && r.dueAt ? t("gigs.dueAtLine", { date: when(r.dueAt) }) : null,
                    r.status === "RELEASED" && r.releasedAt ? t("gigs.releasedAtLine", { date: when(r.releasedAt) }) : null,
                    r.status === "PAID_OUT" && r.paidOutAt ? when(r.paidOutAt) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
                <Pill label={t(PAYMENT_STATUS[r.status].label)} tone={PAYMENT_STATUS[r.status].tone} />
              </View>
            ))
          )}
          {d.payouts.length > 0 ? (
            <View style={{ gap: th.space[1] }}>
              <Text variant="sm" bold>
                {t("gigs.payoutsTitle")}
              </Text>
              {d.payouts.map((p) => (
                <Text key={p.id} variant="xs" tone="muted">
                  {[
                    p.status === "PAID" || p.status === "RELEASED" ? t("gigs.payoutLine", { amount: money(p.netPaise, locale), count: p.paymentsCount }) : t("gigs.payoutOpenLine", { amount: money(p.netPaise, locale), count: p.paymentsCount }),
                    p.status === "RELEASED" && p.paidAt ? t("gigs.opReleasedLine", { date: when(p.paidAt) }) : p.status === "PAID" && p.paidAt ? t("gigs.paidOutLine", { date: when(p.paidAt), reference: p.reference ?? "" }) : when(p.createdAt),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              ))}
            </View>
          ) : null}
          <View style={{ gap: th.space[1] }}>
            <Text variant="sm" bold>
              {t("gigs.invoicesTitle")}
            </Text>
            {d.invoices.length === 0 ? (
              <Text variant="xs" tone="muted">
                {t("gigs.invoicesNone")}
              </Text>
            ) : (
              d.invoices.map((i) => (
                <View key={i.id} style={{ gap: th.space[1] }}>
                  <Text variant="xs" tone="muted">
                    {t("gigs.invoiceLine", { number: i.number, date: when(i.issuedAt), total: money(i.totalPaise, locale) })}
                  </Text>
                  <Button label={t("gigs.invoicePdf")} variant="secondary" accessibilityLabel={[t("gigs.invoicePdf"), i.number].join(": ")} busy={pdfBusy === i.id} onPress={() => void openInvoice(i.id, i.number)} />
                </View>
              ))
            )}
          </View>
        </>
      ) : null}
    </Card>
  );
}
