import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminTimetableSchema, okSchema, savedIdSchema, type AdminTimetable } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatTimeRange, hhmm, weekdayName } from "../family/shared";
import { Chips, parseClock } from "./shared";

type Period = AdminTimetable["periods"][number];
type Slot = NonNullable<AdminTimetable["grid"]>["slots"][number];
type Kind = "LESSON" | "BREAK";
type Section = "day" | "week";
export type PeriodBody = { name: string; startMinute: number; endMinute: number; kind: Kind };
export type SlotBody = { classId: string; periodId: string; weekday: number; subject: string; teacherMembershipId: string | null; room: string | null };

const WEEKDAYS = [1, 2, 3, 4, 5, 6];

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    for (const queryKey of [["admin", "timetable"], ["principal", "timetable"], ["admin", "overview"]]) void qc.invalidateQueries({ queryKey });
  };
}

/**
 * Building the timetable — the web's /admin/timetable, phone-sized. The
 * school day first: its periods, each edited in place, retired (its lessons
 * kept) after a confirm, or brought back. Then a class's week, one day at a
 * time: choose the class, choose the day, tap a period and a sheet opens
 * under it for the subject, the teacher (with who is already teaching then)
 * and the room — or to take the lesson out.
 */
export function TimetableEditor() {
  const t = useT();
  const params = useLocalSearchParams<{ classId?: string }>();
  const initialClass = typeof params.classId === "string" && params.classId ? params.classId : null;
  const [section, setSection] = useState<Section>(initialClass ? "week" : "day");
  const [classId, setClassId] = useState<string | null>(initialClass);
  const query = useQuery({
    queryKey: ["admin", "timetable", classId],
    placeholderData: keepPreviousData,
    queryFn: async () => adminTimetableSchema.parse(unwrap(await api().get(classId ? `/api/v1/admin/timetable?classId=${encodeURIComponent(classId)}` : "/api/v1/admin/timetable"))),
  });
  const d = query.data;
  return (
    <Screen title={t("timetable.title")} description={t("timetable.subtitle")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Chips
        label={t("timetable.title")}
        value={section}
        options={[
          { value: "day", label: t("timetable.schoolDay") },
          { value: "week", label: t("timetable.classWeek") },
        ]}
        onChange={setSection}
      />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? section === "day" ? <DayPanel periods={d.periods} /> : <WeekPanel data={d} onClass={setClassId} onDay={() => setSection("day")} /> : null}
    </Screen>
  );
}

