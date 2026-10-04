import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { studentAccountSchema } from "@edulink/contracts";
import { Button, Card, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@edulink/i18n";

/**
 * An adult student's own account on the phone (4 Oct 2026), the web's
 * /student/account: what their guardians may see (changed on the consent
 * screen), two-step sign-in, and whether each no-dues clearance stands.
 */
export function StudentAccountScreen() {
  const t = useT();
  const router = useRouter();
  const query = useQuery({ queryKey: ["student", "account"], queryFn: async () => studentAccountSchema.parse(unwrap(await api().get("/api/v1/student/account"))) });
  const a = query.data;
  const granted = a?.grants.filter((g) => g.on) ?? [];
  return (
    <Screen title={t("collegeOffice.accountTitle")} description={t("collegeOffice.accountIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {a ? (
        <Card>
          <Text bold>{t("collegeOffice.guardiansSee")}</Text>
          <Text variant="sm" tone="muted">
            {!a.consentApplies ? t("collegeOffice.consentNotApplies") : granted.length === 0 ? t("collegeOffice.consentNothing") : granted.map((g) => t(`consent.grant.${g.grant}.name` as TranslationKey)).join(", ")}
          </Text>
          {a.consentApplies ? <Button label={t("collegeOffice.changeGrants")} variant="secondary" onPress={() => router.push("/(app)/consent" as never)} /> : null}
        </Card>
      ) : null}
      {a ? (
        <Card>
          <Row title={t("collegeOffice.twoStep")} right={<Text tone={a.twoFactorOn ? "ok" : "warn"}>{a.twoFactorOn ? t("collegeOffice.twoStepOn") : t("collegeOffice.twoStepOff")}</Text>} />
          <Button label={t("collegeOffice.manageAccount")} variant="secondary" onPress={() => router.push("/(app)/account" as never)} />
        </Card>
      ) : null}
      {a && a.noDues.length > 0 ? (
        <Card>
          <Text bold>{t("collegeOffice.navNoDues")}</Text>
          {a.noDues.map((n) => (
            <Row key={n.event} title={t(`collegeOffice.event${n.event}`)} right={<Text tone={n.completed ? "ok" : "warn"}>{n.completed ? t("collegeOffice.cleared") : t("collegeOffice.notCleared")}</Text>} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
