import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { driverTodaySchema, minuteLabel, type DriverToday, type RosterEntry } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useSession } from "@/lib/session";
import { startOutboxRunner } from "@/lib/outbox-runner";
import { queueBoarding, waitingPositions } from "@/lib/trip-positions";
import { currentPlace, startTracking, stopTracking } from "@/lib/trip-location-platform";
import { ModuleRoleHome } from "@/screens/modules/role-home";
import { TransportMap } from "./map";
import { DIRECTION_KEY, STATUS_KEY } from "./labels";

const PATH = "/api/v1/transport/today";
type Trip = DriverToday["trips"][number];


const hhmmOf = (iso: string | null) => (iso ? new Date(iso).toTimeString().slice(0, 5) : "");

/**
 * The DRIVER's home on the phone (transport, 3 Oct 2026) — the phone is the
 * bus's GPS. Off at the school, the module role's "switched off" home. On:
 * the location sentence to say yes to once; today's trips; Start trip (the
 * phone's place is sent, and the server starts it inside the first stop's
 * geofence — anywhere else it asks for a reason, which is then sent); while
 * a trip is LIVE the phone sends the bus's position every few seconds
 * through the outbox (lib/trip-positions), with the count still waiting for
 * a signal; the roster per stop to tick on and off (through the outbox too);
 * End trip, asked twice. Tracking runs only while one of the driver's trips
 * is LIVE, and stops the moment none is.
 */
export function DriverHome() {
  const t = useT();
  const th = useTheme();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const on = (me?.modules ?? []).includes("TRANSPORT");
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["transport", "today"],
    enabled: on,
    queryFn: async () => driverTodaySchema.parse(unwrap(await api().get(PATH))),
    refetchInterval: (q) => ((q.state.data as DriverToday | undefined)?.trips.some((x) => x.status === "LIVE") ? 30_000 : false),
  });
  const live = query.data?.trips.find((x) => x.status === "LIVE") ?? null;
  const tracking = useRef<string | null>(null);
  const waiting = useQuery({ queryKey: ["transport", "waiting"], enabled: Boolean(live), queryFn: waitingPositions, refetchInterval: 5_000 });

  useEffect(() => {
    startOutboxRunner();
  }, []);
  // Send the bus's position while — and only while — a trip of this driver's is live.
  useEffect(() => {
    if (!query.data) return;
    if (live && tracking.current !== live.id) {
      tracking.current = live.id;
      void startTracking(live.id, { title: t("transport.foregroundTitle"), body: t("transport.foregroundBody") });
    } else if (!live && tracking.current) {
      tracking.current = null;
      void stopTracking();
    }
  }, [live, query.data, t]);

  if (!on) return <ModuleRoleHome role="DRIVER" />;
  const refresh = () => void client.invalidateQueries({ queryKey: ["transport"] });
  const d = query.data;
  return (
    <Screen title={t("transport.driverTitle")} description={d?.dateKey} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d?.consent.needed ? <Consent onDone={refresh} /> : null}
      {live ? (
        <Card title={t("transport.tripLive")}>
          <Text>{t("transport.sending")}</Text>
          {waiting.data ? (
            <Text tone="warn" variant="sm">
              {t("transport.queued", { count: waiting.data })}
            </Text>
          ) : null}
          {live.lowBattery ? (
            <Text tone="warn" variant="sm">
              {t("transport.batteryLow")}
            </Text>
          ) : null}
        </Card>
      ) : null}
      {d?.noSchool && d.trips.length === 0 ? (
        // A Sunday or a closing holiday (B-11): no trip runs, so none is "missed" and none waits to start.
        <Empty
          icon="bus"
          title={d.noSchool.holidayName ? t("common.noSchoolTodayHoliday", { name: d.noSchool.holidayName }) : t("common.noSchoolToday")}
          body={t("transport.noTripsClosedDay")}
          action={<Button label={t("transport.refresh")} variant="secondary" onPress={() => void query.refetch()} />}
        />
      ) : null}
      {d && !d.noSchool && d.trips.length === 0 ? <Empty icon="bus" title={t("transport.noDriverTrips")} body={t("transport.noDriverTripsBody")} action={<Button label={t("transport.refresh")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      <View style={{ gap: th.space[3] }}>
        {d?.trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} consentNeeded={d.consent.needed} onChanged={refresh} />
        ))}
      </View>
    </Screen>
  );
}

function Consent({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Card title={t("transport.consentTitle")}>
      <Text>{t("transport.consentBody")}</Text>
      {error ? <Text tone="danger">{error}</Text> : null}
      <Button
        label={t("transport.consentAgree")}
        busy={busy}
        onPress={async () => {
          setBusy(true);
          const result = await api().post("/api/v1/transport/consent", {});
          setBusy(false);
          if (!result.ok) return setError(errorText(result, t("common.somethingWrong")));
          onDone();
        }}
      />
    </Card>
  );
}

