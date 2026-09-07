import { useState } from "react";
import { useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminClassesSchema, principalClassesSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { Chips, DEFAULT_SPAN, formatDateKey, openWeb, pct, WindowPicker, type Span } from "./shared";

export type PrincipalSort = "name" | "attendance" | "progress";

export function principalClassesPath(span: Span, sort: PrincipalSort, grade: string): string {
  return `/api/v1/staff/principal/classes?days=${span}&sort=${sort}${grade ? `&grade=${encodeURIComponent(grade)}` : ""}`;
}

export function adminClassesPath(q: string): string {
  return `/api/v1/admin/classes${q ? `?q=${encodeURIComponent(q)}` : ""}`;
}

/** Classes: the head's insights over a window, or the office's list with leads and sizes. */
export function StaffClasses() {
  const role = useRole();
  const t = useT();
  if (role === "ADMIN") return <AdminClasses />;
  if (role === "PRINCIPAL") return <PrincipalClasses />;
  return (
    <Screen title={t("nav.classes")}>
      <Loading />
    </Screen>
  );
}

function PrincipalClasses() {
  const t = useT();
  const router = useRouter();
  const { locale } = useLocale();
  const [span, setSpan] = useState<Span>(DEFAULT_SPAN);
  const [sort, setSort] = useState<PrincipalSort>("name");
  const [grade, setGrade] = useState("");
  const query = useQuery({
    queryKey: ["principal", "classes", span, sort, grade],
    placeholderData: keepPreviousData,
    queryFn: async () => principalClassesSchema.parse(unwrap(await api().get(principalClassesPath(span, sort, grade)))),
  });
  const d = query.data;
  return (
    <Screen
      title={t("principal.classes")}
      description={d ? `${t("principal.rangeTo", { from: formatDateKey(d.window.fromDateKey, locale), to: formatDateKey(d.window.toDateKey, locale) })} · ${t("principal.classByClassBody")}` : t("principal.classByClassBody")}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      <WindowPicker value={span} onChange={setSpan} />
      <Chips
        label={t("common.sortBy")}
        value={sort}
        options={[
          { value: "name", label: t("common.byName") },
          { value: "attendance", label: t("principal.sortAttendance") },
          { value: "progress", label: t("principal.sortProgress") },
        ]}
        onChange={setSort}
      />
      {d && d.grades.length > 0 ? <Chips label={t("principal.gradeFilter")} value={grade} options={[{ value: "", label: t("exams.allGrades") }, ...d.grades.map((g) => ({ value: g, label: g }))]} onChange={setGrade} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.classes.length === 0 ? (
          <Empty title={t("principal.noClasses")} body={t("principal.noClassesBody")} />
        ) : (
          <Card title={t("principal.classByClass")}>
            {d.classes.map((c) => {
              const below = c.attendance.percent !== null && c.attendance.percent < d.concernPercent;
              const caption = [
                c.pupils === 1 ? t("principal.pupilsOne") : t("principal.pupilsMany", { count: c.pupils }),
                c.sessionsTaken === 1 ? t("principal.registersTakenOne") : t("principal.registersTakenMany", { count: c.sessionsTaken }),
                `${t("principal.progress")} ${pct(c.progress.percent)}`,
                c.progress.pupilsWithNoMarks > 0 ? t("principal.noMarksYet", { count: c.progress.pupilsWithNoMarks }) : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <Row
                  key={c.classId}
                  title={c.section ? `${c.name} · ${c.section}` : c.name}
                  caption={caption}
                  right={<Text variant="base" bold tone={below ? "danger" : "fg"}>{pct(c.attendance.percent)}</Text>}
                  onPress={() => router.push({ pathname: "/(app)/classes/detail", params: { classId: c.classId } } as never)}
                />
              );
            })}
            <Text variant="xs" tone="subtle">
              {t("principal.denominatorNote")}
            </Text>
          </Card>
        )
      ) : null}
    </Screen>
  );
}

function AdminClasses() {
  const t = useT();
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const query = useQuery({
    queryKey: ["admin", "classes", q],
    placeholderData: keepPreviousData,
    queryFn: async () => adminClassesSchema.parse(unwrap(await api().get(adminClassesPath(q)))),
  });
  const d = query.data;
  const description = d ? [d.activeCount === 1 ? t("classes.activeCountOne") : t("classes.activeCountMany", { count: d.activeCount }), d.archivedCount > 0 ? t("classes.archivedCount", { count: d.archivedCount }) : null].filter(Boolean).join(" · ") : undefined;
  return (
    <Screen title={t("classes.title")} description={description} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Field label={t("common.searchLabel")} placeholder={t("classes.searchPlaceholder")} value={typed} onChangeText={setTyped} onSubmitEditing={() => setQ(typed.trim())} returnKeyType="search" autoCapitalize="none" />
      <Button label={t("classes.newClass")} variant="secondary" onPress={() => openWeb("/admin/classes/new")} />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.classes.length === 0 ? (
          q ? (
            <Empty title={t("common.noResultsTitle")} body={t("common.noResultsBody")} action={<Button label={t("common.clearSearch")} variant="secondary" onPress={() => { setTyped(""); setQ(""); }} />} />
          ) : (
            <Empty title={t("classes.noClassesYet")} body={t("classes.noClassesBody")} action={<Button label={t("classes.createClass")} onPress={() => openWeb("/admin/classes/new")} />} />
          )
        ) : (
          <Card title={t("classes.title")}>
            {d.leaderlessCount > 0 ? (
              <Text variant="xs" tone="warn">
                {t("classes.leaderlessWhy")}
              </Text>
            ) : null}
            {d.classes.map((c) => (
              <Row
                key={c.id}
                title={c.name}
                caption={[c.pupils === 1 ? t("classes.studentsOne") : t("classes.studentsMany", { count: c.pupils }), c.teachers.length > 0 ? c.teachers.map((x) => x.name).join(", ") : t("classes.noTeacherAssigned"), c.room ? t("classes.room", { room: c.room }) : null].filter(Boolean).join(" · ")}
                right={c.leaderless ? <Text variant="xs" tone="warn" bold>{t("classes.filterLeaderless")}</Text> : null}
                onPress={() => router.push({ pathname: "/(app)/classes/detail", params: { classId: c.id } } as never)}
              />
            ))}
          </Card>
        )
      ) : null}
    </Screen>
  );
}
