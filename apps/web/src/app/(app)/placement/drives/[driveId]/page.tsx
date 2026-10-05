import type { Metadata } from "next";
import { momentFormatter } from "@/lib/school-zone";
import { notFound } from "next/navigation";
import { CalendarBlankIcon, ChatTextIcon, FunnelIcon, InfoIcon } from "@phosphor-icons/react/ssr";
import { DRIVE_STATUSES } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { AccessError } from "@/lib/tenancy";
import { driveEligibility, driveView } from "@/lib/placement";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { CellFrame, DRIVE_KIND_KEY, DRIVE_STATUS_KEY, ROUND_KIND_KEY, TABLE, TD, TH, cellContext, packageRange, reasons, statusBadge } from "@/components/placement/parts";
import { Applicants, JoinedForms, OfferForm, ResultsForm } from "@/components/placement/rounds";
import { inviteAction, moveDriveAction, remindAction, saveRuleAction } from "../../actions";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("placement.tabDrives"), robots: { index: false, follow: false } };
}

/**
 * One drive, for its host's cell: what it is, who qualifies and why not
 * (every failed condition named), the applicants with the record they
 * consented to share, the round results and offers, and the recruiter's word
 * on the college. A pooled drive's guest reads its own students alone.
 */
export default async function DrivePage({ params, searchParams }: { params: Promise<{ driveId: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, on, college } = await cellContext();
  const moment = await momentFormatter(ctx.schoolId);
  const { driveId } = await params;
  const { ok, error } = await searchParams;
  const back = { href: "/placement/drives", label: t("placement.tabDrives") };
  if (!on) return <CellFrame t={t} on={false} college={college} current="drives" title={t("placement.tabDrives")} back={back}>{null}</CellFrame>;
  const [d, elig] = await Promise.all([driveView(ctx, driveId), driveEligibility(ctx, driveId)]).catch((e: unknown) => {
    if (e instanceof AccessError) notFound();
    throw e;
  });
  const here = `/placement/drives/${d.id}`;
  // A drive for a company nobody has checked goes no further than a draft (A3-journeys-12): the page says why and offers only closing.
  const next = DRIVE_STATUSES.slice(DRIVE_STATUSES.indexOf(d.status) + 1).filter((s) => d.companyVerified || s === "CLOSED");
  const liveDrive = ["OPEN", "SHORTLISTING", "ROUNDS", "OFFERS"].includes(d.status);
  return (
    <CellFrame t={t} on college={college} current="drives" title={d.title} description={[d.companyName, t(DRIVE_KIND_KEY[d.kind]!), packageRange(d.packageMinRupees, d.packageMaxRupees, t)].join(" · ")} ok={ok} error={error} back={back}>
      <Card>
        <CardHeader icon={<InfoIcon weight="duotone" className="size-5" />} title={t("placement.aboutDrive")} action={statusBadge(d.status, t)} />
        <CardBody className="space-y-3 text-sm">
          {d.hosted ? null : <p className="text-fg-muted">{t("placement.guestNote", { name: d.hostName })}</p>}
          {d.companyVerified ? null : (
            <p className="flex flex-wrap items-center gap-2" data-testid="drive-unchecked">
              <Badge tone="warn">{t("placement.unverified")}</Badge>
              {t("placement.refuseDriveUnchecked")}
            </p>
          )}
          {d.jd ? <p className="whitespace-pre-line">{d.jd}</p> : null}
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-fg-muted">{t("placement.fieldBond")}</dt>
              <dd>{d.bond || "—"}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">{t("placement.fieldVenues")}</dt>
              <dd>{d.venues || "—"}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">{t("placement.fieldRounds")}</dt>
              <dd>{d.rounds.length ? d.rounds.map((r) => t("placement.roundNamed", { round: r.n, kind: t(ROUND_KIND_KEY[r.kind]!) })).join(" → ") : "—"}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">{t("placement.eligibleCount")}</dt>
              <dd>{t("placement.eligibleOf", { eligible: elig.eligible, total: elig.total })}</dd>
            </div>
            {d.poolSchools.length ? (
              <div className="sm:col-span-2">
                <dt className="text-fg-muted">{t("placement.poolTitle")}</dt>
                <dd>{d.poolSchools.map((s) => s.name).join(", ")}</dd>
              </div>
            ) : null}
          </dl>
          {d.schedule.length ? (
            <ul className="space-y-1">
              {d.schedule.map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CalendarBlankIcon className="size-4 text-fg-muted" aria-hidden />
                  {s.label} · {moment(s.at)}
                </li>
              ))}
            </ul>
          ) : null}
          {d.canEdit ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {next.slice(0, 2).map((s) => (
                <form key={s} action={moveDriveAction}>
                  <input type="hidden" name="back" value={here} />
                  <input type="hidden" name="driveId" value={d.id} />
                  <input type="hidden" name="status" value={s} />
                  <Button type="submit" size="sm" variant={s === "CLOSED" ? "secondary" : "primary"}>
                    {t("placement.moveTo", { status: t(DRIVE_STATUS_KEY[s]!) })}
                  </Button>
                </form>
              ))}
              {next.length > 2 && !next.slice(0, 2).includes("CLOSED") ? (
                <form action={moveDriveAction}>
                  <input type="hidden" name="back" value={here} />
                  <input type="hidden" name="driveId" value={d.id} />
                  <input type="hidden" name="status" value="CLOSED" />
                  <Button type="submit" size="sm" variant="secondary">
                    {t("placement.moveTo", { status: t("placement.statusCLOSED") })}
                  </Button>
                </form>
              ) : null}
            </div>
          ) : null}
          {liveDrive && ctx.role === "TPO" ? (
            <div className="flex flex-wrap gap-2">
              {d.status === "OPEN" && d.companyVerified ? (
                <form action={inviteAction}>
                  <input type="hidden" name="back" value={here} />
                  <input type="hidden" name="driveId" value={d.id} />
                  <Button type="submit" size="sm" variant="soft">
                    {t("placement.inviteEligible")}
                  </Button>
                </form>
              ) : null}
              <form action={remindAction}>
                <input type="hidden" name="back" value={here} />
                <input type="hidden" name="driveId" value={d.id} />
                <Button type="submit" size="sm" variant="ghost">
                  {t("placement.remindApplicants")}
                </Button>
              </form>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<FunnelIcon weight="duotone" className="size-5" />} title={t("placement.eligibilityTitle")} description={t("placement.eligibilityIntro")} />
        <CardBody className="p-0">
          <TableScroll>
            <table className={TABLE}>
              <thead>
                <tr className="border-b border-border">
                  <th className={TH}>{t("placement.colStudent")}</th>
                  <th className={TH}>{t("placement.colCgpa")}</th>
                  <th className={TH}>{t("placement.colBacklogs")}</th>
                  <th className={TH}>{t("placement.colEligible")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {elig.rows.map((r) => (
                  <tr key={r.studentMembershipId}>
                    <td className={TD}>{r.name}</td>
                    <td className={TD}>{r.record.cgpa === null ? "—" : r.record.cgpa.toFixed(2)}</td>
                    <td className={TD}>{r.record.liveBacklogs ?? "—"}</td>
                    <td className={TD}>
                      {r.eligible ? <Badge tone="ok">{t("placement.eligibleYes")}</Badge> : <ul className="list-disc pl-4 text-xs text-fg-muted">{reasons(r.failed, t).map((x) => <li key={x}>{x}</li>)}</ul>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
          {d.canEdit && ["DRAFT", "OPEN"].includes(d.status) ? (
            <form action={saveRuleAction} className="grid gap-3 border-t border-border p-5 sm:grid-cols-3 sm:items-end">
              <input type="hidden" name="back" value={here} />
              <input type="hidden" name="driveId" value={d.id} />
              {d.rule.programmeIds.map((id) => <input key={id} type="hidden" name="programmeIds" value={id} />)}
              {d.rule.genders.map((g) => <input key={g} type="hidden" name="genders" value={g} />)}
              <TextField label={t("placement.fieldCgpaMin")} name="cgpaMin" type="number" step="0.01" min="0" max="10" defaultValue={d.rule.cgpaMin ?? ""} />
              <TextField label={t("placement.fieldBatchYear")} name="batchYear" type="number" defaultValue={d.rule.batchYear ?? ""} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="noLiveBacklogs" defaultChecked={d.rule.noLiveBacklogs} />
                {t("placement.fieldNoBacklogs")}
              </label>
              <Button type="submit" size="sm" variant="secondary" className="sm:justify-self-start">
                {t("placement.saveRule")}
              </Button>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <Applicants applications={d.applications} t={t} showCollege={d.kind === "POOLED"} />
      {d.canEdit && liveDrive ? (
        <>
          <ResultsForm driveId={d.id} applications={d.applications} rounds={d.rounds} back={here} t={t} />
          <OfferForm driveId={d.id} applications={d.applications} back={here} t={t} />
          <JoinedForms applications={d.applications} back={here} t={t} />
        </>
      ) : null}
      {d.recruiterRating !== null ? (
        <Card>
          <CardHeader icon={<ChatTextIcon weight="duotone" className="size-5" />} title={t("placement.recruiterWord", { rating: d.recruiterRating })} />
          <CardBody className="text-sm">{d.recruiterFeedback ?? "—"}</CardBody>
        </Card>
      ) : null}
    </CellFrame>
  );
}
