import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hostelLeaveListSchema, hostelLeaveRowSchema, hostelNightSchema, hostelRollCallSheetSchema, hostelsSchema, hostelVisitorsSchema, type HostelNight, type HostelRollCallSheet, type HostelRollStatus } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { newClientId } from "@/lib/outbox";
import { Chips, Notice } from "../staff/shared";
import { OutboxBadge, postOrQueue, useOutboxRunner } from "../teacher/support";
import { ModuleRoleHome } from "../modules/role-home";
import { LEAVE_KIND_KEY, LEAVE_STATUS_KEY, ROLL_KEY, whenOf } from "./words";

type Mode = "roll" | "leave" | "night" | "visitors";

/**
 * The warden's hostel on the phone (module HOSTEL, 3 Oct 2026) — the
 * WARDEN's home, the web's /hostel: tonight's roll call (saved on the device
 * first and sent through the outbox, so a corridor with no signal still
 * keeps the call), leave to decide and the gate's out and in, and the
 * visitor book, and tonight at the gate (5 Oct 2026: the web's /hostel/night —
 * who is away tonight, due back by when, signed out and in from the row).
 * Rooms, the menu and incidents are the web's /hostel pages.
 * Switched off, the home says so.
 */
export function WardenHome() {
  const session = useSession();
  const t = useT();
  const [mode, setMode] = useState<Mode>("roll");
  const [hostelId, setHostelId] = useState<string | null>(null);
  useOutboxRunner();
  const on = session.status === "signed-in" && (session.me.modules ?? []).includes("HOSTEL");
  const hostels = useQuery({ queryKey: ["hostel", "hostels"], enabled: on, queryFn: async () => hostelsSchema.parse(unwrap(await api().get("/api/v1/hostel/hostels"))) });
  const list = hostels.data?.hostels ?? [];
  const chosen = hostelId ?? list[0]?.id ?? null;
  if (!on) return <ModuleRoleHome role="WARDEN" />;
  return (
    <Screen title={t("modules.hostelName")} description={t("hostel.homeIntro")} refreshing={hostels.isRefetching} onRefresh={() => void hostels.refetch()}>
      <OutboxBadge />
      {hostels.isPending ? <Loading /> : null}
      {hostels.isError ? <Failed message={hostels.error.message} onRetry={() => void hostels.refetch()} /> : null}
      {hostels.data && list.length === 0 ? <Empty icon="bed" title={t("hostel.noHostels")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void hostels.refetch()} />} /> : null}
      {list.length > 1 ? <Chips label={t("hostel.whichHostel")} value={chosen ?? ""} onChange={setHostelId} options={list.map((h) => ({ value: h.id, label: h.name }))} /> : null}
      {chosen ? (
        <>
          <Chips
            label={t("hostel.wardenNav")}
            value={mode}
            onChange={setMode}
            options={[
              { value: "roll", label: t("hostel.tabRollCall") },
              { value: "leave", label: t("hostel.tabLeave") },
              { value: "night", label: t("collegeDesks.nightTab") },
              { value: "visitors", label: t("hostel.tabVisitors") },
            ]}
          />
          {mode === "roll" ? <RollCall hostelId={chosen} /> : mode === "leave" ? <Leave /> : mode === "night" ? <Night onLeave={() => setMode("leave")} /> : <Visitors hostelId={chosen} />}
        </>
      ) : null}
    </Screen>
  );
}

