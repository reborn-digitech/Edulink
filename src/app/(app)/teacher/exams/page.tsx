import type { Metadata } from "next";
import Link from "next/link";
import { ExamIcon, CheckCircleIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { EXAM_CATEGORY, examClassesFor, marksGrid } from "@/lib/exams";
import { listGradeCategories, weightsAreUsable } from "@/lib/grading";
import { formatDateKey } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";
import { TabBar } from "@/components/ui/tabs";
import { saveMarksAction } from "./actions";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("exams.marksTitle") };
}

/**
 * Marks entry: pick a class, pick a paper, fill the register-shaped grid.
 * Saving writes ordinary Grade rows against the sitting's auto-created
 * Assignment (category "Exam"), so the marks flow into the child's grades page
 * and the report-card builder without another keystroke.
 */
export default async function TeacherExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; slotId?: string; error?: string; saved?: string }>;
}) {
  const ctx = await requireRole("TEACHER", "ADMIN");
  const t = await getT();
  const { classId: requestedClass, slotId: requestedSlot, error, saved } = await searchParams;

  const classes = await examClassesFor(ctx);
  if (classes.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("exams.marksTitle")}</h1>
        <EmptyState
          icon={<ExamIcon weight="duotone" className="size-8" />}
          title={t("exams.marksTitle")}
          description={t("teacher.noClassesYet")}
        />
      </div>
    );
  }

  const selectedClass = classes.find((c) => c.id === requestedClass) ?? classes[0]!;
  const slots = selectedClass.series.flatMap((s) =>
    s.slots.map((slot) => ({ ...slot, seriesName: s.name })),
  );
  // The first paper self-selects: chips over dead space made a teacher's
  // first visit a guessing game.
  const selectedSlot = slots.find((s) => s.id === requestedSlot) ?? slots[0] ?? null;

  const grid = selectedSlot ? await marksGrid(ctx, selectedSlot.id, selectedClass.id) : null;

  // A sitting's marks join the weighted overall only through a weighted
  // category named "Exam" — a text join nothing else surfaces. Warn exactly
  // when it bites: the class weights its work, and no Exam weight exists. A
  // points-based class needs no warning; there the marks already count.
  const weights = grid ? await listGradeCategories(ctx, selectedClass.id) : [];
  const examUnweighted =
    grid !== null &&
    weightsAreUsable(weights) &&
    !weights.some((w) => w.name === EXAM_CATEGORY && w.weightBps > 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.exams")} description={t("exams.marksIntro")} />

      {/* Marks and report cards are two tabs of one Exams — the cards tab is
          the shared staff view on /exams, which lists this teacher's classes. */}
      <TabBar
        ariaLabel={t("nav.exams")}
        current="marks"
        tabs={[
          { key: "marks", href: "/teacher/exams", label: t("exams.tabMarksEntry") },
          { key: "cards", href: "/exams?tab=cards", label: t("exams.tabCards") },
        ]}
      />

      {classes.length > 1 && (
        <nav aria-label={t("nav.classes")} className="flex flex-wrap gap-2">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/teacher/exams?classId=${c.id}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                selectedClass.id === c.id ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      )}

      {error && (
        <Card>
          <CardBody className="flex items-center gap-2 text-sm text-danger">
            <WarningIcon weight="fill" className="size-4 shrink-0" />
            {error}
          </CardBody>
        </Card>
      )}
      {saved && (
        <Card>
          <CardBody className="flex items-center gap-2 text-sm text-ok">
            <CheckCircleIcon weight="fill" className="size-4 shrink-0" />
            {t("exams.savedNote")}
          </CardBody>
        </Card>
      )}

      {slots.length === 0 ? (
        <EmptyState
          icon={<ExamIcon weight="duotone" className="size-8" />}
          title={t("exams.noPapersTitle")}
          description={t("exams.noPapersBody")}
        />
      ) : (
        <nav aria-label={t("exams.pickPaper")} className="flex flex-wrap gap-2">
          {slots.map((slot) => (
            <Link
              key={slot.id}
              href={`/teacher/exams?classId=${selectedClass.id}&slotId=${slot.id}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                selectedSlot?.id === slot.id ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted"
              }`}
            >
              {slot.seriesName} · {slot.subject} · {formatDateKey(slot.dateKey)}
            </Link>
          ))}
        </nav>
      )}

      {examUnweighted && (
        <Card>
          <CardBody className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-fg-muted">
            <WarningIcon weight="fill" className="size-4 shrink-0 text-warn" />
            <span className="min-w-0 flex-1">{t("exams.unweightedNote")}</span>
            <Link
              href={`/teacher/classes/${selectedClass.id}`}
              className="font-medium text-accent underline-offset-2 hover:underline"
            >
              {t("exams.unweightedLink")}
            </Link>
          </CardBody>
        </Card>
      )}

      {grid && selectedSlot && (
        <Card>
          <CardHeader
            icon={<ExamIcon weight="duotone" className="size-5" />}
            title={`${grid.seriesName} · ${grid.subject}`}
            description={t("exams.gridHint", { max: grid.maxMarks })}
          />
          <CardBody>
            {/* The form is KEYED BY THE PAPER. Its boxes are uncontrolled
                (`defaultValue`), so without the key a click from English to
                Mathematics kept the same <input> elements — and English's
                marks — on screen for every pupil. A new key remounts the form
                with the new paper's own marks. */}
            {grid.pupils.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("exams.emptyRoll")}</p>
            ) : (
              <form key={`${selectedClass.id}:${selectedSlot.id}`} action={saveMarksAction} className="space-y-4">
                <input type="hidden" name="slotId" value={selectedSlot.id} />
                <input type="hidden" name="classId" value={selectedClass.id} />
                <ul className="divide-y divide-border">
                  {grid.pupils.map((pupil) => (
                    <li key={pupil.membershipId} className="flex items-center justify-between gap-3 py-2">
                      <label htmlFor={`marks-${pupil.membershipId}`} className="text-sm font-medium text-fg">
                        {pupil.name}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id={`marks-${pupil.membershipId}`}
                          name={`marks-${pupil.membershipId}`}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={grid.maxMarks}
                          step="0.5"
                          defaultValue={pupil.marks ?? ""}
                          className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-right text-fg"
                        />
                        <span className="text-xs text-fg-muted">/ {grid.maxMarks}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-fg-muted">{t("exams.blankMeansAbsent")}</p>
                <Button type="submit">{t("exams.saveMarks")}</Button>
              </form>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
