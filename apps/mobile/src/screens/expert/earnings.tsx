import { Linking, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expertEarningsSchema, expertPayoutSchema, type ExpertPayout, type GigPaidGate } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Loading, Stat, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatInstant, Note, Pill } from "@/screens/family/shared";
import { money } from "@/screens/shared/fees";
import { MENTORING_OFFER_DAYS, PAYMENT_STATUS } from "@/screens/shared/gigs";

/**
 * The expert's side of paid seats (decision 0004, amended 2026-10-02) — the
 * web's "Get paid" card and /expert/earnings: the account the gateway pays a
 * seat's money into, linked once after KYC; the four conditions before a
 * workshop seat may be priced, as a checklist; and what is on hold, paid out
 * and refunded, seat by seat.
 */
export const PAYOUT_KEY = ["expert", "payout"] as const;
export const EARNINGS_KEY = ["expert", "earnings"] as const;
const PAYOUT_STATUS: Record<ExpertPayout["payout"]["status"], { label: TranslationKey; tone: "muted" | "warn" | "ok" }> = { NONE: { label: "gigs.payoutNONE", tone: "muted" }, PENDING: { label: "gigs.payoutPENDING", tone: "warn" }, ACTIVE: { label: "gigs.payoutACTIVE", tone: "ok" } };

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
    <View style={{ gap: th.space[1] }} accessibilityRole="list">
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

/** "Get paid": where the expert is paid, linked once; KYC first. */
export function GetPaidCard() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: PAYOUT_KEY, queryFn: async () => expertPayoutSchema.parse(unwrap(await api().get("/api/v1/expert/payout"))) });
  const link = useMutation({
    mutationFn: async () => {
      const result = await api().post("/api/v1/expert/payout/link");
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return expertPayoutSchema.parse(result.data);
    },
    onSuccess: (next) => {
      qc.setQueryData(PAYOUT_KEY, next);
      void qc.invalidateQueries({ queryKey: ["gigs", "slots"] });
    },
  });
  const d = query.data;
  return (
    <Card title={t("gigs.getPaidTitle")} action={d ? <Pill label={t(PAYOUT_STATUS[d.payout.status].label)} tone={PAYOUT_STATUS[d.payout.status].tone} /> : undefined}>
      <Text variant="sm" tone="muted">
        {t("gigs.getPaidBody")}
      </Text>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {link.isError ? <Failed message={link.error.message} /> : null}
      {link.isSuccess ? (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok" accessibilityLiveRegion="polite">
            {t("gigs.payoutLinked")}
          </Text>
        </Note>
      ) : null}
      {d ? (
        <View style={{ gap: th.space[2] }}>
          {d.payout.note ? (
            <Text variant="sm" tone="muted">
              {t("gigs.payoutNote", { note: d.payout.note })}
            </Text>
          ) : null}
          {!d.gate.kycVerified ? (
            <Text variant="sm" tone="muted">
              {t("gigs.payoutNeedKyc")}
            </Text>
          ) : null}
          {d.payout.transport === "off" ? (
            <Text variant="sm" tone="muted">
              {t("gigs.payoutOff")}
            </Text>
          ) : null}
          {d.payout.status !== "ACTIVE" && d.payout.transport !== "off" ? <Button label={t("gigs.payoutLink")} busy={link.isPending} disabled={!d.gate.kycVerified} onPress={() => link.mutate()} /> : null}
          {d.payout.status === "PENDING" && d.payout.onboardingUrl ? <Button label={t("gigs.payoutOnboarding")} variant="secondary" onPress={() => void Linking.openURL(d.payout.onboardingUrl!)} /> : null}
          <Text variant="sm" bold>
            {t("gigs.gateTitle")}
          </Text>
          <PaidGateList gate={d.gate} />
        </View>
      ) : null}
    </Card>
  );
}

/** Earnings: on hold, paid out, refunded; seat by seat and payout by payout. */
export function EarningsCard() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const query = useQuery({ queryKey: EARNINGS_KEY, queryFn: async () => expertEarningsSchema.parse(unwrap(await api().get("/api/v1/expert/earnings"))) });
  const d = query.data;
  const when = (iso: string) => formatInstant(iso, locale, { day: "numeric", month: "short" }, "Asia/Kolkata");
  return (
    <Card title={t("gigs.earningsTitle")}>
      <Text variant="sm" tone="muted">
        {t("gigs.earningsIntro")}
      </Text>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Stat label={t("gigs.earningsHeld")} value={money(d.heldPaise, locale)} tone="warn" />
            <Stat label={t("gigs.earningsReleased")} value={money(d.releasedPaise, locale)} tone="ok" />
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
                  {[when(r.startsAt), r.schoolName, t("gigs.earningsNet", { net: money(r.netPaise, locale), amount: money(r.amountPaise, locale) }), r.status === "HELD" && r.holdUntil ? t("gigs.holdUntilLine", { date: when(r.holdUntil) }) : null, r.settlementId ? t("gigs.settlementRef", { ref: r.settlementId }) : null].filter(Boolean).join(" · ")}
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
                  {[t("gigs.payoutLine", { amount: money(p.amountPaise, locale), count: p.transfers }), when(p.createdAt), p.settlementId ? t("gigs.settlementRef", { ref: p.settlementId }) : null].filter(Boolean).join(" · ")}
                </Text>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
