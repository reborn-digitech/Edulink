import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { hostelIncidents, listBoarders } from "@/lib/hostel";
import { listExpulsions } from "@/lib/head-approvals";
import { todayKey } from "@/lib/dates";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { WardenFrame, wardenContext, when } from "@/components/hostel/parts";
import { decideExpulsionAction, proposeExpulsionAction, withdrawExpulsionAction } from "./actions";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeDesks.expulsionsTitle"), robots: { index: false, follow: false } };
}

const STATUS: Record<string, { key: TranslationKey; tone: "ok" | "warn" | "danger" | "neutral" }> = {
  ASKED: { key: "collegeDesks.statusASKED", tone: "warn" },
  APPROVED: { key: "collegeDesks.statusAPPROVED", tone: "danger" },
  REFUSED: { key: "collegeDesks.statusREFUSED", tone: "ok" },
  WITHDRAWN: { key: "collegeDesks.statusWITHDRAWN", tone: "neutral" },
};

/**
 * HOSTEL EXPULSIONS (5 Oct 2026, head-approvals.ts): the warden or the office
 * proposes ending a boarder's place with the reason, the incident it rests on
 * and the day; only the principal decides, here. An approval ends the place
 * on that day and tells the student and the family; a proposal still waiting
 * may be withdrawn.
 */
export default async function HostelExpulsionsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, locale, on, timeZone } = await wardenContext();
  const { ok, error } = await searchParams;
  if (!on) return <WardenFrame t={t} on={false} current="expulsions" title={t("collegeDesks.expulsionsTitle")}>{null}</WardenFrame>;
  const list = await listExpulsions(ctx);
  const [boarders, incidents] = list.canPropose ? await Promise.all([listBoarders(ctx), hostelIncidents(ctx)]) : [{ items: [] }, { items: [] }];
  return (
    <WardenFrame t={t} on current="expulsions" title={t("collegeDesks.expulsionsTitle")} description={t("collegeDesks.expulsionsIntro")} ok={ok} error={error}>
      {list.canPropose && boarders.items.length > 0 ? (
        <Card>
          <CardHeader title={t("collegeDesks.expulsionPropose")} />
          <CardBody>
            <ActionForm action={proposeExpulsionAction} className="grid gap-3 sm:grid-cols-2">
              <SelectField name="allotmentId" required label={t("collegeDesks.expulsionBoarder")}>
                {boarders.items.map((b) => (
                  <option key={b.allotmentId} value={b.allotmentId}>
                    {b.name} · {b.hostelName} {b.roomNumber}
                  </option>
                ))}
              </SelectField>
              <SelectField name="incidentId" label={t("collegeDesks.expulsionIncident")} defaultValue="">
                <option value="">{t("collegeDesks.expulsionNoIncident")}</option>
                {incidents.items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.studentName} · {i.title}
                  </option>
                ))}
              </SelectField>
              <DateField name="effectiveOn" required label={t("collegeDesks.expulsionEffective")} defaultValue={todayKey(timeZone)} />
              <TextAreaField name="reason" required minLength={10} maxLength={1000} label={t("collegeDesks.expulsionReason")} className="sm:col-span-2" />
              <Button type="submit" className="sm:col-span-2 sm:justify-self-start">{t("collegeDesks.expulsionSend")}</Button>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardBody className="p-0">
          {list.items.length === 0 ? (
            <EmptyState title={t("collegeDesks.expulsionsNone")} description={t("collegeDesks.expulsionsNoneBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {list.items.map((x) => (
                <li key={x.id} className="space-y-2 px-5 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-fg">{x.name}</span>
                    <Badge tone={STATUS[x.status]!.tone}>{t(STATUS[x.status]!.key)}</Badge>
                  </div>
                  <p className="text-fg-muted">{t("collegeDesks.expulsionLine", { hostel: x.hostelName, room: x.roomNumber, date: x.effectiveOn, name: x.proposedByName })} · {when(x.proposedAt, timeZone, locale)}</p>
                  <p className="text-fg">{x.reason}</p>
                  {x.decisionNote ? <p className="text-fg-muted">{x.decisionNote}</p> : null}
                  {x.status === "ASKED" && list.canDecide ? (
                    <ActionForm action={decideExpulsionAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="expulsionId" value={x.id} />
                      <TextField name="note" maxLength={600} label={t("collegeDesks.decisionNote")} />
                      <Button type="submit" size="sm" variant="danger" name="decision" value="APPROVE">{t("collegeDesks.approve")}</Button>
                      <Button type="submit" size="sm" variant="secondary" name="decision" value="REFUSE">{t("collegeDesks.refuse")}</Button>
                    </ActionForm>
                  ) : null}
                  {x.status === "ASKED" && list.canPropose ? (
                    <ActionForm action={withdrawExpulsionAction}>
                      <input type="hidden" name="expulsionId" value={x.id} />
                      <Button type="submit" size="sm" variant="ghost">{t("collegeDesks.expulsionWithdraw")}</Button>
                    </ActionForm>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </WardenFrame>
  );
}
