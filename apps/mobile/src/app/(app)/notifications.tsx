import { BackTo } from "@/components/back-to";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { View } from "react-native";
import { useRouter } from "expo-router";
import type { z } from "zod";
import { notificationsSchema, type notificationSchema } from "@edulink/contracts";
import { Button, Empty, Failed, Loading, Row, Screen, ShowMore, Text } from "@/components";
import { api } from "@/lib/api";
import { screenFor } from "@/lib/links";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { openWeb } from "@/screens/family/shared";

/**
 * The bell: the person's notices, newest first, with mark-all-read. Each row
 * is a button (A3-journeys-14, audit of 5 Oct 2026): a tap marks that notice
 * read and opens its link — the app's screen when the link mapper has one,
 * the web otherwise — and a screen reader hears the title, the words and
 * whether it is read.
 */
function NotificationsInner() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => notificationsSchema.parse(unwrap(await api().get("/api/v1/shared/notifications?limit=30"))),
  });
  const readAll = useMutation({
    mutationFn: async () => unwrap(await api().post("/api/v1/shared/notifications/read-all")),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  // One notice read; the key covers the list and the tab badge's unread count.
  const readOne = useMutation({
    mutationFn: async (id: string) => unwrap(await api().post(`/api/v1/shared/notifications/${encodeURIComponent(id)}/read`)),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const open = (n: z.infer<typeof notificationSchema>) => {
    if (!n.read) readOne.mutate(n.id);
    if (!n.url) return;
    const target = screenFor(n.url);
    if (target) router.push((target.params ? { pathname: target.pathname, params: target.params } : target.pathname) as never);
    else openWeb(n.url);
  };
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
            <ShowMore items={query.data.items}>
              {(shown) =>
                shown.map((n) => (
                  <Row
                    key={n.id}
                    title={n.title}
                    caption={n.body || undefined}
                    label={[n.title, n.body || null, n.read ? t("notif.stateRead") : t("notif.tabUnread")].filter(Boolean).join(", ")}
                    onPress={() => open(n)}
                    right={n.read ? null : <Text variant="xs" tone="accent" bold>{t("notif.tabUnread")}</Text>}
                  />
                ))
              }
            </ShowMore>
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
