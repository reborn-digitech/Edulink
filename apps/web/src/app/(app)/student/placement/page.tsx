import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon, ChalkboardTeacherIcon, DownloadSimpleIcon, IdentificationCardIcon, LightningIcon, NotebookIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import { INTERNSHIP_WINDOWS, LAW_INTERNSHIP_WINDOWS, internshipKindsFor } from "@edulink/contracts";
import { streamsOf } from "@/lib/streams";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { studentPlacement } from "@/lib/placement-student";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { Flash, INTERNSHIP_KIND_KEY, INTERNSHIP_STATUS_KEY, LINK, OUTCOME_KEY, ROUND_KIND_KEY, applicationBadge, offerLine, packageRange, reasons, statusBadge } from "@/components/placement/parts";
import { answerOfferAction, applyAction, diaryAction, internshipFileAction, proposeInternshipAction, saveProfileAction, withdrawAction } from "@/app/(app)/placement/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("placement.studentTitle"), robots: { index: false, follow: false } };
}

const BACK = "/student/placement";
const CHECK = "flex items-center gap-2 text-sm";

/**
 * A student's placement (the placement module, 4 October 2026): the record
 * the cell reads and the profile they add, the resume rendered from both,
 * every drive with whether they qualify and why not, applying (which is the
 * consent to share with that company), rounds and offers, internships with
 * the diary and the report, the aptitude, reasoning and coding practice, and
 * the free one-to-ones the college's alumni mentors offer.
 */
