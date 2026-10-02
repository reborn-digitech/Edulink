import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gigPayoutsSchema } from "@edulink/contracts";
import {
  Button,
  Card,
  Failed,
  Loading,
  Screen,
  Stat,
  Text,
} from "@/components";
import { SwitchRow } from "@/components/switch-row";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatInstant, Note } from "@/screens/family/shared";
import { money } from "@/screens/shared/fees";

/**
 * Paid seats on the operator's console — the web's Payouts card on
 * /root/gigs: the kill switch, the month's commission, what the gateway
 * holds for experts, the releases and refunds that failed and wait to be
 * tried again, and the payouts released. The platform holds no money; the
 * service pays each expert directly (decision 0004 as amended).
 */
const KEY = ["operator", "gigs", "payouts"] as const;

export function OperatorPayouts() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [said, setSaid] = useState<string | null>(null);
  const [failedSaid, setFailedSaid] = useState<string | null>(null);
  const query = useQuery({
    queryKey: KEY,
    queryFn: async () =>
      gigPayoutsSchema.parse(
        unwrap(await api().get("/api/v1/operator/gigs/payouts")),
      ),
  });
  const settle = {
    onSuccess: (line: string) => {
      setFailedSaid(null);
      setSaid(line);
      void qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (e: Error) => {
      setSaid(null);
      setFailedSaid(e.message);
    },
  };
  const flip = useMutation({
    mutationFn: async (on: boolean) => {
      const result = await api().post("/api/v1/operator/gigs/payouts/switch", {
        on,
      });
      if (!result.ok)
        throw new Error(errorText(result, t("common.somethingWrong")));
      return t("gigs.opSwitched");
    },
    ...settle,
  });
  const retry = useMutation({
    mutationFn: async (paymentId: string) => {
      const result = await api().post(
        `/api/v1/operator/gigs/payouts/${paymentId}/retry`,
      );
      if (!result.ok)
        throw new Error(errorText(result, t("common.somethingWrong")));
      return t("gigs.opRetried", {
        outcome: String((result.data as { outcome?: string }).outcome ?? ""),
      });
    },
    ...settle,
  });
  const d = query.data;
  const when = (iso: string) =>
    formatInstant(
      iso,
      locale,
      { day: "numeric", month: "short" },
      "Asia/Kolkata",
    );

  return (
    <Screen
      title={t("gigs.opPayoutsTitle")}
      description={t("gigs.opPayoutsIntro")}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {query.isPending ? <Loading /> : null}
      {query.isError ? (
        <Failed
          message={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {failedSaid ? <Failed message={failedSaid} /> : null}
      {said ? (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok" accessibilityLiveRegion="polite">
            {said}
          </Text>
        </Note>
      ) : null}
      {d ? (
        <>
          <Card>
            <SwitchRow
              label={
                d.paymentsEnabled ? t("gigs.opSwitchOn") : t("gigs.opSwitchOff")
              }
              hint={t("gigs.opTransport", { transport: d.transport })}
              value={d.paymentsEnabled}
              disabled={flip.isPending}
              onChange={(next) => flip.mutate(next)}
            />
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: th.space[2],
              }}
            >
              <Stat
                label={t("gigs.opCommission")}
                value={money(d.commissionThisMonthPaise, locale)}
                tone="accent"
              />
              <Stat
                label={t("gigs.opHeld")}
                value={money(d.heldPaise, locale)}
                tone="warn"
              />
              <Stat
                label={t("gigs.opReleased")}
                value={money(d.releasedThisMonthPaise, locale)}
                tone="ok"
              />
              <Stat
                label={t("gigs.opRefunded")}
                value={money(d.refundedThisMonthPaise, locale)}
              />
            </View>
          </Card>
          <Card title={t("gigs.opFailures")}>
            {d.failures.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("gigs.opFailuresNone")}
              </Text>
            ) : (
              d.failures.map((f) => (
                <View
                  key={f.paymentId}
                  style={{
                    gap: th.space[1],
                    paddingVertical: th.space[2],
                    borderTopWidth: 1,
                    borderTopColor: th.border,
                  }}
                >
                  <Text variant="sm" bold>
                    {[
                      f.expertName,
                      money(f.amountPaise, locale),
                      t(`gigs.opAction${f.action}`),
                      t("gigs.opAttempts", { count: f.attempts }),
                    ].join(" · ")}
                  </Text>
                  {f.lastError ? (
                    <Text variant="xs" tone="muted">
                      {f.lastError}
                    </Text>
                  ) : null}
                  <Button
                    label={t("gigs.opRetry")}
                    variant="secondary"
                    accessibilityLabel={[t("gigs.opRetry"), f.expertName].join(
                      ": ",
                    )}
                    busy={retry.isPending && retry.variables === f.paymentId}
                    onPress={() => retry.mutate(f.paymentId)}
                  />
                </View>
              ))
            )}
          </Card>
          <Card title={t("gigs.payoutsTitle")}>
            {d.payouts.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("gigs.opPayoutsNone")}
              </Text>
            ) : (
              d.payouts.map((p) => (
                <View
                  key={p.id}
                  style={{
                    gap: th.space[1],
                    paddingVertical: th.space[2],
                    borderTopWidth: 1,
                    borderTopColor: th.border,
                  }}
                >
                  <Text variant="sm" bold>
                    {[
                      p.expertName,
                      t("gigs.payoutLine", {
                        amount: money(p.amountPaise, locale),
                        count: p.transfers,
                      }),
                    ].join(" · ")}
                  </Text>
                  <Text variant="xs" tone="muted">
                    {[
                      when(p.createdAt),
                      p.status,
                      p.settlementId
                        ? t("gigs.settlementRef", { ref: p.settlementId })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
