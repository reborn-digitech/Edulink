import { useState } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { Share, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";
import { familyExamsSchema, familyReportCardSchema, familyReportCardsSchema } from "@edulink/contracts";
import type { Translate } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Icon, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { bytesApi, shareBytes } from "@/lib/download";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, EXAM_KIND, ExamMarksCards, formatDateKey, formatMilli, hhmm, Note, param, Pill, subjectName, Tabs, type ExamKind } from "./shared";
// Vidura pass 2 (17 Oct 2026): "Explain this to me" beside each line of a report card.
import { ExplainThis } from "../shared/vidura";
import { useRole } from "@/lib/session";

type Tab = "marks" | "upcoming" | "cards";
type ReportCard = z.infer<typeof familyReportCardSchema>;
type Layout = NonNullable<ReportCard["layout"]>;
/** A card issued before the office had any rules to set: everything on, nothing said around it. */
const DEFAULT_LAYOUT: Layout = { font: "default", signerLeft: "NONE", signerRight: "NONE", showSeal: false, showAttendance: true, showPractice: true, showCoScholastic: true, showGradePoints: true, showAddress: false, showSignatures: false, showRemark: true, useBrandColour: false, signatureLeft: "", signatureRight: "", headerNote: null, footerNote: null, paper: "A4" };
const KINDS: ExamKind[] = ["UNIT_TEST", "MID_TERM", "FINAL"];

/**
 * "How did I do" — the web's /exams for a pupil or across a guardian's
 * children: marks as they come in, the sittings still ahead, and the report
 * cards, one of which opens natively with a Share button. Given
 * `?cardId=` (the archive's past report cards) it opens on that card.
 */