function TripCard({ trip, consentNeeded, onChanged }: { trip: Trip; consentNeeded: boolean; onChanged: () => void }) {
  const t = useT();
  const th = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askReason, setAskReason] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ticks, setTicks] = useState<Record<string, { boarded?: boolean; alighted?: boolean }>>({});

  async function start(withReason: boolean) {
    setBusy(true);
    setError(null);
    const here = withReason ? null : await currentPlace();
    if (!withReason && !here) {
      setBusy(false);
      setError(t("transport.locationDenied"));
      setAskReason(true);
      return;
    }
    const body = withReason ? { reason: reason.trim(), ...(here ? here : {}) } : { lat: here!.lat, lng: here!.lng, ...(here!.accuracy !== null ? { accuracy: here!.accuracy } : {}) };
    const result = await api().post(`/api/v1/transport/trips/${trip.id}/start`, body);
    setBusy(false);
    if (!result.ok) {
      setError(errorText(result, t("common.somethingWrong")));
      if (result.status === 403 || result.status === 422) setAskReason(true);
      return;
    }
    await startTracking(trip.id, { title: t("transport.foregroundTitle"), body: t("transport.foregroundBody") });
    onChanged();
  }

  async function end() {
    setBusy(true);
    const result = await api().post(`/api/v1/transport/trips/${trip.id}/end`, {});
    setBusy(false);
    setConfirmEnd(false);
    if (!result.ok) return setError(errorText(result, t("common.somethingWrong")));
    await stopTracking();
    onChanged();
  }

  async function tick(r: RosterEntry, change: { boarded?: boolean; alighted?: boolean }) {
    setTicks((all) => ({ ...all, [r.allotmentId]: { ...all[r.allotmentId], ...change } }));
    await queueBoarding(trip.id, { allotmentId: r.allotmentId, ...change });
  }

  const isLive = trip.status === "LIVE";
  return (
    <Card title={t("transport.tripTitle", { bus: trip.busRegistration, direction: t(DIRECTION_KEY[trip.direction] ?? "transport.directionMorning") })}>
      <Text tone="muted" variant="sm">
        {[trip.routeName, trip.scheduledMinute !== null ? t("transport.scheduledAt", { time: minuteLabel(trip.scheduledMinute) }) : null, t(STATUS_KEY[trip.status])].filter(Boolean).join(" · ")}
      </Text>
      <TransportMap stops={trip.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.name, passed: Boolean(s.passedAt) }))} track={trip.track.map((p) => ({ lat: p.lat, lng: p.lng }))} buses={isLive && trip.lastPosition ? [{ id: trip.id, lat: trip.lastPosition.lat, lng: trip.lastPosition.lng, label: trip.busRegistration }] : []} />
      {error ? <Text tone="danger">{error}</Text> : null}
      {trip.canStart && !consentNeeded ? (
        <View style={{ gap: th.space[2] }}>
          {askReason ? (
            <>
              <Field label={t("transport.startReason")} value={reason} onChangeText={setReason} maxLength={200} />
              <Button label={t("transport.startAnyway")} busy={busy} disabled={reason.trim().length < 3} onPress={() => void start(true)} />
            </>
          ) : (
            <Button label={t("transport.startTrip")} busy={busy} onPress={() => void start(false)} />
          )}
        </View>
      ) : null}
      {isLive ? (
        confirmEnd ? (
          <View style={{ gap: th.space[2] }}>
            <Text>{t("transport.endConfirm")}</Text>
            <Button label={t("transport.endTrip")} variant="danger" busy={busy} onPress={() => void end()} />
          </View>
        ) : (
          <Button label={t("transport.endTrip")} variant="secondary" onPress={() => setConfirmEnd(true)} />
        )
      ) : null}
      <View style={{ gap: th.space[3] }}>
        {trip.stops.map((s, i) => {
          const riders = trip.roster.filter((r) => r.stopId === s.id);
          return (
            <View key={s.id} style={{ gap: th.space[1] }}>
              <Text bold>
                {`${i + 1}. ${s.name}`} <Text tone="muted">{minuteLabel(s.scheduledMinute)}</Text>
              </Text>
              {s.passedAt ? (
                <Text tone="muted" variant="sm">
                  {t("transport.passedAt", { time: hhmmOf(s.passedAt) })}
                </Text>
              ) : null}
              {riders.map((r) => {
                const local = ticks[r.allotmentId] ?? {};
                const boarded = local.boarded ?? Boolean(r.boardedAt);
                const alighted = local.alighted ?? Boolean(r.alightedAt);
                return (
                  <View key={r.allotmentId} style={{ gap: th.space[1] }}>
                    <Text>{[r.name, r.className].filter(Boolean).join(" · ")}</Text>
                    {isLive ? (
                      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
                        <Button label={boarded ? `✓ ${t("transport.markOn")}` : t("transport.markOn")} accessibilityLabel={t("transport.markOnName", { name: r.name })} accessibilityState={{ selected: boarded }} variant={boarded ? "primary" : "secondary"} onPress={() => void tick(r, { boarded: !boarded })} />
                        <Button label={alighted ? `✓ ${t("transport.markOff")}` : t("transport.markOff")} accessibilityLabel={t("transport.markOffName", { name: r.name })} accessibilityState={{ selected: alighted }} variant={alighted ? "primary" : "secondary"} onPress={() => void tick(r, { alighted: !alighted })} />
                      </View>
                    ) : (
                      <Text tone="muted" variant="sm">
                        {[r.boardedAt ? t("transport.onBoard", { time: hhmmOf(r.boardedAt) }) : null, r.alightedAt ? t("transport.offBus", { time: hhmmOf(r.alightedAt) }) : null].filter(Boolean).join(" · ") || t("transport.notTicked")}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
        {trip.roster.length === 0 ? <Text tone="muted">{t("transport.noRiders")}</Text> : null}
      </View>
    </Card>
  );
}
