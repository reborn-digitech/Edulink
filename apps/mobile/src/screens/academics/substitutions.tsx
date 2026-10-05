import { useState } from "react";
import { Pressable, View } from "react-native";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { academicsChangedResultSchema, lectureSubstitutionsSchema } from "@edulink/contracts";
import type { z } from "zod";
import { Button, Card, Empty, Failed, Loading, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { Pill } from "../family/shared";
import { clock } from "../teacher/support";
import { addDaysToKey, formatDateKey } from "../staff/shared";

/**
 * AN HOD'S LECTURE SUBSTITUTIONS ON THE PHONE (5 Oct 2026, the campaign's HOD
 * recommendation), the board the web's /hod draws: one day's lectures of the
 * department whose faculty member is on leave or absent on the staff register,
 * who stands in, and who could. Naming or clearing a substitute is one POST
 * to /api/v1/academics/substitutions — the library decides the department, a
 * substitute busy at that hour and "already so", and tells the one named.
 */
export const LECTURE_SUBS_KEY = ["academics", "substitutions"] as const;
type Board = z.infer<typeof lectureSubstitutionsSchema>;

export function LectureSubstitutionsScreen() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const [date, setDate] = useState<string | null>(null);
  const query = useQuery({
    queryKey: [...LECTURE_SUBS_KEY, date ?? "today"],
    placeholderData: keepPreviousData,
    queryFn: async () => lectureSubstitutionsSchema.parse(unwrap(await api().get(`/api/v1/academics/substitutions${date ? `?date=${date}` : ""}`))),
  });
  const d = query.data;
  const dayLabel = d ? formatDateKey(d.dateKey, locale, { weekday: "short", day: "numeric", month: "short" }) : "";
  return (
    <Screen title={t("academics.tabSubstitutions")} description={t("academics.boardBody")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {d ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], flexWrap: "wrap" }}>
          <Button label={t("substitutions.previousDay")} variant="secondary" onPress={() => setDate(addDaysToKey(d.dateKey, -1))} />
          <Text variant="base" bold style={{ flex: 1, textAlign: "center" }} accessibilityLabel={t("academics.boardTitle", { date: dayLabel })}>
            {dayLabel}
          </Text>
          <Button label={t("substitutions.nextDay")} variant="secondary" onPress={() => setDate(addDaysToKey(d.dateKey, 1))} />
          {date !== null ? <Button label={t("substitutions.today")} variant="ghost" onPress={() => setDate(null)} /> : null}
        </View>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && d.lectures.length === 0 ? <Empty icon="users" title={t("academics.boardEmpty")} body={t("academics.boardEmptyBody", { date: dayLabel })} action={<Button label={t("nav.staffAttendance")} variant="secondary" onPress={() => router.push("/(app)/my-attendance" as never)} />} /> : null}
      {d?.lectures.map((l) => <LectureCard key={l.lectureId} lecture={l} candidates={d.candidates} />)}
    </Screen>
  );
}

function LectureCard({ lecture: l, candidates }: { lecture: Board["lectures"][number]; candidates: Board["candidates"] }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [picked, setPicked] = useState<string | null>(l.substituteMembershipId);
  const save = useMutation({
    mutationFn: async (substituteMembershipId: string | null) => academicsChangedResultSchema.parse(unwrap(await api().post("/api/v1/academics/substitutions", { lectureId: l.lectureId, substituteMembershipId }))),
    onSuccess: () => {
      toast.show(t("academics.saved"), "ok");
      void qc.invalidateQueries({ queryKey: LECTURE_SUBS_KEY });
    },
    onError: (e: Error) => toast.show(e.message, "danger"),
  });
  const title = `${l.courseCode} · ${l.courseName}`;
  return (
    <Card title={title} action={<Pill label={t(l.reason === "ON_LEAVE" ? "academics.awayLeave" : "academics.awayAbsent")} tone="warn" />}>
      <Text variant="sm" tone="muted">
        {[`${clock(l.startMinute)}–${clock(l.endMinute)}`, l.divisionName, l.facultyName].filter(Boolean).join(" · ")}
      </Text>
      <Text variant="base" bold tone={l.substituteName ? "fg" : "warn"}>
        {`${t("academics.fieldSubstitute")}: ${l.substituteName ?? t("academics.noSubstitute")}`}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={`${t("academics.fieldSubstitute")}: ${title}`} style={{ gap: th.space[1] }}>
        {candidates.map((c) => {
          const on = c.membershipId === picked;
          return (
            <Pressable
              key={c.membershipId}
              accessibilityRole="radio"
              aria-checked={on}
              accessibilityLabel={c.name}
              accessibilityState={{ checked: on, disabled: save.isPending }}
              disabled={save.isPending}
              onPress={() => setPicked(c.membershipId)}
              style={({ pressed }) => ({ minHeight: th.tap, justifyContent: "center", paddingHorizontal: th.space[3], borderRadius: th.radius.md, borderWidth: 1, borderColor: on ? th.accent : th.border, backgroundColor: on ? th.accentSoft : th.surface, opacity: pressed ? 0.8 : 1 })}
            >
              <Text bold={on}>{c.name}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
        <Button label={t("common.save")} busy={save.isPending} disabled={!picked || picked === l.substituteMembershipId} onPress={() => save.mutate(picked)} accessibilityLabel={`${t("common.save")}: ${title}`} />
        {l.substituteMembershipId ? (
          <Button
            label={t("substitutions.clear")}
            variant="ghost"
            disabled={save.isPending}
            onPress={() => {
              setPicked(null);
              save.mutate(null);
            }}
            accessibilityLabel={`${t("substitutions.clear")}: ${title}`}
          />
        ) : null}
      </View>
    </Card>
  );
}
