import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowSquareInIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SelectField } from "@/components/ui/field";
import { AttachmentList } from "@/components/attachment-list";
import { AssignmentAssistantSwitch } from "@/components/assistant/assignment-switch";
import { ModuleOff } from "@/components/module-off";
import { ModuleFlash } from "@/components/module-flash";
import { requireRole } from "@/lib/tenancy";
import { AccessError } from "@/lib/access-error";
import { isModuleOn } from "@/lib/modules";
import { getGradebook } from "@/lib/grading";
import { offeringWorkGradebook } from "@/lib/college-homework";
import { formatMilli } from "@/lib/validation";
import { relativeTime } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { Gradebook } from "../../../teacher/assignments/[assignmentId]/gradebook";
import { postInternalAction, publishWorkAction, saveFacultyGrades } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("collegeWork.markTitle") };
}

/**
 * One piece of an offering's homework (R-48): publish a draft, mark it on the
 * school's own marking screen (the registered students, what each handed in
 * with its photographs), and post the marks into an internal component.
 */
export default async function FacultyWorkItemPage({ params, searchParams }: { params: Promise<{ assignmentId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("FACULTY", "HOD");
  const t = await getT();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const { assignmentId } = await params;
  const sp = await searchParams;
  let view, book;
  try {
    view = await offeringWorkGradebook(ctx, assignmentId);
    // The school's gradebook rows, for the school's own marking screen.
    book = await getGradebook({ schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role }, assignmentId);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }
  const a = view.assignment;
  return (
    <div className="space-y-6">
      <Link href={`/faculty/work/offerings/${a.offeringId}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" aria-hidden />
        {t("collegeWork.backToOffering")}
      </Link>
      <PageHeader
        title={a.title}
        description={[a.label, a.category, a.pointsMilli ? t("collegeWork.outOf", { points: formatMilli(a.pointsMilli) }) : null, a.dueAt ? t("collegeWork.due", { when: relativeTime(new Date(a.dueAt)) }) : null].filter(Boolean).join(" · ")}
      />
      <ModuleFlash t={t} params={sp} />
      {!a.publishedAt ? (
        <form action={publishWorkAction} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft p-4">
          <input type="hidden" name="assignmentId" value={a.id} />
          <p className="min-w-0 flex-1 text-sm font-medium text-warn">{t("collegeWork.stillDraft")}</p>
          <Button type="submit" size="sm" icon={<PaperPlaneTiltIcon weight="bold" />}>{t("collegeWork.publishNow")}</Button>
        </form>
      ) : null}
      {a.body ? <div className="whitespace-pre-wrap rounded-[var(--radius-md)] border border-border bg-surface p-4 text-sm leading-relaxed text-fg-muted">{a.body}</div> : null}
      {a.attachments.length ? <AttachmentList target="assignment" assignmentId={a.id} recordId={a.id} attachments={book.assignment.attachments} canEdit={false} /> : null}
      {/* The assistant's hint rule for this piece of work (Phase C, 10 Oct 2026): the door names FACULTY and HOD. */}
      <AssignmentAssistantSwitch assignmentId={a.id} />
      <Card>
        <CardHeader icon={<ArrowSquareInIcon weight="duotone" className="size-5" />} title={t("collegeWork.postTitle")} description={view.locked ? t("collegeWork.postLocked") : t("collegeWork.postBody")} />
        {!view.locked && view.components.length > 0 && a.pointsMilli ? (
          <CardBody>
            <form action={postInternalAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="assignmentId" value={a.id} />
              <SelectField label={t("collegeWork.fieldComponent")} name="componentId" required className="min-w-56">
                {view.components.map((k) => <option key={k.id} value={k.id}>{t("collegeWork.componentOption", { name: k.name, max: k.maxMarks })}</option>)}
              </SelectField>
              <Button type="submit" variant="secondary">{t("collegeWork.postButton")}</Button>
            </form>
          </CardBody>
        ) : !view.locked ? (
          <CardBody>
            <p className="text-sm text-fg-muted">{a.pointsMilli ? t("collegeWork.postNoComponents") : t("collegeWork.postNoPoints")}</p>
          </CardBody>
        ) : null}
      </Card>
      <Gradebook assignmentId={a.id} maxMilli={a.pointsMilli} rows={book.rows} stats={book.stats} saveAction={saveFacultyGrades} />
    </div>
  );
}
