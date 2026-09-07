import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { attendanceClassesSchema, registerSchema, type RegisterBody } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { newClientId } from "@/lib/outbox";
import { OutboxBadge, dayLabel, useOutboxRunner, writeOrQueue } from "./support";

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
type SaveState = "idle" | "saving" | "saved" | "queued" | "error";

export function Register() {
  const params = useLocalSearchParams<{ classId?: string; date?: string }>();
  const t = useT();
  const { locale } = useLocale();
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
      {classes.isError ? <Failed message={classes.error.message} onRetry={() => void classes.refetch()} /> : null}
      {data ? (
        <>
          <OutboxBadge />
          {data.calendar.closed ? (
            <Text variant="sm" tone="warn">
              {data.calendar.nonTeachingDay ? t("teacher.sundayRegister") : t("teacher.closedDayBody")}
            </Text>
          ) : null}
          {data.classes.length === 0 ? (
            <Empty title={t("teacher.noRegisterToday")} body={t("teacher.noRegisterBody")} />
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
  const qc = useQueryClient();
  const register = useQuery({
    queryKey: ["staff", "attendance", "register", classId, date ?? "today"],
    queryFn: async () => registerSchema.parse(unwrap(await api().get(`/api/v1/staff/attendance/register?classId=${classId}${date ? `&date=${date}` : ""}`))),
  });
  const [local, setLocal] = useState<Record<string, Mark>>({});
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const dirty = useRef(new Map<string, Mark>());
  const lastBody = useRef<{ classId: string; dateKey: string; marks: unknown[] } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tag = `attendance:${classId}`;

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
    const outcome = await writeOrQueue(await api().post("/api/attendance", body), { url: "/api/attendance", body, tag });
    if (outcome.kind === "refused") {
      setState("error");
      setError(outcome.message || t("teacher.checkConnection"));
      return;
    }
    lastBody.current = null;
    setState(outcome.kind === "sent" ? "saved" : "queued");
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
      next[p.membershipId] = m;
    }
    setLocal((prev) => ({ ...prev, ...next }));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scheduleSave();
  };

  const marked = data ? data.roster.length - unmarked.length : 0;
  const stateLine = state === "saving" ? t("teacher.saving") : state === "saved" ? t("teacher.savedShort") : state === "queued" ? t("teacher.savedOnDevice") : state === "error" ? t("teacher.didNotSave") : t("teacher.readyShort");

  return (
    <Screen title={data?.class.name ?? t("nav.register")} description={data ? dayLabel(data.dateKey, locale) : undefined} refreshing={register.isRefetching} onRefresh={() => void register.refetch()}>
      <Button label={t("common.back")} variant="ghost" onPress={onBack} style={{ alignSelf: "flex-start" }} />
      {register.isPending ? <Loading /> : null}
      {register.isError ? <Failed message={register.error.message} onRetry={() => void register.refetch()} /> : null}
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
            <Text variant="xs" tone={state === "error" ? "danger" : "muted"} accessibilityLiveRegion="polite">
              {stateLine}
            </Text>
          </View>
          <OutboxBadge tag={tag} />
          {state === "error" ? <Failed message={error ?? t("teacher.didNotSave")} onRetry={() => void flush()} /> : null}
          {!data.readOnly && unmarked.length > 0 ? <Button label={t("teacher.markAllPresent", { count: unmarked.length })} variant="secondary" onPress={markAllPresent} /> : null}
          {data.roster.length === 0 ? (
            <Empty title={t("teacher.nobodyInClassYet")} body={t("teacher.addStudentsAppear")} />
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
                    {note ? (
                      <Text variant="xs" tone="muted">
                        {t("teacher.noteFor", { name: p.name })}: {note}
                      </Text>
                    ) : null}
                    <View style={{ flexDirection: "row", gap: th.space[2] }}>
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
