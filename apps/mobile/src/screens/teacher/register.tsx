import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { onlineManager, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { attendanceClassesSchema, registerSchema, type RegisterBody } from "@edulink/contracts";
import { Button, Card, Empty, Failed, LiveNotice, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { newClientId, onQueueEvent } from "@/lib/outbox";
import { useEvents } from "@/lib/use-events";
import { OutboxBadge, dayLabel, postOrQueue, useOutboxRunner, useQueuedCount } from "./support";
import { REASON_KEY } from "../family/absence-notes";

/**
 * The register, the web's /teacher/attendance, with the outbox first: a tap
 * on a status is saved on the device before anything else, sent 700 ms later
 * in one batch, and queued for replay when the network is not there. The
 * body is exactly what POST /api/attendance takes — classId, dateKey and the
 * marks, each with a clientId minted here so a replay cannot write twice.
 */
type Status = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
const STATUSES: Status[] = ["PRESENT", "LATE", "ABSENT", "EXCUSED"];
const STATUS_KEY = { PRESENT: "attendance.present", LATE: "attendance.late", ABSENT: "attendance.absent", EXCUSED: "attendance.excused" } as const;
const SHORT_KEY = { PRESENT: "attendance.presentShort", LATE: "attendance.lateShort", ABSENT: "attendance.absentShort", EXCUSED: "attendance.excusedShort" } as const;

type Mark = { status: Status; note: string | null; clientId: string; markedAt: string };
/** `delivered`: marks that waited in the outbox have since reached the school (A3-journeys-32). */
type SaveState = "idle" | "saving" | "saved" | "queued" | "delivered" | "error";

/** The browser's word on the web target (React Query mirrors navigator.onLine); a phone never says offline and finds out on the first send. */
function useOnline(): boolean {
  return useSyncExternalStore(
    (notify) => onlineManager.subscribe(notify),
    () => onlineManager.isOnline(),
    () => true,
  );
}

/**
 * The register's one line of state. Once the outbox has sent what it held
 * the marks are at the school, so it says that rather than "Saved on this
 * device" for ever; before anything is marked while offline it says the
 * marks will wait on the device, rather than "Ready".
 */
export function registerStateKey(state: SaveState, online: boolean) {
  if (state === "saving") return "teacher.saving" as const;
  if (state === "saved") return "teacher.savedShort" as const;
  if (state === "queued") return online ? ("teacher.savedOnDevice" as const) : ("teacher.registerOffline" as const);
  if (state === "delivered") return "teacher.registerSent" as const;
  if (state === "error") return "teacher.didNotSave" as const;
  return online ? ("teacher.readyShort" as const) : ("teacher.registerOffline" as const);
}

export function Register() {
  // A child's record, a register, a message: private while on screen (no screenshots or screen recording on the phone).
  usePrivateScreen();
  const params = useLocalSearchParams<{ classId?: string; date?: string }>();
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const [classId, setClassId] = useState<string | null>(params.classId ?? null);
  const date = params.date;
  useOutboxRunner();

  const classes = useQuery({
    queryKey: ["staff", "attendance", "classes", date ?? "today"],
    queryFn: async () => attendanceClassesSchema.parse(unwrap(await api().get(`/api/v1/staff/attendance/classes${date ? `?date=${date}` : ""}`))),
    enabled: !classId,
  });

  if (classId) return <ClassRegister classId={classId} date={date} onBack={() => setClassId(null)} />;

  const data = classes.data;
  return (
    <Screen title={t("nav.register")} description={data ? `${t("teacher.dayLabel")}: ${dayLabel(data.dateKey, locale)}` : undefined} refreshing={classes.isRefetching} onRefresh={() => void classes.refetch()}>
      {classes.isPending ? <Loading /> : null}
      {classes.isError ? <Failed error={classes.error} onRetry={() => void classes.refetch()} /> : null}
      {data ? (
        <>
          <OutboxBadge />
          {data.calendar.closed ? (
            <Text variant="sm" tone="warn">
              {data.calendar.nonTeachingDay ? t("teacher.sundayRegister") : t("teacher.closedDayBody")}
            </Text>
          ) : null}
          {data.classes.length === 0 ? (
            <Empty title={t("teacher.noRegisterToday")} body={t("teacher.noRegisterBody")} action={<Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />} />
          ) : (
            <Card title={t("teacher.takeRegister")}>
              {data.unmarkedCount === 0 ? (
                <Text variant="sm" tone="ok">
                  {t("teacher.allMarkedTitle")}
                </Text>
              ) : null}
              {data.classes.map((c) => (
                <Row
                  key={c.id}
                  title={c.name}
                  caption={`${c.students === 1 ? t("teacher.studentsCountOne") : t("teacher.studentsCount", { count: c.students })}${c.subject ? ` · ${c.subject}` : ""}`}
                  right={
                    <Text variant="sm" bold tone={c.taken ? "ok" : "accent"}>
                      {c.taken ? t("teacher.registerDone") : t("teacher.registerToDo")}
                    </Text>
                  }
                  onPress={() => setClassId(c.id)}
                />
              ))}
            </Card>
          )}
        </>
      ) : null}
    </Screen>
  );
}

function ClassRegister({ classId, date, onBack }: { classId: string; date?: string; onBack: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const register = useQuery({
    queryKey: ["staff", "attendance", "register", classId, date ?? "today"],
    queryFn: async () => registerSchema.parse(unwrap(await api().get(`/api/v1/staff/attendance/register?classId=${classId}${date ? `&date=${date}` : ""}`))),
  });
  const [local, setLocal] = useState<Record<string, Mark>>({});
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  // How many of the last batch the server would not take (a pupil no longer in the class): said beside the state, as the web's toast says it.
  const [rejected, setRejected] = useState(0);
  // And how many it skipped because the register already holds a later mark for that pupil (TA-029): every mark sent
  // here carries a fresh key, so a skipped one was lost to somebody's later mark, and is said rather than shown as Saved.
  const [skipped, setSkipped] = useState(0);
  const dirty = useRef(new Map<string, Mark>());
  const lastBody = useRef<{ classId: string; dateKey: string; marks: unknown[] } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tag = `attendance:${classId}`;
  const online = useOnline();
  // What this register put in the outbox: when the count for its tag falls back to
  // nothing after it held something, the outbox sent it and the server took it.
  const waiting = useQueuedCount(tag);
  const held = useRef(false);
  useEffect(() => {
    if (waiting > 0) held.current = true;
    else if (held.current) {
      held.current = false;
      setState((s) => (s === "queued" ? "delivered" : s));
    }
  }, [waiting]);
  // A replay the server refused leaves the outbox too, and is not a delivery.
  useEffect(
    () =>
      onQueueEvent((event) => {
        if (event.type === "rejected" && event.item.tag === tag) {
          held.current = false;
          setState("error");
          setError(t("teacher.didNotSave"));
        }
      }),
    [tag, t],
  );

  /* ---- a colleague's marks, live ----
   *
   * The events stream says the register for this class and day changed. If
   * every clientId on the event is one this device minted, the save was ours
   * and the chips already show it. Otherwise the register is re-read, and
   * the teacher's own marks that the server has not yet confirmed (unsent,
   * in flight, or in the outbox) stay on top of what came back: `local`
   * overlays the roster, and only the entries the server has confirmed are
   * let go, so what the colleague marked shows and what this teacher is
   * marking is never fought over. The same re-read runs when the app comes
   * back to the front (the stream is closed in the background). The web's
   * register does the same, in src/app/(app)/teacher/attendance/register.tsx.
   */
  const minted = useRef(new Set<string>());
  const unconfirmed = useRef(new Map<string, string>());
  const [colleagueAt, setColleagueAt] = useState<number | null>(null);
  const reread = useCallback(async () => {
    const before = register.data?.roster;
    const result = await register.refetch();
    const fresh = result.data?.roster;
    if (!fresh) return;
    // The server's word replaces every mark of ours it has confirmed; the rest stay the teacher's.
    setLocal((prev) => {
      const next: Record<string, Mark> = {};
      for (const [id, m] of Object.entries(prev)) if (dirty.current.has(id) || unconfirmed.current.has(id)) next[id] = m;
      return next;
    });
    // Said only when something on the screen moved: a re-read that found nothing new is silent.
    const changed = !before || before.length !== fresh.length || fresh.some((p, i) => p.membershipId !== before[i]!.membershipId || p.status !== before[i]!.status || p.note !== before[i]!.note);
    if (changed) setColleagueAt(Date.now());
  }, [register]);
  useEvents(
    ["attendance.updated"],
    (event) => {
      if (event.type !== "attendance.updated" || event.classId !== classId || event.dateKey !== register.data?.dateKey) return;
      const ids = event.clientIds ?? [];
      const ours = ids.length > 0 && ids.every((id) => minted.current.has(id));
      if (!ours) void reread();
    },
    { enabled: !!register.data, onResume: () => void reread() },
  );

  const flush = useCallback(async () => {
    const dateKey = register.data?.dateKey;
    if (!dateKey) return;
    let body = lastBody.current;
    if (dirty.current.size > 0) {
      const marks = [...dirty.current.entries()].map(([studentMembershipId, m]) => ({ studentMembershipId, status: m.status, note: m.note ?? undefined, clientId: m.clientId, markedAt: m.markedAt }));
      dirty.current.clear();
      body = { classId, dateKey, marks };
    }
    if (!body) return;
    lastBody.current = body;
    setState("saving");
    setError(null);
    setRejected(0);
    setSkipped(0);
    const outcome = await postOrQueue<{ applied?: number; skipped?: number; rejected?: unknown[] }>({ url: "/api/attendance", body, tag });
    if (outcome.kind === "refused") {
      setState("error");
      setError(outcome.message || t("teacher.checkConnection"));
      return;
    }
    lastBody.current = null;
    setState(outcome.kind === "sent" ? "saved" : "queued");
    if (outcome.kind === "sent") {
      if (Array.isArray(outcome.data?.rejected)) setRejected(outcome.data.rejected.length);
      if (typeof outcome.data?.skipped === "number") setSkipped(outcome.data.skipped);
      // Confirmed: a later re-read may show these pupils as the server has them, unless re-marked since.
      for (const sent of body.marks as { studentMembershipId: string; clientId: string }[]) {
        if (unconfirmed.current.get(sent.studentMembershipId) === sent.clientId) unconfirmed.current.delete(sent.studentMembershipId);
      }
    }
    void qc.invalidateQueries({ queryKey: ["staff", "attendance", "classes"] });
    void qc.invalidateQueries({ queryKey: ["staff", "today"] });
  }, [classId, register.data?.dateKey, qc, t, tag]);

  const scheduleSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 700);
  }, [flush]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const mark = (membershipId: string, status: Status, note: string | null) => {
    const m: Mark = { status, note, clientId: newClientId(), markedAt: new Date().toISOString() };
    dirty.current.set(membershipId, m);
    minted.current.add(m.clientId);
    unconfirmed.current.set(membershipId, m.clientId);
    setLocal((prev) => ({ ...prev, [membershipId]: m }));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scheduleSave();
  };

  const data = register.data;
  const statusOf = (p: RegisterBody["roster"][number]) => local[p.membershipId]?.status ?? p.status;
  const unmarked = data ? data.roster.filter((p) => !statusOf(p)) : [];
  const markAllPresent = () => {
    if (!data) return;
    const stamp = new Date().toISOString();
    const next: Record<string, Mark> = {};
    for (const p of unmarked) {
      const m: Mark = { status: "PRESENT", note: p.note, clientId: newClientId(), markedAt: stamp };
      dirty.current.set(p.membershipId, m);
      minted.current.add(m.clientId);
      unconfirmed.current.set(p.membershipId, m.clientId);
      next[p.membershipId] = m;
    }
    setLocal((prev) => ({ ...prev, ...next }));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scheduleSave();
  };

  const marked = data ? data.roster.length - unmarked.length : 0;
  const stateLine = t(registerStateKey(state, online));

  return (
    <Screen title={data?.class.name ?? t("nav.register")} description={data ? dayLabel(data.dateKey, locale) : undefined} refreshing={register.isRefetching} onRefresh={() => void register.refetch()}>
      <Button label={t("common.back")} variant="ghost" onPress={onBack} style={{ alignSelf: "flex-start" }} />
      {register.isPending ? <Loading /> : null}
      {register.isError ? <Failed error={register.error} onRetry={() => void register.refetch()} /> : null}
      {data ? (
        <>
          {data.duty.reason === "COVER" && data.duty.coverUntil ? (
            <Text variant="sm" tone="accent">
              {t("teacher.coveringUntil", { date: dayLabel(data.duty.coverUntil, locale) })}
            </Text>
          ) : null}
          {data.calendar.closed ? (
            <Text variant="sm" tone="warn">
              {data.calendar.nonTeachingDay ? t("teacher.sundayRegister") : t("teacher.closedDayBody")}
            </Text>
          ) : null}
          {data.readOnly ? (
            <Text variant="sm" tone="warn">
              {t("attendance.futureRegister")}
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: th.space[3], flexWrap: "wrap" }}>
            <Text variant="sm" bold tone={unmarked.length === 0 && data.roster.length > 0 ? "ok" : "fg"} accessibilityLiveRegion="polite">
              {unmarked.length === 0 && data.roster.length > 0 ? t("teacher.registerComplete") : t("teacher.markedOf", { marked, total: data.roster.length })}
            </Text>
            <Text variant="xs" tone={state === "error" ? "danger" : state === "delivered" ? "ok" : "muted"} accessibilityLiveRegion="polite" testID="register-state">
              {stateLine}
            </Text>
          </View>
          <LiveNotice stamp={colleagueAt}>{t("teacher.updatedByColleague")}</LiveNotice>
          <OutboxBadge tag={tag} />
          {rejected > 0 ? (
            <Text variant="sm" tone="warn" accessibilityLiveRegion="polite">
              {t("teacher.someNotSaved")}: {t("teacher.noLongerInClass", { count: rejected })}
            </Text>
          ) : null}
          {skipped > 0 ? (
            <Text variant="sm" tone="warn" accessibilityLiveRegion="polite">
              {t("teacher.supersededMarks", { count: skipped })}
            </Text>
          ) : null}
          {state === "error" ? <Failed message={error ?? t("teacher.didNotSave")} onRetry={() => void flush()} /> : null}
          {!data.readOnly && unmarked.length > 0 ? <Button label={t("teacher.markAllPresent", { count: unmarked.length })} variant="secondary" onPress={markAllPresent} /> : null}
          {data.roster.length === 0 ? (
            <Empty title={t("teacher.nobodyInClassYet")} body={t("teacher.addStudentsAppear")} action={<Button label={t("teacher.classJoinCode")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/classes/detail", params: { classId } } as never)} />} />
          ) : (
            <Card>
              {data.roster.map((p) => {
                const current = statusOf(p);
                const note = local[p.membershipId]?.note ?? p.note;
                return (
                  <View key={p.membershipId} style={{ gap: th.space[2], paddingVertical: th.space[2], borderBottomWidth: 1, borderBottomColor: th.border }}>
                    <Text variant="base" bold>
                      {p.name}
                    </Text>
                    {p.absenceNote ? (
                      // The family told the school first: the line sits under the name before the teacher marks anything.
                      <Text variant="xs" bold tone="warn" testID="absence-note-line">
                        {t(p.absenceNote.byFamily ? "familyCare.registerLine" : "familyCare.registerLineSelf", { reason: t(REASON_KEY[p.absenceNote.reason]) })}
                        {p.absenceNote.text ? ` · “${p.absenceNote.text}”` : ""}
                      </Text>
                    ) : null}
                    {note ? (
                      <Text variant="xs" tone="muted">
                        {t("teacher.noteFor", { name: p.name })}: {note}
                      </Text>
                    ) : null}
                    {/* One radio group per pupil, named with the pupil, as the web's register names it (A3-journeys-32). */}
                    <View accessibilityRole="radiogroup" accessibilityLabel={t("teacher.attendanceFor", { name: p.name })} testID={`register-group-${p.membershipId}`} style={{ flexDirection: "row", gap: th.space[2] }}>
                      {STATUSES.map((s) => (
                        <StatusChip key={s} status={s} selected={current === s} disabled={data.readOnly} label={t(STATUS_KEY[s])} short={t(SHORT_KEY[s])} onPress={() => mark(p.membershipId, s, note)} />
                      ))}
                    </View>
                  </View>
                );
              })}
            </Card>
          )}
        </>
      ) : null}
    </Screen>
  );
}

function StatusChip({ status, selected, disabled, label, short, onPress }: { status: Status; selected: boolean; disabled: boolean; label: string; short: string; onPress: () => void }) {
  const th = useTheme();
  const colour = { PRESENT: [th.attPresent, th.attPresentSoft], LATE: [th.attLate, th.attLateSoft], ABSENT: [th.attAbsent, th.attAbsentSoft], EXCUSED: [th.attExcused, th.attExcusedSoft] }[status] as [string, string];
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={selected}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, minHeight: th.tap, alignItems: "center", justifyContent: "center", borderRadius: th.radius.md, borderWidth: 2, borderColor: selected ? colour[0] : th.border, backgroundColor: selected ? colour[1] : th.surface, opacity: pressed ? 0.8 : 1 })}
    >
      <Text variant="base" bold style={{ color: selected ? colour[0] : th.fgMuted }}>
        {short}
      </Text>
    </Pressable>
  );
}
