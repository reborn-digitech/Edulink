import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ClipboardTextIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { TextAreaField, TextField } from "@/components/ui/field";
import { DateTimeField } from "@/components/ui/date-time-field";
import { FileField } from "@/components/ui/file-field";
import { ModuleOff } from "@/components/module-off";
import { ModuleFlash } from "@/components/module-flash";
import { requireRole } from "@/lib/tenancy";
import { AccessError } from "@/lib/access-error";
import { isModuleOn } from "@/lib/modules";
import { offeringWork } from "@/lib/college-homework";
import { formatMilli } from "@/lib/validation";
import { relativeTime } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { setWorkAction } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("collegeWork.title") };
}

/** One offering's homework (R-48): set a piece of work, and the list with its hand-ins and marks against the registered students. */
export default async function OfferingWorkPage({ params, searchParams }: { params: Promise<{ offeringId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("FACULTY", "HOD");
  const t = await getT();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const { offeringId } = await params;
  const sp = await searchParams;
  let view;
  try {
    view = await offeringWork(ctx, offeringId);
  } catch (error) {
    // Another college's offering, or one the caller neither teaches nor heads: not found.
    if (error instanceof AccessError) notFound();
    throw error;
  }
  return (
    <div className="space-y-6">
      <Link href="/faculty/work" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" aria-hidden />
        {t("collegeWork.allOfferings")}
      </Link>
      <PageHeader title={[view.courseCode, view.courseName].join(" · ")} description={[view.termName, view.divisionName ?? t("collegeWork.elective"), t("collegeWork.registeredCount", { count: view.registered })].join(" · ")} />
      <ModuleFlash t={t} params={sp} />
      <Card>
        <CardHeader icon={<PlusIcon weight="duotone" className="size-5" />} title={t("collegeWork.setTitle")} description={t("collegeWork.setBody")} />
        <CardBody>
          <form action={setWorkAction} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="offeringId" value={view.offeringId} />
            <TextField label={t("collegeWork.fieldTitle")} name="title" required minLength={2} maxLength={200} className="sm:col-span-2" />
            <TextAreaField label={t("collegeWork.fieldBody")} name="body" rows={4} maxLength={20000} className="sm:col-span-2" />
            <TextField label={t("collegeWork.fieldCategory")} name="category" maxLength={60} hint={t("collegeWork.fieldCategoryHint")} />
            <TextField label={t("collegeWork.fieldPoints")} name="points" type="number" min={0} max={10000} step="0.5" hint={t("collegeWork.fieldPointsHint")} />
            <DateTimeField label={t("collegeWork.fieldDue")} name="dueAt" defaultTime="16:00" />
            <FileField label={t("collegeWork.fieldHandout")} name="files" />
            <label className="flex min-h-11 items-center gap-2 text-sm text-fg sm:col-span-2">
              <input type="checkbox" name="confirmPastDue" value="true" className="size-4 accent-[var(--accent)]" />
              {t("collegeWork.confirmPastDue")}
            </label>
            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <Button type="submit" name="publish" value="true">{t("collegeWork.publishNow")}</Button>
              <Button type="submit" name="publish" value="false" variant="secondary">{t("collegeWork.saveDraft")}</Button>
            </div>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<ClipboardTextIcon weight="duotone" className="size-5" />} title={t("collegeWork.listTitle")} />
        <CardBody>
          {view.items.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("collegeWork.noWork")} description={t("collegeWork.noWorkBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {view.items.map((w) => (
                <li key={w.id}>
                  <Link href={`/faculty/work/${w.id}`} className="flex min-h-11 flex-wrap items-center justify-between gap-3 py-3 hover:bg-surface-muted/60">
                    <span className="min-w-0">
                      <span className="block font-semibold text-fg">{w.title}</span>
                      <span className="block text-xs text-fg-muted">
                        {[w.category, w.pointsMilli ? t("collegeWork.outOf", { points: formatMilli(w.pointsMilli) }) : null, w.dueAt ? t("collegeWork.due", { when: relativeTime(new Date(w.dueAt)) }) : t("collegeWork.noDue")].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      {w.publishedAt ? null : <Badge tone="warn" size="sm">{t("collegeWork.draft")}</Badge>}
                      <Badge tone="neutral" size="sm">{t("collegeWork.handedIn", { done: w.submitted, of: w.registered })}</Badge>
                      <Badge tone={w.graded >= w.registered && w.registered > 0 ? "ok" : "neutral"} size="sm">{t("collegeWork.marked", { done: w.graded, of: w.registered })}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