export default async function StudentPlacementPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("STUDENT");
  const streams = await streamsOf(ctx.schoolId);
  const t = await getT();
  const { ok, error } = await searchParams;
  const [on, kind] = await Promise.all([isModuleOn(ctx.schoolId, "PLACEMENT"), institutionKindOf(ctx.schoolId)]);
  if (!on) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("placement.studentTitle")} />
        <ModuleOff module="PLACEMENT" t={t} college={isCollegeKind(kind)} />
      </div>
    );
  }
  const p = await studentPlacement(ctx);
  const r = p.record;
  return (
    <div className="space-y-5">
      <PageHeader title={t("placement.studentTitle")} description={t("placement.studentIntro", { batch: p.batchYear })} />
      <Flash ok={ok} error={error} />

      <Card>
        <CardHeader
          icon={<IdentificationCardIcon weight="duotone" className="size-5" />}
          title={t("placement.recordTitle")}
          description={t("placement.recordIntro")}
          action={
            <a className={LINK} href="/api/v1/student/placement/resume" target="_blank" rel="noreferrer">
              <DownloadSimpleIcon className="mr-1 inline size-4" aria-hidden />
              {t("placement.resume")}
            </a>
          }
        />
        <CardBody className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
          <div><div className="text-fg-muted">{t("placement.colCgpa")}</div><div className="font-semibold">{r.cgpa === null ? "—" : r.cgpa.toFixed(2)}</div></div>
          <div><div className="text-fg-muted">{t("placement.colBacklogs")}</div><div className="font-semibold">{r.liveBacklogs ?? "—"}</div></div>
          <div><div className="text-fg-muted">{t("placement.colAttendance")}</div><div className="font-semibold">{r.attendancePct === null ? "—" : `${Math.round(r.attendancePct)} %`}</div></div>
          <div><div className="text-fg-muted">{t("placement.colProgramme")}</div><div className="font-semibold">{r.programmeName ?? "—"}</div></div>
          <div><div className="text-fg-muted">{t("placement.colBatch")}</div><div className="font-semibold">{r.batchYear ?? "—"}</div></div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<BriefcaseIcon weight="duotone" className="size-5" />} title={t("placement.profileTitle")} description={p.profile.consentAt ? t("placement.profileIntroSaved") : t("placement.profileIntroFirst")} />
        <CardBody>
          <form action={saveProfileAction} className="grid gap-4 sm:grid-cols-3">
            <input type="hidden" name="back" value={BACK} />
            <TextAreaField label={t("placement.fieldSkills")} name="skills" defaultValue={p.profile.skills.join("\n")} hint={t("placement.onePerLine")} />
            <TextAreaField label={t("placement.fieldCertifications")} name="certifications" defaultValue={p.profile.certifications.join("\n")} hint={t("placement.onePerLine")} />
            <TextAreaField label={t("placement.fieldProjects")} name="projects" defaultValue={p.profile.projects.map((x) => x.title).join("\n")} hint={t("placement.onePerLine")} />
            <div className="space-y-2 sm:col-span-3">
              <label className={CHECK}><input type="checkbox" name="optedOut" defaultChecked={p.profile.optedOut} />{t("placement.fieldOptOut")}</label>
              <label className={CHECK}><input type="checkbox" name="higherStudies" defaultChecked={p.profile.higherStudies} />{t("placement.fieldHigherStudies")}</label>
              <label className={CHECK}><input type="checkbox" name="entrepreneur" defaultChecked={p.profile.entrepreneur} />{t("placement.fieldEntrepreneur")}</label>
              {p.profile.dreamFlag ? <Badge tone="accent">{t("placement.dreamOn")}</Badge> : null}
            </div>
            <Button type="submit" className="sm:justify-self-start">{t("placement.saveProfile")}</Button>
          </form>
        </CardBody>
      </Card>

      <section className="space-y-3" aria-labelledby="drives">
        <h2 id="drives" className="text-lg font-semibold">{t("placement.drivesForYou")}</h2>
        {p.drives.length === 0 ? <p className="text-sm text-fg-muted">{t("placement.noDrivesForYou")}</p> : null}
        {p.drives.map(({ drive: d, eligible, failed, application: a }) => (
          <Card key={d.id}>
            <CardHeader title={[d.title, d.companyName].join(" · ")} description={[packageRange(d.packageMinRupees, d.packageMaxRupees, t), d.hosted ? null : t("placement.hostedBy", { name: d.hostName })].filter(Boolean).join(" · ")} action={statusBadge(d.status, t)} />
            <CardBody className="space-y-3 text-sm">
              {d.jd ? <p className="whitespace-pre-line text-fg-muted">{d.jd}</p> : null}
              {d.rounds.length ? <p className="text-xs text-fg-muted">{d.rounds.map((x) => t("placement.roundNamed", { round: x.n, kind: t(ROUND_KIND_KEY[x.kind]!) })).join(" → ")}</p> : null}
              {a ? (
                <div className="space-y-1">
                  <div>{applicationBadge(a, t)}</div>
                  {a.results.map((x) => (
                    <div key={x.round} className="text-xs">
                      {x.round === 0 ? t("placement.roundShortlist") : t("placement.roundN", { round: x.round })} · {t(OUTCOME_KEY[x.outcome]!)}
                      {x.feedback ? ` · ${x.feedback}` : ""}
                    </div>
                  ))}
                </div>
              ) : eligible ? (
                <Badge tone="ok">{t("placement.eligibleYes")}</Badge>
              ) : (
                <ul className="list-disc pl-4 text-xs text-fg-muted">
                  {reasons(failed, t).map((x) => <li key={x}>{x}</li>)}
                </ul>
              )}
              {!a || a.status === "WITHDRAWN" ? (
                d.status === "OPEN" && eligible ? (
                  <form action={applyAction} className="space-y-2">
                    <input type="hidden" name="back" value={BACK} />
                    <input type="hidden" name="driveId" value={d.id} />
                    <label className={CHECK}><input type="checkbox" name="consent" required />{t("placement.consentLine", { company: d.companyName })}</label>
                    <Button type="submit" size="sm">{t("placement.apply")}</Button>
                  </form>
                ) : null
              ) : !a.offer ? (
                <form action={withdrawAction} className="space-y-2">
                  {!a.consentAt ? <p className="text-xs text-fg-muted">{t("placement.awaitingGuardian")}</p> : null}
                  <input type="hidden" name="back" value={BACK} />
                  <input type="hidden" name="driveId" value={d.id} />
                  <Button type="submit" size="sm" variant="ghost">{t("placement.withdraw")}</Button>
                </form>
              ) : null}
            </CardBody>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader icon={<SealCheckIcon weight="duotone" className="size-5" />} title={t("placement.offersTitle")} />
        <CardBody className="space-y-3 text-sm">
          {p.offers.length === 0 ? <p className="text-fg-muted">{t("placement.noOffers")}</p> : null}
          {p.offers.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium">{o.driveTitle}</div>
                <div className="text-xs text-fg-muted">{offerLine(o, t)}</div>
                {o.letterFileId ? <a className={LINK} href={`/api/files/${o.letterFileId}`} target="_blank" rel="noreferrer">{t("placement.letter")}</a> : null}
              </div>
              {!o.acceptedAt && !o.declinedAt ? (
                <div className="flex gap-2">
                  <form action={answerOfferAction}>
                    <input type="hidden" name="back" value={BACK} />
                    <input type="hidden" name="offerId" value={o.id} />
                    <input type="hidden" name="accept" value="1" />
                    <Button type="submit" size="sm">{t("placement.acceptOffer")}</Button>
                  </form>
                  <form action={answerOfferAction}>
                    <input type="hidden" name="back" value={BACK} />
                    <input type="hidden" name="offerId" value={o.id} />
                    <input type="hidden" name="accept" value="0" />
                    <Button type="submit" size="sm" variant="secondary">{t("placement.declineOffer")}</Button>
                  </form>
                </div>
              ) : null}
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<NotebookIcon weight="duotone" className="size-5" />} title={t("placement.myInternships")} description={t("placement.myInternshipsIntro", { credits: p.internshipCredits })} />
        <CardBody className="space-y-4 text-sm">
          {p.internships.map((i) => (
            <div key={i.id} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">{i.companyName} · {t(INTERNSHIP_KIND_KEY[i.kind]!)}</span>
                <Badge tone={i.status === "CREDITED" ? "ok" : "accent"}>{t(INTERNSHIP_STATUS_KEY[i.status]!)}</Badge>
              </div>
              <div className="text-xs text-fg-muted">{i.from} – {i.to} · {t("placement.hoursN", { hours: i.hours })}{i.credits !== null ? ` · ${t("placement.creditsIs", { credits: i.credits })}` : ""}</div>
              {["APPROVED", "SUBMITTED"].includes(i.status) ? (
                <form action={diaryAction} className="grid gap-2 sm:grid-cols-[10rem_6rem_1fr_auto] sm:items-end">
                  <input type="hidden" name="back" value={BACK} />
                  <input type="hidden" name="internshipId" value={i.id} />
                  <DateField label={t("placement.fieldDay")} name="on" min={i.from} max={i.to} required />
                  <TextField label={t("placement.fieldHours")} name="hours" type="number" step="0.5" min="0.5" max="16" required />
                  <TextField label={t("placement.fieldDiary")} name="text" required maxLength={2000} />
                  <Button type="submit" size="sm" variant="secondary">{t("placement.addDiary")}</Button>
                </form>
              ) : null}
              {["APPROVED", "SUBMITTED"].includes(i.status) || (i.needsDeclaration && !i.declarationFileId) ? (
                <form action={internshipFileAction} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="back" value={BACK} />
                  <input type="hidden" name="internshipId" value={i.id} />
                  <SelectField label={t("placement.fieldFileKind")} name="kind" defaultValue="REPORT">
                    <option value="REPORT">{t("placement.report")}</option>
                    {i.needsDeclaration ? <option value="DECLARATION">{t("placement.declaration")}</option> : null}
                  </SelectField>
                  <TextField label={t("placement.fieldFile")} name="file" type="file" accept="application/pdf,image/*" required />
                  <Button type="submit" size="sm" variant="secondary">{t("placement.upload")}</Button>
                </form>
              ) : null}
            </div>
          ))}
          <form action={proposeInternshipAction} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
            <input type="hidden" name="back" value={BACK} />
            <TextField label={t("placement.fieldInternCompany")} name="companyName" required maxLength={160} />
            <SelectField label={t("placement.fieldInternKind")} name="kind" defaultValue="INDUSTRY">
              {/* The kinds the college's streams offer (stream records, 5 Oct 2026): a law college's court, firm and legal aid; a management college's summer. */}
              {internshipKindsFor(streams).map((k) => <option key={k} value={k}>{t(INTERNSHIP_KIND_KEY[k]!)}</option>)}
            </SelectField>
            <SelectField label={t("placement.fieldWindow")} name="windowSemester" defaultValue="6">
              {(streams.includes("LAW") ? LAW_INTERNSHIP_WINDOWS : INTERNSHIP_WINDOWS).map((w) => <option key={w} value={w}>{t("placement.windowN", { semester: w })}</option>)}
            </SelectField>
            <DateField label={t("placement.fieldFrom")} name="from" required />
            <DateField label={t("placement.fieldTo")} name="to" required />
            <TextField label={t("placement.fieldHoursTotal")} name="hours" type="number" min="1" max="2000" required />
            <TextField label={t("placement.fieldIndustrySupervisor")} name="supervisorName" required maxLength={120} />
            <Button type="submit" className="sm:col-span-3 sm:justify-self-start">{t("placement.proposeInternship")}</Button>
          </form>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader icon={<LightningIcon weight="duotone" className="size-5" />} title={t("placement.prepTitle")} description={t("placement.prepIntro")} />
          <CardBody className="space-y-1 text-sm">
            {p.prep.length === 0 ? <p className="text-fg-muted">{t("placement.noPrep")}</p> : null}
            {p.prep.map((x) => (
              <div key={x.slug} className="flex justify-between gap-3">
                <Link className={LINK} href={`/student/practice/${x.slug}`}>{x.name}</Link>
                <span className="text-fg-muted">{t("placement.prepLine", { count: x.questionCount, level: x.level })}</span>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />} title={t("placement.mentorsTitle")} description={t("placement.mentorsIntro")} />
          <CardBody className="space-y-1 text-sm">
            {p.mentorSlots.length === 0 ? <p className="text-fg-muted">{t("placement.noMentorSlots")}</p> : null}
            {p.mentorSlots.map((s) => (
              <div key={s.id} className="flex justify-between gap-3">
                <span>{s.title} · {s.mentorName}{s.batchYear ? ` (${s.batchYear})` : ""}</span>
                <span className="text-fg-muted">{new Date(s.startsAt).toLocaleString()}</span>
              </div>
            ))}
            {p.mentorSlots.length ? <Link className={LINK} href="/sessions">{t("placement.bookInSessions")}</Link> : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
