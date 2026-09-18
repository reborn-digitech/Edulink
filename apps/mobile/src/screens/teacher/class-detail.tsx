import { useState } from "react";
import { Pressable, Share, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { okSchema, staffClassDetailSchema, type ClassWeightsBody, type StaffClassDetail } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { API_BASE, api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { haptics } from "@/lib/haptics";
import { Chips } from "../staff/shared";
import { relativeTime } from "./support";

/**
 * One class, the web's /teacher/classes/[classId]: today's register, the
 * figures (the two about pupils are filters on the roster, as the web's
 * tiles are), the report cards and the marks grid, the class join code to
 * share, the roster with 28 days of attendance and a way to write to each
 * family, the recent work (each opens its gradebook), and the grade weights.
 */
type Filter = "" | "concern" | "noguardian";

export function TeacherClassDetail() {
  const { classId } = useLocalSearchParams<{ classId?: string }>();
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("");
  const query = useQuery({
    queryKey: ["staff", "classes", classId],
    queryFn: async () => staffClassDetailSchema.parse(unwrap(await api().get(`/api/v1/staff/classes/${classId}`))),
    enabled: Boolean(classId),
  });
  const data = query.data;
  if (!classId) {
    return (
      <Screen title={t("nav.classes")}>
        <Failed message={t("teacher.classNotFound")} />
      </Screen>
    );
  }
  const shareCode = (d: StaffClassDetail) => {
    void Share.share({ message: `${t("teacher.classJoinCode")} · ${d.class.name}: ${d.class.joinCode}\n${t("teacher.studentsEnterAt")} ${API_BASE}/join/student` });
  };
  const shown = data ? data.roster.filter((p) => (filter === "concern" ? p.percent !== null && p.percent < 90 : filter === "noguardian" ? !p.hasGuardian : true)) : [];
  return (
    <Screen
      title={data?.class.name ?? t("nav.classes")}
      description={data ? [t("classes.onTheRoll", { count: data.roster.length }), data.class.subject, data.class.gradeLevel, data.class.room].filter(Boolean).join(" · ") : undefined}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {data ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("teacher.registerToday")} value={data.today.registerTakenAt ? t("teacher.done") : t("teacher.toDo")} tone={data.today.registerTakenAt ? "ok" : "warn"} />
            <Stat label={t("teacher.toMark")} value={data.toGrade} tone={data.toGrade > 0 ? "warn" : "fg"} />
            <Stat label={t("teacher.attendanceConcern")} value={data.ofConcern} tone={data.ofConcern > 0 ? "danger" : "fg"} />
            <Stat label={t("teacher.noGuardian")} value={data.withoutGuardian} tone={data.withoutGuardian > 0 ? "warn" : "fg"} />
          </View>
          <Text variant="xs" tone="muted">
            {data.today.registerTakenAt ? t("teacher.markedAgo", { count: data.today.recordsToday, when: relativeTime(data.today.registerTakenAt, locale) }) : t("teacher.nobodyMarkedYet")}
          </Text>
          <Button label={data.today.registerTakenAt ? t("teacher.editTodaysRegister") : t("teacher.takeRegister")} onPress={() => router.push({ pathname: "/(app)/attendance", params: { classId } } as never)} />
          <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
            <Button label={t("teacher.reportCards")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/report-cards", params: { classId } } as never)} style={{ flexGrow: 1 }} />
            <Button label={t("exams.enterMarks")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/marks", params: { classId } } as never)} style={{ flexGrow: 1 }} />
            <Button label={t("syllabus.openSyllabus")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/syllabus", params: { classId } } as never)} style={{ flexGrow: 1 }} />
          </View>

          <Card title={t("teacher.classJoinCode")} action={<Button label={t("mobile.share")} variant="ghost" icon={<Icon name="share" size={18} color={th.accentStrong} weight="bold" />} onPress={() => shareCode(data)} />}>
            <Text variant="3xl" bold tone="accent" selectable accessibilityLabel={`${t("teacher.classJoinCode")}: ${data.class.joinCode.split("").join(" ")}`}>
              {data.class.joinCode}
            </Text>
            <Text variant="xs" tone="muted">
              {`${t("teacher.studentsEnterAt")} ${API_BASE}/join/student`}
            </Text>
          </Card>

          <Card title={t("teacher.whoIsInClass")}>
            <Text variant="xs" tone="subtle">
              {t("teacher.attendanceOver", { days: 28 })}
            </Text>
            {data.roster.length > 0 && (data.ofConcern > 0 || data.withoutGuardian > 0) ? (
              <Chips
                label={t("teacher.stateFilter")}
                value={filter}
                options={[
                  { value: "" as Filter, label: `${t("vacancies.filterAll")} · ${data.roster.length}` },
                  { value: "concern" as Filter, label: `${t("teacher.attendanceConcern")} · ${data.ofConcern}` },
                  { value: "noguardian" as Filter, label: `${t("teacher.noGuardian")} · ${data.withoutGuardian}` },
                ]}
                onChange={setFilter}
              />
            ) : null}
            {data.roster.length === 0 ? (
              <Empty title={t("teacher.nobodyJoined")} body={t("teacher.shareCodeBlurb")} icon="users" action={<Button label={t("mobile.share")} variant="secondary" onPress={() => shareCode(data)} />} />
            ) : shown.length === 0 ? (
              <Empty title={t("common.noResultsTitle")} body={t("common.noResultsBody")} action={<Button label={t("common.clearAll")} variant="secondary" onPress={() => setFilter("")} />} />
            ) : (
              shown.map((p) => {
                const concern = p.percent !== null && p.percent < 90;
                return (
                  <Row
                    key={p.membershipId}
                    title={p.name}
                    caption={p.percent === null ? t("teacher.nobodyMarkedYet") : `${Math.round(p.percent)}%${concern ? ` · ${t("teacher.belowNinety", { days: 28 })}` : ""}`}
                    right={
                      <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
                        <View style={{ alignItems: "flex-end", gap: 2 }}>
                          {p.absences > 0 ? (
                            <Text variant="xs" tone={concern ? "danger" : "muted"}>
                              {t("attendance.absent")}: {p.absences}
                            </Text>
                          ) : null}
                          {!p.hasGuardian ? (
                            <Text variant="xs" tone="warn" bold>
                              {t("teacher.noGuardian")}
                            </Text>
                          ) : null}
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t("health.cardOf", { name: p.name })}
                          hitSlop={4}
                          onPress={() => {
                            haptics.tap();
                            router.push({ pathname: "/(app)/pupil-health", params: { membershipId: p.membershipId } } as never);
                          }}
                          style={({ pressed }) => ({ width: th.tap, height: th.tap, borderRadius: th.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: th.dangerSoft, opacity: pressed ? 0.7 : 1 })}
                        >
                          <Icon name="heart" size={20} color={th.danger} weight="bold" />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t("incidents.recordFor", { name: p.name })}
                          hitSlop={4}
                          onPress={() => {
                            haptics.tap();
                            router.push({ pathname: "/(app)/incident-new", params: { membershipId: p.membershipId, name: p.name } } as never);
                          }}
                          style={({ pressed }) => ({ width: th.tap, height: th.tap, borderRadius: th.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: th.warnSoft, opacity: pressed ? 0.7 : 1 })}
                        >
                          <Icon name="firstAid" size={20} color={th.warn} weight="bold" />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t("teacher.messageGuardiansOf", { name: p.name })}
                          hitSlop={4}
                          onPress={() => {
                            haptics.tap();
                            router.push({ pathname: "/(app)/remark-new", params: { membershipId: p.membershipId } } as never);
                          }}
                          style={({ pressed }) => ({ width: th.tap, height: th.tap, borderRadius: th.radius.md, alignItems: "center", justifyContent: "center", backgroundColor: th.accentSoft, opacity: pressed ? 0.7 : 1 })}
                        >
                          <Icon name="chatDots" size={20} color={th.accentStrong} weight="bold" />
                        </Pressable>
                      </View>
                    }
                  />
                );
              })
            )}
          </Card>

          <Card title={t("teacher.recentWork")} action={<Button label={t("teacher.setWork")} variant="ghost" onPress={() => router.push({ pathname: "/(app)/assignments", params: { classId, compose: "1" } } as never)} />}>
            {data.recentAssignments.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("teacher.nothingSetYet")}
              </Text>
            ) : (
              data.recentAssignments.map((a) => (
                <Row
                  key={a.id}
                  title={a.title}
                  caption={`${!a.publishedAt ? t("teacher.draft") : a.dueAt ? t("teacher.dueWhen", { when: relativeTime(a.dueAt, locale) }) : t("teacher.noDueDate")} · ${t("teacher.markedOf", { marked: a.graded, total: data.roster.length })}`}
                  onPress={() => router.push({ pathname: "/(app)/assignment", params: { assignmentId: a.id } } as never)}
                />
              ))
            )}
          </Card>

          <GradeWeights key={data.weights.map((w) => `${w.name}:${w.weightBps}`).join("|")} classId={classId} initial={data.weights} categoriesInUse={data.categoriesInUse} />
        </>
      ) : null}
    </Screen>
  );
}

