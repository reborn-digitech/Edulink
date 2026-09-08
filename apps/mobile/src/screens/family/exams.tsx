import { useState } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { Share, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";
import { familyExamsSchema, familyReportCardSchema, familyReportCardsSchema } from "@edulink/contracts";
import type { Translate } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, EXAM_KIND, ExamMarksCards, formatDateKey, formatMilli, hhmm, Note, subjectName, Tabs, type ExamKind } from "./shared";

type Tab = "marks" | "upcoming" | "cards";
type ReportCard = z.infer<typeof familyReportCardSchema>;
const KINDS: ExamKind[] = ["UNIT_TEST", "MID_TERM", "FINAL"];

/**
 * "How did I do" — the web's /exams for a pupil or across a guardian's
 * children: marks as they come in, the sittings still ahead, and the report
 * cards, one of which opens natively with a Share button.
 */
export function FamilyExams() {
  // Marks and report cards are a child's private record: no screenshots, no screen recording, while this screen is up.
  usePrivateScreen();
  const t = useT();
  const { locale } = useLocale();
  const [cardId, setCardId] = useState<string | null>(null);
  const [tabChoice, setTab] = useState<Tab | null>(null);
  const [kind, setKind] = useState<ExamKind | "all">("all");
  const exams = useQuery({
    queryKey: ["family", "exams"],
    queryFn: async () => familyExamsSchema.parse(unwrap(await api().get("/api/v1/family/exams"))),
  });
  const anyMarks = exams.data?.marks.some((m) => m.series.length > 0) ?? false;
  // The web opens on marks when there are any, else on what is ahead.
  const tab: Tab = tabChoice ?? (anyMarks ? "marks" : "upcoming");
  const cards = useQuery({
    queryKey: ["family", "report-cards"],
    queryFn: async () => familyReportCardsSchema.parse(unwrap(await api().get("/api/v1/family/report-cards"))),
    enabled: tab === "cards",
  });
  if (cardId) return <ReportCardView cardId={cardId} onBack={() => setCardId(null)} />;

  const d = exams.data;
  const count = (groups: { rows: unknown[] }[]) => groups.reduce((n, g) => n + g.rows.length, 0);
  const cardCount = cards.data ? count(cards.data.groups) : d ? count(d.cards) : undefined;
  const multiSchool = d ? new Set(d.upcoming.map((s) => s.schoolName)).size > 1 : false;
  const refresh = () => {
    void exams.refetch();
    if (tab === "cards") void cards.refetch();
  };
  return (
    <Screen title={t("nav.exams")} description={t("exams.readerIntro")} refreshing={exams.isRefetching} onRefresh={refresh}>
      <Tabs
        label={t("nav.exams")}
        current={tab}
        onChange={setTab}
        tabs={[
          { key: "marks", label: t("exams.tabMarks") },
          { key: "upcoming", label: t("exams.tabUpcoming") },
          { key: "cards", label: t("exams.tabCards"), count: cardCount },
        ]}
      />
      {exams.isPending ? <Loading /> : null}
      {exams.isError ? <Failed message={exams.error.message} onRetry={() => void exams.refetch()} /> : null}

      {d && tab === "marks" ? (
        anyMarks ? (
          <>
            <Text variant="xs" tone="muted">
              {t("exams.myMarksIntro")}
            </Text>
            <Chips label={t("exams.kindFilterLabel")} value={kind} onChange={setKind} options={[{ value: "all" as const, label: t("exams.allKinds") }, ...KINDS.map((k) => ({ value: k, label: t(EXAM_KIND[k]) }))]} />
            {d.marks.map((m) => (
              <ExamMarksCards key={m.studentMembershipId} marks={kind === "all" ? m : { ...m, series: m.series.filter((s) => s.kind === kind) }} showStudent={d.marks.length > 1} />
            ))}
          </>
        ) : (
          <Empty title={t("exams.noMarksYet")} body={t("exams.myMarksIntro")} action={<Button label={t("exams.tabUpcoming")} variant="secondary" onPress={() => setTab("upcoming")} />} />
        )
      ) : null}

      {d && tab === "upcoming" ? (
        d.upcoming.length === 0 ? (
          <Empty title={t("exams.noUpcomingTitle")} body={t("exams.noUpcomingBody")} action={anyMarks ? <Button label={t("exams.tabMarks")} variant="secondary" onPress={() => setTab("marks")} /> : <Button label={t("exams.tabCards")} variant="secondary" onPress={() => setTab("cards")} />} />
        ) : (
          d.upcoming.map((sheet) => (
            <Card key={sheet.id} title={`${sheet.name} · ${t("practice.classN", { n: sheet.gradeLevel })}`}>
              <Text variant="xs" tone="muted">
                {[t(EXAM_KIND[sheet.kind]), multiSchool ? sheet.schoolName : null].filter(Boolean).join(" · ")}
              </Text>
              {sheet.slots.map((slot) => (
                <Row
                  key={slot.id}
                  title={slot.subject}
                  caption={[formatDateKey(slot.dateKey, locale), slot.startMinute !== null ? `${hhmm(slot.startMinute)}${slot.endMinute !== null ? `–${hhmm(slot.endMinute)}` : ""}` : null].filter(Boolean).join(" · ")}
                  right={
                    <Text variant="sm" bold>
                      {`${slot.maxMarks} ${t("exams.colMaxMarks").toLowerCase()}`}
                    </Text>
                  }
                />
              ))}
            </Card>
          ))
        )
      ) : null}

      {tab === "cards" ? (
        <>
          {cards.isPending ? <Loading /> : null}
          {cards.isError ? <Failed message={cards.error.message} onRetry={() => void cards.refetch()} /> : null}
          {cards.data ? (
            count(cards.data.groups) === 0 ? (
              <Empty
                title={t("exams.noCardsTitle")}
                body={d?.termIsRunning ? (d.awaitingTermName ? t("exams.cardsAfterTermNamed", { term: d.awaitingTermName }) : t("exams.cardsAfterTerm")) : t("exams.noCardsBody")}
                action={anyMarks ? <Button label={t("exams.tabMarks")} variant="secondary" onPress={() => setTab("marks")} /> : <Button label={t("exams.tabUpcoming")} variant="secondary" onPress={() => setTab("upcoming")} />}
              />
            ) : (
              cards.data.groups
                .filter((group) => group.rows.length > 0)
                .map((group) => (
                  <Card key={group.studentMembershipId} title={group.name ?? undefined}>
                    {group.rows.map((card) => (
                      <Row
                        key={card.id}
                        title={card.title}
                        caption={card.publishedAt ? formatDateKey(card.publishedAt.slice(0, 10), locale) : undefined}
                        right={
                          card.overallPercentMilli !== null ? (
                            <Text variant="sm" bold>
                              {`${(card.overallPercentMilli / 1000).toFixed(1)}%`}
                            </Text>
                          ) : null
                        }
                        onPress={() => setCardId(card.id)}
                      />
                    ))}
                  </Card>
                ))
            )
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

/** One report card as it will be printed — natively, with the phone's share sheet instead of a printer. */
function ReportCardView({ cardId, onBack }: { cardId: string; onBack: () => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const query = useQuery({
    queryKey: ["family", "report-card", cardId],
    queryFn: async () => familyReportCardSchema.parse(unwrap(await api().get(`/api/v1/family/report-cards/${encodeURIComponent(cardId)}`))),
  });
  const c = query.data;
  const share = () => {
    if (!c) return;
    void Share.share({ title: `${c.title} · ${c.studentName}`, message: cardText(c, t, locale) });
  };
  const range = c ? `${formatDateKey(c.fromDateKey, locale, { day: "numeric", month: "short" })} – ${formatDateKey(c.toDateKey, locale, { day: "numeric", month: "short", year: "numeric" })}` : "";
  return (
    <Screen title={c?.title ?? t("nav.exams")} description={c ? `${c.school.name} · ${c.className}${c.classSection ? ` ${c.classSection}` : ""}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <View style={{ flexDirection: "row", gap: th.space[2] }}>
        <Button variant="secondary" label={t("reportView.back")} onPress={onBack} style={{ flex: 1 }} />
        <Button label={t("mobile.share")} onPress={share} disabled={!c} style={{ flex: 1 }} />
      </View>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {c ? (
        <>
          {c.status !== "PUBLISHED" ? (
            <Note tone="warn">
              <Text variant="sm" bold tone="warn">
                {t("reportView.draftBanner")}
              </Text>
            </Note>
          ) : null}
          <Card>
            <Text variant="2xl" bold accessibilityRole="header">
              {c.studentName}
            </Text>
            <Text variant="xs" tone="muted">
              {range}
            </Text>
            <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
              <Figure
                label={t("reportView.overall")}
                value={c.overallPercent === null ? "—" : `${c.overallPercent.toFixed(1)}%`}
                hint={c.overallPercent === null ? t("reportView.noMarksCounted") : c.gradingMethod === "exams" ? t("reportView.examsOnly") : c.gradingMethod === "weighted" ? t("reportView.weightedBy") : t("reportView.acrossBelow")}
              />
              <Figure
                label={t("reportView.attendance")}
                value={c.attendancePercent === null ? "—" : `${c.attendancePercent}%`}
                hint={c.attendanceTotal === 0 ? t("reportView.noRegisterWindow") : t("reportView.daysOf", { present: c.attendancePresent, total: c.attendanceTotal })}
              />
            </View>
          </Card>
          <Card title={t("reportView.whatThisCovers")}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text variant="xs" tone="muted">
                {t("reportView.assessment")}
              </Text>
              <Text variant="xs" tone="muted">
                {t("reportView.mark")}
              </Text>
            </View>
            {c.items.map((item, index) => (
              <Row
                key={index}
                title={item.title}
                caption={item.category ?? undefined}
                right={
                  <Text variant="sm" bold tone={item.scoreMilli === null ? "muted" : "fg"}>
                    {/* Blank, not zero: a paper the child has not sat is not a mark of nought. */}
                    {item.scoreMilli === null ? t("exams.awaitingMarks") : `${formatMilli(item.scoreMilli)}${item.pointsMilli ? ` / ${formatMilli(item.pointsMilli)}` : ""}`}
                  </Text>
                }
              />
            ))}
          </Card>
          {c.practice && c.practice.length > 0 ? (
            <Card title={t("reportView.practiceTitle")}>
              {c.practice.map((row, index) => (
                <Row key={index} title={row.name} caption={subjectName(t, row.subject)} right={<Text variant="sm">{`L${row.level}/6 · ${row.tiers}/6`}</Text>} />
              ))}
            </Card>
          ) : null}
          {c.remark ? (
            <Card title={t("reportView.fromClassTeacher")}>
              <Text variant="sm">{c.remark}</Text>
            </Card>
          ) : null}
          <Text variant="xs" tone="muted">
            {footer(c, t, locale)}
          </Text>
        </>
      ) : null}
    </Screen>
  );
}

function Figure({ label, value, hint }: { label: string; value: string; hint: string }) {
  const th = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}. ${hint}`} style={{ flex: 1, minWidth: 140, backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[3], gap: 2 }}>
      <Text variant="xs" tone="muted">
        {label}
      </Text>
      <Text variant="2xl" bold>
        {value}
      </Text>
      <Text variant="xs" tone="muted">
        {hint}
      </Text>
    </View>
  );
}

function footer(c: ReportCard, t: Translate, locale: string): string {
  const by = c.authorName ? `${t("reportView.writtenBy", { name: c.authorName })} ` : "";
  return by + (c.publishedAt ? t("reportView.issuedOn", { date: formatDateKey(c.publishedAt.slice(0, 10), locale) }) : t("reportView.notYetIssued"));
}

/** The card as plain text for the share sheet — the same lines, top to bottom. */
function cardText(c: ReportCard, t: Translate, locale: string): string {
  const lines = [
    c.school.name,
    `${c.title} · ${c.className}${c.classSection ? ` ${c.classSection}` : ""}`,
    c.studentName,
    `${formatDateKey(c.fromDateKey, locale)} – ${formatDateKey(c.toDateKey, locale)}`,
    "",
    `${t("reportView.overall")}: ${c.overallPercent === null ? "—" : `${c.overallPercent.toFixed(1)}%`}`,
    `${t("reportView.attendance")}: ${c.attendancePercent === null ? "—" : `${c.attendancePercent}%`}`,
    "",
    t("reportView.whatThisCovers"),
    ...c.items.map((item) => `${item.title}${item.category ? ` (${item.category})` : ""}: ${item.scoreMilli === null ? t("exams.awaitingMarks") : `${formatMilli(item.scoreMilli)}${item.pointsMilli ? ` / ${formatMilli(item.pointsMilli)}` : ""}`}`),
  ];
  if (c.remark) lines.push("", t("reportView.fromClassTeacher"), c.remark);
  lines.push("", footer(c, t, locale));
  return lines.join("\n");
}
