import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { certificatesListSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { Pill } from "../family/shared";
import { formatDateKey } from "./shared";

/**
 * Every certificate the school has issued — the web's /admin/certificates
 * list, newest first, each opening natively. A revoked one stays on the list
 * and says so. Issuing starts from a pupil's record (the records list), so
 * the empty state's door is there; the templates themselves are designed on
 * the web.
 */
export function StaffCertificates() {
  const t = useT();
  const router = useRouter();
  const { locale } = useLocale();
  const query = useQuery({
    queryKey: ["office", "certificates"],
    queryFn: async () => certificatesListSchema.parse(unwrap(await api().get("/api/v1/office/certificates"))),
  });
  const items = query.data?.items ?? [];
  return (
    <Screen title={t("certificates.issuedTitle")} description={t("certificates.issuedIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        items.length === 0 ? (
          <Empty icon="fileText" title={t("certificates.noIssued")} body={t("certificates.noIssuedBody")} action={<Button label={t("pupilRecord.officeTitle")} variant="secondary" onPress={() => router.push("/(app)/pupil-records" as never)} />} />
        ) : (
          <Card>
            {items.map((c) => (
              <Row
                key={c.id}
                title={c.title}
                caption={[c.studentName, c.serial, t("certificates.issuedOn", { date: formatDateKey(c.issuedAt.slice(0, 10), locale, { day: "numeric", month: "short", year: "numeric" }) })].join(" · ")}
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
