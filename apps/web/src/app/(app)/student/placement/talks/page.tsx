import type { Metadata } from "next";
import { PresentationChartIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { studentTalks } from "@/lib/placement-talks";
import { momentFormatter } from "@/lib/school-zone";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { ActionForm } from "@/components/ui/action-form";
import { ModuleOff } from "@/components/module-off";
import { talkBadge } from "@/components/placement/events";
import { answerTalkAction } from "@/app/(app)/placement/talks/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("talks.studentTitle"), robots: { index: false, follow: false } };
}

/** A student's pre-placement talks (R-2, 5 Oct 2026): going or not while one is ahead, and whether they were marked present. */
export default async function StudentTalksPage() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const back = { href: "/student/placement", label: t("placement.studentTitle") };
  const [on, kind] = await Promise.all([isModuleOn(ctx.schoolId, "PLACEMENT"), institutionKindOf(ctx.schoolId)]);
  if (!on) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("talks.studentTitle")} back={back} />
        <ModuleOff module="PLACEMENT" t={t} college={isCollegeKind(kind)} />
      </div>
    );
  }
  const [{ talks }, moment] = await Promise.all([studentTalks(ctx), momentFormatter(ctx.schoolId)]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("talks.studentTitle")} description={t("talks.studentIntro")} back={back} />
      {talks.length === 0 ? (
        <EmptyState icon={<PresentationChartIcon weight="duotone" className="size-8" />} title={t("talks.studentNoneTitle")} description={t("talks.studentNoneBody")} />
      ) : (
        <ul className="space-y-3">
          {talks.map((x) => (
            <li key={x.id}>
              <Card>
                <CardBody className="space-y-2 pt-5 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{x.title}</h2>
                    {talkBadge(x, t)}
                  </div>
                  <p className="text-fg-muted">{[x.companyName, moment(x.startsAt), x.venue].filter(Boolean).join(" · ")}</p>
                  {x.note ? <p>{x.note}</p> : null}
                  <div className="flex flex-wrap items-center gap-2">
                    {x.mine?.answer ? <Badge tone={x.mine.answer === "GOING" ? "accent" : "neutral"}>{x.mine.answer === "GOING" ? t("talks.youGoing") : t("talks.youNotGoing")}</Badge> : null}
                    {x.mine?.attendance ? <Badge tone={x.mine.attendance === "PRESENT" ? "ok" : "neutral"}>{x.mine.attendance === "PRESENT" ? t("talks.youPresent") : t("talks.youAbsent")}</Badge> : null}
                    {x.capacity !== null && !x.started ? <span className="text-fg-muted">{x.capacity - x.counts.going === 1 ? t("talks.seatsLeftOne", { count: 1 }) : t("talks.seatsLeft", { count: Math.max(0, x.capacity - x.counts.going) })}</span> : null}
                  </div>
                  {x.canAnswer || (x.status === "SCHEDULED" && !x.started && x.mine?.answer === "GOING") ? (
                    <div className="flex flex-wrap gap-2">
                      {x.mine?.answer !== "GOING" && x.canAnswer ? (
                        <ActionForm action={answerTalkAction}>
                          <input type="hidden" name="talkId" value={x.id} />
                          <input type="hidden" name="answer" value="GOING" />
                          <Button type="submit" size="sm">{t("talks.imGoing")}</Button>
                        </ActionForm>
                      ) : null}
                      {x.mine?.answer !== "NOT_GOING" ? (
                        <ActionForm action={answerTalkAction}>
                          <input type="hidden" name="talkId" value={x.id} />
                          <input type="hidden" name="answer" value="NOT_GOING" />
                          <Button type="submit" size="sm" variant="secondary">{t("talks.imNotGoing")}</Button>
                        </ActionForm>
                      ) : null}
                    </div>
                  ) : !x.started && x.status === "SCHEDULED" && !x.canAnswer ? (
                    <p className="text-fg-muted">{t("talks.full")}</p>
                  ) : null}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
