import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { incidentsListSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, ShowMore, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Pill, Tabs } from "../family/shared";
import { kindLabel, severityLabel, severityTone, whenLabel } from "../shared/incidents";

type Status = "OPEN" | "CLOSED" | "ALL";
const PATH = "/api/v1/staff/incidents";

/** The query string the server reads, built by hand: React Native's URLSearchParams is a partial polyfill. */
export function logQuery(status: Status, studentMembershipId: string | undefined, page: number): string {
  const parts = [`status=${status}`];
  if (studentMembershipId) parts.push(`studentMembershipId=${encodeURIComponent(studentMembershipId)}`);
  if (page > 1) parts.push(`page=${page}`);
  return `?${parts.join("&")}`;
}

/**
 * The sick-room and incident log for the school — the web's
 * /staff/incidents: the office and the head see the school's, a teacher
 * their own pupils'. Open, closed or all as tabs, a page of rows each
 * opening its record. Recording one needs a pupil, so with a
 * `studentMembershipId` in the route (from a pupil's health card) the
 * screen is that pupil's file and carries the record button; without one
 * the door is the class roster, where every pupil's row has it.
 */
export function StaffIncidents() {
  const params = useLocalSearchParams<{ studentMembershipId?: string; name?: string }>();
  const pupilId = typeof params.studentMembershipId === "string" && params.studentMembershipId ? params.studentMembershipId : undefined;
  const pupilName = typeof params.name === "string" && params.name ? params.name : undefined;
  const t = useT();
  const role = useRole();
  const router = useRouter();
  const th = useTheme();
  const { locale } = useLocale();
  const [status, setStatus] = useState<Status>("OPEN");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["staff", "incident-log", status, pupilId ?? null, page],
    queryFn: async () => incidentsListSchema.parse(unwrap(await api().get(`${PATH}${logQuery(status, pupilId, page)}`))),
  });
  const d = query.data;
  const record = () => router.push({ pathname: "/(app)/incident-new", params: { membershipId: pupilId, ...(pupilName ? { name: pupilName } : {}) } } as never);
  const toClasses = () => router.push("/(app)/classes" as never);
  const door = pupilId ? <Button label={t("incidents.record")} onPress={record} /> : <Button label={t("nav.classes")} variant="secondary" onPress={toClasses} />;
  const pages = d ? Math.max(1, Math.ceil(d.total / d.pageSize)) : 1;
  return (
    <Screen title={pupilName ? t("incidents.onFile", { name: pupilName }) : t("incidents.title")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text variant="sm" tone="muted">
        {t("incidents.intro")}
      </Text>
      {door}
      <Tabs<Status>
        label={t("incidents.title")}
        current={status}
        onChange={(next) => {
          setStatus(next);
          setPage(1);
        }}
        tabs={[
          { key: "OPEN", label: t("incidents.open"), count: d?.openCount },
          { key: "CLOSED", label: t("incidents.closed") },
          { key: "ALL", label: t("incidents.all") },
        ]}
      />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.rows.length === 0 ? (
          <Empty
            icon="firstAid"
            title={pupilName ? t("incidents.noneForChild") : t("incidents.none")}
            body={pupilName ? t("incidents.noneForChildBody", { name: pupilName }) : role === "TEACHER" ? t("incidents.noneTeacherBody") : t("incidents.noneBody")}
            action={door}
          />
        ) : (
          <Card title={t("incidents.openCount", { count: d.openCount })}>
            <ShowMore items={d.rows}>
              {(shown) => shown.map((r) => (
              <Row
                key={r.id}
                title={r.title}
                caption={[whenLabel(r.occurredAt, locale), r.studentName, r.className, kindLabel(t, r.kind), r.guardiansNotifiedAt ? t("incidents.familyTold", { when: whenLabel(r.guardiansNotifiedAt, locale) }) : t("incidents.familyNotTold"), r.noteCount > 0 ? `${t("incidents.notes")} ${r.noteCount}` : null]
                  .filter(Boolean)
                  .join(" · ")}
                right={
                  <View style={{ alignItems: "flex-end", gap: 2 }}>
                    <Pill label={severityLabel(t, r.severity)} tone={severityTone(r.severity)} />
                    {status === "ALL" ? <Pill label={r.status === "OPEN" ? t("incidents.open") : t("incidents.closed")} tone={r.status === "OPEN" ? "ok" : "muted"} /> : null}
                  </View>
                }
                onPress={() => router.push({ pathname: "/(app)/incident", params: { incidentId: r.id } } as never)}
              />
              ))}
            </ShowMore>
            {pages > 1 ? (
              <View accessibilityLabel={t("people.pagination")} style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
                <Button label={t("people.previous")} variant="secondary" disabled={d.page <= 1} onPress={() => setPage(d.page - 1)} />
                <Text variant="sm" tone="muted" style={{ flex: 1, textAlign: "center" }}>
                  {t("people.pageOf", { page: d.page, pages })}
                </Text>
                <Button label={t("people.next")} variant="secondary" disabled={d.page >= pages} onPress={() => setPage(d.page + 1)} />
              </View>
            ) : null}
          </Card>
        )
      ) : null}
    </Screen>
  );
}
