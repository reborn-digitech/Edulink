import { useState } from "react";
import { View } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { studentConsentSchema, type StudentConsent, type StudentConsentGrant } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { formatDate } from "@/lib/dates";
import { useTheme } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@edulink/i18n";
import { Confirm } from "../family/shared";

const RELATION_KEY: Record<"PARENT" | "GUARDIAN" | "OTHER", TranslationKey> = { PARENT: "parent.relationParent", GUARDIAN: "parent.relationGuardian", OTHER: "parent.relationOther" };

/** What a write is about, so the one button that is working shows it and the answer is said in its words. */
type Act =
  | { kind: "grant"; guardianshipId: string; name: string; grant: StudentConsentGrant; on: boolean }
  | { kind: "end"; guardianshipId: string; name: string }
  | { kind: "claim"; claimId: string; name: string; decision: "APPROVE" | "DECLINE" };

/**
 * What I let my guardians see (4 Oct 2026), the web's /student/consent: six
 * grants, each on or off, an adult student's to change whenever they like.
 * A minor, or a pupil at a school, is told their guardians see everything and
 * offered no button.
 *
 * GUARDIAN BY GUARDIAN (TA-555, the owner's decision of 14 November 2026): a
 * grant is one guardian's, so each guardian has a card of their own with the
 * six buttons and one that ends their link (asked about in place first), and a
 * guardian linked later starts with nothing. Somebody asking to be the
 * student's guardian waits at the top for the student's own yes or no.
 *
 * One change at a time (TA-589): each answer is the whole list as that request
 * read it, so while one is on its way every button waits, and an earlier
 * answer arriving last cannot draw a later change off.
 */
export function StudentConsentScreen() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const client = useQueryClient();
  const [ending, setEnding] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["student", "consent"], queryFn: async () => studentConsentSchema.parse(unwrap(await api().get("/api/v1/student/consent"))) });
  const save = useMutation({
    mutationFn: async (act: Act): Promise<StudentConsent> => {
      const result =
        act.kind === "grant"
          ? await api().post("/api/v1/student/consent", { grant: act.grant, on: act.on, guardianshipId: act.guardianshipId })
          : act.kind === "end"
            ? await api().post(`/api/v1/student/guardians/${act.guardianshipId}/end`, {})
            : await api().post(`/api/v1/student/guardian-claims/${act.claimId}/decide`, { decision: act.decision });
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return studentConsentSchema.parse(result.data);
    },
    onMutate: () => setSaid(null),
    onSuccess: (data, act) => {
      client.setQueryData(["student", "consent"], data);
      setEnding(null);
      setSaid(
        act.kind === "grant"
          ? t(act.on ? "consent.guardianGranted" : "consent.guardianRevoked", { name: act.name })
          : act.kind === "end"
            ? t("consent.linkEnded", { name: act.name })
            : t(act.decision === "APPROVE" ? "consent.claimAccepted" : "consent.claimDeclined", { name: act.name }),
      );
    },
  });
  const d = query.data;
  const working = save.isPending ? save.variables : undefined;
  const names = d?.guardians.map((g) => g.name).join(", ") ?? "";
  return (
    <Screen title={t("consent.title")} description={d ? (d.applies ? t("consent.intro") : t("consent.notApplies")) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {save.isError ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {save.error.message}
        </Text>
      ) : null}
      {said && !save.isError ? (
        <Text variant="sm" tone="muted" accessibilityLiveRegion="polite">
          {said}
        </Text>
      ) : null}
      {d && d.claims.length > 0 ? (
        <Card title={t("consent.claimsTitle")}>
          <Text variant="sm" tone="muted">
            {t("consent.claimsIntro")}
          </Text>
          {d.claims.map((claim) => (
            <View key={claim.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
              <Row title={claim.claimantName} caption={`${t(RELATION_KEY[claim.relation])} · ${formatDate(claim.createdAt)}`} />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                <Button
                  label={t("consent.claimAccept")}
                  accessibilityLabel={`${t("consent.claimAccept")}: ${claim.claimantName}`}
                  busy={working?.kind === "claim" && working.claimId === claim.id && working.decision === "APPROVE"}
                  disabled={save.isPending}
                  onPress={() => save.mutate({ kind: "claim", claimId: claim.id, name: claim.claimantName, decision: "APPROVE" })}
                />
                <Button
                  label={t("consent.claimDecline")}
                  accessibilityLabel={`${t("consent.claimDecline")}: ${claim.claimantName}`}
                  variant="secondary"
                  busy={working?.kind === "claim" && working.claimId === claim.id && working.decision === "DECLINE"}
                  disabled={save.isPending}
                  onPress={() => save.mutate({ kind: "claim", claimId: claim.id, name: claim.claimantName, decision: "DECLINE" })}
                />
              </View>
            </View>
          ))}
        </Card>
      ) : null}
      {d && d.guardians.length === 0 ? (
        <Empty icon="users" title={t("consent.noGuardians")} body={t("consent.title")} action={<Button label={t("nav.account")} variant="secondary" onPress={() => router.push("/(app)/account" as never)} />} />
      ) : null}
      {d && d.guardians.length > 0 && !d.applies ? (
        <>
          <Text variant="sm" tone="muted">
            {t("consent.guardiansLine", { names })}
          </Text>
          <Card>
            {d.grants.map(({ grant, on }) => (
              <Row key={grant} title={t(`consent.grant.${grant}.name`)} caption={`${t(`consent.grant.${grant}.what`)} · ${on ? t("consent.on") : t("consent.off")}`} />
            ))}
          </Card>
        </>
      ) : null}
      {d && d.guardians.length > 0 && d.applies ? (
        <>
          <Text variant="sm" tone="muted">
            {t("consent.perGuardianHint")}
          </Text>
          {d.guardians.map((guardian) => (
            <Card key={guardian.guardianshipId} title={guardian.name}>
              <Text variant="sm" tone="muted">
                {`${t(RELATION_KEY[guardian.relation])} · ${t("people.familyLinkSince", { date: formatDate(guardian.since) })}`}
              </Text>
              {guardian.grants.map(({ grant, on }) => {
                const label = on ? t("consent.revokeButton") : t("consent.grantButton");
                return (
                  <Row
                    key={grant}
                    title={t(`consent.grant.${grant}.name`)}
                    caption={`${t(`consent.grant.${grant}.what`)} · ${on ? t("consent.on") : t("consent.off")}`}
                    right={
                      <Button
                        label={label}
                        accessibilityLabel={`${label}: ${t(`consent.grant.${grant}.name`)}, ${guardian.name}`}
                        variant={on ? "secondary" : "primary"}
                        busy={working?.kind === "grant" && working.guardianshipId === guardian.guardianshipId && working.grant === grant}
                        disabled={save.isPending}
                        onPress={() => save.mutate({ kind: "grant", guardianshipId: guardian.guardianshipId, name: guardian.name, grant, on: !on })}
                      />
                    }
                  />
                );
              })}
              {ending === guardian.guardianshipId ? (
                <Confirm
                  question={t("consent.endLinkConfirm", { name: guardian.name })}
                  confirmLabel={t("consent.endLink", { name: guardian.name })}
                  busy={working?.kind === "end" && working.guardianshipId === guardian.guardianshipId}
                  onConfirm={() => save.mutate({ kind: "end", guardianshipId: guardian.guardianshipId, name: guardian.name })}
                  onCancel={() => setEnding(null)}
                />
              ) : (
                <Button label={t("consent.endLink", { name: guardian.name })} variant="ghost" disabled={save.isPending} onPress={() => setEnding(guardian.guardianshipId)} />
              )}
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
