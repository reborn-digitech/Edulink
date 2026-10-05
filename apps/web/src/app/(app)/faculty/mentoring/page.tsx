import type { Metadata } from "next";
import { ChatsCircleIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { MENTOR_FLAGS } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { ModuleFlash } from "@/components/module-flash";
import { FLAG_KEY } from "@/components/academics/parts";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { mentoringView } from "@/lib/academics-mentoring";
import { academicsStructure, listSeats } from "@/lib/academics";
import { getT } from "@/lib/i18n/server";
import { mentoringGroupAction, mentoringNoteAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.mentoringTitle") };
}

/** A mentor's groups with notes and flags; the HOD forms the department's groups. */
export default async function MentoringPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("FACULTY", "HOD");
  const t = await getT();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const m = await mentoringView(ctx);
  const [s, seats] = m.canOrganise ? await Promise.all([academicsStructure(ctx), listSeats(ctx, {})]) : [null, null];
  return (
    <div className="space-y-6">
      <PageHeader title={t("academics.mentoringTitle")} description={t("academics.mentoringIntro")} />
      <ModuleFlash t={t} params={await searchParams} />
      {m.groups.length === 0 ? <EmptyState title={t("academics.mentoringNone")} description={t("academics.mentoringNoneBody")} /> : null}
      {m.groups.map((g) => (
        <Card key={g.id}>
          <CardHeader icon={<ChatsCircleIcon weight="duotone" className="size-5" />} title={g.name} description={t("academics.mentorLine", { name: g.facultyName, n: g.members.length })} />
          <CardBody className="space-y-4">
            <ul className="flex flex-wrap gap-2 text-sm">
              {g.members.map((x) => (
                <li key={x.studentMembershipId} className="rounded-full border border-border px-3 py-1">
                  {x.name} {x.flag !== "NONE" ? <Badge tone="warn">{t(FLAG_KEY[x.flag]!)}</Badge> : null}
                </li>
              ))}
            </ul>
            <form action={mentoringNoteAction} className="grid gap-2 sm:grid-cols-4">
              <input type="hidden" name="groupId" value={g.id} />
              <SelectField label={t("academics.colStudent")} name="studentMembershipId" required>
                {g.members.map((x) => <option key={x.studentMembershipId} value={x.studentMembershipId}>{x.name}</option>)}
              </SelectField>
              <SelectField label={t("academics.fieldFlag")} name="flag" defaultValue="NONE">
                {MENTOR_FLAGS.map((f) => <option key={f} value={f}>{t(FLAG_KEY[f]!)}</option>)}
              </SelectField>
              <TextField label={t("academics.fieldNote")} name="note" required minLength={2} maxLength={1000} />
              <div className="self-end">
                <Button type="submit" variant="secondary">{t("academics.addNote")}</Button>
              </div>
            </form>
            {g.notes.length ? (
              <ul className="divide-y divide-border text-sm">
                {g.notes.slice(0, 20).map((n) => (
                  <li key={n.id} className="py-2">
                    <span className="font-medium text-fg">{n.studentName}</span> <span className="text-fg-muted">{n.at.slice(0, 10)}</span> {n.flag !== "NONE" ? <Badge tone="warn">{t(FLAG_KEY[n.flag]!)}</Badge> : null}
                    <p className="text-fg">{n.note}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardBody>
        </Card>
      ))}
      {m.canOrganise && s && seats && s.terms.length ? (
        <Card>
          <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={t("academics.newGroupTitle")} description={t("academics.newGroupBody", { max: s.settings.menteesPerMentor })} />
          <CardBody>
            <form action={mentoringGroupAction} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <TextField label={t("academics.fieldName")} name="name" required maxLength={80} />
                <SelectField label={t("academics.fieldTerm")} name="termId" required>
                  {s.terms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
                </SelectField>
                <SelectField label={t("academics.fieldMentor")} name="facultyMembershipId" required>
                  {s.faculty.map((f) => <option key={f.membershipId} value={f.membershipId}>{f.name}</option>)}
                </SelectField>
              </div>
              <fieldset className="grid gap-1 sm:grid-cols-3">
                <legend className="mb-1 text-sm font-medium text-fg">{t("academics.fieldMenteeList")}</legend>
                {seats.seats.map((x) => (
                  <label key={x.studentMembershipId} className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="checkbox" name="studentMembershipId" value={x.studentMembershipId} className="size-5 shrink-0 accent-[var(--accent)]" />
                    {`${x.name} · ${x.programmeCode}`}
                  </label>
                ))}
              </fieldset>
              <Button type="submit">{t("academics.formGroup")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
