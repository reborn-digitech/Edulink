import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { condonationSchema, studentAcademicsSchema, CONDONATION_GROUNDS, type CourseAttendance } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { Chips, Notice } from "../staff/shared";
import { CONDONATION_KEY, GROUND_KEY, INTERNAL_KIND_KEY, LECTURE_KIND_KEY, clock, projectionText, standingText } from "./words";

/** One course's attendance as a row: attended of held, the percentage, the standing and how many more may be missed. */
export function AttendanceRows({ rows }: { rows: CourseAttendance[] }) {
  const t = useT();
  if (rows.length === 0) return <Text tone="muted">{t("academics.attendanceNoneBody")}</Text>;
  return (
    <>
      {rows.map((a) => (
        <Row
          key={a.offeringId}
          title={`${a.courseCode} · ${a.percent === null ? "—" : `${a.percent}%`}`}
          caption={[t("academics.attendedOf", { attended: a.attended, held: a.held }), standingText(t, a), projectionText(t, a)].join(" · ")}
        />
      ))}
    </>
  );
}

/**
 * A college student's academics on the phone (4 Oct 2026) — the web's
 * /student/academics: today's lectures, attendance per course with how
 * many more may be missed, a condonation ask (the document is the web's),
 * internal marks as released, the mentor, and registration.
 */
export function StudentAcademicsScreen() {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const mine = useQuery({ queryKey: ["academics", "mine"], queryFn: async () => studentAcademicsSchema.parse(unwrap(await api().get("/api/v1/academics/mine"))) });
  const [course, setCourse] = useState<string>("");
  const [ground, setGround] = useState<string>("MEDICAL");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const ask = useMutation({
    mutationFn: async (termId: string) => condonationSchema.parse(unwrap(await api().post("/api/v1/academics/condonations", { termId, offeringId: course || null, ground, note: note.trim(), documentFileId: null }))),
    onSuccess: () => {
      setNotice({ tone: "ok", text: t("academics.condonationAsked") });
      setNote("");
      void qc.invalidateQueries({ queryKey: ["academics", "mine"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  const a = mine.data;
  const term = a?.registration.term ?? null;
  return (
    <Screen title={t("academics.studentTitle")} description={a?.registration.programme ? `${a.registration.programme.code} · ${t("academics.semesterShort", { semester: a.registration.programme.semester })}${term ? ` · ${term.name}` : ""}` : undefined} refreshing={mine.isRefetching} onRefresh={() => void mine.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {mine.isPending ? <Loading /> : null}
      {mine.isError ? <Failed message={mine.error.message} onRetry={() => void mine.refetch()} /> : null}
      {a && !a.registration.programme ? <Empty icon="graduationCap" title={t("academics.noSeatTitle")} body={t("academics.noSeatBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void mine.refetch()} />} /> : null}
      {a?.registration.programme ? (
        <>
          <Card title={t("academics.todayLectures")}>
            {a.today.length === 0 ? <Text tone="muted">{t("academics.noLectures")}</Text> : null}
            {a.today.map((c) => (
              <Row key={c.slotId} title={`${clock(c.startMinute, c.endMinute)} · ${c.courseCode}`} caption={[t(LECTURE_KIND_KEY[c.kind]!), c.roomName, c.facultyName].filter(Boolean).join(" · ")} />
            ))}
            <Button label={t("academics.registrationTitle")} variant="secondary" onPress={() => router.push("/(app)/registration" as never)} />
          </Card>
          <Card title={t("academics.myAttendance")}>
            <AttendanceRows rows={a.attendance} />
          </Card>
          <Card title={t("academics.condonationsTitle")}>
            {a.condonations.map((c) => (
              <Row key={c.id} title={`${c.courseCode ?? t("academics.allCourses")} · ${t(GROUND_KEY[c.ground]!)}`} caption={t(CONDONATION_KEY[c.status]!)} />
            ))}
            {term && a.attendance.length ? (
              <>
                <Text variant="sm" tone="muted">{t("academics.condonationAskBody")}</Text>
                <Chips label={t("academics.fieldCourse")} value={course} onChange={setCourse} options={[{ value: "", label: t("academics.allCourses") }, ...a.attendance.map((x) => ({ value: x.offeringId, label: x.courseCode }))]} />
                <Chips label={t("academics.fieldGround")} value={ground} onChange={setGround} options={CONDONATION_GROUNDS.map((g) => ({ value: g, label: t(GROUND_KEY[g]!) }))} />
                <Field label={t("academics.fieldWhy")} value={note} onChangeText={setNote} multiline />
                <Button label={t("academics.askCondonation")} disabled={note.trim().length < 4} busy={ask.isPending} onPress={() => ask.mutate(term.id)} />
              </>
            ) : null}
          </Card>
          <Card title={t("academics.myMarks")}>
            {a.marks.length === 0 ? <Text tone="muted">{t("academics.marksNone")}</Text> : null}
            {a.marks.map((m) => (
              <Card key={m.offeringId} title={`${m.courseCode} · ${m.courseName}`}>
                {m.components.map((k) => (
                  <Row key={k.name} title={k.name} caption={`${t(INTERNAL_KIND_KEY[k.kind]!)} · ${k.marks === null ? t("academics.absentShort") : `${k.marks} / ${k.maxMarks}`}`} />
                ))}
              </Card>
            ))}
          </Card>
          <Card title={t("academics.myMentor")}>
            <Text>{a.mentor ? t("academics.mentorIs", { name: a.mentor.facultyName, group: a.mentor.groupName }) : t("academics.noMentor")}</Text>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
