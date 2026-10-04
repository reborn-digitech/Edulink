import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { recruiterMeSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";

/**
 * The recruiter's home (4 Oct 2026), the web's /recruiter: an outside account
 * that belongs to no college. Until a college's placement cell invites them
 * to a drive (the placement module) there is nothing of any college to show,
 * and the page says so.
 */
export function RecruiterHome() {
  const t = useT();
  const router = useRouter();
  const query = useQuery({ queryKey: ["recruiter", "me"], queryFn: async () => recruiterMeSchema.parse(unwrap(await api().get("/api/v1/recruiter/me"))) });
  const me = query.data;
  return (
    <Screen title={me ? t("recruiter.homeTitle", { company: me.companyName }) : t("role.recruiter")} description={t("recruiter.homeIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {me && !me.emailVerified ? (
        <Card>
          <Text variant="sm" tone="muted">
            {t("recruiter.verifyEmail")}
          </Text>
        </Card>
      ) : null}
      {me ? <Empty icon="handshake" title={t("recruiter.noDrivesTitle")} body={t("recruiter.noDrivesBody")} action={<Button label={t("nav.account")} variant="secondary" onPress={() => router.push("/(app)/account" as never)} />} /> : null}
    </Screen>
  );
}