function DayPanel({ periods }: { periods: Period[] }) {
  const t = useT();
  const toast = useToast();
  const refresh = useRefresh();
  const [editing, setEditing] = useState<string | null>(null);
  const active = periods.filter((p) => !p.archivedAt).sort((a, b) => a.position - b.position);
  const retired = periods.filter((p) => p.archivedAt);
  const save = useMutation({
    mutationFn: async (input: { id: string | null; body: PeriodBody }) =>
      savedIdSchema.parse(unwrap(input.id ? await api().post(`/api/v1/office/timetable/periods/${input.id}`, input.body) : await api().post("/api/v1/admin/timetable/periods", input.body))),
    onSuccess: (_r, input) => {
      toast.show(input.id ? t("timetable.periodUpdated", { name: input.body.name }) : t("timetable.periodAdded", { name: input.body.name }));
      setEditing(null);
      refresh();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const retire = useMutation({
    mutationFn: async (input: { period: Period; retired: boolean }) => savedIdSchema.parse(unwrap(await api().post(`/api/v1/office/timetable/periods/${input.period.id}/retire`, { retired: input.retired }))),
    onSuccess: (_r, input) => {
      toast.show(input.retired ? t("timetable.retired", { name: input.period.name }) : t("timetable.broughtBack", { name: input.period.name }));
      refresh();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const retiring = (id: string) => retire.isPending && retire.variables?.period.id === id;
  return (
    <>
      <Card title={t("timetable.schoolDay")}>
        <Text variant="xs" tone="subtle">
          {t("timetable.schoolDayBody")}
        </Text>
        {active.length === 0 && editing !== "new" ? (
          <Empty icon="clock" title={t("timetable.noTimetableYet")} body={t("timetable.nothingSetUp")} action={<Button label={t("timetable.addOnePeriod")} variant="secondary" onPress={() => setEditing("new")} />} />
        ) : null}
        {active.map((p) =>
          editing === p.id ? (
            <PeriodForm key={p.id} period={p} busy={save.isPending} onSave={(body) => save.mutate({ id: p.id, body })} onCancel={() => setEditing(null)} />
          ) : (
            <PeriodRow key={p.id} period={p} busy={retiring(p.id)} onEdit={() => setEditing(p.id)} onRetire={() => retire.mutate({ period: p, retired: true })} />
          ),
        )}
        {editing === "new" ? (
          <PeriodForm period={null} busy={save.isPending} onSave={(body) => save.mutate({ id: null, body })} onCancel={() => setEditing(null)} />
        ) : active.length > 0 ? (
          <Button label={t("timetable.addAPeriod")} variant="secondary" onPress={() => setEditing("new")} />
        ) : null}
        <Text variant="xs" tone="subtle">
          {t("timetable.twentyFourHour")}
        </Text>
      </Card>
      {retired.length > 0 ? (
        <Card title={retired.length === 1 ? t("timetable.retiredCountOne") : t("timetable.retiredCountMany", { count: retired.length })}>
          <Text variant="xs" tone="subtle">
            {t("timetable.retiredNote")}
          </Text>
          {retired.map((p) => (
            <Row
              key={p.id}
              title={p.name}
              caption={formatTimeRange(p.startMinute, p.endMinute)}
              right={<Button label={t("timetable.bringBack")} variant="secondary" busy={retiring(p.id)} onPress={() => retire.mutate({ period: p, retired: false })} accessibilityLabel={`${t("timetable.bringBack")}: ${p.name}`} />}
            />
          ))}
        </Card>
      ) : null}
    </>
  );
}

/** One period of the day: edit it in place, or retire it — which asks first. */
function PeriodRow({ period: p, busy, onEdit, onRetire }: { period: Period; busy: boolean; onEdit: () => void; onRetire: () => void }) {
  const t = useT();
  const th = useTheme();
  const [confirming, setConfirming] = useState(false);
  return (
    <View style={{ gap: th.space[2] }}>
      <Row title={p.name} caption={`${formatTimeRange(p.startMinute, p.endMinute)}${p.kind === "BREAK" ? t("timetable.breakSuffix") : ""}`} />
      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
        <Button label={t("common.edit")} variant="secondary" onPress={onEdit} accessibilityLabel={`${t("common.edit")}: ${p.name}`} />
        {confirming ? (
          <>
            <Button label={t("timetable.retire")} variant="danger" busy={busy} onPress={onRetire} accessibilityLabel={`${t("common.confirm")}: ${t("timetable.retire")} ${p.name}`} />
            <Button label={t("common.cancel")} variant="ghost" onPress={() => setConfirming(false)} />
          </>
        ) : (
          <Button label={t("timetable.retire")} variant="ghost" onPress={() => setConfirming(true)} accessibilityLabel={`${t("timetable.retire")}: ${p.name}`} />
        )}
      </View>
    </View>
  );
}

/** A period's name, its times as the clock reads them, and whether lessons go in it. */
function PeriodForm({ period, busy, onSave, onCancel }: { period: Period | null; busy: boolean; onSave: (body: PeriodBody) => void; onCancel: () => void }) {
  const t = useT();
  const th = useTheme();
  const [name, setName] = useState(period?.name ?? "");
  const [starts, setStarts] = useState(period ? hhmm(period.startMinute) : "");
  const [ends, setEnds] = useState(period ? hhmm(period.endMinute) : "");
  const [kind, setKind] = useState<Kind>(period?.kind ?? "LESSON");
  const [error, setError] = useState<string | null>(null);
  function submit() {
    const start = parseClock(starts);
    const end = parseClock(ends);
    if (!name.trim()) setError(t("timetable.needPeriodName"));
    else if (start === null || end === null) setError(t("timetable.bothTimes"));
    else if (end <= start) setError(t("timetable.endAfterStart"));
    else {
      setError(null);
      onSave({ name: name.trim(), startMinute: start, endMinute: end, kind });
    }
  }
  return (
    <View style={{ backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[3], gap: th.space[3] }}>
      <Field label={t("timetable.name")} value={name} onChangeText={setName} placeholder={t("timetable.namePlaceholder")} maxLength={60} />
      <View style={{ flexDirection: "row", gap: th.space[3] }}>
        <View style={{ flex: 1 }}>
          <Field label={t("timetable.starts")} value={starts} onChangeText={setStarts} placeholder="08:30" keyboardType="numbers-and-punctuation" maxLength={5} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("timetable.ends")} value={ends} onChangeText={setEnds} placeholder="09:15" keyboardType="numbers-and-punctuation" maxLength={5} />
        </View>
      </View>
      <Chips
        label={t("timetable.kind")}
        value={kind}
        options={[
          { value: "LESSON", label: t("timetable.lesson") },
          { value: "BREAK", label: t("timetable.break") },
        ]}
        onChange={setKind}
      />
      <Text variant="xs" tone="subtle">
        {kind === "LESSON" ? t("timetable.lessonHint") : t("timetable.breakHint")}
      </Text>
      {error ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: th.space[2] }}>
        <Button label={t("common.save")} busy={busy} onPress={submit} style={{ flexGrow: 1 }} />
        <Button label={t("common.cancel")} variant="ghost" onPress={onCancel} />
      </View>
    </View>
  );
}

function WeekPanel({ data: d, onClass, onDay }: { data: AdminTimetable; onClass: (classId: string) => void; onDay: () => void }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const router = useRouter();
  const refresh = useRefresh();
  const { locale } = useLocale();
  const [weekday, setWeekday] = useState(() => d.grid?.days.find((x) => x.isToday)?.weekday ?? 1);
  const [open, setOpen] = useState<string | null>(null);
  const saveSlot = useMutation({
    mutationFn: async (body: SlotBody) => savedIdSchema.parse(unwrap(await api().post("/api/v1/admin/timetable/slots", body))),
    onSuccess: (_r, body) => {
      toast.show(t("timetable.lessonSet", { subject: body.subject, day: weekdayName(body.weekday, locale) }));
      setOpen(null);
      refresh();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const clearSlot = useMutation({
    mutationFn: async (body: { classId: string; periodId: string; weekday: number }) => okSchema.parse(unwrap(await api().post("/api/v1/office/timetable/slots/clear", body))),
    onSuccess: () => {
      toast.show(t("timetable.lessonRemoved"));
      setOpen(null);
      refresh();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  if (d.classes.length === 0) {
    return <Empty icon="chalkboard" title={t("timetable.noClasses")} body={t("timetable.noClassesBody")} action={<Button label={t("timetable.createClass")} variant="secondary" onPress={() => router.push("/(app)/class-new" as never)} />} />;
  }
  const classId = d.selectedClassId;
  const selected = d.classes.find((k) => k.id === classId) ?? null;
  const periods = [...(d.grid?.periods ?? d.periods.filter((p) => !p.archivedAt))].sort((a, b) => a.position - b.position);
  const days = d.grid?.days.map((x) => x.weekday) ?? WEEKDAYS;
  const dayName = weekdayName(weekday, locale);
  return (
    <>
      <Chips
        label={t("timetable.chooseClass")}
        value={classId ?? ""}
        options={d.classes.map((k) => ({ value: k.id, label: k.name }))}
        onChange={(next) => {
          setOpen(null);
          onClass(next);
        }}
      />
      {classId === null || selected === null ? null : periods.filter((p) => p.kind === "LESSON").length === 0 ? (
        <Empty icon="clock" title={t("timetable.noTimetableYet")} body={t("timetable.setDayFirst")} action={<Button label={t("timetable.schoolDay")} variant="secondary" onPress={onDay} />} />
      ) : (
        <>
          <Chips
            label={t("timetable.pickADay")}
            value={String(weekday)}
            options={days.map((w) => ({ value: String(w), label: weekdayName(w, locale) }))}
            onChange={(next) => {
              setOpen(null);
              setWeekday(Number(next));
            }}
          />
          <Card title={`${selected.name} · ${dayName}`}>
            {periods.map((p) => {
              const time = formatTimeRange(p.startMinute, p.endMinute);
              if (p.kind === "BREAK") return <Row key={p.id} title={p.name} caption={`${time}${t("timetable.breakSuffix")}`} />;
              const slot = d.grid?.slots.find((s) => s.weekday === weekday && s.periodId === p.id) ?? null;
              const where = t("timetable.cellLabel", { period: p.name, day: dayName });
              return (
                <View key={p.id} style={{ gap: th.space[2] }}>
                  <Row
                    title={slot ? slot.subject : t("timetable.free")}
                    caption={[p.name, time, slot ? (slot.teacherName ?? t("timetable.noTeacherYet")) : null, slot?.room ?? null].filter(Boolean).join(" · ")}
                    onPress={() => setOpen(open === p.id ? null : p.id)}
                  />
                  {open === p.id ? (
                    <SlotSheet
                      key={`${p.id}:${weekday}`}
                      where={where}
                      slot={slot}
                      staff={d.staff}
                      busyElsewhere={(teacherId) => d.busy[teacherId]?.[`${weekday}:${p.id}`] ?? null}
                      saving={saveSlot.isPending}
                      clearing={clearSlot.isPending}
                      onSave={(input) => saveSlot.mutate({ classId, periodId: p.id, weekday, ...input })}
                      onClear={() => clearSlot.mutate({ classId, periodId: p.id, weekday })}
                      onCancel={() => setOpen(null)}
                    />
                  ) : null}
                </View>
              );
            })}
          </Card>
        </>
      )}
    </>
  );
}

/** One cell of the week: what is taught, by whom (and who is already teaching then), where — or take the lesson out, after a confirm. */
function SlotSheet({
  where,
  slot,
  staff,
  busyElsewhere,
  saving,
  clearing,
  onSave,
  onClear,
  onCancel,
}: {
  where: string;
  slot: Slot | null;
  staff: AdminTimetable["staff"];
  busyElsewhere: (teacherId: string) => string | null;
  saving: boolean;
  clearing: boolean;
  onSave: (input: { subject: string; teacherMembershipId: string | null; room: string | null }) => void;
  onClear: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const th = useTheme();
  const [subject, setSubject] = useState(slot?.subject ?? "");
  const [teacher, setTeacher] = useState(slot?.teacherMembershipId ?? "");
  const [room, setRoom] = useState(slot?.room ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const free = staff.filter((s) => !busyElsewhere(s.membershipId)).length;
  function submit() {
    if (!subject.trim()) {
      setError(t("timetable.saySubject"));
      return;
    }
    setError(null);
    onSave({ subject: subject.trim(), teacherMembershipId: teacher || null, room: room.trim() || null });
  }
  return (
    <View style={{ backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[3], gap: th.space[3] }}>
      <Text variant="sm" bold accessibilityRole="header">
        {slot ? t("timetable.changeIt", { subject: slot.subject, where }) : t("timetable.addLessonAt", { where })}
      </Text>
      <Field label={t("timetable.subject")} value={subject} onChangeText={setSubject} placeholder={t("timetable.subjectPlaceholder")} error={error} maxLength={80} />
      <Chips
        label={t("timetable.teacher")}
        value={teacher}
        options={[{ value: "", label: t("timetable.noTeacherYet") }, ...staff.map((s) => ({ value: s.membershipId, label: busyElsewhere(s.membershipId) ? `${s.name} · ${t("timetable.alreadyTeaching")}` : s.name }))]}
        onChange={setTeacher}
      />
      <Text variant="xs" tone="subtle">
        {free === staff.length ? t("timetable.everybodyFree") : t("timetable.freeAndBusy", { free, busy: staff.length - free })}
      </Text>
      <Field label={t("timetable.room")} value={room} onChangeText={setRoom} placeholder={t("timetable.roomPlaceholder")} maxLength={40} />
      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
        <Button label={t("common.save")} busy={saving} onPress={submit} style={{ flexGrow: 1 }} />
        {slot ? (
          confirming ? (
            <Button label={t("common.remove")} variant="danger" busy={clearing} onPress={onClear} accessibilityLabel={`${t("common.confirm")}: ${t("common.remove")} ${slot.subject}`} />
          ) : (
            <Button label={t("common.remove")} variant="ghost" onPress={() => setConfirming(true)} />
          )
        ) : null}
        <Button label={t("common.cancel")} variant="ghost" onPress={onCancel} />
      </View>
    </View>
  );
}
