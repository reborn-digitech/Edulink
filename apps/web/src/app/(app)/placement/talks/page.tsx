import type { Metadata } from "next";
import Link from "next/link";
import { PresentationChartIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { listTalks } from "@/lib/placement-talks";
import { listDrives } from "@/lib/placement";
import { momentFormatter } from "@/lib/school-zone";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { TableScroll } from "@/components/ui/table-scroll";
import { ActionForm } from "@/components/ui/action-form";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { DateTimeField } from "@/components/ui/date-time-field";
import { CellFrame, LINK, TABLE, TD, TH, cellContext } from "@/components/placement/parts";
import { talkBadge } from "@/components/placement/events";
import { createTalkAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("talks.title"), robots: { index: false, follow: false } };
}

/**
 * The cell's pre-placement talks (R-2, 5 Oct 2026): every talk with its
 * answers and attendance, and for the TPO the form that sets one — with the
 * drive it belongs to (`?driveId=` comes from a drive's page).
 */
export default async function TalksPage({ searchParams }: { searchParams: Promise<{ driveId?: string }> }) {
  const { ctx, t, on, college, canWrite } = await cellContext();
  const { driveId } = await searchParams;
  if (!on) return <CellFrame t={t} on={false} college={college} current="talks" title={t("talks.title")}>{null}</CellFrame>;
  const [{ talks }, moment] = await Promise.all([listTalks(ctx), momentFormatter(ctx.schoolId)]);
  const drives = canWrite ? (await listDrives(ctx)).drives.filter((d) => d.hosted && d.status !== "CLOSED") : [];
  const withTalk = new Set(talks.map((x) => x.driveId).filter(Boolean));
  return (
    <CellFrame t={t} on college={college} current="talks" title={t("talks.title")} description={t("talks.intro")}>
      <Card>
        <CardHeader icon={<PresentationChartIcon weight="duotone" className="size-5" />} title={t("talks.listTitle")} />
        <CardBody className="p-0">
          {talks.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={<PresentationChartIcon weight="duotone" className="size-8" />} title={t("talks.noneTitle")} description={t("talks.noneBody")} />
            </div>
          ) : (
            <TableScroll label={t("talks.listTitle")}>
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th className={TH}>{t("talks.colTalk")}</th>
                    <th className={TH}>{t("talks.colWhen")}</th>
                    <th className={TH}>{t("talks.colDrive")}</th>
                    <th className={TH}>{t("talks.colGoing")}</th>
                    <th className={TH}>{t("talks.colPresent")}</th>
                    <th className={TH}>{t("talks.colStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {talks.map((x) => (
                    <tr key={x.id}>
                      <td className={TD}>
                        <Link className={LINK} href={`/placement/talks/${x.id}`}>
                          {x.title}
                        </Link>
                        <div className="text-xs text-fg-muted">{x.companyName}</div>
                      </td>
                      <td className={TD}>
                        {moment(x.startsAt)}
                        {x.venue ? <div className="text-xs text-fg-muted">{x.venue}</div> : null}
                      </td>
                      <td className={TD}>{x.driveId ? <Link className={LINK} href={`/placement/drives/${x.driveId}`}>{x.driveTitle ?? "—"}</Link> : "—"}</td>
                      <td className={TD}>{x.capacity === null ? x.counts.going : t("talks.goingOfSeats", { going: x.counts.going, seats: x.capacity })}</td>
                      <td className={TD}>{x.heldAt ? x.counts.present : "—"}</td>
                      <td className={TD}>{talkBadge(x, t)}</td>
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
          <CardHeader title={t("talks.newTitle")} description={t("talks.newIntro")} />
          <CardBody>
            <ActionForm action={createTalkAction} className="grid gap-3 sm:grid-cols-2">
              <TextField name="title" label={t("talks.fieldTitle")} required minLength={2} maxLength={160} />
              <TextField name="companyName" label={t("talks.fieldCompany")} required minLength={2} maxLength={120} />
              <SelectField name="driveId" label={t("talks.fieldDrive")} defaultValue={driveId && drives.some((d) => d.id === driveId) ? driveId : ""}>
                <option value="">{t("talks.noDrive")}</option>
                {drives.map((d) => (
                  <option key={d.id} value={d.id} disabled={withTalk.has(d.id)}>
                    {d.title} · {d.companyName}
                  </option>
                ))}
              </SelectField>
              <DateTimeField name="startsAt" label={t("talks.fieldWhen")} required defaultTime="11:00" />
              <TextField name="durationMinutes" label={t("talks.fieldMinutes")} type="number" min={15} max={480} defaultValue="60" />
              <TextField name="venue" label={t("talks.fieldVenue")} maxLength={160} />
              <TextField name="capacity" label={t("talks.fieldSeats")} type="number" min={1} max={5000} hint={t("talks.fieldSeatsHint")} />
              <TextAreaField name="note" label={t("talks.fieldNote")} maxLength={1000} className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <Button type="submit">{t("talks.create")}</Button>
              </div>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
    </CellFrame>
  );
}
