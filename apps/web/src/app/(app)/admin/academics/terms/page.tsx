import type { Metadata } from "next";
import { CalendarIcon, DoorIcon, UsersFourIcon } from "@phosphor-icons/react/ssr";
import { ROOM_KINDS } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { OfficeTop, ROOM_KEY } from "@/components/academics/parts";
import { academicsStructure } from "@/lib/academics";
import { getT } from "@/lib/i18n/server";
import { academicsGate, type SearchParams } from "../shared";
import { createDivisionAction, saveRoomAction, saveTermAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.tabTerms") };
}

/** Terms with their registration windows, rooms and labs with their capacity, and the divisions of each programme. */
export default async function TermsPage({ searchParams }: { searchParams: SearchParams }) {
  const { ctx, t, on, college, canEdit } = await academicsGate();
  if (!on) return <ModuleOff module="ACADEMICS" t={t} college={college} />;
  const params = await searchParams;
  const s = await academicsStructure(ctx);
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
                  <span className="text-fg-muted">{t("academics.termLine", { year: term.academicYear, from: term.startsOn, to: term.endsOn })}</span>
                  <span className="text-fg-muted">{t("academics.windowLine", { from: term.registrationOpensOn, to: term.registrationClosesOn })}</span>
                  {term.registrationOpen ? <Badge tone="ok">{t("academics.registrationOpen")}</Badge> : <Badge tone="neutral">{t("academics.registrationClosed")}</Badge>}
                </li>
              ))}
            </ul>
          )}
          {canEdit ? (
            <form action={saveTermAction} className="grid gap-3 sm:grid-cols-3">
              <TextField label={t("academics.fieldName")} name="name" required maxLength={80} />
              <TextField label={t("academics.fieldAcademicYear")} name="academicYear" required placeholder="2026–27" pattern="\d{4}[–-]\d{2}" />
              <TextField label={t("academics.fieldStartsOn")} name="startsOn" type="date" required />
              <TextField label={t("academics.fieldEndsOn")} name="endsOn" type="date" required />
              <TextField label={t("academics.fieldOpensOn")} name="registrationOpensOn" type="date" required />
              <TextField label={t("academics.fieldClosesOn")} name="registrationClosesOn" type="date" required />
              <div>
                <Button type="submit">{t("academics.addTerm")}</Button>
              </div>
            </form>
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
                <li key={r.id} className="rounded-[--radius-md] border border-border px-3 py-1.5">
                  <span className="font-medium text-fg">{r.name}</span> <span className="text-fg-muted">· {t(ROOM_KEY[r.kind]!)} · {t("academics.seats", { n: r.capacity })}</span>
                </li>
              ))}
            </ul>
          )}
          {canEdit ? (
            <form action={saveRoomAction} className="grid gap-3 sm:grid-cols-4">
              <TextField label={t("academics.fieldName")} name="name" required maxLength={60} />
              <TextField label={t("academics.fieldCapacity")} name="capacity" type="number" min={1} max={2000} defaultValue={60} />
              <SelectField label={t("academics.fieldRoomKind")} name="kind" defaultValue="CLASSROOM">
                {ROOM_KINDS.map((k) => <option key={k} value={k}>{t(ROOM_KEY[k]!)}</option>)}
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
            <form action={createDivisionAction} className="grid gap-3 sm:grid-cols-4">
              <SelectField label={t("academics.fieldProgramme")} name="programmeId" required>
                {s.programmes.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
              </SelectField>
              <TextField label={t("academics.fieldYearOfStudy")} name="yearOfStudy" type="number" min={1} max={6} defaultValue={1} />
              <TextField label={t("academics.fieldName")} name="name" required maxLength={60} />
              <TextField label={t("academics.fieldAcademicYear")} name="academicYear" required placeholder="2026–27" pattern="\d{4}[–-]\d{2}" />
              <div>
                <Button type="submit">{t("academics.addDivision")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