export function FamilyExams() {
  // Marks and report cards are a child's private record: no screenshots, no screen recording, while this screen is up.
  usePrivateScreen();
  const t = useT();
  const { locale } = useLocale();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const asked = param(params.cardId) ?? null;
  const [cardId, setCardId] = useState<string | null>(asked);
  // A card asked for again while this screen is still mounted (it may be a tab) opens too.
  const [lastAsked, setLastAsked] = useState<string | null>(asked);
  if (asked !== lastAsked) {
    setLastAsked(asked);
    setCardId(asked);
  }
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
      {exams.isError ? <Failed error={exams.error} onRetry={() => void exams.refetch()} /> : null}

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
          {cards.isError ? <Failed error={cards.error} onRetry={() => void cards.refetch()} /> : null}
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

/**
 * One report card as it will be printed — natively, with the phone's share
 * sheet instead of a printer. The card carries the layout it was issued
 * under (which blocks show, the letterhead's colour and notes) and its own
 * scale, so a card from a past year keeps looking as it did; the PDF the
 * server renders comes through the same share sheet as a file.
 */
function ReportCardView({ cardId, onBack }: { cardId: string; onBack: () => void }) {
  const t = useT();
  const role = useRole();
  const th = useTheme();
  const { locale } = useLocale();
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["family", "report-card", cardId],
    queryFn: async () => familyReportCardSchema.parse(unwrap(await api().get(`/api/v1/family/report-cards/${encodeURIComponent(cardId)}`))),
  });
  const c = query.data;
  const share = () => {
    if (!c) return;
    void Share.share({ title: `${c.title} · ${c.studentName}`, message: cardText(c, t, locale) });
  };
  const downloadPdf = async () => {
    if (!c) return;
    setPdfBusy(true);
    setPdfError(null);
    const fallback = t("common.somethingWrong");
    const got = await bytesApi.get(`/api/v1/shared/report-cards/${encodeURIComponent(c.id)}/pdf`, fallback);
    const error = got.ok ? await shareBytes(got, `${c.title} - ${c.studentName}.pdf`, fallback) : got.error;
    setPdfBusy(false);
    setPdfError(error);
  };
  const range = c ? `${formatDateKey(c.fromDateKey, locale, { day: "numeric", month: "short" })} – ${formatDateKey(c.toDateKey, locale, { day: "numeric", month: "short", year: "numeric" })}` : "";
  const layout = c?.layout ?? DEFAULT_LAYOUT;
  const brand = layout.useBrandColour && c?.school.brandPrimary ? c.school.brandPrimary : null;
  const subjects = c?.subjects ?? [];
  const coScholastic = c?.coScholastic ?? [];
  const address = c ? [c.school.addressLine, c.school.city, c.school.region, c.school.postalCode].filter(Boolean).join(", ") : "";
  const contact = c ? [c.school.contactPhone, c.school.contactEmail, c.school.website].filter(Boolean).join(" · ") : "";
  return (
    <Screen title={c?.title ?? t("nav.exams")} description={c ? `${c.school.name} · ${c.className}${c.classSection ? ` ${c.classSection}` : ""}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <View style={{ flexDirection: "row", gap: th.space[2] }}>
        <Button variant="secondary" label={t("reportView.back")} onPress={onBack} style={{ flex: 1 }} />
        <Button label={t("mobile.share")} onPress={share} disabled={!c} style={{ flex: 1 }} />
      </View>
      <Button variant="secondary" label={t("reportView.downloadPdf")} icon={<Icon name="fileText" size={18} color={th.fg} weight="bold" />} busy={pdfBusy} disabled={!c} onPress={() => void downloadPdf()} />
      {pdfError ? <Failed message={pdfError} onRetry={() => void downloadPdf()} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
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
            <Text variant="lg" bold style={brand ? { color: brand } : undefined}>
              {c.school.name}
            </Text>
            {layout.headerNote ? (
              <Text variant="xs" tone="muted">
                {layout.headerNote}
              </Text>
            ) : null}
            {layout.showAddress && address ? (
              <Text variant="xs" tone="muted">
                {address}
              </Text>
            ) : null}
            {layout.showAddress && contact ? (
              <Text variant="xs" tone="muted">
                {contact}
              </Text>
            ) : null}
            {c.scope === "YEAR" ? <Pill label={t("reportView.annualCard")} tone="accent" /> : null}
            <Text variant="2xl" bold accessibilityRole="header">
              {c.studentName}
            </Text>
            <Text variant="xs" tone="muted">
              {range}
            </Text>
            <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
              <Figure
                label={t("reportView.overall")}
                value={overallText(c)}
                hint={c.overallPercent === null ? t("reportView.noMarksCounted") : c.gradingMethod === "weighted" ? t("reportView.weightedExplainerShort") : c.gradingMethod === "exams" ? t("reportView.examsOnly") : t("reportView.acrossBelow")}
              />
              {layout.showGradePoints && c.gradePoints !== null && c.gradePoints !== undefined ? <Figure label={t("reportView.gradePoints")} value={c.gradePoints.toFixed(1)} hint={t("reportView.gradePointsHint")} /> : null}
              {layout.showAttendance ? (
                <Figure
                  label={t("reportView.attendance")}
                  value={c.attendancePercent === null ? "—" : `${c.attendancePercent}%`}
                  hint={c.attendanceTotal === 0 ? t("reportView.noRegisterWindow") : t("reportView.daysOf", { present: c.attendancePresent, total: c.attendanceTotal })}
                />
              ) : null}
            </View>
          </Card>
          {subjects.length > 0 ? (
            <Card title={t("reportView.scholastic")}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: th.space[2] }}>
                <Text variant="xs" tone="muted">
                  {`${t("reportView.subject")} · ${c.scope === "YEAR" ? t("reportView.terms") : t("reportView.papers")}`}
                </Text>
                <Text variant="xs" tone="muted">
                  {[t("reportView.percent"), t("reportView.grade"), t("reportView.points")].join(" · ")}
                </Text>
              </View>
              {subjects.map((row, index) => (
                <View key={row.subject}>
                  <Row title={row.subject} caption={partsText(row.parts, t) || undefined} right={<Text variant="sm" bold tone={row.percent === null ? "muted" : "fg"}>{subjectMark(row, t)}</Text>} />
                  {role === "STUDENT" || role === "PARENT" ? <ExplainThis about={{ kind: "REPORT_LINE", id: `${c.id}:s${index}`, ...(role === "PARENT" ? { childId: c.studentMembershipId } : {}) }} label={row.subject} /> : null}
                </View>
              ))}
            </Card>
          ) : (
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
                <View key={index}>
                <Row
                  title={item.title}
                  caption={[item.subject, item.category].filter(Boolean).join(" · ") || undefined}
                  right={
                    <Text variant="sm" bold tone={item.scoreMilli === null ? "muted" : "fg"}>
                      {/* Blank, not zero: a paper the child has not sat is not a mark of nought. */}
                      {itemMark(item, t)}
                    </Text>
                  }
                />
                {role === "STUDENT" || role === "PARENT" ? <ExplainThis about={{ kind: "REPORT_LINE", id: `${c.id}:${index}`, ...(role === "PARENT" ? { childId: c.studentMembershipId } : {}) }} label={item.title} /> : null}
                </View>
              ))}
            </Card>
          )}
          {layout.showCoScholastic && coScholastic.length > 0 ? (
            <Card title={t("reportView.coScholastic")}>
              {coScholastic.map((row) => (
                <Row key={row.area} title={row.area} caption={row.note ?? undefined} right={<Text variant="sm" bold tone={row.grade ? "fg" : "muted"}>{coGradeText(row.grade, c)}</Text>} />
              ))}
            </Card>
          ) : null}
          {layout.showPractice && c.practice && c.practice.length > 0 ? (
            <Card title={t("reportView.practiceTitle")}>
              {c.practice.map((row, index) => (
                <Row key={index} title={row.name} caption={subjectName(t, row.subject)} right={<Text variant="sm">{`L${row.level}/6 · ${row.tiers}/6`}</Text>} />
              ))}
            </Card>
          ) : null}
          {layout.showRemark && c.remark ? (
            <Card title={t("reportView.fromClassTeacher")}>
              <Text variant="sm">{c.remark}</Text>
            </Card>
          ) : null}
          {scaleText(c, t) ? (
            <Text variant="xs" tone="muted">
              {scaleText(c, t)}
            </Text>
          ) : null}
          {layout.footerNote ? (
            <Text variant="xs" tone="muted">
              {layout.footerNote}
            </Text>
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

/** "88.5% · A1": the percent, and the band it falls in when the school has a scale. */
function overallText(c: ReportCard): string {
  if (c.overallPercent === null) return "—";
  return `${c.overallPercent.toFixed(1)}%${c.overallLetter ? ` · ${c.overallLetter}` : ""}`;
}

type Subject = NonNullable<ReportCard["subjects"]>[number];
function subjectMark(row: Subject, t: Translate): string {
  if (row.percent === null) return t("exams.awaitingMarks");
  return [`${row.percent.toFixed(1)}%`, row.letter, row.points !== null ? String(row.points) : null].filter((x) => x !== null && x !== "").join(" · ");
}

/** The parts a subject's percent was made of: "Unit test 1 20/25 (80%) · Mid-term 60/80 (75%)". */
function partsText(parts: Subject["parts"], t: Translate): string {
  return parts
    .map((p) => {
      if (p.scoreMilli === null) return `${p.label} ${t("exams.awaitingMarks")}`;
      const out = p.pointsMilli ? `${formatMilli(p.scoreMilli)}/${formatMilli(p.pointsMilli)}` : formatMilli(p.scoreMilli);
      return `${p.label} ${out}${p.percent !== null ? ` (${Math.round(p.percent)}%)` : ""}`;
    })
    .join(" · ");
}

function itemMark(item: ReportCard["items"][number], t: Translate): string {
  if (item.scoreMilli === null) return t("exams.awaitingMarks");
  const mark = `${formatMilli(item.scoreMilli)}${item.pointsMilli ? ` / ${formatMilli(item.pointsMilli)}` : ""}`;
  return item.letter ? `${mark} · ${item.letter}` : mark;
}

/** A co-scholastic grade with its descriptor from the card's own scale: "A · Outstanding". */
function coGradeText(grade: string | null, c: ReportCard): string {
  if (!grade) return "—";
  const found = c.scale?.coScale.find((s) => s.label === grade);
  return found?.descriptor ? `${grade} · ${found.descriptor}` : grade;
}

/** "Scale: A1 ≥ 91% (10) · A2 ≥ 81% (9) …" — the bands the card was graded on, so a letter can be read. */
function scaleText(c: ReportCard, t: Translate): string {
  const bands = c.scale?.bands ?? [];
  if (bands.length === 0) return "";
  return `${t("reportView.scaleLine")}: ${bands.map((b) => `${b.label} ≥ ${b.minPercent}%${b.points !== null ? ` (${b.points})` : ""}`).join(" · ")}`;
}

function footer(c: ReportCard, t: Translate, locale: string): string {
  const by = c.authorName ? `${t("reportView.writtenBy", { name: c.authorName })} ` : "";
  return by + (c.issuedDateKey ? t("reportView.issuedOn", { date: formatDateKey(c.issuedDateKey, locale) }) : c.publishedAt ? t("reportView.issuedOn", { date: formatDateKey(c.publishedAt.slice(0, 10), locale) }) : t("reportView.notYetIssued"));
}

/** The card as plain text for the share sheet — the same lines, top to bottom. */
function cardText(c: ReportCard, t: Translate, locale: string): string {
  const layout = c.layout ?? DEFAULT_LAYOUT;
  const subjects = c.subjects ?? [];
  const lines = [
    c.school.name,
    ...(layout.headerNote ? [layout.headerNote] : []),
    `${c.title} · ${c.className}${c.classSection ? ` ${c.classSection}` : ""}`,
    c.studentName,
    `${formatDateKey(c.fromDateKey, locale)} – ${formatDateKey(c.toDateKey, locale)}`,
    "",
    `${t("reportView.overall")}: ${overallText(c)}`,
  ];
  if (layout.showGradePoints && c.gradePoints !== null && c.gradePoints !== undefined) lines.push(`${t("reportView.gradePoints")}: ${c.gradePoints.toFixed(1)}`);
  if (layout.showAttendance) lines.push(`${t("reportView.attendance")}: ${c.attendancePercent === null ? "—" : `${c.attendancePercent}%`}`);
  if (subjects.length > 0) {
    lines.push("", t("reportView.scholastic"), ...subjects.map((row) => `${row.subject}: ${subjectMark(row, t)}${row.parts.length ? ` (${partsText(row.parts, t)})` : ""}`));
  } else {
    lines.push("", t("reportView.whatThisCovers"), ...c.items.map((item) => `${item.title}${item.category ? ` (${item.category})` : ""}: ${itemMark(item, t)}`));
  }
  const co = c.coScholastic ?? [];
  if (layout.showCoScholastic && co.length > 0) lines.push("", t("reportView.coScholastic"), ...co.map((row) => `${row.area}: ${coGradeText(row.grade, c)}${row.note ? ` — ${row.note}` : ""}`));
  if (layout.showRemark && c.remark) lines.push("", t("reportView.fromClassTeacher"), c.remark);
  const scale = scaleText(c, t);
  if (scale) lines.push("", scale);
  if (layout.footerNote) lines.push(layout.footerNote);
  lines.push("", footer(c, t, locale));
  return lines.join("\n");
}
