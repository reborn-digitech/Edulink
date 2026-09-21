import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { certificatesListSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { formatDateKey, Pill } from "./shared";

/**
 * The certificates the school has issued — the web's /parent/certificates
 * and /student/certificates: every one for the pupil, or across a guardian's
 * children, newest first, each opening natively with its PDF. A revoked one
 * stays on the list and says so, as the web's does.
 */
export function FamilyCertificates() {
  const t = useT();
  const router = useRouter();
  const { locale } = useLocale();
  const query = useQuery({
    queryKey: ["family", "certificates"],
    queryFn: async () => certificatesListSchema.parse(unwrap(await api().get("/api/v1/family/certificates"))),
  });
  const items = query.data?.items ?? [];
  const pupils = new Set(items.map((c) => c.studentMembershipId)).size;
  return (
    <Screen title={t("certificates.myTitle")} description={t("certificates.myIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        items.length === 0 ? (
          <Empty icon="fileText" title={t("certificates.noMine")} body={t("certificates.noMineBody")} action={<Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} />
        ) : (
          <Card>
            {items.map((c) => (
              <Row
                key={c.id}
                title={c.title}
                caption={[pupils > 1 ? c.studentName : null, c.serial, t("certificates.issuedOn", { date: formatDateKey(c.issuedAt.slice(0, 10), locale) })].filter(Boolean).join(" · ")}
                right={c.revokedAt ? <Pill label={t("fees.concessionRevoked")} tone="danger" /> : undefined}
                onPress={() => router.push({ pathname: "/(app)/certificate", params: { id: c.id } } as never)}
              />
            ))}
          </Card>
        )
      ) : null}
    </Screen>
  );
}
