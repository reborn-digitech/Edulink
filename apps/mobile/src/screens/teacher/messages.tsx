import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { inboxSchema } from "@edulink/contracts";
import { Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { relativeTime } from "./support";

/**
 * The inbox, the web's /remarks, for every role: rooms (a conversation with
 * one or more people) and threads (a conversation about one pupil, with the
 * family in it). A row opens the room or the thread.
 */
export function Inbox() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const role = useRole();
  const query = useQuery({
    queryKey: ["shared", "inbox"],
    queryFn: async () => inboxSchema.parse(unwrap(await api().get("/api/v1/shared/inbox"))),
  });
  const data = query.data;
  const isTeacher = role === "TEACHER";
  const intro = isTeacher ? t("remarks.introTeacher") : role === "ADMIN" || role === "PRINCIPAL" ? t("remarks.introAdmin") : role === "STUDENT" ? t("remarks.introStudent") : t("remarks.introParent");
  const unread = (on: boolean) =>
    on ? (
      <Text variant="xs" bold tone="accent">
        {t("remarks.unread")}
      </Text>
    ) : null;

  return (
    <Screen title={t("remarks.title")} description={data && data.unreadTotal > 0 ? t("convo.unreadCount", { count: data.unreadTotal }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {data ? (
        data.conversations.length === 0 && data.threads.length === 0 ? (
          <Empty title={t("remarks.noMessagesYet")} body={t("convo.emptyBody")} />
        ) : (
          <>
            {data.conversations.length > 0 ? (
              <Card title={t("convo.title")}>
                {data.conversations.map((c) => {
                  const names = c.others.map((o) => o.name).join(", ");
                  return (
                    <Row
                      key={c.id}
                      title={names || t("convo.message")}
                      caption={`${c.preview ? `${c.previewMine ? `${t("convo.you")}: ` : ""}${c.preview}` : t("convo.noMessagesInRoom")} · ${relativeTime(c.lastMessageAt, locale)}`}
                      right={unread(c.unread)}
                      onPress={() => router.push({ pathname: "/(app)/messages/room", params: { conversationId: c.id } } as never)}
                    />
                  );
                })}
              </Card>
            ) : null}
            {data.threads.length > 0 ? (
              <Card title={t("convo.aboutPupil")}>
                <Text variant="xs" tone="muted">
                  {intro}
                </Text>
                {data.threads.map((th) => (
                  <Row
                    key={th.id}
                    title={th.subject}
                    caption={`${isTeacher ? t("convo.aboutName", { name: th.studentName }) : t("convo.withAbout", { teacher: th.teacherName, name: th.studentName })} · ${relativeTime(th.lastMessageAt, locale)}`}
                    right={unread(th.unread)}
                    onPress={() => router.push({ pathname: "/(app)/messages/thread", params: { threadId: th.id } } as never)}
                  />
                ))}
              </Card>
            ) : null}
          </>
        )
      ) : null}
    </Screen>
  );
}
