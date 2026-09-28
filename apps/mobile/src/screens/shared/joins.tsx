import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { waitingQueueSchema, type JoinDecisionBody } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Screen, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Pill, relativeTime } from "../family/shared";

const RELATION_KEY: Record<"PARENT" | "GUARDIAN" | "OTHER", TranslationKey> = { PARENT: "parent.relationParent", GUARDIAN: "parent.relationGuardian", OTHER: "parent.relationOther" };

/**
 * The two decisions on somebody waiting, as on the web: one press each, and
 * no reason asked for a decline. A refusal stays above the buttons until the
 * next try; a decision reads the queue again, so the row leaves it.
 */
function Decide({ kind, id, name }: { kind: "join" | "claim"; id: string; name: string }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const decide = useMutation({
    mutationFn: async (body: JoinDecisionBody) => {
      const result = kind === "join" ? await api().post(`/api/v1/shared/joins/${encodeURIComponent(id)}/decide`, body) : await api().post(`/api/v1/shared/claims/${encodeURIComponent(id)}/decide`, body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return body.decision;
    },
    onSuccess: (decision) => {
      toast.show(t(decision === "DECLINE" ? "joinRequests.declinedToast" : kind === "join" ? "joinRequests.letInToast" : "joinRequests.claimApprovedToast"));
      void qc.invalidateQueries({ queryKey: ["joins"] });
    },
  });
  const yes = t(kind === "join" ? "joinRequests.letInCta" : "joinRequests.approveClaimCta");
  const no = t("joinRequests.declineCta");
  return (
    <View style={{ gap: th.space[2] }}>
      {decide.isError ? <Failed message={decide.error.message} /> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        <Button label={yes} accessibilityLabel={`${yes}: ${name}`} busy={decide.isPending} onPress={() => decide.mutate({ decision: "APPROVE" })} />
        <Button label={no} accessibilityLabel={`${no}: ${name}`} variant="secondary" disabled={decide.isPending} onPress={() => decide.mutate({ decision: "DECLINE" })} />
      </View>
    </View>
  );
}

/**
 * Everybody waiting on this reader for a yes — the web's /joins, and for a
 * guardian its /parent/claims: pupils who typed a code, and people who asked
 * to be linked to a pupil. Whose they are is the server's rule; the screen
 * draws what it is sent. Oldest first.
 */
export function Joins() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const session = useSession();
  const router = useRouter();
  const guardian = session.status === "signed-in" && session.me.active.role === "PARENT";
  const query = useQuery({
    queryKey: ["joins"],
    queryFn: async () => waitingQueueSchema.parse(unwrap(await api().get("/api/v1/shared/joins"))),
  });
  const joins = query.data?.joins ?? [];
  const claims = query.data?.claims ?? [];
  const row = { gap: th.space[2], borderTopWidth: 1, borderTopColor: th.border, paddingTop: th.space[2] } as const;
  const line = { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: th.space[2] } as const;
  return (
    <Screen
      title={guardian ? t("joinRequests.parentClaimsTitle") : t("joinRequests.title")}
      description={guardian ? t("joinRequests.parentClaimsBody") : t("joinRequests.description")}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data && joins.length === 0 && claims.length === 0 ? (
        <Empty
          title={guardian ? t("joinRequests.parentClaimsNone") : t("joinRequests.emptyTitle")}
          body={guardian ? undefined : t("joinRequests.emptyBody")}
          icon="userPlus"
          action={<Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />}
        />
      ) : null}
      {joins.length > 0 ? (
        <Card title={`${t("joinRequests.joinsHeading")} (${joins.length})`}>
          {joins.map((join) => (
            <View key={join.id} style={row}>
              <Text variant="base" bold>
                {join.name}
              </Text>
              <View style={line}>
                <Pill label={join.via === "CLASS" ? t("joinRequests.viaClass") : t("joinRequests.viaSchool")} tone="muted" />
                {join.onRoll ? <Pill label={t("joinRequests.onRoll")} tone="ok" /> : null}
              </View>
              <Text variant="xs" tone="muted">
                {[join.className, join.age === null ? t("joinRequests.ageUnknown") : t("joinRequests.ageYears", { age: join.age }), relativeTime(join.createdAt, locale)].filter(Boolean).join(" · ")}
              </Text>
              <Decide kind="join" id={join.id} name={join.name} />
            </View>
          ))}
        </Card>
      ) : null}
      {claims.length > 0 ? (
        <Card title={`${t("joinRequests.claimsHeading")} (${claims.length})`}>
          {claims.map((claim) => (
            <View key={claim.id} style={row}>
              <Text variant="base" bold>
                {t("joinRequests.claimLine", { claimant: claim.claimantName, child: claim.childName })}
              </Text>
              <View style={line}>
                <Pill label={t(RELATION_KEY[claim.relation])} tone="muted" />
              </View>
              <Text variant="xs" tone="muted">
                {[claim.claimantEmail, claim.className, claim.schoolName, relativeTime(claim.createdAt, locale)].filter(Boolean).join(" · ")}
              </Text>
              <Decide kind="claim" id={claim.id} name={claim.claimantName} />
            </View>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