function RollCall({ hostelId }: { hostelId: string }) {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const qc = useQueryClient();
  const [slot, setSlot] = useState<"NIGHT" | "MORNING">("NIGHT");
  const [marks, setMarks] = useState<Record<string, HostelRollStatus>>({});
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const [clientId] = useState(() => newClientId());
  const sheet = useQuery({ queryKey: ["hostel", "roll", hostelId, slot], queryFn: async () => hostelRollCallSheetSchema.parse(unwrap(await api().get(`/api/v1/hostel/rollcall?hostelId=${hostelId}&slot=${slot}`))) });
  // Marks are kept per hostel and slot, so switching either shows that sheet's own.
  const markOf = (allotmentId: string) => marks[`${hostelId}:${slot}:${allotmentId}`];
  const save = useMutation({
    mutationFn: async (s: HostelRollCallSheet) =>
      postOrQueue({
        url: "/api/v1/hostel/rollcall",
        tag: `hostel-roll:${s.hostelId}`,
        body: { hostelId: s.hostelId, dateKey: s.dateKey, slot: s.slot, clientId: `${clientId}-${s.slot}`, entries: s.entries.map((e) => ({ allotmentId: e.allotmentId, status: markOf(e.allotmentId) ?? e.status })) },
      }),
    onSuccess: (outcome) => {
      if (outcome.kind === "refused") setNotice({ tone: "danger", text: outcome.message });
      else if (outcome.kind === "queued") setNotice({ tone: "ok", text: t("common.queuedOffline") });
      else {
        const d = outcome.data as { present: number; onLeave: number; absent: number } | undefined;
        setNotice({ tone: "ok", text: t("hostel.rollTaken", { present: d?.present ?? 0, onLeave: d?.onLeave ?? 0, absent: d?.absent ?? 0 }) });
        void qc.invalidateQueries({ queryKey: ["hostel", "roll"] });
      }
    },
  });
  const s = sheet.data;
  return (
    <View style={{ gap: th.space[3] }}>
      <Chips label={t("hostel.whichSlot")} value={slot} onChange={setSlot} options={[{ value: "NIGHT", label: t("hostel.slotNIGHT") }, { value: "MORNING", label: t("hostel.slotMORNING") }]} />
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {sheet.isPending ? <Loading /> : null}
      {sheet.isError ? <Failed message={sheet.error.message} onRetry={() => void sheet.refetch()} /> : null}
      {s ? (
        <Card title={`${s.hostelName} · ${s.dateKey}`}>
          <Text variant="sm" tone="muted">
            {s.taken ? t("hostel.rollTakenAt", { at: whenOf(s.taken.at, locale), name: s.taken.byName }) : t("hostel.rollHint")}
          </Text>
          {s.entries.length === 0 ? <Text tone="muted">{t("hostel.noBoarders")}</Text> : null}
          {s.entries.map((e) => (
            <Chips
              key={e.allotmentId}
              label={`${e.name} · ${t("hostel.roomBed", { room: e.roomNumber, bed: e.bed })}`}
              value={markOf(e.allotmentId) ?? e.status}
              disabled={Boolean(s.taken)}
              onChange={(next) => setMarks((m) => ({ ...m, [`${hostelId}:${slot}:${e.allotmentId}`]: next }))}
              options={(["PRESENT", "ON_LEAVE", "ABSENT"] as const).map((v) => ({ value: v, label: t(ROLL_KEY[v]) }))}
            />
          ))}
          {!s.taken && s.entries.length > 0 ? <Button label={t("hostel.saveRollCall")} busy={save.isPending} onPress={() => save.mutate(s)} /> : null}
        </Card>
      ) : null}
    </View>
  );
}

