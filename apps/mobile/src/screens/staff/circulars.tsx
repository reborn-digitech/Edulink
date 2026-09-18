import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { officeCircularsSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { formatInstant } from "../family/shared";
import { audienceLabel } from "./circular-reach";

/**
 * Every circular of the school with its reach — the web's /admin/circulars
 * for the office and the head: newest first, each row saying when it went,
 * to whom, and how many families have acknowledged, and opening the reach
 * report where the rest are chased. A school with none yet is sent to the
 * bulletin to write one.
 */
export function StaffCirculars() {
  const t = useT();
  const router = useRouter();
  const { locale } = useLocale();
  const query = useQuery({
    queryKey: ["staff", "circulars"],
    queryFn: async () => officeCircularsSchema.parse(unwrap(await api().get("/api/v1/office/circulars"))),
  });
  const d = query.data;
  const write = <Button label={t("circulars.writeOne")} variant="secondary" onPress={() => router.push("/(app)/bulletin" as never)} />;
  return (
    <Screen title={t("circulars.title")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text variant="sm" tone="muted">
        {t("circulars.intro")}
      </Text>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.rows.length === 0 ? (
          <Empty icon="megaphone" title={t("circulars.none")} body={t("circulars.noneBody")} action={write} />
        ) : (
          <Card>
            {d.rows.map((r) => (
              <Row
                key={r.postId}
                title={r.title}
                caption={[t("circulars.published", { when: formatInstant(r.publishedAt, locale) }), audienceLabel(t, r.audience), r.className].filter(Boolean).join(" · ")}
                right={
                  <Text variant="sm" tone={r.acked >= r.total ? "ok" : "muted"}>
                    {t("circulars.ackedOf", { acked: r.acked, total: r.total })}
                  </Text>
                }
                onPress={() => router.push({ pathname: "/(app)/circular-reach", params: { postId: r.postId } } as never)}
              />
            ))}
          </Card>
        )
      ) : null}
    </Screen>
  );
}
