import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { notFound } from "next/navigation";
import { requireRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { assessmentsFor, assertMayWriteCards, cardsForClass } from "@/lib/report-cards";
import { Builder } from "./builder";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.reportCards") };
}

export default async function ReportCardsPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ title?: string }>;
}) {
  const t = await getT();
  // PRINCIPAL is here because `cohort.ts` lets a school make one the LEAD class
  // teacher — in a small school the head takes Class 5 on Tuesdays, and that was
  // a deliberate decision. Without this line that head was redirected at the
  // door and could not write the cards for their own class: two decisions that
  // contradicted each other. `assertMayWriteCards` below is still what decides,
  // and it refuses a principal who is NOT this class's LEAD.
  const ctx = await requireRole("TEACHER", "ADMIN", "PRINCIPAL");
  const { classId } = await params;
  const { title } = await searchParams;

  // Throws for a co-teacher, a principal, and anybody outside this school. In a
  // PAGE that has to become a 404, not an unhandled throw — the same catch the
  // class page does around `assertClassAccess`, and the same answer: a screen
  // somebody may not use should not confirm that it exists. The sweep found
  // this as a 500.
  let klass;
  try {
    klass = await assertMayWriteCards(ctx, classId);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }

  const [assessments, all] = await Promise.all([
    assessmentsFor(ctx, classId),
    cardsForClass(ctx, classId),
  ]);

  const titles = [...new Set(all.map((c) => c.title))];
  const selected = title && titles.includes(title) ? title : (titles[0] ?? null);
  const cards = selected ? all.filter((c) => c.title === selected) : [];

  const heading = [klass.name, klass.section ? `Section ${klass.section}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href={`/teacher/classes/${classId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {klass.name}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("teacher.reportCards")}</h1>
        <p className="mt-1 text-sm text-fg-muted">{heading}</p>
      </div>

      {titles.length > 1 && (
        <nav aria-label={t("teacher.reports")} className="flex flex-wrap gap-1.5">
          {titles.map((existing) => (
            <Link
              key={existing}
              href={`/teacher/classes/${classId}/report-cards?title=${encodeURIComponent(existing)}`}
              className={
                existing === selected
                  ? "rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-fg"
                  : "rounded-full bg-surface-muted px-3.5 py-1.5 text-sm font-medium text-fg-muted hover:text-fg"
              }
            >
              {existing}
            </Link>
          ))}
        </nav>
      )}

      <Builder
        classId={classId}
        assessments={assessments}
        existingTitles={titles}
        selectedTitle={selected}
        cards={cards.map((card) => ({
          id: card.id,
          title: card.title,
          status: card.status,
          remark: card.remark,
          overallPercentMilli: card.overallPercentMilli,
          attendancePresent: card.attendancePresent,
          attendanceTotal: card.attendanceTotal,
          studentName: card.student.user.preferredName ?? card.student.user.name,
        }))}
      />
    </div>
  );
}
