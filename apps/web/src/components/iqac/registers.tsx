import { ACTIVITY_KINDS, CAPACITY_THEMES, RESEARCH_INDEXING, RESEARCH_KINDS } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import type { Translate } from "@/lib/i18n/dictionary";
import { addActivityAction, addResearchAction, removeResearchAction } from "@/app/(app)/iqac/actions";
import { day, keyed } from "./parts";
import { ActionForm } from "@/components/ui/action-form";

/**
 * The research and activity registers as the desk, a faculty member and an
 * HOD each draw them (module IQAC, 4 Oct 2026): the list, the per-teacher
 * ratio, and the add form. Who may add for whom is lib/iqac.ts's.
 */

type ResearchRow = { id: string; kind: string; title: string; indexing: string; year: number; amountLakhs: number | null; facultyName: string | null; fileId: string | null; mine: boolean };

export function ResearchRegister({ t, back, items, perTeacher, scope, teachers, canRemoveAll, canAdd = true }: { t: Translate; back: string; items: ResearchRow[]; perTeacher: { teachers: number; publications: number; books: number }; scope: string; teachers: { id: string; name: string }[] | null; canRemoveAll: boolean; canAdd?: boolean }) {
  const tt = keyed(t);
  const year = new Date().getUTCFullYear();
  return (
    <Card>
      <CardHeader title={t("iqac.researchTitle")} description={[tt("iqac.scope." + scope), " · ", t("iqac.perTeacherLine", { teachers: perTeacher.teachers, publications: perTeacher.publications, books: perTeacher.books })].join("")} />
      <CardBody className="space-y-4">
        {canAdd ? (
        <ActionForm action={addResearchAction} className="grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="back" value={back} />
          <SelectField name="kind" label={t("iqac.researchKindField")} defaultValue="PUBLICATION">
            {RESEARCH_KINDS.map((k) => (
              <option key={k} value={k}>
                {tt("iqac.researchKind." + k)}
              </option>
            ))}
          </SelectField>
          <TextField name="title" required minLength={3} maxLength={400} label={t("iqac.titleField")} className="sm:col-span-2" />
          <SelectField name="indexing" label={t("iqac.indexingField")} defaultValue="UGC_CARE">
            {RESEARCH_INDEXING.map((k) => (
              <option key={k} value={k}>
                {tt("iqac.indexing." + k)}
              </option>
            ))}
          </SelectField>
          <TextField name="year" type="number" required min={1950} max={2100} defaultValue={year} label={t("iqac.yearField")} />
          <TextField name="amountLakhs" type="number" min={0} step="any" label={t("iqac.amountField")} />
          {teachers ? (
            <SelectField name="facultyMembershipId" label={t("iqac.facultyField")} defaultValue="">
              <option value="">{t("iqac.facultyNone")}</option>
              {teachers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectField>
          ) : null}
          <TextField name="file" type="file" label={t("iqac.fileField")} accept="application/pdf,image/*" />
          <div className="sm:col-span-3">
            <Button type="submit">{t("iqac.addResearch")}</Button>
          </div>
        </ActionForm>
        ) : null}
        {items.length === 0 ? (
          <EmptyState title={t("iqac.noResearch")} />
        ) : (
          <ul className="divide-y divide-border text-sm">
            {items.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <Badge>{tt("iqac.researchKind." + r.kind)}</Badge> {r.title} · {r.year}
                  {r.indexing !== "NONE" ? ` · ${tt("iqac.indexing." + r.indexing)}` : ""}
                  {r.amountLakhs ? ` · ₹${r.amountLakhs} L` : ""}
                  {r.facultyName ? ` · ${r.facultyName}` : ""}
                  {r.fileId ? (
                    <>
                      {" · "}
                      <a className="text-accent-strong underline" href={`/api/files/${r.fileId}`} target="_blank" rel="noreferrer">
                        {t("iqac.view")}
                      </a>
                    </>
                  ) : null}
                </span>
                {r.mine || canRemoveAll ? (
                  <ActionForm action={removeResearchAction}>
                    <input type="hidden" name="back" value={back} />
                    <input type="hidden" name="itemId" value={r.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      {t("iqac.removeResearch")}
                    </Button>
                  </ActionForm>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

type ActivityRow = { id: string; kind: string; title: string; at: string; participants: number; staffParticipants: number; fileId: string | null };

export function ActivityRegister({ t, back, items, canEdit, staff, locale }: { t: Translate; back: string; items: ActivityRow[]; canEdit: boolean; staff: { id: string; name: string }[]; locale: string }) {
  const tt = keyed(t);
  return (
    <Card>
      <CardHeader title={t("iqac.activitiesTitle")} />
      <CardBody className="space-y-4">
        {canEdit ? (
          <ActionForm action={addActivityAction} className="grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="back" value={back} />
            <SelectField name="kind" label={t("iqac.activityKindField")} defaultValue="EXTENSION">
              {ACTIVITY_KINDS.map((k) => (
                <option key={k} value={k}>
                  {tt("iqac.activityKind." + k)}
                </option>
              ))}
            </SelectField>
            <TextField name="title" required minLength={3} maxLength={300} label={t("iqac.titleField")} className="sm:col-span-2" />
            <DateField name="at" required label={t("iqac.dateField")} />
            <TextField name="participants" type="number" min={0} defaultValue={0} label={t("iqac.participantsField")} />
            <SelectField name="theme" label={t("iqac.themeField")} defaultValue="">
              <option value="">{t("iqac.themeNone")}</option>
              {CAPACITY_THEMES.map((k) => (
                <option key={k} value={k}>
                  {tt("iqac.theme." + k)}
                </option>
              ))}
            </SelectField>
            {staff.length ? (
              <SelectField name="staff" multiple label={t("iqac.staffField")} className="sm:col-span-2">
                {staff.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SelectField>
            ) : null}
            <TextField name="file" type="file" label={t("iqac.fileField")} accept="application/pdf,image/*" />
            <div className="sm:col-span-3">
              <Button type="submit">{t("iqac.addActivity")}</Button>
            </div>
          </ActionForm>
        ) : null}
        {items.length === 0 ? (
          <EmptyState title={t("iqac.noActivities")} />
        ) : (
          <ul className="divide-y divide-border text-sm">
            {items.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <Badge>{tt("iqac.activityKind." + a.kind)}</Badge> {a.title}
                </span>
                <span className="text-fg-muted">{t("iqac.activityLine", { date: day(a.at, locale), n: Math.max(a.participants, a.staffParticipants) })}</span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
