import type { Metadata } from "next";
import { ChalkboardTeacherIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { studentTrainings } from "@/lib/soft-skills";
import { momentFormatter } from "@/lib/school-zone";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { ActionForm } from "@/components/ui/action-form";
import { ModuleOff } from "@/components/module-off";
import { SKILL_KEY, trainingBadge } from "@/components/placement/events";
import { enrolSelfAction } from "@/app/(app)/placement/training/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("softSkills.studentTitle"), robots: { index: false, follow: false } };
}

/** A student's soft-skills training (R-2, 5 Oct 2026): the open trainings, enrolling and withdrawing, their attendance and what they completed. */
export default async function StudentTrainingPage() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const back = { href: "/student/placement", label: t("placement.studentTitle") };
  const [on, kind] = await Promise.all([isModuleOn(ctx.schoolId, "PLACEMENT"), institutionKindOf(ctx.schoolId)]);
  if (!on) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("softSkills.studentTitle")} back={back} />
        <ModuleOff module="PLACEMENT" t={t} college={isCollegeKind(kind)} />
      </div>
    );
  }
  const [mine, moment] = await Promise.all([studentTrainings(ctx), momentFormatter(ctx.schoolId)]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("softSkills.studentTitle")} description={t("softSkills.studentIntro")} back={back} />
      {mine.completed.length ? (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <SealCheckIcon weight="fill" className="size-5 text-ok" aria-hidden />
          {t("softSkills.youCompleted", { count: mine.completed.length })}
        </p>
      ) : null}
      {mine.trainings.length === 0 ? (
        <EmptyState icon={<ChalkboardTeacherIcon weight="duotone" className="size-8" />} title={t("softSkills.studentNoneTitle")} description={t("softSkills.studentNoneBody")} />
      ) : (
        <ul className="space-y-3">
          {mine.trainings.map((x) => (
            <li key={x.id}>
              <Card>
                <CardBody className="space-y-2 pt-5 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{x.title}</h2>
                    {trainingBadge(x, t)}
                    {x.mine?.completed ? <Badge tone="ok">{t("softSkills.completedYes")}</Badge> : null}
                  </div>
                  <p className="text-fg-muted">{[t(SKILL_KEY[x.skill]), x.trainer, x.nextSessionAt ? t("softSkills.nextAt", { when: moment(x.nextSessionAt) }) : null].filter(Boolean).join(" · ")}</p>
                  {x.mine?.enrolled ? <p>{t("softSkills.yourAttendance", { attended: x.mine.attended, sessions: x.sessions, percent: x.minAttendancePercent })}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    {x.canEnrol ? (
                      <ActionForm action={enrolSelfAction}>
                        <input type="hidden" name="trainingId" value={x.id} />
                        <input type="hidden" name="enrol" value="true" />
                        <Button type="submit" size="sm">{t("softSkills.enrol")}</Button>
                      </ActionForm>
                    ) : null}
                    {x.mine?.enrolled ? (
                      <ActionForm action={enrolSelfAction}>
                        <input type="hidden" name="trainingId" value={x.id} />
                        <input type="hidden" name="enrol" value="false" />
                        <Button type="submit" size="sm" variant="secondary">{t("softSkills.withdraw")}</Button>
                      </ActionForm>
                    ) : null}
                    {!x.canEnrol && !x.mine?.enrolled && x.status === "OPEN" ? <span className="text-fg-muted">{t("softSkills.full")}</span> : null}
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
