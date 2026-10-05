import type { Metadata } from "next";
import Link from "next/link";
import { COMMITTEE_KINDS } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { listCommittees } from "@/lib/iqac";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { IqacFlash, day, keyed } from "@/components/iqac/parts";
import { addMeetingAction, saveCommitteeAction } from "../../iqac/actions";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.committeesTitle"), robots: { index: false, follow: false } };
}

/**
 * The committees and their minutes (module IQAC, 4 Oct 2026): the grievance
 * committee, the anti-ragging committee, the ICC, the CDC, the governing
 * body, the IQAC and the rest, with members and every meeting's minutes. The
 * office keeps them; the principal reads; the IQAC cites them.
 */
export default async function CommitteesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const tt = keyed(t);
  const { ok, error } = await searchParams;
  const kind = await institutionKindOf(ctx.schoolId);
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("iqac.committeesTitle")} />
        <ModuleOff module="IQAC" t={t} college={isCollegeKind(kind)} />
      </div>
    );
  }
  const c = await listCommittees(ctx);
  const back = "/admin/committees";
  return (
    <div className="space-y-5">
      <PageHeader
        title={t("iqac.committeesTitle")}
        description={t("iqac.committeesIntro")}
        actions={
          <Button asChild variant="secondary">
            <Link href="/iqac/grievances">{t("iqac.navGrievances")}</Link>
          </Button>
        }
      />
      <IqacFlash ok={ok} error={error} />
      {c.canEdit ? (
        <Card>
          <CardHeader title={t("iqac.newCommitteeTitle")} />
          <CardBody>
            <ActionForm action={saveCommitteeAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="back" value={back} />
              <SelectField name="kind" label={t("iqac.committeeKindField")} defaultValue="GRIEVANCE">
                {COMMITTEE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {tt("iqac.committeeKind." + k)}
                  </option>
                ))}
              </SelectField>
              <TextField name="name" required minLength={3} maxLength={200} label={t("iqac.committeeName")} />
              <TextAreaField name="members" required label={t("iqac.membersField")} className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <Button type="submit">{t("iqac.saveCommittee")}</Button>
              </div>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
      {c.items.length === 0 ? (
        <EmptyState title={t("iqac.noCommittees")} />
      ) : (
        c.items.map((x) => (
          <Card key={x.id}>
            <CardHeader title={x.name} description={[tt("iqac.committeeKind." + x.kind), " · ", t("iqac.membersCount", { n: x.members.length })].join("")} />
            <CardBody className="space-y-4 text-sm">
              <ul className="list-disc pl-5">
                {x.members.map((m, i) => (
                  <li key={i}>{m.role ? `${m.name} (${m.role})` : m.name}</li>
                ))}
              </ul>
              <div>
                <p className="font-medium">{t("iqac.meetingsTitle")}</p>
                {x.meetings.length === 0 ? (
                  <p className="text-fg-muted">{t("iqac.noMeetings")}</p>
                ) : (
                  <ul className="space-y-1">
                    {x.meetings.map((m) => (
                      <li key={m.id}>
                        {day(m.at, locale)}
                        {m.actionTaken ? ` · ${m.actionTaken}` : ""}
                        {m.minutesFileId ? (
                          <>
                            {" · "}
                            <a className="text-accent-strong underline" href={`/api/files/${m.minutesFileId}`} target="_blank" rel="noreferrer">
                              {t("iqac.minutesLink")}
                            </a>
                          </>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {c.canEdit ? (
                <ActionForm action={addMeetingAction} className="grid gap-3 border-t border-border pt-3 sm:grid-cols-3">
                  <input type="hidden" name="back" value={back} />
                  <input type="hidden" name="committeeId" value={x.id} />
                  <DateField name="at" required label={t("iqac.dateField")} />
                  <TextField name="file" type="file" label={t("iqac.minutesFile")} accept="application/pdf,image/*" />
                  <TextAreaField name="actionTaken" label={t("iqac.actionTakenField")} className="sm:col-span-3" />
                  <div className="sm:col-span-3">
                    <Button type="submit" size="sm">
                      {t("iqac.addMeeting")}
                    </Button>
                  </div>
                </ActionForm>
              ) : null}
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
