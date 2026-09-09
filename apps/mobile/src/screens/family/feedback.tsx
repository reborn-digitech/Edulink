import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyReviewsSchema, okSchema } from "@edulink/contracts";
import type { z } from "zod";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Icon, Loading, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { formatDateKey, Note } from "./shared";

type Pending = z.infer<typeof familyReviewsSchema>["pending"][number];

/** The web's REVIEW_QUESTIONS and QUESTION_KEY: five fixed questions, in this order, keys not words. */
const QUESTIONS: { id: string; label: TranslationKey }[] = [
  { id: "CLARITY", label: "reviews.qClarity" },
  { id: "SUPPORT", label: "reviews.qSupport" },
  { id: "FAIRNESS", label: "reviews.qFairness" },
  { id: "ENGAGEMENT", label: "reviews.qEngagement" },
  { id: "RESPECT", label: "reviews.qRespect" },
];
const SCALE = [1, 2, 3, 4, 5];

/**
 * Feedback — the web's /reviews for a pupil or a guardian: every open
 * questionnaire about a teacher who teaches them (or their child), five
 * stars a question and no text box anywhere, which is the design. An answer
 * can be amended while the round is open, and the card says which state it
 * is in. Names are never shown to the teacher — only averages.
 */
export function FamilyFeedback() {
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [savedFor, setSavedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isFamily = role === "STUDENT" || role === "PARENT";
  const query = useQuery({
    queryKey: ["family", "reviews"],
    enabled: isFamily,
    queryFn: async () => familyReviewsSchema.parse(unwrap(await api().get("/api/v1/family/reviews"))),
  });
  const send = useMutation({
    mutationFn: async (body: { roundId: string; teacherMembershipId: string; scores: Record<string, number> }) => {
      const result = await api().post("/api/v1/family/reviews", body);
      if (!result.ok) throw new Error(errorText(result, t("reviews.couldNotSend")));
      return okSchema.parse(result.data);
    },
    onSuccess: (_, body) => {
      setError(null);
      setSavedFor(keyOf(body));
      void qc.invalidateQueries({ queryKey: ["family", "reviews"] });
    },
    onError: (e) => setError(e.message),
  });
  const home = <Button label={role === "STUDENT" ? t("nav.today") : t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />;
  if (role !== null && !isFamily) {
    return (
      <Screen title={t("reviews.yourReviews")}>
        <Empty title={t("reviews.nothingWaitingTitle")} body={t("reviews.notAskedOfYou")} action={home} />
      </Screen>
    );
  }
  const d = query.data;
  return (
    <Screen title={t("reviews.yourReviews")} description={t("reviews.respondIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {error ? <Failed message={error} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.pending.length === 0 ? (
          <Empty title={t("reviews.nothingWaitingTitle")} body={t("reviews.nothingWaitingBody")} action={home} />
        ) : (
          d.pending.map((entry) => {
            const key = keyOf(entry);
            const mine = scores[key] ?? entry.myScores ?? {};
            const complete = QUESTIONS.every((q) => typeof mine[q.id] === "number");
            const answered = entry.myScores !== null;
            return (
              <Card key={key} title={entry.teacherName}>
                <Text variant="xs" tone={answered ? "ok" : "muted"}>
                  {answered ? t("reviews.answered") : t("reviews.openUntil", { date: formatDateKey(entry.closesDateKey, locale) })}
                </Text>
                {savedFor === key ? (
                  <Note tone="ok">
                    <Text variant="sm" bold tone="ok">
                      {t("reviews.savedThanks")}
                    </Text>
                  </Note>
                ) : null}
                {QUESTIONS.map((q) => {
                  const value = mine[q.id] ?? 0;
                  return (
                    <View key={q.id} style={{ gap: th.space[1] }}>
                      <Text variant="sm">{t(q.label)}</Text>
                      <View accessibilityRole="radiogroup" accessibilityLabel={t(q.label)} style={{ flexDirection: "row", alignItems: "center", gap: th.space[1] }}>
                        <Text variant="xs" tone="subtle">
                          {t("reviews.scaleLow")}
                        </Text>
                        {SCALE.map((n) => (
                          <Pressable
                            key={n}
                            accessibilityRole="radio"
                            accessibilityLabel={String(n)}
                            aria-checked={value === n}
                            accessibilityState={{ checked: value === n }}
                            onPress={() => setScores((prev) => ({ ...prev, [key]: { ...mine, [q.id]: n } }))}
                            style={{ minHeight: th.tap, minWidth: th.tap, alignItems: "center", justifyContent: "center" }}
                          >
                            <Icon name="star" size={24} weight={n <= value ? "fill" : "regular"} color={n <= value ? th.warn : th.fgSubtle} />
                          </Pressable>
                        ))}
                        <Text variant="xs" tone="subtle">
                          {t("reviews.scaleHigh")}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                <Button label={t("reviews.send")} disabled={!complete} busy={send.isPending && keyOf(send.variables) === key} onPress={() => send.mutate({ roundId: entry.roundId, teacherMembershipId: entry.teacherMembershipId, scores: mine })} />
              </Card>
            );
          })
        )
      ) : null}
    </Screen>
  );
}

function keyOf(entry: Pick<Pending, "roundId" | "teacherMembershipId"> | undefined): string {
  return entry ? `${entry.roundId}:${entry.teacherMembershipId}` : "";
}
