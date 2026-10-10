import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, DownloadSimpleIcon } from "@phosphor-icons/react/ssr";
import { requireRole, AccessError } from "@/lib/tenancy";
import { getGradebook } from "@/lib/grading";
import { Gradebook } from "./gradebook";
import { PublishBar } from "./publish-bar";
import { AttachmentList } from "@/components/attachment-list";
import { formatMilli } from "@/lib/validation";
import { relativeTime } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { AssignmentAssistantSwitch } from "@/components/assistant/assignment-switch";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.markWork") };
}

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const t = await getT();
  const ctx = await requireRole("TEACHER", "ADMIN");
  const { assignmentId } = await params;

  let book;
  try {
    book = await getGradebook(ctx, assignmentId);
  } catch (error) {
    // Another school's assignment, or another teacher's class, is a 404.
    if (error instanceof AccessError) notFound();
    throw error;
  }

  const { assignment, rows, stats } = book;

  return (
    <div className="space-y-5">
      <Link
        href="/teacher/assignments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("teacher.allAssignments")}
      </Link>

      <PageHeader title={assignment.title} description={<>{assignment.className}
          {assignment.category ? ` · ${assignment.category}` : ""}
          {assignment.pointsMilli ? ` · ${t("teacher.outOfPoints", { points: formatMilli(assignment.pointsMilli) })}` : ""}
          {assignment.dueAt ? ` · ${t("teacher.dueWhenLower", { when: relativeTime(assignment.dueAt) })}` : ""}</>} />

      {!assignment.publishedAt && <PublishBar assignmentId={assignment.id} />}

      {/* The class's whole gradebook — every assignment as a column, the marks
          and whether the work came in — as a file from the API's door, the
          same CSV/Excel split as the office's attendance exports. */}
      <form action={`/api/v1/teaching/classes/${assignment.classId}/gradebook/export`} method="get" className="flex flex-wrap items-center gap-3" data-testid="gradebook-export">
        <span className="text-xs text-fg-muted">{t("exports.gradebookHint")}</span>
        <Button type="submit" size="sm" variant="secondary" icon={<DownloadSimpleIcon weight="bold" />}>
          {t("exports.gradebookCsv")}
        </Button>
        <Button type="submit" name="format" value="xlsx" size="sm" variant="secondary" icon={<DownloadSimpleIcon weight="bold" />}>
          {t("exports.gradebookXlsx")}
        </Button>
      </form>

      {assignment.body && (
        <div className="whitespace-pre-wrap rounded-[var(--radius-md)] border border-border bg-surface p-4 text-sm leading-relaxed text-fg-muted">
          {assignment.body}
        </div>
      )}

      {/* The assistant's hint rule for this assignment (Phase C, 10 Oct 2026): the class's teacher's switch; the door
          names TEACHER, FACULTY and HOD, so the office reading this page is not offered it. */}
      {ctx.role === "TEACHER" && <AssignmentAssistantSwitch assignmentId={assignment.id} />}

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          {t("teacher.filesForClass")}
        </h2>
        <AttachmentList
          className="mt-2"
          target="assignment"
          assignmentId={assignment.id}
          recordId={assignment.id}
          attachments={assignment.attachments}
          canEdit
        />
      </div>

      <Gradebook
        assignmentId={assignment.id}
        maxMilli={assignment.pointsMilli}
        rows={rows}
        stats={stats}
      />
    </div>
  );
}
