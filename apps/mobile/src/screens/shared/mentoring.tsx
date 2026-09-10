import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { mentoringPageSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { Chips } from "../staff/shared";
import { Note, Pill, relativeTime } from "../family/shared";

type Status = "" | "ACTIVE" | "REQUESTED" | "CLOSED";

/** The web's MENTOR_STATUS_KEY: the thread's lifecycle in the reader's words. PENDING_CONSENT is named by awaitingConsent first. */
const STATUS_KEY: Partial<Record<string, TranslationKey>> = { ACTIVE: "mentoring.statusActive", CLOSED: "mentoring.statusClosed", REQUESTED: "mentoring.statusRequested" };

/**
 * Mentoring, the web's /mentoring, from whichever side you are on: one list
 * for the expert, the pupil, the guardian and the school, filtered by who
 * they are on the server. Pairing a pupil, asking for a mentor and deciding
 * a request are the set-up screen's; this one reads, filters and opens a thread.
 */
export function Mentoring() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const role = useRole();
  const [status, setStatus] = useState<Status>("");
  const query = useQuery({
    queryKey: ["shared", "mentoring"],
    queryFn: async () => mentoringPageSchema.parse(unwrap(await api().get("/api/v1/shared/mentoring"))),
  });
  const data = query.data;
  const threads = data?.threads ?? [];
  const shown = status ? threads.filter((x) => x.status === status) : threads;
  const waiting = threads.filter((x) => x.awaitingConsent).length;
  const isStaff = role === "ADMIN" || role === "TEACHER";
  const reviews = role === "ADMIN" || role === "PRINCIPAL";
  const requests = reviews ? (data?.requests ?? []) : [];
  const setUp = () => router.push("/(app)/mentoring-setup" as never);

  const door = () => {
    if (role === "STUDENT") return <Button label={t("mentoring.askTitle")} variant="secondary" onPress={setUp} />;
    if (isStaff) return <Button label={t("mentoring.setUp")} variant="secondary" onPress={setUp} />;
    if (role === "PARENT") return <Button label={t("nav.experts")} variant="secondary" onPress={() => router.push("/(app)/experts" as never)} />;
    return <Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />;
  };

  return (
    <Screen title={t("feature.mentoring")} description={t("mentoring.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {data ? (
        <>
          {isStaff ? <Button label={t("mentoring.setUp")} variant="secondary" onPress={setUp} /> : null}
          {role === "STUDENT" ? <Button label={t("mentoring.askTitle")} variant="secondary" onPress={setUp} /> : null}
          {requests.length > 0 ? (
            <Card title={requests.length === 1 ? t("mentoring.askingOne") : t("mentoring.askingMany", { count: requests.length })}>
              <Text variant="xs" tone="muted">
                {t("mentoring.decisionFirst")}
              </Text>
              {requests.map((r) => (
                <Row key={r.threadId} title={`${r.studentName} & ${r.expertName}`} caption={`${r.purpose} · ${t("mentoring.askedAgo", { when: relativeTime(r.askedAt, locale) })}`} right={r.expertVerified ? <Text variant="xs" tone="accent" bold>{t("mentoring.checked")}</Text> : null} />
              ))}
              <Button label={t("mentoring.reviewRequests")} onPress={setUp} />
            </Card>
          ) : null}
          {role === "PARENT" && waiting > 0 ? (
            <Note tone="warn">
              <Text variant="sm">{t("mentoring.needsYourAgreement", { count: waiting })}</Text>
            </Note>
          ) : null}
          {threads.length > 2 || status ? (
            <Chips
              label={t("mentoring.statusFilter")}
              value={status}
              options={[
                { value: "" as Status, label: t("vacancies.filterAll") },
                ...(["ACTIVE", "REQUESTED", "CLOSED"] as const).filter((st) => threads.some((x) => x.status === st)).map((st) => ({ value: st as Status, label: t(STATUS_KEY[st] ?? "mentoring.statusActive") })),
              ]}
              onChange={setStatus}
            />
          ) : null}
          {threads.length === 0 ? (
            <Empty title={t("mentoring.emptyTitle")} body={t("mentoring.emptyBody")} action={door()} />
          ) : shown.length === 0 ? (
            <Empty title={t("common.noResultsTitle")} body={t("common.noResultsBody")} action={<Button label={t("vacancies.filterAll")} variant="secondary" onPress={() => setStatus("")} />} />
          ) : (
            <Card>
              {shown.map((thread) => (
                <Row
                  key={thread.id}
                  title={`${thread.studentName} & ${thread.expertName}`}
                  caption={thread.purpose}
                  right={
                    <View style={{ alignItems: "flex-end", gap: th.space[1] }}>
                      <Pill tone={thread.status === "ACTIVE" ? "ok" : thread.status === "CLOSED" ? "muted" : "warn"} label={thread.awaitingConsent ? t("mentoring.waitingForGuardian") : t(STATUS_KEY[thread.status] ?? "mentoring.statusActive")} />
                      {thread.unread > 0 ? (
                        <Text variant="xs" bold tone="accent">
                          {t("mentoring.newCount", { count: thread.unread })}
                        </Text>
                      ) : null}
                    </View>
                  }
                  onPress={() => router.push({ pathname: "/(app)/mentoring/thread", params: { threadId: thread.id } } as never)}
                />
              ))}
            </Card>
          )}
        </>
      ) : null}
    </Screen>
  );
}
