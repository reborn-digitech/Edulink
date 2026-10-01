import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { staffExamsSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { bytesApi, shareBytes } from "@/lib/download";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, formatDateKey } from "../staff/shared";
import { Pill } from "../family/shared";
import { clock } from "./support";

/**
 * Exams, the web's /teacher/exams: the classes this person may enter marks
 * for, each class's series and the papers in them. A paper opens the marks
 * grid (src/screens/teacher/marks.tsx) with the class and the paper picked;
 * report cards open the builder (src/screens/teacher/report-cards.tsx) for the
 * class on screen. An admin sees every class.
 */
const KIND_KEY = { UNIT_TEST: "exams.kindUnitTest", MID_TERM: "exams.kindMidTerm", FINAL: "exams.kindFinal" } as const;

export function TeacherExams() {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [picked, setPicked] = useState<string | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["staff", "exams"],
    queryFn: async () => staffExamsSchema.parse(unwrap(await api().get("/api/v1/staff/exams"))),
  });
  const d = query.data;
  const klass = d?.classes.find((c) => c.id === picked) ?? d?.classes[0] ?? null;
  const papers = klass ? klass.series.reduce((n, s) => n + s.slots.length, 0) : 0;
  const cards = <Button label={t("exams.tabCards")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/report-cards", params: klass ? { classId: klass.id } : {} } as never)} />;

  /** The whole exam for the class as a CSV — every paper, the total and the grade — to the share sheet, as the report-card bundle goes. */
  const shareMarks = async (series: { id: string; name: string }) => {
    if (!klass) return;
    setSharing(series.id);
    const fallback = t("exports.notReady");
    const got = await bytesApi.get(`/api/v1/teaching/classes/${klass.id}/marks/export?exam=${encodeURIComponent(series.id)}`, fallback);
    const error = got.ok ? await shareBytes({ bytes: got.bytes, mime: "text/csv" }, `${series.name} - ${klass.name}.csv`, fallback) : got.error;
    setSharing(null);
    if (error) toast.show(error, "danger");
  };

  return (
    <Screen title={t("nav.exams")} description={t("exams.marksIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && d.classes.length === 0 ? (
        <Empty title={t("exams.marksTitle")} body={t("teacher.noClassesYet")} action={<Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />} />
      ) : null}
      {d && klass ? (
        <>
          {d.classes.length > 1 ? <Chips label={t("nav.classes")} value={klass.id} options={d.classes.map((c) => ({ value: c.id, label: c.name }))} onChange={setPicked} /> : null}
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("nav.classes")} value={d.classes.length} />
            <Stat label={t("exams.pickPaper")} value={papers} tone={papers > 0 ? "accent" : "fg"} />
          </View>
          {klass.series.length === 0 ? (
            <Empty title={t("exams.noPapersTitle")} body={t("exams.noPapersBody")} action={cards} />
          ) : (
            <>
              {klass.series.map((s) => (
                <Card key={s.id} title={s.name} action={<Pill label={s.publishedAt ? t("exams.published") : t("teacher.draft")} tone={s.publishedAt ? "ok" : "warn"} />}>
                  <Text variant="xs" tone="muted">
                    {`${t(KIND_KEY[s.kind])} · ${klass.name}${klass.gradeLevel ? ` · ${klass.gradeLevel}` : ""}`}
                  </Text>
                  {s.slots.map((slot) => (
                    <Row
                      key={slot.id}
                      title={slot.subject}
                      caption={[formatDateKey(slot.dateKey, locale), slot.startMinute !== null ? `${clock(slot.startMinute)}–${clock(slot.endMinute)}` : null, `${t("exams.colMaxMarks")} ${slot.maxMarks}`].filter(Boolean).join(" · ")}
                      right={
                        <Text variant="sm" bold tone="accent">
                          {t("exams.tabMarksEntry")}
                        </Text>
                      }
                      onPress={() => router.push({ pathname: "/(app)/marks", params: { classId: klass.id, slotId: slot.id } } as never)}
                    />
                  ))}
                  <Button label={t("exports.shareCsv")} variant="secondary" busy={sharing === s.id} accessibilityHint={t("exports.shareMarks")} onPress={() => void shareMarks(s)} />
                </Card>
              ))}
              {cards}
            </>
          )}
        </>
      ) : null}
    </Screen>
  );
}
