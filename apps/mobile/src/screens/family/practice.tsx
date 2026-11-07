import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { collegeTermParts, familyParentPracticeSchema, familyStudentPracticeSchema, isCollegeClassLevel, practiceOnceListSchema, quizBoardOrder, QUIZ_BOARD_BOTH, sortCollegeTerms, STREAMS, topicOnBoard, type CollegeTerm, type PracticeSection, type QuizBoard, type QuizBoardChoice } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Icon, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { planLockOf, unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { ChildSwitcher, childQuery, firstChild, Chips, levelName, Note, param, subjectName } from "./shared";

/** "Class 8", or "College" for the placement bank at class 13 and above (integration, 11 Oct 2026). */
function classLevelLabel(t: ReturnType<typeof useT>, classLevel: number): string {
  return isCollegeClassLevel(classLevel) ? t("practice.collegeLevel") : t("practice.classN", { n: classLevel });
}

/* ---- college-content (12 Oct 2026): a college's practice in two sections, as on the web ---- */

/** "Year 2" / "Semester 3". */
function termLabel(t: ReturnType<typeof useT>, term: CollegeTerm): string {
  const { kind, n } = collegeTermParts(term);
  return t(kind === "YEAR" ? "collegePractice.termYEAR" : "collegePractice.termSEMESTER", { n });
}

/** A college chapter's subject: the stream's name (a stream bank's subject is its stream code), else the school word. */
function collegeSubject(t: ReturnType<typeof useT>, code: string): string {
  return (STREAMS as readonly string[]).includes(code) ? t(`streams.${code}.name` as never) : subjectName(t, code);
}

const SECTION_KEY = { STREAM: "collegePractice.sectionSTREAM", PREP: "collegePractice.sectionPREP" } as const;

/** The section chips: "My stream" and "Competitive Exams Prep". */
function SectionChips({ value, onChange }: { value: PracticeSection; onChange: (value: PracticeSection) => void }) {
  const t = useT();
  return <Chips label={t("collegePractice.sectionLabel")} value={value} onChange={onChange} options={(["STREAM", "PREP"] as const).map((s) => ({ value: s, label: t(SECTION_KEY[s]) }))} />;
}

/**
 * Practice. A pupil sees the topic list and the cards above it (the web's
 * /student/practice), and every chapter, the one left half-way, the chapters
 * a teacher set and smart revision open the phone's own player (route
 * "quiz"). A guardian sees every chapter their child has touched and the rung
 * they stand on — this child against this ladder, nobody else's — and has no
 * player: the questions are the child's to answer on their own sign-in.
 */
export function FamilyPractice() {
  const role = useRole();
  const t = useT();
  if (role === "STUDENT") return <PupilPractice />;
  if (role === "PARENT") return <ChildPractice />;
  return (
    <Screen title={t("nav.practice")}>
      <Loading />
    </Screen>
  );
}

type QuizParams = { mode: "topic" | "revision" | "assigned" | "once"; slug?: string; assignmentId?: string };

/**
 * ONE-TIME PRACTICE (decision 0008, 7 Nov 2026): a pupil without the Student plan — the practice read answered 402 —
 * still sees the sets a teacher assigned, each of which opens ONCE in the player's "once" mode, scored, and shows
 * its score here when done. Drawn above the plan card, as the web's practice layout draws it. The door is planFree.
 */
function OnceSets({ play }: { play: (params: QuizParams) => void }) {
  const t = useT();
  const query = useQuery({ queryKey: ["practice", "once"], queryFn: async () => practiceOnceListSchema.parse(unwrap(await api().get("/api/v1/practice/once"))) });
  const sets = query.data?.sets ?? [];
  if (sets.length === 0) return null;
  return (
    <Card title={t("practiceOnce.title")}>
      <Text variant="xs" tone="muted">
        {t("practiceOnce.lockedNote")}
      </Text>
      {sets.map((s) => (
        <Row
          key={s.assignmentId}
          title={s.topicName}
          caption={`${t("practice.assignedTarget", { tier: s.targetTierName, level: s.targetLevel })} · ${s.state === "DONE" ? t("practiceOnce.stateDone", { correct: s.correct, total: s.total }) : s.state === "OPEN" ? t("practiceOnce.stateOpen", { answered: s.answered, total: s.total }) : t("practiceOnce.stateNotOpened")}`}
          onPress={() => play({ mode: "once", assignmentId: s.assignmentId })}
        />
      ))}
    </Card>
  );
}

/**
 * quiz-board (11 Oct 2026): the board switch, as on the web — the school's board first, then the other,
 * then both; a school with neither opens on both. The server sends every chapter with its board and the
 * school's board; an older server sends neither, and then there is no switch and every chapter lists.
 */
const BOARD_KEY = { NCERT: "quizBoard.NCERT", BALBHARATI: "quizBoard.BALBHARATI", ALL: "quizBoard.ALL" } as const;

function boardOptions(schoolBoard: QuizBoard | null): QuizBoardChoice[] {
  const boards = quizBoardOrder(schoolBoard);
  return schoolBoard ? [...boards, QUIZ_BOARD_BOTH] : [QUIZ_BOARD_BOTH, ...boards];
}

function BoardChips({ schoolBoard, value, onChange }: { schoolBoard: QuizBoard | null; value: QuizBoardChoice; onChange: (value: QuizBoardChoice) => void }) {
  const t = useT();
  return <Chips label={t("quizBoard.switchLabel")} value={value} onChange={onChange} options={boardOptions(schoolBoard).map((b) => ({ value: b, label: t(BOARD_KEY[b]) }))} />;
}

/** Whether the server told us the boards at all (a server from before 11 Oct 2026 did not). */
const knowsBoards = (topics: { board?: string | null }[], schoolBoard: unknown) => schoolBoard !== undefined || topics.some((x) => x.board !== undefined);

function ChildPractice() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const [childId, setChildId] = useState<string | null>(param(params.childId) ?? param(params.child) ?? null);
  const [boardChosen, setBoardChosen] = useState<QuizBoardChoice | null>(null);
  const query = useQuery({
    queryKey: ["family", "practice", childId],
    queryFn: async () => familyParentPracticeSchema.parse(unwrap(await api().get(`/api/v1/family/practice${childQuery(childId)}`))),
  });
  const d = query.data;
  const name = d?.childName ?? "";
  const childBoard = d?.schoolBoard ?? null;
  // college-content (12 Oct 2026): at a college no board chips; each card names its section (and a stream bank its programme).
  const college = d?.practiceKind === "COLLEGE";
  const showBoards = d ? !college && knowsBoards(d.topics, d.schoolBoard) && d.topics.length > 0 : false;
  const board: QuizBoardChoice = boardChosen ?? childBoard ?? QUIZ_BOARD_BOTH;
  const rows = d ? d.topics.filter((row) => !showBoards || topicOnBoard(row.board, board)) : [];
  const groupOf = (row: (typeof rows)[number]) => (college ? `${row.section ?? ""}\u0000${row.section === "STREAM" ? (row.programme ?? "") : ""}\u0000${row.subject}` : row.subject);
  const subjects = [...new Set(rows.map(groupOf))];
  const groupTitle = (key: string) => {
    if (!college) return subjectName(t, key);
    const [sec, programmeName, subjectCode] = key.split("\u0000") as [string, string, string];
    return sec === "STREAM" ? [programmeName || t("collegePractice.collegeWide"), collegeSubject(t, subjectCode)].join(" · ") : `${t("collegePractice.sectionPREP")} · ${subjectName(t, subjectCode)}`;
  };
  return (
    <Screen title={d ? t("practice.parentPracticeTitle", { name }) : t("nav.practice")} description={d ? t("practice.parentPracticeIntro", { name }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {d ? <ChildSwitcher pupils={d.children} selectedId={childId ?? firstChild(d.children)?.studentMembershipId ?? null} onSelect={(id) => { setChildId(id); setBoardChosen(null); }} /> : null}
      {d ? (
        <Note tone="accent">
          <Text variant="sm">{t("practice.childPlaysOwn")}</Text>
        </Note>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.topics.length === 0 ? (
          <Empty title={t("feature.practice")} body={t("practice.parentPracticeEmpty", { name })} action={<Button label={t("nav.assignments")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/assignments", params: { child: childId ?? firstChild(d.children)?.studentMembershipId ?? "" } } as never)} />} />
        ) : (
          <>
            <Note tone="accent">
              <Text variant="sm">{t("practice.parentWeekly", { n: d.weeklyCount })}</Text>
            </Note>
            {showBoards ? <BoardChips schoolBoard={childBoard} value={board} onChange={setBoardChosen} /> : null}
            {rows.length === 0 ? <Empty title={t("feature.practice")} body={t("quizBoard.nothingOnBoard", { name, board: t(BOARD_KEY[board]) })} action={<Button label={t("quizBoard.ALL")} variant="secondary" onPress={() => setBoardChosen(QUIZ_BOARD_BOTH)} />} /> : null}
            {subjects.map((subject) => (
              <Card key={subject} title={groupTitle(subject)}>
                {rows
                  .filter((row) => groupOf(row) === subject)
                  .map((row) => (
                    <Row
                      key={row.slug}
                      title={[row.name, row.section === "STREAM" ? (row.yearOrSemester ? termLabel(t, row.yearOrSemester) : null) : classLevelLabel(t, row.classLevel), row.board ? t(BOARD_KEY[row.board]) : null].filter(Boolean).join(" · ")}
                      caption={[levelName(t, row.level), `${t("practice.colTried")} ${row.seenCount}`, `${t("practice.colBadges")} ${row.tierCount}/6`, row.cleanCompletion ? t("student.badgeEarned") : null].filter(Boolean).join(" · ")}
                    />
                  ))}
              </Card>
            ))}
          </>
        )
      ) : null}
    </Screen>
  );
}

function PupilPractice() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const [grade, setGrade] = useState<number | "all" | null>(null);
  const [subject, setSubject] = useState<string>("all");
  const [boardChosen, setBoardChosen] = useState<QuizBoardChoice | null>(null);
  // college-content (12 Oct 2026): a college's two sections and the stream section's filters.
  const [section, setSection] = useState<PracticeSection>("STREAM");
  const [programme, setProgramme] = useState<string>("all");
  const [term, setTerm] = useState<string>("all");
  const query = useQuery({
    queryKey: ["family", "student", "practice"],
    queryFn: async () => familyStudentPracticeSchema.parse(unwrap(await api().get("/api/v1/family/student/practice"))),
  });
  const d = query.data;
  const college = d?.practiceKind === "COLLEGE";
  const schoolBoard = d?.schoolBoard ?? null;
  const showBoards = d ? !college && knowsBoards(d.topics, d.schoolBoard) : false;
  const board: QuizBoardChoice = boardChosen ?? schoolBoard ?? QUIZ_BOARD_BOTH;
  // The board first: its chapters list their own classes and subjects, as on the web.
  // At a college, the section first: the prep section lists by class and subject as a school does; the stream section by programme and term.
  const topics = (d?.topics ?? []).filter((topic) => (college ? topic.section === section : !showBoards || topicOnBoard(topic.board, board)));
  const streamMode = college && section === "STREAM";
  const programmes = streamMode ? [...new Set(topics.map((x) => x.programme).filter((p): p is string => !!p))].sort((a, b) => a.localeCompare(b)) : [];
  const terms = streamMode ? sortCollegeTerms(topics.map((x) => x.yearOrSemester)) : [];
  const grades = [...new Set(topics.map((topic) => topic.classLevel))].sort((a, b) => a - b);
  // No choice yet opens on the pupil's own grade, as the web does; "all" is the way out.
  const gradeNum = grade === "all" ? null : (grade ?? (d?.defaultGrade && grades.includes(d.defaultGrade) ? d.defaultGrade : null));
  const subjectsShown = [...new Set(topics.filter((topic) => gradeNum === null || topic.classLevel === gradeNum).map((topic) => topic.subject))];
  const shown = streamMode
    ? topics.filter((topic) => (programme === "all" || topic.programme === programme) && (term === "all" || topic.yearOrSemester === term || !topic.yearOrSemester))
    : topics.filter((topic) => (subject === "all" || topic.subject === subject) && (gradeNum === null || topic.classLevel === gradeNum));
  const resume = d?.resume ?? null;
  const play = (params: QuizParams) => router.push({ pathname: "/(app)/quiz", params } as never);
  return (
    <Screen title={t("feature.practice")} description={t("practice.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {/* decision 0008: a pupil without the plan sees the sets a teacher assigned above the plan card. */}
      {query.isError && planLockOf(query.error) ? <OnceSets play={play} /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {/* My own journey (A3-inventory-14): the web's link beside the page title, here the first thing under it. */}
      {d ? <Button variant="secondary" label={t("journey.title")} onPress={() => router.push("/(app)/practice-journey" as never)} /> : null}
      {d && college ? (
        <SectionChips
          value={section}
          onChange={(value) => {
            setSection(value);
            setSubject("all");
            setGrade(null);
          }}
        />
      ) : null}
      {d && showBoards ? (
        <BoardChips
          schoolBoard={schoolBoard}
          value={board}
          onChange={(value) => {
            setBoardChosen(value);
            setSubject("all");
          }}
        />
      ) : null}
      {d ? (
        topics.length === 0 ? (
          college && section === "STREAM" ? (
            <Empty title={t("collegePractice.noStreamTopics")} body={t("collegePractice.noStreamTopicsBody", { streams: (d.collegeStreams ?? []).map((x) => t(`streams.${x}.name` as never)).join(", ") || "—" })} action={<Button label={t("collegePractice.openPrep")} variant="secondary" onPress={() => setSection("PREP")} />} />
          ) : (
            <Empty title={t("student.noTopics")} body={t("student.noTopicsBody")} action={<Button label={t("nav.assignments")} variant="secondary" onPress={() => router.push("/(app)/assignments" as never)} />} />
          )
        ) : (
          <>
            {resume ? (
              <Card title={t("practice.continueTitle")}>
                <Row title={resume.name} caption={`${levelName(t, resume.level)}${resume.tierCount > 0 ? ` · ${resume.tierCount}/6` : ""}`} onPress={() => play({ mode: "topic", slug: resume.slug })} />
                <Text variant="xs" tone="muted">
                  {resume.remainingForBadge !== null && resume.nextTierName ? t("practice.continueBadgeHint", { n: resume.remainingForBadge, tier: resume.nextTierName }) : t("practice.continueAllProven")}
                </Text>
              </Card>
            ) : null}
            <Card title={t("practice.goalTitle")}>
              <Text variant="2xl" bold>
                {`${Math.min(d.weekly, d.weeklyGoal)}`}
                <Text variant="sm" tone="muted">{` / ${d.weeklyGoal}`}</Text>
              </Text>
              <View accessible accessibilityRole="progressbar" accessibilityLabel={t("practice.goalHint", { n: d.weekly, goal: d.weeklyGoal })} style={{ height: 6, borderRadius: th.radius.sm, backgroundColor: th.surfaceMuted, overflow: "hidden" }}>
                <View style={{ height: 6, width: `${Math.min(100, Math.round((d.weekly * 100) / Math.max(1, d.weeklyGoal)))}%`, backgroundColor: th.accent }} />
              </View>
              <Text variant="xs" tone="muted">
                {t("practice.goalHint", { n: d.weekly, goal: d.weeklyGoal })}
              </Text>
            </Card>
            {d.revision.length > 0 ? (
              <Card title={t("practice.revisionTitle")}>
                <Text variant="2xl" bold>
                  {String(d.revision.length)}
                </Text>
                <Text variant="xs" tone="muted">
                  {t("practice.revisionHint", { n: d.revision.length })}
                </Text>
                <Button variant="secondary" label={t("practice.revisionStart")} onPress={() => play({ mode: "revision" })} />
              </Card>
            ) : null}
            {d.assigned.length > 0 ? (
              <Card title={t("practice.assignedTitle")}>
                {d.assigned.map((a) => (
                  <Row
                    key={a.id}
                    title={a.topicName}
                    caption={`${t("practice.assignedTarget", { tier: a.targetTierName, level: a.targetLevel })} · ${a.reached ? t("practice.assignedReached") : t("practice.assignedKeepGoing")}`}
                    onPress={() => play({ mode: "assigned", assignmentId: a.id })}
                  />
                ))}
              </Card>
            ) : null}

            {streamMode && programmes.length > 1 ? (
              <Chips label={t("collegePractice.programmeLabel")} value={programme} onChange={setProgramme} options={[{ value: "all", label: t("collegePractice.allProgrammes") }, ...programmes.map((p) => ({ value: p, label: p }))]} />
            ) : null}
            {streamMode && terms.length > 0 ? (
              <Chips label={t("collegePractice.termLabel")} value={term} onChange={setTerm} options={[{ value: "all", label: t("collegePractice.allTerms") }, ...terms.map((x) => ({ value: x, label: termLabel(t, x) }))]} />
            ) : null}
            {!streamMode && grades.length > 1 ? (
              <Chips
                label={t("practice.allClasses")}
                value={gradeNum === null ? "all" : String(gradeNum)}
                onChange={(value) => setGrade(value === "all" ? "all" : Number(value))}
                options={[{ value: "all", label: t("practice.allClasses") }, ...grades.map((g) => ({ value: String(g), label: classLevelLabel(t, g) }))]}
              />
            ) : null}
            {!streamMode && subjectsShown.length > 1 ? (
              <Chips label={t("student.subjects")} value={subject} onChange={setSubject} options={[{ value: "all", label: t("practice.allSubjects") }, ...subjectsShown.map((s) => ({ value: s, label: subjectName(t, s) }))]} />
            ) : null}

            {shown.map((topic) => (
              <Card key={topic.id}>
                <Row
                  title={topic.name}
                  caption={(streamMode
                    ? [topic.programme ?? t("collegePractice.collegeWide"), collegeSubject(t, topic.subject), topic.yearOrSemester ? termLabel(t, topic.yearOrSemester) : null]
                    : [subjectName(t, topic.subject), classLevelLabel(t, topic.classLevel), topic.board ? t(BOARD_KEY[topic.board]) : null]
                  )
                    .filter(Boolean)
                    .join(" · ")}
                  right={
                    topic.badgeEarned ? (
                      <View accessible accessibilityLabel={t("student.badgeEarned")}>
                        <Icon name="medal" size={22} weight="fill" color={th.accentStrong} />
                      </View>
                    ) : null
                  }
                  onPress={() => play({ mode: "topic", slug: topic.slug })}
                />
                {topic.summary ? (
                  <Text variant="sm" tone="muted">
                    {topic.summary}
                  </Text>
                ) : null}
                <Text variant="xs" tone="muted">
                  {[levelName(t, topic.level), t("practice.triedOfTotal", { seen: topic.seenCount, total: topic.questionCount }), topic.tierCount > 0 ? t("practice.tierBadges", { n: topic.tierCount }) : null, topic.completed && !topic.badgeEarned ? t("practice.finished") : null]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </Card>
            ))}
          </>
        )
      ) : null}
    </Screen>
  );
}
