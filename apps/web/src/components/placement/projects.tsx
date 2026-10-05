import { FolderSimpleIcon } from "@phosphor-icons/react/ssr";
import type { ProjectView } from "@edulink/contracts";
import type { Translate } from "@/lib/i18n/dictionary";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateField, TextField } from "@/components/ui/field";
import { reviewProjectAction } from "@/app/(app)/placement/actions";
import { ActionForm } from "@/components/ui/action-form";

/** Students' projects with their reviews; the guide records the next review, the final one with the marks. */
export function ProjectList({ projects, t, back, myMembershipId }: { projects: ProjectView[]; t: Translate; back: string; myMembershipId: string }) {
  return (
    <Card>
      <CardHeader icon={<FolderSimpleIcon weight="duotone" className="size-5" />} title={t("placement.projectsTitle", { count: projects.length })} />
      <CardBody className="space-y-4 text-sm">
        {projects.length === 0 ? <p className="text-fg-muted">{t("placement.noProjects")}</p> : null}
        {projects.map((p) => (
          <div key={p.id} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
            <div className="font-medium">{p.title}</div>
            <div className="text-xs text-fg-muted">
              {t("placement.guidedBy", { name: p.guideName })} · {p.students.map((s) => s.name).join(", ")}
              {p.marks !== null ? ` · ${t("placement.marksIs", { marks: p.marks })}` : ""}
            </div>
            {p.reviews.length ? (
              <ul className="space-y-1 text-xs">
                {p.reviews.map((r, i) => (
                  <li key={i}>
                    <span className="font-medium">{r.on}</span> · {r.byName} · {r.note}
                    {r.marks !== null ? ` · ${r.marks}` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
            {p.guideMembershipId === myMembershipId ? (
              <ActionForm action={reviewProjectAction} className="grid gap-2 sm:grid-cols-[10rem_1fr_6rem_auto_auto] sm:items-end">
                <input type="hidden" name="back" value={back} />
                <input type="hidden" name="projectId" value={p.id} />
                <DateField label={t("placement.fieldDay")} name="on" required />
                <TextField label={t("placement.fieldReview")} name="note" required maxLength={2000} />
                <TextField label={t("placement.fieldMarks")} name="marks" type="number" min="0" max="100" />
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" name="final" />
                  {t("placement.fieldFinal")}
                </label>
                <Button type="submit" size="sm" variant="secondary">{t("placement.addReview")}</Button>
              </ActionForm>
            ) : null}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
