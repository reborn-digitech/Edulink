import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expertEarningsSchema, expertPayoutSchema, type ExpertPayout, type GigPaidGate } from "@edulink/contracts";
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
 * The expert's side of paid seats (decision 0004, second amendment of
 * 2 October 2026) — the web's "Get paid" card and /expert/earnings: where
 * the company pays them from its own bank (a name, a UPI id or a bank
 * account and IFSC, the GST state, a GSTIN if any; the account number is
 * sealed on the server and comes back as its last four digits only), the
 * four conditions before a workshop seat may be priced as a checklist, and
 * what is on hold, due, paid and refunded seat by seat with the fee the
 * company collected, its commission, the GST on it and the net — the
 * payouts with the company's transfer reference, and each tax invoice as a
 * PDF through the share sheet.
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

type PayeeForm = { payeeName: string; upiId: string; bankAccount: string; ifsc: string; gstStateCode: string; gstin: string };

/** "Get paid": where the company pays the expert, saved by them; active once KYC is verified. */
export function GetPaidCard() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: PAYOUT_KEY, queryFn: async () => expertPayoutSchema.parse(unwrap(await api().get("/api/v1/expert/payout"))) });
  const [editing, setEditing] = useState<PayeeForm | null>(null);
  const save = useMutation({
    mutationFn: async (form: PayeeForm) => {
      const result = await api().post("/api/v1/expert/payout", { payeeName: form.payeeName, upiId: form.upiId || null, bankAccount: form.bankAccount || null, ifsc: form.ifsc || null, gstStateCode: form.gstStateCode, gstin: form.gstin || null });
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return expertPayoutSchema.parse(result.data);
    },
    onSuccess: (next) => {
      qc.setQueryData(PAYOUT_KEY, next);
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["gigs", "slots"] });
    },
  });
  const d = query.data;
  const payout = d?.payout;
  const startEditing = () => setEditing({ payeeName: payout?.payeeName ?? "", upiId: payout?.upiId ?? "", bankAccount: "", ifsc: payout?.ifsc ?? "", gstStateCode: payout?.gstStateCode ?? "", gstin: payout?.gstin ?? "" });
  const form = editing ?? (d && !payout?.payeeName ? { payeeName: "", upiId: "", bankAccount: "", ifsc: "", gstStateCode: "", gstin: "" } : null);
  const set = (key: keyof PayeeForm) => (value: string) => setEditing((f) => ({ ...(f ?? { payeeName: "", upiId: "", bankAccount: "", ifsc: "", gstStateCode: "", gstin: "" }), [key]: value }));
  return (
    <Card title={t("gigs.getPaidTitle")} action={payout ? <Pill label={t(PAYOUT_STATUS[payout.status].label)} tone={PAYOUT_STATUS[payout.status].tone} /> : undefined}>
      <Text variant="sm" tone="muted">
        {t("gigs.getPaidBody")}
      </Text>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {save.isError ? <Failed message={save.error.message} /> : null}
      {save.isSuccess && !editing ? (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok" accessibilityLiveRegion="polite">
            {t("gigs.payoutLinked")}
          </Text>
        </Note>
      ) : null}
      {d && payout ? (
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
              <Text variant="xs" tone="muted">
                {[payout.upiId ? t("gigs.payeeUpiLine", { upiId: payout.upiId }) : payout.bankLast4 ? t("gigs.payeeBankLine", { last4: payout.bankLast4, ifsc: payout.ifsc ?? "" }) : null, t("gigs.opPayeeState", { code: payout.gstStateCode ?? "" }), payout.gstin ? t("gigs.opPayeeGstin", { gstin: payout.gstin }) : null].filter(Boolean).join(" · ")}
              </Text>
              <Button label={t("common.edit")} variant="secondary" onPress={startEditing} />
            </View>
          ) : null}
          {form ? (
            <View style={{ gap: th.space[2] }}>
              <Text variant="xs" tone="muted">
                {t("gigs.payeeHow")}
              </Text>
              <Field label={t("gigs.payeeLabelName")} value={form.payeeName} onChangeText={set("payeeName")} maxLength={80} />
              <Field label={t("gigs.payeeUpi")} value={form.upiId} onChangeText={set("upiId")} maxLength={300} autoCapitalize="none" />
              <Field label={t("gigs.payeeBankAccount")} value={form.bankAccount} onChangeText={set("bankAccount")} maxLength={30} keyboardType="number-pad" placeholder={payout.bankLast4 ? `•••• ${payout.bankLast4}` : undefined} />
              <Field label={t("gigs.payeeIfsc")} value={form.ifsc} onChangeText={set("ifsc")} maxLength={20} autoCapitalize="characters" />
              <Field label={t("gigs.payeeState")} hint={t("gigs.payeeStateHint")} value={form.gstStateCode} onChangeText={set("gstStateCode")} maxLength={2} keyboardType="number-pad" />
              <Field label={t("gigs.payeeGstin")} value={form.gstin} onChangeText={set("gstin")} maxLength={20} autoCapitalize="characters" />
              <Button label={t("gigs.payoutLink")} busy={save.isPending} onPress={() => save.mutate(form)} />
              {payout.payeeName ? <Button label={t("common.cancel")} variant="ghost" onPress={() => setEditing(null)} /> : null}
            </View>
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

/** Earnings: on hold, due, paid and refunded; seat by seat with the three figures, payout by payout, and the invoices. */
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
            <Stat label={t("gigs.earningsDue")} value={money(d.duePaise, locale)} tone="accent" />
            <Stat label={t("gigs.earningsReleased")} value={money(d.paidOutPaise, locale)} tone="ok" />
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
                  {[p.status === "PAID" ? t("gigs.payoutLine", { amount: money(p.netPaise, locale), count: p.paymentsCount }) : t("gigs.payoutOpenLine", { amount: money(p.netPaise, locale), count: p.paymentsCount }), p.status === "PAID" && p.paidAt ? t("gigs.paidOutLine", { date: when(p.paidAt), reference: p.reference ?? "" }) : when(p.createdAt)].filter(Boolean).join(" · ")}
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