type WeightRow = { name: string; percent: string };

/** The weights must add to 100, so the total is always in view; saving none turns weighting off. */
export function weightsTotal(rows: WeightRow[]): number {
  return rows.reduce((n, r) => n + (Number(r.percent) || 0), 0);
}

/** The web's GradeWeights: a category and its percent per line, the running total, and one save. */
function GradeWeights({ classId, initial, categoriesInUse }: { classId: string; initial: StaffClassDetail["weights"]; categoriesInUse: string[] }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [rows, setRows] = useState<WeightRow[]>(() => initial.map((w) => ({ name: w.name, percent: String(w.weightBps / 100) })));
  const named = rows.filter((r) => r.name.trim());
  const total = weightsTotal(named);
  const isEmpty = named.length === 0;
  const balanced = Math.abs(total - 100) < 0.01;
  const unweighted = isEmpty ? [] : categoriesInUse.filter((c) => !named.some((r) => r.name.trim().toLowerCase() === c.toLowerCase()));
  const save = useMutation({
    mutationFn: async (body: ClassWeightsBody) => okSchema.parse(unwrap(await api().post(`/api/v1/staff/classes/${classId}/weights`, body))),
    onSuccess: async () => {
      toast.show(t("teacher.weightsSaved"));
      await qc.invalidateQueries({ queryKey: ["staff", "classes", classId] });
    },
  });
  const submit = () => save.mutate({ rows: named.map((r) => ({ name: r.name.trim(), percent: Number(r.percent) || 0 })) });
  const update = (i: number, patch: Partial<WeightRow>) => setRows((all) => all.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <Card title={t("teacher.gradeWeights")}>
      <Text variant="xs" tone="muted">
        {t("teacher.weightsBlurb")}
      </Text>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: "row", gap: th.space[2], alignItems: "flex-end" }}>
          <View style={{ flex: 2 }}>
            <Field label={t("teacher.categoryName", { n: i + 1 })} placeholder={t("teacher.categoryPlaceholder")} value={r.name} onChangeText={(name) => update(i, { name })} maxLength={60} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t("teacher.categoryWeight", { n: i + 1 })} value={r.percent} onChangeText={(percent) => update(i, { percent: percent.replace(/[^0-9.]/g, "") })} keyboardType="decimal-pad" placeholder="%" />
          </View>
          <Button label={t("common.remove")} accessibilityLabel={t("teacher.removeCategory", { n: i + 1 })} variant="ghost" onPress={() => setRows((all) => all.filter((_, j) => j !== i))} />
        </View>
      ))}
      {rows.length < 20 ? <Button label={t("teacher.addCategory")} variant="ghost" icon={<Icon name="plus" size={18} color={th.accentStrong} weight="bold" />} onPress={() => setRows((all) => [...all, { name: "", percent: "" }])} /> : null}
      <Text variant="sm" bold tone={!isEmpty && !balanced ? "danger" : "fg"}>
        {isEmpty ? t("teacher.noWeighting") : `${t("teacher.totalPercent", { percent: total.toFixed(2).replace(/\.00$/, "") })}${balanced ? "" : ` ${t("teacher.mustBe100")}`}`}
      </Text>
      {unweighted.length > 0 ? (
        <Text variant="xs" tone="warn">
          {t("teacher.unweightedWarning", { categories: unweighted.map((c) => `“${c}”`).join(", ") })}
        </Text>
      ) : null}
      <Text variant="xs" tone="subtle">
        {isEmpty ? t("teacher.weightsOffHint") : t("teacher.weightsScaleHint")}
      </Text>
      {save.isError ? <Failed message={save.error.message} onRetry={submit} /> : null}
      <Button label={t("teacher.saveWeights")} variant="secondary" busy={save.isPending} disabled={!isEmpty && !balanced} onPress={submit} />
    </Card>
  );
}
