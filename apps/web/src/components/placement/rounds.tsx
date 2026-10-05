import { CheckCircleIcon, ListChecksIcon, SealCheckIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { ROUND_OUTCOMES, type DriveApplicationView, type DriveRound } from "@edulink/contracts";
import type { Translate } from "@/lib/i18n/dictionary";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { joinedAction, offerAction, resultsAction } from "@/app/(app)/placement/actions";
import { OUTCOME_KEY, ROUND_KIND_KEY, TABLE, TD, TH, applicationBadge, lpa, offerLine } from "./parts";
import { TableScroll } from "@/components/ui/table-scroll";

/**
 * A drive's applicants and what is recorded about them — the host cell's
 * page and the bound recruiter's draw the same pieces: the list with each
 * applicant's shared record and where they stand, a round's outcomes entered
 * in one table (round 0 the shortlist), an offer with its letter, and the
 * day an accepted offer's student joined.
 */
export function Applicants({ applications, t, showCollege }: { applications: DriveApplicationView[]; t: Translate; showCollege: boolean }) {
  return (
    <Card>
      <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={t("placement.applicantsTitle", { count: applications.length })} description={t("placement.applicantsIntro")} />
      <CardBody className="p-0">
        {applications.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-fg-muted">{t("placement.noApplicants")}</p>
        ) : (
          <TableScroll>
            <table className={TABLE}>
              <thead>
                <tr className="border-b border-border">
                  <th className={TH}>{t("placement.colStudent")}</th>
                  {showCollege ? <th className={TH}>{t("placement.colCollege")}</th> : null}
                  <th className={TH}>{t("placement.colCgpa")}</th>
                  <th className={TH}>{t("placement.colBacklogs")}</th>
                  <th className={TH}>{t("placement.colProgramme")}</th>
                  <th className={TH}>{t("placement.colStatus")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td className={TD}>
                      {a.studentName}
                      {a.skills.length ? <div className="text-xs text-fg-muted">{a.skills.slice(0, 6).join(", ")}</div> : null}
                      {a.offer ? <div className="text-xs text-ok">{offerLine(a.offer, t)}</div> : null}
                    </td>
                    {showCollege ? <td className={TD}>{a.schoolName}</td> : null}
                    <td className={TD}>{a.record.cgpa === null ? "—" : a.record.cgpa.toFixed(2)}</td>
                    <td className={TD}>{a.record.liveBacklogs ?? "—"}</td>
                    <td className={TD}>{a.record.programmeName ?? "—"}</td>
                    <td className={TD}>{applicationBadge(a, t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </CardBody>
    </Card>
  );
}

const live = (a: DriveApplicationView) => a.status !== "WITHDRAWN" && a.status !== "REJECTED" && a.consentAt !== null;

/** One round's outcomes: a select per live candidate; a blank one is left out of this round. */
export function ResultsForm({ driveId, applications, rounds, back, t }: { driveId: string; applications: DriveApplicationView[]; rounds: DriveRound[]; back: string; t: Translate }) {
  const candidates = applications.filter((a) => live(a) && a.status !== "SELECTED");
  if (candidates.length === 0) return null;
  return (
    <Card>
      <CardHeader icon={<ListChecksIcon weight="duotone" className="size-5" />} title={t("placement.resultsTitle")} description={t("placement.resultsIntro")} />
      <CardBody>
        <form action={resultsAction} className="space-y-4">
          <input type="hidden" name="back" value={back} />
          <input type="hidden" name="driveId" value={driveId} />
          <SelectField label={t("placement.fieldRound")} name="round" defaultValue="0" className="max-w-xs">
            <option value="0">{t("placement.roundShortlist")}</option>
            {rounds.map((r) => (
              <option key={r.n} value={r.n}>
                {t("placement.roundNamed", { round: r.n, kind: t(ROUND_KIND_KEY[r.kind]!) })}
              </option>
            ))}
          </SelectField>
          <ul className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
            {candidates.map((a) => (
              <li key={a.id} className="grid gap-2 p-3 sm:grid-cols-[1fr_12rem_1fr] sm:items-end">
                <div className="text-sm">
                  <div className="font-medium">{a.studentName}</div>
                  <div className="text-xs text-fg-muted">{applicationBadge(a, t)}</div>
                </div>
                <SelectField label={t("placement.fieldOutcome")} name={`outcome_${a.studentMembershipId}`} defaultValue="">
                  <option value="">{t("placement.notThisRound")}</option>
                  {ROUND_OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                      {t(OUTCOME_KEY[o]!)}
                    </option>
                  ))}
                </SelectField>
                <div className="space-y-1">
                  <TextField label={t("placement.fieldFeedback")} name={`feedback_${a.studentMembershipId}`} maxLength={1000} />
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" name={`share_${a.studentMembershipId}`} />
                    {t("placement.fieldShareFeedback")}
                  </label>
                </div>
              </li>
            ))}
          </ul>
          <Button type="submit">{t("placement.saveResults")}</Button>
        </form>
      </CardBody>
    </Card>
  );
}

/** An offer to a candidate still in the drive, with the letter as a PDF or a photo. */
export function OfferForm({ driveId, applications, back, t }: { driveId: string; applications: DriveApplicationView[]; back: string; t: Translate }) {
  const candidates = applications.filter((a) => live(a) && !a.offer);
  if (candidates.length === 0) return null;
  return (
    <Card>
      <CardHeader icon={<SealCheckIcon weight="duotone" className="size-5" />} title={t("placement.offerTitle")} description={t("placement.offerIntro")} />
      <CardBody>
        <form action={offerAction} className="grid gap-4 sm:grid-cols-3 sm:items-end">
          <input type="hidden" name="back" value={back} />
          <input type="hidden" name="driveId" value={driveId} />
          <SelectField label={t("placement.colStudent")} name="studentMembershipId" required>
            {candidates.map((a) => (
              <option key={a.id} value={a.studentMembershipId}>
                {a.studentName}
              </option>
            ))}
          </SelectField>
          <TextField label={t("placement.fieldPackage")} name="package" type="number" step="0.1" min="0" required hint={t("placement.fieldPackageHint")} />
          <TextField label={t("placement.fieldLetter")} name="letter" type="file" accept="application/pdf,image/*" />
          <Button type="submit" className="sm:col-span-3 sm:justify-self-start">
            {t("placement.recordOffer")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

/** The day an accepted offer's student joined, one small form per accepted offer not yet joined. */
export function JoinedForms({ applications, back, t }: { applications: DriveApplicationView[]; back: string; t: Translate }) {
  const accepted = applications.filter((a) => a.offer?.acceptedAt && !a.offer.joinedAt);
  if (accepted.length === 0) return null;
  return (
    <Card>
      <CardHeader icon={<CheckCircleIcon weight="duotone" className="size-5" />} title={t("placement.joinedTitle")} />
      <CardBody className="space-y-3">
        {accepted.map((a) => (
          <form key={a.id} action={joinedAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="back" value={back} />
            <input type="hidden" name="offerId" value={a.offer!.id} />
            <div className="min-w-48 text-sm">
              <div className="font-medium">{a.studentName}</div>
              <div className="text-xs text-fg-muted">{lpa(a.offer!.packageRupees, t)}</div>
            </div>
            <DateField label={t("placement.fieldJoinedOn")} name="joinedOn" required />
            <Button type="submit" size="sm" variant="secondary">
              {t("placement.recordJoined")}
            </Button>
          </form>
        ))}
      </CardBody>
    </Card>
  );
}
