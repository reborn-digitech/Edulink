import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole, AccessError } from "@/lib/tenancy";
import { getGradebook } from "@/lib/grading";
import { Gradebook } from "./gradebook";
import { PublishBar } from "./publish-bar";
import { AttachmentList } from "@/components/attachment-list";
import { formatMilli } from "@/lib/validation";
import { relativeTime } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.markWork") };
}

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const locale = await getLocale();
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

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {assignment.title}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {assignment.className}
          {assignment.category ? ` · ${assignment.category}` : ""}
          {assignment.pointsMilli ? ` · out of ${formatMilli(assignment.pointsMilli)}` : ""}
          {assignment.dueAt ? ` · due ${relativeTime(assignment.dueAt, undefined, locale)}` : ""}
        </p>
      </div>

      {!assignment.publishedAt && <PublishBar assignmentId={assignment.id} />}

      {assignment.body && (
        <div className="whitespace-pre-wrap rounded-[--radius-md] border border-border bg-surface p-4 text-sm leading-relaxed text-fg-muted">
          {assignment.body}
        </div>
      )}

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
