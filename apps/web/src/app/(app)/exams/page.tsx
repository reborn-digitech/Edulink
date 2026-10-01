import type { Metadata } from "next";
import Link from "next/link";
import { CertificateIcon, ExamIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { dateSheetsFor, examMarksFor } from "@/lib/exams";
import { myCards, cardsForChild } from "@/lib/report-cards";
import { currentTerms } from "@/lib/terms";
import { listContexts } from "@/lib/session";
import { ExamMarksCards } from "@/components/exams/exam-marks";
import { EXAM_KIND_KEY, EXAM_KINDS, type ExamKind } from "@/lib/constants";
import { formatDateKey, todayKey } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { TabBar } from "@/components/ui/tabs";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("nav.exams") };
}

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const TABS = ["marks", "upcoming", "cards"] as const;
type Tab = (typeof TABS)[number];

type CardRow = { id: string; title: string; publishedAt: Date | null; overallPercentMilli: number | null };

/**
 * ONE PLACE FOR "HOW DID I DO": exam marks as they come in, the exams still
 * ahead, and the report cards — three tabs, for a pupil or across a parent's
 * children. Assignments are the other question and live on their own page.
 * Staff land here too: the whole date sheet, and a way into the report-card
 * builders class by class.
 */
export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; kind?: string }>;
}) {
  const session = await requireUser();
  const t = await getT();
  const { tab: rawTab, kind: rawKind } = await searchParams;
  // The Indian-year toggle: a term is two unit tests and a mid-term or a
  // final, and a parent asking "how did the half-yearly go" should not have
  // to scroll past every unit test to find out. A GET param, so the filtered
  // view is a link.
  const kind = EXAM_KINDS.includes(rawKind as ExamKind) ? (rawKind as ExamKind) : null;
  const isReader = session.role === "STUDENT" || session.role === "PARENT";
  const isStaff = session.role === "ADMIN" || session.role === "PRINCIPAL" || session.role === "TEACHER";

  const [sheets, marks] = await Promise.all([
    dateSheetsFor(session),
    isReader ? examMarksFor(session) : Promise.resolve([]),
  ]);

  /* Report cards: a pupil's own, or each child's — named per child only when
   * there is more than one. Staff get the classes whose cards they may build. */
  let cards: { name: string | null; rows: CardRow[] }[] = [];
  if (session.role === "STUDENT") {
    cards = [{ name: null, rows: await myCards(session) }];
  } else if (session.role === "PARENT") {
    const { children } = await listContexts(session.user.id);
    cards = await Promise.all(
      children.map(async (child) => ({
        name: children.length > 1 ? child.name : null,
        rows: (await cardsForChild(session, child.studentMembershipId)).filter((c) => c.status === "PUBLISHED"),
      })),
    );
  }
  /**
   * When a reader has no cards yet, it matters WHY: a card is prepared once
   * the school marks the term finished (the milestone on the calendar), so a
   * parent looking mid-term should be told the cards are coming, not left to
   * read an empty tab as broken. Resolve the reader's school(s) — the pupil's
   * own, or every school their children attend — and see whether any is
   * running a term that has not been marked finished. One distinct term name
   * is named; a mix stays generic.
   */
  // The tab is known here, and everything below is bought only by the tab
  // that shows it — the cards tab's four lookups were paid on the marks tab.
  const anyMarks = marks.some((m) => m.series.length > 0);
  const cardCount = cards.reduce((n, c) => n + c.rows.length, 0);
  const defaultTab: Tab = isReader ? (anyMarks ? "marks" : "upcoming") : "upcoming";
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : defaultTab;

  let awaitingTermName: string | null = null;
  let termIsRunning = false;
  if (tab === "cards" && isReader && cardCount === 0) {
    const readerSchoolIds =
      session.role === "PARENT"
        ? [...new Set((await listContexts(session.user.id)).children.map((c) => c.schoolId))]
        : session.schoolId
          ? [session.schoolId]
          : [];
    if (readerSchoolIds.length > 0) {
      const zones = new Map(
        (await db.school.findMany({ where: { id: { in: readerSchoolIds } }, select: { id: true, timezone: true } })).map((s) => [s.id, s.timezone]),
      );
      const runningNames = new Set<string>();
      for (const schoolId of readerSchoolIds) {
        for (const term of await currentTerms(schoolId, zones.get(schoolId) ?? "UTC")) {
          if (term.current && !term.finishedAt) runningNames.add(term.name);
        }
      }
      termIsRunning = runningNames.size > 0;
      awaitingTermName = runningNames.size === 1 ? [...runningNames][0]! : null;
    }
  }

  const staffClasses = tab === "cards" && isStaff && session.schoolId
    ? await db.class.findMany({
        where: {
          schoolId: session.schoolId,
          archivedAt: null,
          ...(session.role === "TEACHER" && session.membershipId
            ? { teachers: { some: { teacherMembershipId: session.membershipId } } }
            : {}),
        },
        select: { id: true, name: true, _count: { select: { reportCards: { where: { status: "PUBLISHED" } } } } },
        orderBy: { name: "asc" },
      })
    : [];

  /* UPCOMING ONLY for readers, in each school's own timezone; a sheet with
   * nothing left to sit disappears. Staff see the whole sheet. */
  const schoolNames = [...new Set(sheets.map((s) => s.schoolName))];
  const zones = new Map(
    tab === "upcoming" && isReader
      ? (await db.school.findMany({ where: { name: { in: schoolNames } }, select: { name: true, timezone: true } })).map(
          (s) => [s.name, s.timezone] as const,
        )
      : [],
  );
  const visibleSheets = isReader
    ? sheets
        .map((sheet) => {
          const today = todayKey(zones.get(sheet.schoolName) ?? "UTC");
          return { ...sheet, slots: sheet.slots.filter((slot) => slot.dateKey >= today) };
        })
        .filter((sheet) => sheet.slots.length > 0)
    : sheets;
  const multiSchool = schoolNames.length > 1;


  const tabs = [
    ...(isReader ? [{ key: "marks", href: "/exams?tab=marks", label: t("exams.tabMarks") }] : []),
    { key: "upcoming", href: "/exams?tab=upcoming", label: isReader ? t("exams.tabUpcoming") : t("exams.tabDateSheet") },
    { key: "cards", href: "/exams?tab=cards", label: t("exams.tabCards"), count: isReader ? cardCount : undefined },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title={t("nav.exams")} description={isReader ? t("exams.readerIntro") : t("exams.sheetIntro")} />

      <TabBar ariaLabel={t("nav.exams")} current={tab} tabs={tabs} />

      {/* ---------------- marks ---------------- */}
      {tab === "marks" && (
        anyMarks ? (
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-fg-muted">{t("exams.myMarksIntro")}</p>
            <nav aria-label={t("exams.kindFilterLabel")} className="flex flex-wrap gap-2">
              {[null, ...EXAM_KINDS].map((k) => (
                <Link
                  key={k ?? "all"}
                  href={k ? `/exams?tab=marks&kind=${k}` : "/exams?tab=marks"}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    kind === k ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted hover:text-fg"
                  }`}
                >
                  {k ? t(EXAM_KIND_KEY[k]) : t("exams.allKinds")}
                </Link>
              ))}
            </nav>
            {marks
              .map((m) => (kind ? { ...m, series: m.series.filter((s) => s.kind === kind) } : m))
              .map((m) => (
                <ExamMarksCards key={m.studentMembershipId} marks={m} showStudent={marks.length > 1} />
              ))}
          </div>
        ) : (
          <EmptyState
            icon={<ExamIcon weight="duotone" className="size-8" />}
            title={t("exams.noMarksYet")}
            description={t("exams.myMarksIntro")}
          />
        )
      )}

      {/* ---------------- upcoming / date sheet ---------------- */}
      {tab === "upcoming" &&
        (visibleSheets.length === 0 ? (
          <EmptyState
            icon={<ExamIcon weight="duotone" className="size-8" />}
            title={isReader ? t("exams.noUpcomingTitle") : t("exams.sheetEmptyTitle")}
            description={isReader ? t("exams.noUpcomingBody") : t("exams.sheetEmptyBody")}
          />
        ) : (
          <div className="space-y-3">
            {visibleSheets.map((sheet) => (
              <Card key={sheet.id}>
                <CardHeader
                  icon={<ExamIcon weight="duotone" className="size-5" />}
                  title={`${sheet.name} · ${t("practice.classN", { n: sheet.gradeLevel })}`}
                  description={[t(EXAM_KIND_KEY[sheet.kind]), multiSchool ? sheet.schoolName : null]
                    .filter(Boolean)
                    .join(" · ")}
                />
                <CardBody className="overflow-x-auto p-0" tabIndex={0}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                        <th className="px-4 py-2 font-medium">{t("exams.colDay")}</th>
                        <th className="px-4 py-2 font-medium">{t("exams.colSubject")}</th>
                        <th className="px-4 py-2 font-medium">{t("exams.colTime")}</th>
                        <th className="px-4 py-2 text-right font-medium">{t("exams.colMaxMarks")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.slots.map((slot) => (
                        <tr key={slot.id} className="border-b border-border last:border-b-0">
                          <td className="px-4 py-2.5 text-fg">{formatDateKey(slot.dateKey)}</td>
                          <td className="px-4 py-2.5 font-medium text-fg">{slot.subject}</td>
                          <td className="px-4 py-2.5 text-fg-muted">
                            {slot.startMinute !== null
                              ? `${hhmm(slot.startMinute)}${slot.endMinute !== null ? `–${hhmm(slot.endMinute)}` : ""}`
                              : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right text-fg">{slot.maxMarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            ))}
          </div>
        ))}

      {/* ---------------- report cards ---------------- */}
      {tab === "cards" && isReader && (
        cardCount === 0 ? (
          <EmptyState
            icon={<CertificateIcon weight="duotone" className="size-8" />}
            title={t("exams.noCardsTitle")}
            // A running term explains the emptiness — cards are prepared when
            // the school marks the term finished. Named when one term is
            // running, generic when several are, and the plain line otherwise.
            description={
              termIsRunning
                ? awaitingTermName
                  ? t("exams.cardsAfterTermNamed", { term: awaitingTermName })
                  : t("exams.cardsAfterTerm")
                : t("exams.noCardsBody")
            }
          />
        ) : (
          <div className="space-y-3">
            {cards
              .filter((group) => group.rows.length > 0)
              .map((group, index) => (
                <Card key={group.name ?? index}>
                  {group.name && (
                    <CardHeader icon={<CertificateIcon weight="duotone" className="size-5" />} title={group.name} />
                  )}
                  <CardBody className="p-0">
                    <ul className="divide-y divide-border">
                      {group.rows.map((card) => (
                        <li key={card.id}>
                          <Link
                            href={`/report-cards/${card.id}`}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-fg">{card.title}</span>
                              {card.publishedAt && (
                                <span className="block text-xs text-fg-muted">
                                  {formatDateKey(card.publishedAt.toISOString().slice(0, 10))}
                                </span>
                              )}
                            </span>
                            {card.overallPercentMilli !== null && (
                              <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">
                                {(card.overallPercentMilli / 1000).toFixed(1)}%
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              ))}
          </div>
        )
      )}

      {tab === "cards" && isStaff && (
        staffClasses.length === 0 ? (
          <EmptyState
            icon={<CertificateIcon weight="duotone" className="size-8" />}
            title={t("exams.noClassesForCards")}
            description={t("exams.noClassesForCardsBody")}
          />
        ) : (
          <Card>
            <CardBody className="p-0">
              <ul className="divide-y divide-border">
                {staffClasses.map((klass) => (
                  <li key={klass.id}>
                    <Link
                      href={`/teacher/classes/${klass.id}/report-cards`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{klass.name}</span>
                      <span className="shrink-0 text-xs text-fg-muted">
                        {klass._count.reportCards === 1
                          ? t("exams.cardsIssuedOne")
                          : t("exams.cardsIssuedMany", { count: klass._count.reportCards })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )
      )}
    </div>
  );
}
