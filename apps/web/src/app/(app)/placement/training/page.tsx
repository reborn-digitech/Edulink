import type { Metadata } from "next";
import Link from "next/link";
import { ChalkboardTeacherIcon } from "@phosphor-icons/react/ssr";
import { SOFT_SKILLS, TRAINING_DEFAULT_MIN_PERCENT } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { listTrainings } from "@/lib/soft-skills";
import { momentFormatter } from "@/lib/school-zone";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { TableScroll } from "@/components/ui/table-scroll";
import { ActionForm } from "@/components/ui/action-form";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { CellFrame, LINK, TABLE, TD, TH, cellContext } from "@/components/placement/parts";
import { SKILL_KEY, trainingBadge } from "@/components/placement/events";
import { createTrainingAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("softSkills.title"), robots: { index: false, follow: false } };
}

/**
 * The cell's soft-skills trainings (R-2, 5 Oct 2026): each with its sessions,
 * the students on it and those who completed it, the count of students who
 * completed any, and for the TPO the form that makes one.
 */
export default async function TrainingPage() {
  const { ctx, t, on, college, canWrite } = await cellContext();
  if (!on) return <CellFrame t={t} on={false} college={college} current="training" title={t("softSkills.title")}>{null}</CellFrame>;
  const [list, moment] = await Promise.all([listTrainings(ctx), momentFormatter(ctx.schoolId)]);
  const open = list.trainings.filter((x) => x.status === "OPEN").length;
  return (
    <CellFrame t={t} on college={college} current="training" title={t("softSkills.title")} description={t("softSkills.intro")}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label={t("softSkills.tileTrainings")} value={list.trainings.length} hint={t("softSkills.tileOpen", { count: open })} />
        <StatTile label={t("softSkills.tileCompleted")} value={list.studentsCompleted} tone="ok" hint={t("softSkills.tileCompletedHint")} />
      </div>
      <Card>
        <CardHeader icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />} title={t("softSkills.listTitle")} />
        <CardBody className="p-0">
          {list.trainings.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={<ChalkboardTeacherIcon weight="duotone" className="size-8" />} title={t("softSkills.noneTitle")} description={t("softSkills.noneBody")} />
            </div>
          ) : (
            <TableScroll label={t("softSkills.listTitle")}>
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th className={TH}>{t("softSkills.colTraining")}</th>
                    <th className={TH}>{t("softSkills.colSkill")}</th>
                    <th className={TH}>{t("softSkills.colSessions")}</th>
                    <th className={TH}>{t("softSkills.colEnrolled")}</th>
                    <th className={TH}>{t("softSkills.colCompleted")}</th>
                    <th className={TH}>{t("softSkills.colNext")}</th>
                    <th className={TH}>{t("softSkills.colStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {list.trainings.map((x) => (
                    <tr key={x.id}>
                      <td className={TD}>
                        <Link className={LINK} href={`/placement/training/${x.id}`}>
                          {x.title}
                        </Link>
                        {x.trainer ? <div className="text-xs text-fg-muted">{x.trainer}</div> : null}
                      </td>
                      <td className={TD}>{t(SKILL_KEY[x.skill])}</td>
                      <td className={TD}>{t("softSkills.heldOf", { held: x.held, sessions: x.sessions })}</td>
                      <td className={TD}>{x.capacity === null ? x.enrolled : `${x.enrolled} / ${x.capacity}`}</td>
                      <td className={TD}>{x.completed}</td>
                      <td className={TD}>{x.nextSessionAt ? moment(x.nextSessionAt) : "—"}</td>
                      <td className={TD}>{trainingBadge(x, t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>
      {canWrite ? (
        <Card>
          <CardHeader title={t("softSkills.newTitle")} description={t("softSkills.newIntro")} />
          <CardBody>
            <ActionForm action={createTrainingAction} className="grid gap-3 sm:grid-cols-2">
              <TextField name="title" label={t("softSkills.fieldTitle")} required minLength={2} maxLength={160} />
              <SelectField name="skill" label={t("softSkills.fieldSkill")} required defaultValue="COMMUNICATION">
                {SOFT_SKILLS.map((s) => (
                  <option key={s} value={s}>
                    {t(SKILL_KEY[s])}
                  </option>
                ))}
              </SelectField>
              <TextField name="trainer" label={t("softSkills.fieldTrainer")} maxLength={120} />
              <TextField name="capacity" label={t("softSkills.fieldSeats")} type="number" min={1} max={5000} hint={t("softSkills.fieldSeatsHint")} />
              <TextField name="minAttendancePercent" label={t("softSkills.fieldMinPercent")} type="number" min={1} max={100} defaultValue={String(TRAINING_DEFAULT_MIN_PERCENT)} hint={t("softSkills.fieldMinPercentHint")} />
              <TextAreaField name="description" label={t("softSkills.fieldDescription")} maxLength={2000} className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <Button type="submit">{t("softSkills.create")}</Button>
              </div>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
    </CellFrame>
  );
}
