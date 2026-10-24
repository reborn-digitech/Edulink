import { useState } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { familyChildrenSchema, familyIncidentsSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, ShowMore, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { IncidentBadges, IncidentNotes, IncidentRecord } from "../shared/incidents";
import { Refusal } from "../staff/shared";
import { ChildLeftBanner, ChildSwitcher, childQuery, firstChild, param } from "./shared";

const PATH = "/api/v1/family/incidents";

/**
 * A child's incidents and sick-room visits for the guardian — the web's
 * /parent/incidents: each record as the school wrote it, what was done,
 * whether and when the family was told, the school's follow-up notes, and
 * the closed line; all read-only. The switcher's children come from
 * /family/children as the health card's do; the endpoint answers for one
 * child at a time. A pupil reads their own log from the age the school
 * sets; refused (403) they are shown "ask a grown-up".
 */
export function FamilyIncidents() {
  // A child's record, a register, a message: private while on screen (no screenshots or screen recording on the phone).
  usePrivateScreen();
  const t = useT();
  const role = useRole();
  const router = useRouter();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const [childId, setChildId] = useState<string | null>(param(params.childId) ?? param(params.child) ?? null);
  const children = useQuery({
    queryKey: ["family", "children"],
    enabled: role === "PARENT",
    queryFn: async () => familyChildrenSchema.parse(unwrap(await api().get("/api/v1/family/children"))),
  });
  const query = useQuery({
    queryKey: ["family", "incidents", role === "STUDENT" ? "mine" : childId],
    enabled: role === "PARENT" || role === "STUDENT",
    retry: false,
    queryFn: async () => {
      const result = await api().get(`${PATH}${role === "STUDENT" ? "" : childQuery(childId)}`);
      if (!result.ok && result.status === 403 && role === "STUDENT") throw new Refusal(result.error, 403, {});
      return familyIncidentsSchema.parse(unwrap(result));
    },
  });
  if (role === "STUDENT") {
    const refused = query.isError && query.error instanceof Refusal && query.error.status === 403;
    const mine = query.data;
    return (
      <Screen title={t("familyCare.myIncidentsTitle")} description={mine ? t("familyCare.myIncidentsBody") : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
        {query.isPending ? <Loading /> : null}
        {refused ? <Empty icon="shield" title={t("familyCare.askGrownUpTitle")} body={t("familyCare.askGrownUpBody")} action={<Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} /> : null}
        {query.isError && !refused ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
        {mine ? (
          mine.incidents.length === 0 ? (
            <Empty icon="firstAid" title={t("incidents.noneForChild")} body={t("incidents.noneForChildBody", { name: mine.childName })} action={<Button label={t("nav.health")} variant="secondary" onPress={() => router.push("/(app)/health" as never)} />} />
          ) : (
            <ShowMore items={mine.incidents}>
              {(shown) =>
                shown.map((i) => (
                  <Card key={i.id} title={i.title}>
                    <IncidentBadges kind={i.kind} severity={i.severity} status={i.status} />
                    <IncidentRecord incident={i} />
                    <IncidentNotes notes={i.notes} bare />
                  </Card>
                ))
              }
            </ShowMore>
          )
        ) : null}
      </Screen>
    );
  }
  if (role !== null && role !== "PARENT") {
    return (
      <Screen title={t("incidents.title")}>
        <Empty icon="firstAid" title={t("incidents.none")} body={t("incidents.noneBody")} action={<Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} />
      </Screen>
    );
  }
  const d = query.data;
  const pupils = children.data?.children ?? [];
  const first = d?.incidents[0];
  const selectedId = first?.studentMembershipId ?? childId;
  const selected = pupils.find((c) => c.studentMembershipId === selectedId) ?? (childId ? undefined : firstChild(pupils));
  const name = d?.childName ?? selected?.name ?? "";
  return (
    <Screen title={name ? t("incidents.forChild", { name }) : t("incidents.title")} description={first?.className ?? undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <ChildSwitcher pupils={pupils} selectedId={selected?.studentMembershipId ?? childId} onSelect={setChildId} />
      {selected?.leftAt ? <ChildLeftBanner name={selected.name} leftAt={selected.leftAt} /> : null}
      {name ? (
        <Text variant="sm" tone="muted">
          {t("incidents.parentIntro", { name })}
        </Text>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? (
        children.data && pupils.length === 0 ? (
          <Empty title={t("parent.linkToYourChild")} body={t("parent.linkNeedCode")} action={<Button label={t("parent.linkToMyChild")} onPress={() => router.push("/(app)/link-child" as never)} />} />
        ) : (
          <Failed error={query.error} onRetry={() => void query.refetch()} />
        )
      ) : null}
      {d ? (
        d.incidents.length === 0 ? (
          <Empty icon="firstAid" title={t("incidents.noneForChild")} body={t("incidents.noneForChildBody", { name: d.childName })} action={<Button label={t("nav.health")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/health", params: childId ? { childId } : {} } as never)} />} />
        ) : (
          <ShowMore items={d.incidents}>
            {(shown) =>
              shown.map((i) => (
                <Card key={i.id} title={i.title}>
                  <IncidentBadges kind={i.kind} severity={i.severity} status={i.status} />
                  <IncidentRecord incident={i} />
                  <IncidentNotes notes={i.notes} bare />
                </Card>
              ))
            }
          </ShowMore>
        )
      ) : null}
    </Screen>
  );
}
