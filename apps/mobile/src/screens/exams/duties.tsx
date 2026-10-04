import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { examDutiesSchema } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { formatInstant, openWeb } from "../family/shared";
import { DUTY_KEY, PAPER_KEY, PAY_KEY } from "./words";

/**
 * A faculty member's exam duties on the phone (module EXAMS, 4 Oct 2026) —
 * the web's /faculty/exams: halls to watch, papers to set (sent sealed from
 * the web, where the PDF is chosen), bundles to assess, remuneration.
 */
export function ExamDutiesScreen() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const query = useQuery({ queryKey: ["exam-cell", "duties"], queryFn: async () => examDutiesSchema.parse(unwrap(await api().get("/api/v1/exam-cell/duties"))) });
  const d = query.data;
  const nothing = d && d.invigilation.length + d.papers.length + d.bundles.length + d.remuneration.length === 0;
  return (
    <Screen title={t("examCell.dutiesTitle")} description={t("examCell.dutiesIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {nothing ? <Empty icon="clipboard" title={t("examCell.noDuties")} action={<Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />} /> : null}
      {d && d.invigilation.length > 0 ? (
        <Card title={t("examCell.invigilationTitle")}>
          {d.invigilation.map((i) => (
            <Row key={i.id} title={`${i.courseCode} · ${i.roomName}`} caption={`${formatInstant(i.at, locale)} · ${i.sessionName} · ${t(DUTY_KEY[i.status]!)}`} />
          ))}
        </Card>
      ) : null}
      {d && d.papers.length > 0 ? (
        <Card title={t("examCell.papersToSet")}>
          {d.papers.map((p) => (
            <Row key={p.id} title={`${p.courseCode} · ${p.sessionName}`} caption={t(PAPER_KEY[p.status]!)} right={p.status !== "MODERATED" ? <Button variant="secondary" label={t("examCell.openOnWeb")} onPress={() => openWeb("/faculty/exams")} /> : undefined} />
          ))}
        </Card>
      ) : null}
      {d && d.bundles.length > 0 ? (
        <Card title={t("examCell.assessmentTitle")}>
          {d.bundles.map((b) => (
            <Row key={b.id} title={`${b.courseCode} · ${b.bundle}`} caption={`${t("examCell.books", { count: b.count })} · ${b.status === "RETURNED" ? t("examCell.returned") : t("examCell.withYou")}`} />
          ))}
        </Card>
      ) : null}
      {d && d.remuneration.length > 0 ? (
        <Card title={t("examCell.remunerationTitle")}>
          {d.remuneration.map((r, i) => (
            <Row key={`${r.sessionName}-${r.kind}-${i}`} title={`${r.sessionName} · ${t(PAY_KEY[r.kind]!)}`} caption={`${r.count} · ${formatPaise(r.amountPaise, locale, { always: true })}`} />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
