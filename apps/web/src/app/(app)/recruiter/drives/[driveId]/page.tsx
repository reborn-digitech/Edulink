import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DownloadSimpleIcon, StarIcon } from "@phosphor-icons/react/ssr";
import { requireRecruiter } from "@/lib/recruiters";
import { recruiterDrive } from "@/lib/placement-recruiter";
import { AccessError } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/field";
import { Flash, LINK, ROUND_KIND_KEY, packageRange, statusBadge } from "@/components/placement/parts";
import { Applicants, JoinedForms, OfferForm, ResultsForm } from "@/components/placement/rounds";
import { recruiterFeedbackAction } from "@/app/(app)/placement/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("role.recruiter"), robots: { index: false, follow: false } };
}

/**
 * One live drive of the recruiter's company: the eligible count, and only
 * the students who consented by applying, with the record they shared; the
 * shortlist, the rounds and the offers the recruiter records; downloads
 * watermarked and audited; the recruiter's word on the college. A drive that
 * has closed is not found.
 */
export default async function RecruiterDrivePage({ params, searchParams }: { params: Promise<{ driveId: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const t = await getT();
  const ctx = await requireRecruiter();
  const { driveId } = await params;
  const { ok, error } = await searchParams;
  const d = await recruiterDrive(ctx, driveId).catch((e: unknown) => {
    if (e instanceof AccessError) notFound();
    throw e;
  });
  const here = `/recruiter/drives/${d.id}`;
  return (
    <div className="space-y-5">
      <PageHeader title={d.title} description={[d.collegeName, packageRange(d.packageMinRupees, d.packageMaxRupees, t)].join(" · ")} back={{ href: "/recruiter", label: t("role.recruiter") }} />
      <Flash ok={ok} error={error} />
      <Card>
        <CardHeader title={t("placement.aboutDrive")} action={statusBadge(d.status, t)} />
        <CardBody className="space-y-2 text-sm">
          <p>{t("placement.recruiterEligible", { count: d.eligibleCount })}</p>
          {d.rounds.length ? <p className="text-fg-muted">{d.rounds.map((r) => t("placement.roundNamed", { round: r.n, kind: t(ROUND_KIND_KEY[r.kind]!) })).join(" → ")}</p> : null}
          {d.venues ? <p className="text-fg-muted">{d.venues}</p> : null}
          <p className="text-xs text-fg-muted">{t("placement.recruiterConsentNote")}</p>
          <a className={LINK} href={`/api/v1/recruiter/drives/${d.id}/export`}>
            <DownloadSimpleIcon className="mr-1 inline size-4" aria-hidden />
            {t("placement.exportApplicants")}
          </a>
        </CardBody>
      </Card>
      <Applicants applications={d.applicants} t={t} showCollege={d.kind === "POOLED"} />
      {d.applicants.length ? (
        <Card>
          <CardHeader title={t("placement.resumesTitle")} description={t("placement.resumesIntro")} />
          <CardBody className="flex flex-wrap gap-3 text-sm">
            {d.applicants.map((a) => (
              <a key={a.id} className={LINK} href={`/api/v1/recruiter/drives/${d.id}/resume/${a.studentMembershipId}`} target="_blank" rel="noreferrer">
                {a.studentName}
              </a>
            ))}
          </CardBody>
        </Card>
      ) : null}
      <ResultsForm driveId={d.id} applications={d.applicants} rounds={d.rounds} back={here} t={t} />
      <OfferForm driveId={d.id} applications={d.applicants} back={here} t={t} />
      <JoinedForms applications={d.applicants} back={here} t={t} />
      <Card>
        <CardHeader icon={<StarIcon weight="duotone" className="size-5" />} title={t("placement.feedbackTitle")} description={t("placement.feedbackIntro")} />
        <CardBody>
          <form action={recruiterFeedbackAction} className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <input type="hidden" name="back" value={here} />
            <input type="hidden" name="driveId" value={d.id} />
            <SelectField label={t("placement.fieldRating")} name="rating" defaultValue={String(d.recruiterRating ?? 4)}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
            </SelectField>
            <TextAreaField label={t("placement.fieldCollegeFeedback")} name="feedback" defaultValue={d.recruiterFeedback ?? ""} maxLength={2000} />
            <Button type="submit" size="sm" className="sm:col-span-2 sm:justify-self-start">{t("placement.saveFeedback")}</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
