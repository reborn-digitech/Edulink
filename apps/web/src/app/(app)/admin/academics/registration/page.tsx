import type { Metadata } from "next";
import { ClockCounterClockwiseIcon, ListPlusIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { OfficeTop } from "@/components/academics/parts";
import { RegistrationForm } from "@/components/academics/registration-form";
import { academicsStructure, listSeats } from "@/lib/academics";
import { listLateRegistrations, registrationView } from "@/lib/academics-registration";
import { getT } from "@/lib/i18n/server";
import { academicsGate, one, type SearchParams } from "../shared";
import { askLateAction, decideLateAction, registerOnBehalfAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.tabRegistration") };
}

const STATUS_TONE = { ASKED: "warn", APPROVED: "ok", REFUSED: "danger" } as const;

/** Registration on a student's behalf, and late registrations: the office asks, the principal decides. */
export default async function RegistrationAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const { ctx, t, on, college, canEdit } = await academicsGate();
  if (!on) return <ModuleOff module="ACADEMICS" t={t} college={college} />;
  const params = await searchParams;
  const student = one(params.student);
  const [s, late, seats] = await Promise.all([academicsStructure(ctx), listLateRegistrations(ctx), listSeats(ctx, {})]);
  const view = canEdit && student ? await registrationView(ctx, { studentMembershipId: student }) : null;
  return (
    <div className="space-y-6">
      <OfficeTop t={t} current="registration" params={params} />
      {canEdit ? (
        <Card>
          <CardHeader icon={<ListPlusIcon weight="duotone" className="size-5" />} title={t("academics.onBehalfTitle")} description={t("academics.onBehalfBody")} />
          <CardBody className="space-y-4">
            <form method="get" className="flex flex-wrap items-end gap-3">
              <SelectField label={t("academics.colStudent")} name="student" defaultValue={student ?? ""}>
                {seats.seats.map((x) => <option key={x.studentMembershipId} value={x.studentMembershipId}>{`${x.name} · ${x.programmeCode}`}</option>)}
              </SelectField>
              <Button type="submit" variant="secondary">{t("academics.show")}</Button>
            </form>
            {view ? <RegistrationForm t={t} view={view} action={registerOnBehalfAction} hidden={{ studentMembershipId: view.studentMembershipId }} /> : null}
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardHeader icon={<ClockCounterClockwiseIcon weight="duotone" className="size-5" />} title={t("academics.lateTitle")} description={t("academics.lateBody")} />
        <CardBody className="space-y-4">
          {late.items.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.lateNone")} description={t("academics.lateNoneBody")} />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {late.items.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    <span className="font-medium text-fg">{l.studentName}</span> <span className="text-fg-muted">· {l.termName} · {t("academics.openUntil", { until: l.openUntil })} · {l.reason}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge tone={STATUS_TONE[l.status]}>{t(l.status === "ASKED" ? "academics.lateASKED" : l.status === "APPROVED" ? "academics.lateAPPROVED" : "academics.lateREFUSED")}</Badge>
                    {late.canDecide && l.status === "ASKED" ? (
                      <>
                        <form action={decideLateAction}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="approve" value="1" />
                          <Button type="submit" size="sm">{t("academics.approve")}</Button>
                        </form>
                        <form action={decideLateAction}>
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="approve" value="0" />
                          <Button type="submit" size="sm" variant="ghost">{t("academics.refuse")}</Button>
                        </form>
                      </>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {canEdit && s.terms.length && seats.seats.length ? (
            <form action={askLateAction} className="grid gap-3 sm:grid-cols-4">
              <SelectField label={t("academics.colStudent")} name="studentMembershipId" required>
                {seats.seats.map((x) => <option key={x.studentMembershipId} value={x.studentMembershipId}>{x.name}</option>)}
              </SelectField>
              <SelectField label={t("academics.fieldTerm")} name="termId" required>
                {s.terms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
              </SelectField>
              <TextField label={t("academics.fieldOpenUntil")} name="openUntil" type="date" required />
              <TextField label={t("academics.fieldReason")} name="reason" required minLength={4} maxLength={400} />
              <div>
                <Button type="submit">{t("academics.askLate")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
