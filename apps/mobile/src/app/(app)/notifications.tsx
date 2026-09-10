import { BackTo } from "@/components/back-to";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { View } from "react-native";
import { notificationsSchema } from "@edulink/contracts";
import { Button, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

/** The bell: the person's notices, newest first, with mark-all-read. */
function NotificationsInner() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => notificationsSchema.parse(unwrap(await api().get("/api/v1/shared/notifications?limit=30"))),
  });
  const readAll = useMutation({
    mutationFn: async () => unwrap(await api().post("/api/v1/shared/notifications/read-all")),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  return (
    <Screen title={t("shell.notifications")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        query.data.items.length === 0 ? (
          <Empty title={t("notif.nothingYet")} />
        ) : (
          <View style={{ gap: th.space[2] }}>
            <Button label={t("notif.markAllRead")} variant="secondary" onPress={() => readAll.mutate()} busy={readAll.isPending} />
            {query.data.items.map((n) => (
              <Row key={n.id} title={n.title} caption={n.body || undefined} right={n.read ? null : <Text variant="xs" tone="accent" bold>{t("notif.tabUnread")}</Text>} />
            ))}
          </View>
        )
      ) : null}
    </Screen>
  );
}

/** Not a tab: "‹ Back" above the title. */
export default function Notifications() {
  return (
    <BackTo fallback="/(app)/more">
      <NotificationsInner />
    </BackTo>
  );
}
