import type { Metadata } from "next";
import { CalendarIcon, DoorIcon, UsersFourIcon } from "@phosphor-icons/react/ssr";
import { ROOM_KINDS } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { ActionForm } from "@/components/ui/action-form";
import { ModuleOff } from "@/components/module-off";
import { OfficeTop, roomKindLabel } from "@/components/academics/parts";
import { academicsStructure } from "@/lib/academics";
import { getT } from "@/lib/i18n/server";
import { academicsGate, type SearchParams } from "../shared";
import { createDivisionAction, saveRoomAction, saveTermAction } from "../actions";
import { isoToDisplayDate, todayKey } from "@/lib/dates";
import { registrationWindow } from "@/lib/academics-rules";
import { db } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.tabTerms") };
}

/** Terms with their registration windows, rooms and labs with their capacity, and the divisions of each programme. */
export default async function TermsPage({ searchParams }: { searchParams: SearchParams }) {
  const { ctx, t, on, college, canEdit, streams } = await academicsGate();
  if (!on) return <ModuleOff page module="ACADEMICS" t={t} college={college} />;
  const params = await searchParams;
  const [s, school] = await Promise.all([academicsStructure(ctx), db.school.findUnique({ where: { id: ctx.schoolId! }, select: { timezone: true } })]);
  const today = todayKey(school?.timezone ?? "Asia/Kolkata");
  return (
    <div className="space-y-6">
      <OfficeTop t={t} current="terms" params={params} />
      <Card>
        <CardHeader icon={<CalendarIcon weight="duotone" className="size-5" />} title={t("academics.termsTitle")} description={t("academics.termsBody")} />
        <CardBody className="space-y-4">
          {s.terms.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.termsNone")} description={t("academics.termsNoneBody")} />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {s.terms.map((term) => (
                <li key={term.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="font-semibold text-fg">{term.name}</span>
                  <span className="text-fg-muted">{t("academics.termLine", { year: term.academicYear, from: isoToDisplayDate(term.startsOn), to: isoToDisplayDate(term.endsOn) })}</span>
                  <span className="text-fg-muted">{t("academics.windowLine", { from: isoToDisplayDate(term.registrationOpensOn), to: isoToDisplayDate(term.registrationClosesOn) })}</span>
                  {(() => {
                    // A window still to come is not a closed one (A3-journeys-28).
                    const state = registrationWindow(term.registrationOpensOn, term.registrationClosesOn, today);
                    if (state === "UPCOMING") return <Badge tone="accent">{t("academics.registrationOpensOn", { date: isoToDisplayDate(term.registrationOpensOn) })}</Badge>;
                    if (state === "OPEN") return <Badge tone="ok">{t("academics.registrationOpenUntil", { date: isoToDisplayDate(term.registrationClosesOn) })}</Badge>;
                    return <Badge tone="neutral">{t("academics.registrationClosed")}</Badge>;
                  })()}
                </li>
              ))}
            </ul>
          )}
          {canEdit ? (
            <ActionForm action={saveTermAction} className="grid gap-3 sm:grid-cols-3">
              <TextField label={t("academics.fieldName")} name="name" required maxLength={80} />
              {/* 2026-27 or 2026–27. Browsers compile `pattern` with the v flag, where a bare "-" in a class is an error that switched the check off (A3-journeys-28); escaped, it is a hyphen. */}
              <TextField label={t("academics.fieldAcademicYear")} name="academicYear" required placeholder="2026–27" pattern="\d{4}[–\-]\d{2}" />
              <DateField label={t("academics.fieldStartsOn")} name="startsOn" required />
              <DateField label={t("academics.fieldEndsOn")} name="endsOn" required />
              <DateField label={t("academics.fieldOpensOn")} name="registrationOpensOn" required />
              <DateField label={t("academics.fieldClosesOn")} name="registrationClosesOn" required />
              <div>
                <Button type="submit">{t("academics.addTerm")}</Button>
              </div>
            </ActionForm>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<DoorIcon weight="duotone" className="size-5" />} title={t("academics.roomsTitle")} description={t("academics.roomsBody")} />
        <CardBody className="space-y-4">
          {s.rooms.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.roomsNone")} description={t("academics.roomsNoneBody")} />
          ) : (
            <ul className="flex flex-wrap gap-2 text-sm">
              {s.rooms.map((r) => (
                <li key={r.id} className="rounded-[var(--radius-md)] border border-border px-3 py-1.5">
                  <span className="font-medium text-fg">{r.name}</span> <span className="text-fg-muted">· {roomKindLabel(r.kind, t, streams)} · {t("academics.seats", { n: r.capacity })}</span>
                </li>
              ))}
            </ul>
          )}
          {canEdit ? (
            <form action={saveRoomAction} className="grid gap-3 sm:grid-cols-4">
              <TextField label={t("academics.fieldName")} name="name" required maxLength={60} />
              <TextField label={t("academics.fieldCapacity")} name="capacity" type="number" min={1} max={2000} defaultValue={60} />
              <SelectField label={t("academics.fieldRoomKind")} name="kind" defaultValue="CLASSROOM">
                {ROOM_KINDS.map((k) => <option key={k} value={k}>{roomKindLabel(k, t, streams)}</option>)}
              </SelectField>
              <div className="self-end">
                <Button type="submit">{t("academics.addRoom")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<UsersFourIcon weight="duotone" className="size-5" />} title={t("academics.divisionsTitle")} description={t("academics.divisionsBody")} />
        <CardBody className="space-y-4">
          {s.divisions.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.divisionsNone")} description={t("academics.divisionsNoneBody")} />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {s.divisions.map((d) => (
                <li key={d.id} className="py-2">
                  <span className="font-medium text-fg">{d.name}</span> <span className="text-fg-muted">· {s.programmes.find((p) => p.id === d.programmeId)?.code} · {t("academics.yearOfStudy", { year: d.yearOfStudy })} · {d.academicYear} · {t("academics.studentsCount", { n: d.students })}</span>
                </li>
              ))}
            </ul>
          )}
          {canEdit && s.programmes.length ? (
            <ActionForm action={createDivisionAction} className="grid gap-3 sm:grid-cols-4">
              <SelectField label={t("academics.fieldProgramme")} name="programmeId" required>
                {s.programmes.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
              </SelectField>
              <TextField label={t("academics.fieldYearOfStudy")} name="yearOfStudy" type="number" min={1} max={6} defaultValue={1} />
              <TextField label={t("academics.fieldName")} name="name" required maxLength={60} />
              <TextField label={t("academics.fieldAcademicYear")} name="academicYear" required placeholder="2026–27" pattern="\d{4}[–\-]\d{2}" />
              <div>
                <Button type="submit">{t("academics.addDivision")}</Button>
              </div>
            </ActionForm>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
