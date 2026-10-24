import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gigMyContributionsSchema, type GigContribution } from "@edulink/contracts";
import { formatPaise, type TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Loading, Row, Screen, Stat, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Note, Pill } from "@/screens/family/shared";

/**
 * A teacher's questions for the shared practice bank — the web's
 * /teacher/contributions: the rule they are paid by, where they stand against
 * it, every question they have sent with what the content team said to it,
 * and where the company pays them. A question opens on its own screen.
 */
export const CONTRIBUTIONS_KEY = ["gigs", "questions"] as const;
export const CONTRIBUTION_STATUS: Record<GigContribution["status"], { label: TranslationKey; tone: "muted" | "ok" | "warn" | "danger" | "accent" }> = {
  SUBMITTED: { label: "gigs.statusSUBMITTED", tone: "accent" },
  RETURNED: { label: "gigs.statusRETURNED", tone: "warn" },
  ACCEPTED: { label: "gigs.statusACCEPTED", tone: "ok" },
  REJECTED: { label: "gigs.statusREJECTED", tone: "danger" },
  WITHDRAWN: { label: "gigs.statusWITHDRAWN", tone: "muted" },
};

export function TeacherContributions() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const [upiId, setUpiId] = useState<string | null>(null);
  const [payeeName, setPayeeName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const money = (paise: number) => formatPaise(paise, locale);

  const query = useQuery({ queryKey: CONTRIBUTIONS_KEY, queryFn: async () => gigMyContributionsSchema.parse(unwrap(await api().get("/api/v1/gigs/questions"))) });
  const d = query.data;
  const save = useMutation({
    mutationFn: async () => {
      const result = await api().post("/api/v1/gigs/payee", { upiId: upiId ?? d?.payee?.upiId ?? "", payeeName: payeeName ?? d?.payee?.payeeName ?? "" });
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return result.data;
    },
    onSuccess: () => {
      setError(null);
      setSaved(true);
      void qc.invalidateQueries({ queryKey: CONTRIBUTIONS_KEY });
    },
    onError: (e) => {
      setSaved(false);
      setError(e.message);
    },
  });
  const earned = (c: GigContribution) => (!c.earning ? null : c.earning.basis === "FREE_BLOCK" ? t("gigs.earnedFree", { free: d?.settings.questionFreeCount ?? 0 }) : t(c.earning.paid ? "gigs.earnedPaid" : "gigs.earnedDue", { amount: money(c.earning.amountPaise) }));

  return (
    <Screen title={t("gigs.title")} description={t("gigs.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} planFrom={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Note tone="accent">
            <Text variant="sm">{t("gigs.ruleLine", { free: d.settings.questionFreeCount, rate: money(d.settings.questionRatePaise), cap: d.settings.questionMonthlyCap })}</Text>
          </Note>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Stat label={t("gigs.standingAdded")} value={d.standing.accepted} tone="ok" />
            <Stat label={t("gigs.standingFreeLeft")} value={d.standing.freeLeft} />
            <Stat label={t("gigs.standingPaidMonth")} value={[d.standing.paidThisMonth, d.settings.questionMonthlyCap].join(" / ")} />
            <Stat label={t("gigs.standingDue")} value={money(d.standing.duePaise)} tone="accent" />
            <Stat label={t("gigs.standingPaid")} value={money(d.standing.paidPaise)} />
          </View>
          <Text variant="xs" tone="muted">
            {t("gigs.limitsLine", { sent: d.standing.sentToday, daily: d.settings.questionDailyLimit, waiting: d.standing.waiting, pending: d.settings.questionPendingLimit })}
          </Text>
          <Button label={t("gigs.newQuestion")} onPress={() => router.push("/(app)/contribution" as never)} />

          <Card title={t("gigs.yours")}>
            {d.contributions.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("gigs.noneYet")}
              </Text>
            ) : (
              d.contributions.map((c) => (
                <Row
                  key={c.id}
                  title={c.en.stem}
                  caption={[t("appadmin.classN", { n: c.topic.classLevel }), c.topic.name, earned(c)].filter(Boolean).join(" · ")}
                  right={<Pill label={t(CONTRIBUTION_STATUS[c.status].label)} tone={CONTRIBUTION_STATUS[c.status].tone} />}
                  onPress={() => router.push({ pathname: "/(app)/contribution", params: { id: c.id } } as never)}
                />
              ))
            )}
          </Card>

          <Card title={t("gigs.payeeTitle")}>
            <Text variant="xs" tone="muted">
              {t("gigs.payeeIntro")}
            </Text>
            {error ? <Failed message={error} /> : null}
            {saved ? (
              <Note tone="ok">
                <Text variant="sm" bold tone="ok" accessibilityLiveRegion="polite">
                  {t("gigs.payeeSaved")}
                </Text>
              </Note>
            ) : null}
            <Field label={t("gigs.upiId")} value={upiId ?? d.payee?.upiId ?? ""} onChangeText={setUpiId} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" maxLength={320} />
            <Field label={t("gigs.payeeName")} value={payeeName ?? d.payee?.payeeName ?? ""} onChangeText={setPayeeName} maxLength={80} />
            <Button label={t("gigs.savePayee")} variant="secondary" busy={save.isPending} onPress={() => save.mutate()} />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
