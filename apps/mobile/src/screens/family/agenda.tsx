import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { familyAgendaSchema, type FamilyAgendaRow } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { screenFor } from "@/lib/links";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { Chips, ChildSwitcher, formatDateKey, formatInstant, openWeb, param, Pill } from "./shared";
import { money } from "../shared/fees";

/**
 * The fortnight ahead — the web's /student/agenda and /parent/agenda: exams,
 * work due, sessions, meetings, closures and fee dates for one pupil, in
 * date order, each row opening the screen that owns it. A guardian picks
 * the child as on the other family screens; a pupil sees their own.
 */
const KIND_KEY = { EXAM: "agenda.kindExam", WORK: "agenda.kindWork", SESSION: "agenda.kindSession", MEETING: "agenda.kindMeeting", CLOSURE: "agenda.kindClosure", EVENT: "agenda.kindEvent", FEE: "agenda.kindFee" } as const;
const KIND_TONE: Record<FamilyAgendaRow["kind"], "muted" | "ok" | "warn" | "danger" | "accent"> = { EXAM: "danger", WORK: "warn", SESSION: "accent", MEETING: "accent", CLOSURE: "muted", EVENT: "ok", FEE: "warn" };

/** Where a row's web href goes on the phone: a screen when the app has one, the web otherwise. Exported for the test. */
export function agendaTarget(href: string): { pathname: string; params?: Record<string, string> } | null {
  if (href.startsWith("/student/fees") || href.startsWith("/parent/fees")) return { pathname: "/(app)/fees" };
  return screenFor(href);
}

export function FamilyAgenda() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const role = useRole();
  const router = useRouter();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const [childId, setChildId] = useState<string | null>(param(params.childId) ?? param(params.child) ?? null);
  const [days, setDays] = useState<"14" | "30">("14");
  const query = useQuery({
    queryKey: ["family", "agenda", childId, days],
    queryFn: async () => familyAgendaSchema.parse(unwrap(await api().get(`/api/v1/family/agenda?days=${days}${childId ? `&student=${encodeURIComponent(childId)}` : ""}`))),
    enabled: role === "PARENT" || role === "STUDENT",
  });
  const d = query.data;
  const open = (row: FamilyAgendaRow) => {
    const target = agendaTarget(row.href);
    if (target) router.push((target.params ? { pathname: target.pathname, params: target.params } : target.pathname) as never);
    else openWeb(row.href);
  };
  const tomorrow = d ? shiftKey(d.fromKey, 1) : null;
  const dayLabel = (key: string) => (d && key === d.fromKey ? t("agenda.today") : key === tomorrow ? t("agenda.tomorrow") : formatDateKey(key, locale, { weekday: "long", day: "numeric", month: "short" }));
  const groups = d ? groupByDay(d.rows) : [];
  return (
    <Screen title={t("agenda.title")} description={d ? (role === "PARENT" ? t("agenda.intro", { name: d.student.name, days: d.days }) : t("agenda.introPupil", { days: d.days })) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {role !== "PARENT" && role !== "STUDENT" ? <Empty title={t("agenda.title")} body={t("fees.refuseFamily")} action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} /> : null}
      {d && role === "PARENT" && d.children.length > 1 ? (
        <ChildSwitcher pupils={d.children.map((c) => ({ guardianshipId: "", studentUserId: "", relation: "", schoolId: "", ...c }))} selectedId={d.student.studentMembershipId} onSelect={setChildId} />
      ) : null}
      <Chips label={t("agenda.title")} value={days} onChange={setDays} options={[{ value: "14", label: t("agenda.days14") }, { value: "30", label: t("agenda.days30") }]} />
      {query.isPending && (role === "PARENT" || role === "STUDENT") ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d && d.rows.length === 0 ? <Empty title={t("agenda.empty", { days: d.days })} action={<Button label={t("nav.timetable")} variant="secondary" onPress={() => router.push("/(app)/timetable" as never)} />} /> : null}
      {groups.map((g) => (
        <Card key={g.dateKey} title={dayLabel(g.dateKey)}>
          {g.rows.map((row) => (
            <Row
              key={row.id}
              title={row.title}
              caption={[row.at && d ? formatInstant(row.at, locale, { hour: "numeric", minute: "2-digit" }, d.timeZone) : null, row.endDateKey ? t("agenda.through", { date: formatDateKey(row.endDateKey, locale, { day: "numeric", month: "short" }) }) : null, row.detail, row.amountPaise !== null ? money(row.amountPaise, locale) : null].filter(Boolean).join(" · ") || undefined}
              right={
                <View style={{ alignItems: "flex-end", gap: th.space[1] }}>
                  <Pill label={t(KIND_KEY[row.kind])} tone={KIND_TONE[row.kind]} />
                  <Text variant="xs" tone="muted">
                    {t("agenda.open")}
                  </Text>
                </View>
              }
              onPress={() => open(row)}
            />
          ))}
        </Card>
      ))}
    </Screen>
  );
}

/** Rows grouped by their day, in the order the server gave them. Exported for the test. */
export function groupByDay(rows: FamilyAgendaRow[]): { dateKey: string; rows: FamilyAgendaRow[] }[] {
  const out: { dateKey: string; rows: FamilyAgendaRow[] }[] = [];
  for (const row of rows) {
    const last = out[out.length - 1];
    if (last && last.dateKey === row.dateKey) last.rows.push(row);
    else out.push({ dateKey: row.dateKey, rows: [row] });
  }
  return out;
}

function shiftKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