function Leave() {
  const t = useT();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const list = useQuery({ queryKey: ["hostel", "leave"], queryFn: async () => hostelLeaveListSchema.parse(unwrap(await api().get("/api/v1/hostel/leave?status=OPEN"))) });
  const act = useMutation({
    mutationFn: async (input: { id: string; what: "approve" | "decline" | "out" | "in" }) => {
      const url = input.what === "approve" || input.what === "decline" ? `/api/v1/hostel/leave/${input.id}/decide` : `/api/v1/hostel/leave/${input.id}/${input.what}`;
      const body = input.what === "approve" || input.what === "decline" ? { approve: input.what === "approve", note: "" } : {};
      return hostelLeaveRowSchema.parse(unwrap(await api().post(url, body)));
    },
    onSuccess: (l, input) => {
      const text = input.what === "approve" ? t("hostel.leaveApproved") : input.what === "decline" ? t("hostel.leaveDeclined") : input.what === "out" ? t("hostel.wentOut", { name: l.name }) : l.late ? t("hostel.cameBackLate", { name: l.name }) : t("hostel.cameBack", { name: l.name });
      setNotice({ tone: "ok", text });
      void qc.invalidateQueries({ queryKey: ["hostel"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  if (list.isPending) return <Loading />;
  if (list.isError) return <Failed message={list.error.message} onRetry={() => void list.refetch()} />;
  return (
    <>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {list.data.items.length === 0 ? <Empty icon="calendar" title={t("hostel.noLeave")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void list.refetch()} />} /> : null}
      {list.data.items.map((l) => (
        <Card key={l.id} title={`${l.name} · ${t(LEAVE_KIND_KEY[l.kind])}`}>
          <Text variant="sm" tone="muted">
            {`${l.destination} · ${t("hostel.fromTo", { from: whenOf(l.fromAt, locale), to: whenOf(l.toAt, locale) })} · ${t(LEAVE_STATUS_KEY[l.status])}`}
          </Text>
          {l.status === "PENDING" ? (
            <>
              <Button label={t("hostel.approve")} disabled={act.isPending} onPress={() => act.mutate({ id: l.id, what: "approve" })} />
              <Button label={t("hostel.decline")} variant="ghost" disabled={act.isPending} onPress={() => act.mutate({ id: l.id, what: "decline" })} />
            </>
          ) : null}
          {l.status === "AWAITING_CONSENT" ? <Text variant="sm" tone="warn">{t("hostel.waitingForGuardian")}</Text> : null}
          {l.status === "APPROVED" && !l.outAt ? <Button label={t("hostel.signOut")} variant="secondary" disabled={act.isPending} onPress={() => act.mutate({ id: l.id, what: "out" })} /> : null}
          {l.outAt && !l.inAt ? <Button label={t("hostel.signIn")} variant="secondary" disabled={act.isPending} onPress={() => act.mutate({ id: l.id, what: "in" })} /> : null}
        </Card>
      ))}
    </>
  );
}

const NIGHT_STATE: Record<HostelNight["leaves"][number]["state"], { key: TranslationKey; tone: "ok" | "warn" | "danger" | "muted" }> = {
  OVERDUE: { key: "collegeDesks.nightStateOVERDUE", tone: "danger" },
  OUT: { key: "collegeDesks.nightStateOUT", tone: "muted" },
  NOT_OUT: { key: "collegeDesks.nightStateNOT_OUT", tone: "muted" },
  BACK_LATE: { key: "collegeDesks.nightStateBACK_LATE", tone: "warn" },
  BACK: { key: "collegeDesks.nightStateBACK", tone: "ok" },
};
const hhmm = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
/** A date key a day either side, as the calendar counts (no clock, no zone). */
export function shiftDateKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const at = new Date(Date.UTC(y!, m! - 1, d! + days));
  return at.toISOString().slice(0, 10);
}

/**
 * Tonight at the gate (5 Oct 2026), the web's /hostel/night: the hostels'
 * curfew and night-out rule, then every approved leave covering the night with
 * when each is due back and where it stands; a boarder not yet gone out is
 * signed out from the row, one out or overdue is signed back in. The night
 * before and after are a press away; the server decides "tonight".
 */
function Night({ onLeave }: { onLeave: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const qc = useQueryClient();
  const [date, setDate] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const night = useQuery({ queryKey: ["hostel", "night", date], queryFn: async () => hostelNightSchema.parse(unwrap(await api().get(`/api/v1/hostel/night${date ? `?date=${date}` : ""}`))) });
  const gate = useMutation({
    mutationFn: async (input: { id: string; what: "out" | "in" }) => hostelLeaveRowSchema.parse(unwrap(await api().post(input.what === "out" ? `/api/v1/hostel/leave/${input.id}/out` : `/api/v1/hostel/leave/${input.id}/in`, {}))),
    onSuccess: (l, input) => {
      setNotice({ tone: "ok", text: input.what === "out" ? t("hostel.wentOut", { name: l.name }) : l.late ? t("hostel.cameBackLate", { name: l.name }) : t("hostel.cameBack", { name: l.name }) });
      void qc.invalidateQueries({ queryKey: ["hostel"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  if (night.isPending) return <Loading />;
  if (night.isError) return <Failed message={night.error.message} onRetry={() => void night.refetch()} />;
  const n = night.data;
  return (
    <View style={{ gap: th.space[3] }}>
      <Text variant="sm" tone="muted">{t("collegeDesks.nightIntro")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        <Button label={t("collegeDesks.nightPrev")} variant="ghost" onPress={() => setDate(shiftDateKey(n.dateKey, -1))} />
        <Button label={t("collegeDesks.nightNext")} variant="ghost" onPress={() => setDate(shiftDateKey(n.dateKey, 1))} />
        {date ? <Button label={t("collegeDesks.nightToday")} variant="ghost" onPress={() => setDate(null)} /> : null}
      </View>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      <Card title={t("collegeDesks.nightRulesTitle")}>
        {n.college ? null : <Text variant="sm" tone="muted">{t("collegeDesks.nightNoCurfew")}</Text>}
        {n.hostels.map((h) => (
          <Row key={h.id} title={h.name} caption={[n.college ? t("collegeDesks.nightCurfew", { time: hhmm(h.curfewMinute) }) : null, t(h.nightOutAllowed ? "collegeDesks.nightOutsAllowed" : "collegeDesks.nightOutsNotAllowed")].filter(Boolean).join(" · ")} />
        ))}
      </Card>
      <Card title={`${t("collegeDesks.nightTitle")} · ${n.dateKey}`}>
        {n.leaves.length === 0 ? <Empty icon="calendar" title={t("collegeDesks.nightNone")} body={t("collegeDesks.nightNoneBody", { date: n.dateKey })} action={<Button label={t("collegeDesks.nightOpenLeave")} variant="secondary" onPress={onLeave} />} /> : null}
        {n.leaves.map((l) => (
          <View key={l.leaveId} style={{ gap: th.space[1] }}>
            <Row
              title={`${l.name} · ${l.hostelName} ${l.roomNumber} · ${t(LEAVE_KIND_KEY[l.kind])}`}
              caption={[
                t(l.curfew ? "collegeDesks.nightBackByCurfew" : "collegeDesks.nightBackBy", { time: whenOf(l.backBy, locale) }),
                l.outAt ? t("hostel.outAt", { at: whenOf(l.outAt, locale) }) : null,
                l.inAt ? t("hostel.inAt", { at: whenOf(l.inAt, locale) }) : null,
              ].filter(Boolean).join(" · ")}
            />
            <Text variant="sm" tone={NIGHT_STATE[l.state].tone}>{t(NIGHT_STATE[l.state].key)}</Text>
            {l.state === "NOT_OUT" ? <Button label={t("hostel.signOut")} variant="secondary" disabled={gate.isPending} onPress={() => gate.mutate({ id: l.leaveId, what: "out" })} /> : null}
            {l.state === "OUT" || l.state === "OVERDUE" ? <Button label={t("hostel.signIn")} variant="secondary" disabled={gate.isPending} onPress={() => gate.mutate({ id: l.leaveId, what: "in" })} /> : null}
          </View>
        ))}
      </Card>
    </View>
  );
}

function Visitors({ hostelId }: { hostelId: string }) {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const qc = useQueryClient();
  const [allotmentId, setAllotmentId] = useState<string>("");
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const book = useQuery({ queryKey: ["hostel", "visitors"], queryFn: async () => hostelVisitorsSchema.parse(unwrap(await api().get("/api/v1/hostel/visitors"))) });
  const sheet = useQuery({ queryKey: ["hostel", "roll", hostelId, "NIGHT"], queryFn: async () => hostelRollCallSheetSchema.parse(unwrap(await api().get(`/api/v1/hostel/rollcall?hostelId=${hostelId}&slot=NIGHT`))) });
  const boarders = sheet.data?.entries ?? [];
  const signIn = useMutation({
    mutationFn: async () => hostelVisitorsSchema.parse(unwrap(await api().post("/api/v1/hostel/visitors", { allotmentId: allotmentId || boarders[0]?.allotmentId, name: name.trim(), relation: relation.trim() }))),
    onSuccess: (data) => {
      qc.setQueryData(["hostel", "visitors"], data);
      setNotice({ tone: "ok", text: t("hostel.visitorIn", { name: name.trim() }) });
      setName("");
      setRelation("");
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const signOut = useMutation({
    mutationFn: async (id: string) => hostelVisitorsSchema.parse(unwrap(await api().post(`/api/v1/hostel/visitors/${id}/out`, {}))),
    onSuccess: () => {
      setNotice({ tone: "ok", text: t("hostel.visitorOut") });
      void qc.invalidateQueries({ queryKey: ["hostel", "visitors"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  return (
    <View style={{ gap: th.space[3] }}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {boarders.length > 0 ? (
        <Card title={t("hostel.visitorSignIn")}>
          <Chips label={t("hostel.toSee")} value={allotmentId || boarders[0]!.allotmentId} onChange={setAllotmentId} options={boarders.map((b) => ({ value: b.allotmentId, label: b.name }))} />
          <Field label={t("hostel.visitorName")} value={name} onChangeText={setName} />
          <Field label={t("hostel.relation")} value={relation} onChangeText={setRelation} />
          <Button label={t("hostel.signVisitorIn")} disabled={!name.trim() || !relation.trim()} busy={signIn.isPending} onPress={() => signIn.mutate()} />
        </Card>
      ) : null}
      {book.isPending ? <Loading /> : null}
      {book.isError ? <Failed message={book.error.message} onRetry={() => void book.refetch()} /> : null}
      {book.data ? (
        <Card title={t("hostel.visitorsTodayTitle")}>
          {book.data.items.length === 0 ? <Text tone="muted">{t("hostel.noVisitors")}</Text> : null}
          {book.data.items.map((v) => (
            <Row
              key={v.id}
              title={`${v.name} (${v.relation}) · ${v.boarderName}`}
              caption={`${t("hostel.inAt", { at: whenOf(v.inAt, locale) })}${v.outAt ? ` · ${t("hostel.outAt", { at: whenOf(v.outAt, locale) })}` : ""}`}
              right={v.outAt ? undefined : <Button label={t("hostel.signVisitorOut")} variant="secondary" disabled={signOut.isPending} onPress={() => signOut.mutate(v.id)} />}
            />
          ))}
        </Card>
      ) : null}
    </View>
  );
}
