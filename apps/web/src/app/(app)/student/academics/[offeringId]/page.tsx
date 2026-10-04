import type { Metadata } from "next";
import { FileTextIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { LINK } from "@/components/module-flash";
import { ITEM_KEY } from "@/components/academics/parts";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { courseFile } from "@/lib/academics-coursefile";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.courseFileTitle") };
}

/** A course I am registered on: its outcomes, the plan by week and what has been taught, and the resources (never the question papers). */
export default async function StudentCourseFilePage({ params }: { params: Promise<{ offeringId: string }> }) {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff module="ACADEMICS" t={t} college />;
  const file = await courseFile(ctx, (await params).offeringId);
  return (
    <div className="space-y-6">
      <PageHeader title={[file.courseCode, file.courseName].join(" · ")} description={file.facultyName ?? undefined} />
      <Card>
        <CardHeader icon={<FileTextIcon weight="duotone" className="size-5" />} title={t("academics.planTitle")} description={t("academics.weeksTaught", { taught: file.taught, planned: file.plan.length })} />
        <CardBody className="space-y-3">
          {file.outcomes.length ? <ul className="list-inside list-disc text-sm text-fg-muted">{file.outcomes.map((o) => <li key={o.code}>{`${o.code} — ${o.text}`}</li>)}</ul> : null}
          {file.plan.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.planNone")} description={t("academics.planNoneStudent")} />
          ) : (
            <ol className="space-y-1 text-sm">
              {file.plan.map((w) => (
                <li key={w.week}>
                  <span className="tabular-nums text-fg-muted">{t("academics.weekN", { n: w.week })}</span> {w.topic} {w.taughtOn ? <Badge tone="ok">{t("academics.taughtOn", { date: w.taughtOn })}</Badge> : null}
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t("academics.itemsTitle")} />
        <CardBody>
          {file.items.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("academics.itemsNone")}</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {file.items.map((i) => (
                <li key={i.id} className="py-2">
                  <Badge tone="neutral">{t(ITEM_KEY[i.kind]!)}</Badge>{" "}
                  {i.fileId ? <a className={LINK} href={`/api/files/${encodeURIComponent(i.fileId)}`} target="_blank" rel="noreferrer">{i.title}</a> : i.url ? <a className={LINK} href={i.url} target="_blank" rel="noreferrer noopener">{i.title}</a> : i.title}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
