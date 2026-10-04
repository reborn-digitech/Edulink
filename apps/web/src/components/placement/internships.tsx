import { FileTextIcon, NotebookIcon } from "@phosphor-icons/react/ssr";
import { INDUSTRY_GRADES, type InternshipView } from "@edulink/contracts";
import type { Translate } from "@/lib/i18n/dictionary";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { decideInternshipAction, evaluateInternshipAction } from "@/app/(app)/placement/actions";
import { INTERNSHIP_KIND_KEY, INTERNSHIP_STATUS_KEY, LINK } from "./parts";

/**
 * Internships for the people who supervise them (the placement module, 4 Oct
 * 2026): the cell and the HOD approve a proposal naming the faculty member who
 * supervises, or refuse it with a reason; the supervisor, the HOD or the cell
 * record the industry grade, the visit and the viva; the cell or the HOD
 * decide the credits last. Each shows its diary and its files.
 */
export function InternshipStaffList({ internships, t, back, canDecide, supervisors, rule }: { internships: InternshipView[]; t: Translate; back: string; canDecide: boolean; supervisors: { membershipId: string; name: string }[]; rule: { creditsMin: number; creditsMax: number; hoursMin: number; hoursMax: number } }) {
  return (
    <Card>
      <CardHeader icon={<NotebookIcon weight="duotone" className="size-5" />} title={t("placement.internshipsTitle", { count: internships.length })} description={t("placement.aicteRule", { creditsMin: rule.creditsMin, creditsMax: rule.creditsMax, hoursMin: rule.hoursMin, hoursMax: rule.hoursMax })} />
      <CardBody className="space-y-4">
        {internships.length === 0 ? <p className="text-sm text-fg-muted">{t("placement.noInternships")}</p> : null}
        {internships.map((i) => (
          <div key={i.id} className="space-y-3 rounded-[--radius-md] border border-border p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-medium">
                  {i.studentName} · {i.companyName}
                </div>
                <div className="text-xs text-fg-muted">
                  {t(INTERNSHIP_KIND_KEY[i.kind]!)} · {i.from} – {i.to} · {t("placement.hoursN", { hours: i.hours })} · {t("placement.windowN", { semester: i.windowSemester })}
                  {i.facultyName ? ` · ${t("placement.supervisedBy", { name: i.facultyName })}` : ""}
                </div>
              </div>
              <Badge tone={i.status === "CREDITED" ? "ok" : i.status === "REFUSED" ? "neutral" : "accent"}>{t(INTERNSHIP_STATUS_KEY[i.status]!)}</Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              {i.reportFileId ? (
                <a className={LINK} href={`/api/files/${i.reportFileId}`} target="_blank" rel="noreferrer">
                  <FileTextIcon className="mr-1 inline size-4" aria-hidden />
                  {t("placement.report")}
                </a>
              ) : null}
              {i.needsDeclaration ? (i.declarationFileId ? <a className={LINK} href={`/api/files/${i.declarationFileId}`} target="_blank" rel="noreferrer">{t("placement.declaration")}</a> : <span className="text-warn">{t("placement.declarationMissing")}</span>) : null}
              {i.industryGrade ? <span>{t("placement.gradeIs", { grade: i.industryGrade })}</span> : null}
              {i.vivaMarks !== null ? <span>{t("placement.vivaIs", { marks: i.vivaMarks })}</span> : null}
              {i.credits !== null ? <span>{t("placement.creditsIs", { credits: i.credits })}</span> : null}
            </div>
            {i.diary.length ? (
              <details>
                <summary className="cursor-pointer text-xs text-fg-muted">{t("placement.diaryN", { count: i.diary.length })}</summary>
                <ul className="mt-2 space-y-1 text-xs">
                  {i.diary.map((d, n) => (
                    <li key={n}>
                      <span className="font-medium">{d.on}</span> · {t("placement.hoursN", { hours: d.hours })} · {d.text}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
            {i.status === "PROPOSED" && canDecide ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <form action={decideInternshipAction} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="back" value={back} />
                  <input type="hidden" name="internshipId" value={i.id} />
                  <input type="hidden" name="approve" value="1" />
                  <SelectField label={t("placement.fieldSupervisor")} name="facultyMembershipId" required>
                    {supervisors.map((s) => (
                      <option key={s.membershipId} value={s.membershipId}>
                        {s.name}
                      </option>
                    ))}
                  </SelectField>
                  <Button type="submit" size="sm">
                    {t("placement.approve")}
                  </Button>
                </form>
                <form action={decideInternshipAction} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="back" value={back} />
                  <input type="hidden" name="internshipId" value={i.id} />
                  <input type="hidden" name="approve" value="0" />
                  <TextField label={t("placement.fieldReason")} name="reason" required maxLength={500} />
                  <Button type="submit" size="sm" variant="secondary">
                    {t("placement.refuse")}
                  </Button>
                </form>
              </div>
            ) : null}
            {["SUBMITTED", "EVALUATED"].includes(i.status) ? (
              <form action={evaluateInternshipAction} className="grid gap-3 sm:grid-cols-5 sm:items-end">
                <input type="hidden" name="back" value={back} />
                <input type="hidden" name="internshipId" value={i.id} />
                <SelectField label={t("placement.fieldGrade")} name="industryGrade" defaultValue={i.industryGrade ?? ""}>
                  <option value="">—</option>
                  {INDUSTRY_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </SelectField>
                <DateField label={t("placement.fieldVisit")} name="facultyVisitOn" defaultValue={i.facultyVisitAt?.slice(0, 10) ?? ""} />
                <TextField label={t("placement.fieldViva")} name="vivaMarks" type="number" min="0" max="100" defaultValue={i.vivaMarks ?? ""} />
                {canDecide ? <TextField label={t("placement.fieldCredits")} name="credits" type="number" min="1" max={rule.creditsMax} /> : <span />}
                <Button type="submit" size="sm" variant="secondary" className="sm:justify-self-start">
                  {t("placement.saveEvaluation")}
                </Button>
              </form>
            ) : null}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
