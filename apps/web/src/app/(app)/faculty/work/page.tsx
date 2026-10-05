import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardTextIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { collegeWorkHome } from "@/lib/college-homework";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("collegeWork.title") };
}

/**
 * Homework at a college (R-48, the risks batch of 5 October 2026): the
 * offerings the teacher teaches — and an HOD's department's — each with its
 * work and the hand-ins waiting for a mark. Setting and marking are one click
 * further, on the offering's page and the work's page.
 */
export default async function FacultyWorkPage() {
  const ctx = await requireRole("FACULTY", "HOD");
  const t = await getT();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const home = await collegeWorkHome(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeWork.title")} description={t("collegeWork.intro")} />
      <Card>
        <CardHeader icon={<ClipboardTextIcon weight="duotone" className="size-5" />} title={t("collegeWork.offeringsTitle")} />
        <CardBody>
          {home.offerings.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("collegeWork.noOfferings")} description={t("collegeWork.noOfferingsBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {home.offerings.map((o) => (
                <li key={o.offeringId}>
                  <Link href={`/faculty/work/offerings/${o.offeringId}`} className="flex min-h-11 flex-wrap items-center justify-between gap-3 py-3 hover:bg-surface-muted/60">
                    <span className="min-w-0">
                      <span className="block font-semibold text-fg">{`${o.courseCode} · ${o.courseName}`}</span>
                      <span className="block text-xs text-fg-muted">
                        {[o.termName, o.divisionName ?? t("collegeWork.elective"), t("collegeWork.registeredCount", { count: o.registered })].join(" · ")}
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      {!o.mine ? <Badge tone="neutral" size="sm">{t("collegeWork.department")}</Badge> : null}
                      <Badge tone="neutral" size="sm">{t("collegeWork.workCount", { count: o.work })}</Badge>
                      {o.toMark > 0 ? <Badge tone="warn" size="sm">{t("collegeWork.toMarkCount", { count: o.toMark })}</Badge> : null}
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
