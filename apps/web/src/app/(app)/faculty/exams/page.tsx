import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import { myDuties } from "@/lib/exam-cell-after";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileField } from "@/components/ui/file-field";
import { CellOff, DUTY_STATUS_KEY, Flash, Hidden, Labelled, PAPER_STATUS_KEY, REMUNERATION_KEY, money, when } from "@/components/exam-cell/parts";
import { submitPaperAction } from "../../exam-cell/actions";
import { fieldClass } from "@/components/ui/field-class";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("examCell.dutiesTitle"), robots: { index: false, follow: false } };
}

/** A faculty member's exam duties: halls to watch, papers to set (an autonomous college's), bundles to assess, what the cell records as owed. */
export default async function FacultyExamsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("FACULTY", "HOD");
  const [t, locale, on, kind] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "EXAMS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <CellOff t={t} college={isCollegeKind(kind)} />;
  const { ok, error } = await searchParams;
  const d = await myDuties(ctx);
  const back = "/faculty/exams";
  const nothing = d.invigilation.length + d.papers.length + d.bundles.length + d.remuneration.length === 0;
  return (
    <div className="space-y-5">
      <PageHeader title={t("examCell.dutiesTitle")} description={t("examCell.dutiesIntro")} />
      <Flash ok={ok} error={error} />
      {nothing ? <p className="text-sm text-fg-muted">{t("examCell.noDuties")}</p> : null}
      {d.invigilation.length > 0 ? (
        <Card>
          <CardHeader title={t("examCell.invigilationTitle")} />
          <CardBody className="space-y-1 text-sm">
            {d.invigilation.map((i) => (
              <p key={i.id}>
                {when(i.at, locale)} · {i.courseCode} · {i.roomName} · {i.sessionName} <Badge tone="outline">{t(DUTY_STATUS_KEY[i.status]!)}</Badge>
              </p>
            ))}
          </CardBody>
        </Card>
      ) : null}
      {d.papers.length > 0 ? (
        <Card>
          <CardHeader title={t("examCell.papersToSet")} description={t("examCell.papersToSetHint")} />
          <CardBody className="space-y-4 text-sm">
            {d.papers.map((p) => (
              <div key={p.id} className="space-y-2">
                <p>
                  {p.courseCode} · {p.sessionName} · {when(p.at, locale)} <Badge tone="outline">{t(PAPER_STATUS_KEY[p.status]!)}</Badge>
                </p>
                {p.status !== "MODERATED" ? (
                  <form action={submitPaperAction} className="grid gap-2 sm:grid-cols-2">
                    <Hidden fields={{ paperId: p.id, back }} />
                    <FileField label={t("examCell.paperFile")} name="file" accept="application/pdf" required />
                    <Labelled label={t("examCell.coMap")}>
                      <textarea name="coMap" required rows={3} placeholder={t("examCell.coMapPlaceholder")} className={fieldClass()} />
                    </Labelled>
                    <div>
                      <Button type="submit" size="sm">
                        {t("examCell.sealPaper")}
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}
      {d.bundles.length > 0 ? (
        <Card>
          <CardHeader title={t("examCell.assessmentTitle")} />
          <CardBody className="space-y-1 text-sm">
            {d.bundles.map((b) => (
              <p key={b.id}>
                {b.courseCode} · {b.bundle} · {t("examCell.books", { count: b.count })} · {b.status === "RETURNED" ? t("examCell.returned") : t("examCell.withYou")}
              </p>
            ))}
          </CardBody>
        </Card>
      ) : null}
      {d.remuneration.length > 0 ? (
        <Card>
          <CardHeader title={t("examCell.remunerationTitle")} description={t("examCell.remunerationHint")} />
          <CardBody className="space-y-1 text-sm">
            {d.remuneration.map((r, i) => (
              <p key={`${r.sessionName}-${r.kind}-${i}`}>
                {r.sessionName} · {t(REMUNERATION_KEY[r.kind]!)} · {r.count} · {money(r.amountPaise, locale)}
              </p>
            ))}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
