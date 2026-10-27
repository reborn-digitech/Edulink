import { useState } from "react";
import { Linking, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { familyChildrenSchema, familyTransportSchema, minuteLabel, type FamilyTransport as View_ } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, SwitchRow, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { ChildSwitcher, childQuery, param } from "./shared";
import { TransportMap } from "../driver/map";
import { DIRECTION_KEY, STATUS_KEY } from "../driver/labels";

const PATH = "/api/v1/family/transport";
const hhmmOf = (iso: string | null) => (iso ? new Date(iso).toTimeString().slice(0, 5) : "");

/**
 * A child's bus for the family on the phone — the web's /parent/transport:
 * the route, the stop and its times, the bus's number (the driver only when
 * the school says so); while a trip runs, the bus on the map, "last seen n
 * minutes ago" when the feed is stale, the stops passed and the arrival
 * range at theirs, read again every fifteen seconds while the trip is live;
 * and this guardian's "tell me when the bus is near" for the child. The BUS,
 * never the child. A pupil reads their own, in their own words (owner-batch-item5:
 * "My bus", from the STUDENT menu's entry; the guardian's switch stays theirs).
 */
export function FamilyTransport() {
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const client = useQueryClient();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const [childId, setChildId] = useState<string | null>(param(params.childId) ?? param(params.child) ?? null);
  const [alertError, setAlertError] = useState<string | null>(null);
  const children = useQuery({
    queryKey: ["family", "children"],
    enabled: role === "PARENT",
    queryFn: async () => familyChildrenSchema.parse(unwrap(await api().get("/api/v1/family/children"))),
  });
  const query = useQuery({
    queryKey: ["family", "transport", role === "STUDENT" ? "mine" : childId],
    enabled: role === "PARENT" || role === "STUDENT",
    queryFn: async () => familyTransportSchema.parse(unwrap(await api().get(`${PATH}${role === "STUDENT" ? "" : childQuery(childId)}`))),
    refetchInterval: (q) => ((q.state.data as View_ | undefined)?.trip?.status === "LIVE" ? 15_000 : false),
  });
  const d = query.data;
  const pupils = children.data?.children ?? [];
  const trip = d?.trip ?? null;
  const mine = trip?.stops.find((s) => s.mine) ?? null;

  async function switchAlerts(next: boolean) {
    if (!d) return;
    setAlertError(null);
    const result = await api().post(`${PATH}/alerts`, { childId: d.studentMembershipId, nearAlerts: next });
    if (!result.ok) return setAlertError(errorText(result, t("common.somethingWrong")));
    void client.invalidateQueries({ queryKey: ["family", "transport"] });
  }

  return (
    <Screen title={role === "STUDENT" ? t("schoolCampus.myBus") : d ? t("transport.forChild", { name: d.childName }) : t("transport.parentTitle")} description={d?.schoolName} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {role === "PARENT" ? <ChildSwitcher pupils={pupils} selectedId={d?.studentMembershipId ?? childId} onSelect={setChildId} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d && !d.moduleOn ? <Empty icon="bus" title={t("modules.offTitle", { module: t("modules.transportName") })} body={t("modules.offBody", { module: t("modules.transportName") })} action={<Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} /> : null}
      {d && d.moduleOn && !d.seat ? <Empty icon="bus" title={role === "STUDENT" ? t("schoolCampus.myNoSeat") : t("transport.noSeat", { name: d.childName })} body={t("transport.noSeatBody")} action={<Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} /> : null}
      {d?.seat ? (
        <Card title={d.seat.busRegistration ? t("transport.busNumber", { bus: d.seat.busRegistration }) : d.seat.routeName}>
          <Text tone="muted">{[d.seat.routeName, d.seat.stopName].join(" · ")}</Text>
          {d.seat.boards && d.seat.morningMinute !== null ? <Text>{t("transport.pickupAt", { time: minuteLabel(d.seat.morningMinute) })}</Text> : null}
          {d.seat.alights && d.seat.eveningMinute !== null ? <Text>{t("transport.dropAt", { time: minuteLabel(d.seat.eveningMinute) })}</Text> : null}
          {d.seat.driverName ? <Text tone="muted">{t("transport.driverLine", { name: d.seat.driverName })}</Text> : null}
          {d.seat.driverPhone ? <Button label={d.seat.driverPhone} variant="ghost" onPress={() => void Linking.openURL(`tel:${d.seat!.driverPhone}`)} /> : null}
          {role === "PARENT" ? <SwitchRow label={t("transport.alertsOn")} hint={t("transport.alertsHint", { name: d.childName })} value={d.nearAlerts} onChange={(next) => void switchAlerts(next)} /> : null}
          {alertError ? <Text tone="danger">{alertError}</Text> : null}
        </Card>
      ) : null}
      {d?.seat && !trip ? <Empty icon="clock" title={t("transport.noTripToday")} body={role === "STUDENT" ? t("schoolCampus.myNoTripBody") : t("transport.noTripTodayBody", { name: d.childName })} action={<Button label={t("transport.refresh")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {trip ? (
        <Card title={trip.status === "LIVE" ? t("transport.liveNow") : trip.status === "ENDED" ? t("transport.tripEnded") : t("transport.notStarted")}>
          <Text tone="muted" variant="sm">
            {[t(DIRECTION_KEY[trip.direction] ?? "transport.directionMorning"), t(STATUS_KEY[trip.status])].join(" · ")}
          </Text>
          {trip.staleMinutes !== null ? <Text tone="warn">{t("transport.lastSeenAgo", { minutes: trip.staleMinutes })}</Text> : null}
          {trip.eta && mine ? (
            <Text bold variant="lg">
              {t("transport.etaRange", { stop: mine.name, from: hhmmOf(trip.eta.earliest), to: hhmmOf(trip.eta.latest) })}
            </Text>
          ) : null}
          {mine?.passedAt ? <Text>{t("transport.passedStop", { stop: mine.name, time: hhmmOf(mine.passedAt) })}</Text> : null}
          {trip.boardedAt ? <Text tone="muted">{t("transport.boardedAt", { time: hhmmOf(trip.boardedAt) })}</Text> : null}
          {trip.alightedAt ? <Text tone="muted">{t("transport.alightedAt", { time: hhmmOf(trip.alightedAt) })}</Text> : null}
          <TransportMap
            stops={trip.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.name, mine: s.mine, passed: Boolean(s.passedAt) }))}
            buses={trip.lastPosition ? [{ id: trip.id, lat: trip.lastPosition.lat, lng: trip.lastPosition.lng, label: d?.seat?.busRegistration ?? "", stale: trip.staleMinutes !== null }] : []}
          />
          <View style={{ gap: th.space[1] }}>
            {trip.stops.map((s, i) => (
              <Text key={s.id} bold={s.mine} tone={s.passedAt ? "muted" : "fg"}>
                {[`${i + 1}. ${s.name}`, minuteLabel(s.scheduledMinute), s.mine ? t("transport.yourStop") : null, s.passedAt ? t("transport.passedAt", { time: hhmmOf(s.passedAt) }) : null].filter(Boolean).join(" · ")}
              </Text>
            ))}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}
