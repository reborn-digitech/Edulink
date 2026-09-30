import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { familyChildrenSchema, familyIncidentsSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, ShowMore, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { IncidentBadges, IncidentNotes, IncidentRecord } from "../shared/incidents";
import { ChildLeftBanner, ChildSwitcher, childQuery, param } from "./shared";

const PATH = "/api/v1/family/incidents";

/**
 * A child's incidents and sick-room visits for the guardian — the web's
 * /parent/incidents: each record as the school wrote it, what was done,
 * whether and when the family was told, the school's follow-up notes, and
 * the closed line; all read-only. The switcher's children come from
 * /family/children as the health card's do; the endpoint answers for one
 * child at a time.
 */
export function FamilyIncidents() {
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
    queryKey: ["family", "incidents", childId],
    enabled: role === "PARENT",
    queryFn: async () => familyIncidentsSchema.parse(unwrap(await api().get(`${PATH}${childQuery(childId)}`))),
  });
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
  const selected = pupils.find((c) => c.studentMembershipId === selectedId) ?? (childId ? undefined : pupils[0]);
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
          <Failed message={query.error.message} onRetry={() => void query.refetch()} />
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
