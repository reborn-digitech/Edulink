import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon, BuildingsIcon, EnvelopeSimpleIcon, UserCircleIcon, UsersIcon } from "@phosphor-icons/react/ssr";
import { PLACEMENT_SECTORS, ROUND_KINDS } from "@edulink/contracts";
import { requireRecruiter } from "@/lib/recruiters";
import { myRequirements, recruiterColleges, recruiterCompany, recruiterDrives } from "@/lib/placement-recruiter";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { Flash, LINK, ROUND_KIND_KEY, SECTOR_KEY, lpa, packageRange, statusBadge } from "@/components/placement/parts";
import { addColleagueAction, postRequirementAction, registerCompanyAction } from "@/app/(app)/placement/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("role.recruiter") };
}

const BACK = "/recruiter";
const CHECK = "flex items-center gap-2 text-sm";

/**
 * The RECRUITER's home (the placement module, 4 October 2026): an outside
 * account that belongs to no college. First its company — by GSTIN or CIN,
 * format-checked, never looked up; then requirements to the colleges in the
 * placement directory; and, once a college's cell opens a drive for the
 * company, that drive: the eligible count before the visit, and the names
 * only of the students who consent by applying — nothing once it closes.
 */
export default async function RecruiterHome({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const t = await getT();
  const ctx = await requireRecruiter();
  const { ok, error } = await searchParams;
  const [{ company, colleagues }, { drives }, { requirements }, { colleges }] = await Promise.all([recruiterCompany(ctx), recruiterDrives(ctx), myRequirements(ctx), recruiterColleges(ctx)]);
  return (
    <div className="space-y-6">
      <PageHeader title={t("recruiter.homeTitle", { company: company?.name ?? ctx.recruiter.companyName })} description={t("recruiter.homeIntro")} />
      {!ctx.recruiter.emailVerified && <p className="rounded-[--radius-md] border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-fg">{t("recruiter.verifyEmail")}</p>}
      <Flash ok={ok} error={error} />
      {!company ? (
        <Card>
          <CardHeader icon={<BuildingsIcon weight="duotone" className="size-5" />} title={t("placement.registerCompany")} description={t("placement.registerCompanyIntro")} />
          <CardBody>
            <form action={registerCompanyAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="back" value={BACK} />
              <TextField label={t("placement.fieldCompanyName")} name="name" required maxLength={160} defaultValue={ctx.recruiter.companyName} />
              <TextField label={t("placement.fieldIdentifier")} name="identifier" required maxLength={30} hint={t("placement.fieldIdentifierHint")} />
              <TextField label={t("placement.fieldPointOfContact")} name="pointOfContact" required maxLength={200} className="sm:col-span-2" />
              <fieldset className="grid gap-1 text-sm sm:col-span-2 sm:grid-cols-3">
                <legend className="mb-1 font-medium">{t("placement.fieldSectors")}</legend>
                {PLACEMENT_SECTORS.map((s) => (
                  <label key={s} className={CHECK}>
                    <input type="checkbox" name="sectors" value={s} />
                    {t(SECTOR_KEY[s]!)}
                  </label>
                ))}
              </fieldset>
              <Button type="submit" className="sm:justify-self-start">{t("placement.registerCompany")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader icon={<BuildingsIcon weight="duotone" className="size-5" />} title={company.name} description={`${company.identifier} · ${company.sectors.map((s) => t(SECTOR_KEY[s] ?? "placement.sectorOTHER")).join(", ")}`} action={company.verifiedAt ? <Badge tone="ok">{t("placement.verified")}</Badge> : <Badge tone="warn">{t("placement.unverified")}</Badge>} />
            <CardBody className="space-y-3 text-sm">
              <p className="text-fg-muted">{company.verifiedAt ? t("placement.companyVerifiedNote") : t("placement.companyUnverifiedNote")}</p>
              {colleagues.length ? (
                <p className="flex items-center gap-2">
                  <UsersIcon className="size-4" aria-hidden />
                  {colleagues.map((c) => c.name).join(", ")}
                </p>
              ) : null}
              <form action={addColleagueAction} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="back" value={BACK} />
                <TextField label={t("placement.fieldColleagueEmail")} name="email" type="email" required maxLength={200} />
                <Button type="submit" size="sm" variant="secondary">{t("placement.addColleague")}</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<BriefcaseIcon weight="duotone" className="size-5" />} title={t("placement.yourDrives")} />
            <CardBody className="space-y-3 text-sm">
              {drives.length === 0 ? <EmptyState icon={<BriefcaseIcon weight="duotone" className="size-8" />} title={t("recruiter.noDrivesTitle")} description={t("recruiter.noDrivesBody")} /> : null}
              {drives.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[--radius-md] border border-border p-3">
                  <div>
                    <Link className={LINK} href={`/recruiter/drives/${d.id}`}>{d.title}</Link>
                    <div className="text-xs text-fg-muted">
                      {d.collegeName} · {packageRange(d.packageMinRupees, d.packageMaxRupees, t)} · {t("placement.recruiterCounts", { eligible: d.eligibleCount, applicants: d.applicantCount })}
                    </div>
                  </div>
                  {statusBadge(d.status, t)}
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<EnvelopeSimpleIcon weight="duotone" className="size-5" />} title={t("placement.postRequirement")} description={t("placement.postRequirementIntro")} />
            <CardBody>
              {colleges.length === 0 ? (
                <p className="text-sm text-fg-muted">{t("placement.noColleges")}</p>
              ) : (
                <form action={postRequirementAction} className="grid gap-4 sm:grid-cols-2">
                  <input type="hidden" name="back" value={BACK} />
                  <TextField label={t("placement.fieldRole")} name="role" required maxLength={160} />
                  <TextField label={t("placement.fieldPackage")} name="package" type="number" step="0.1" min="0" required hint={t("placement.fieldPackageHint")} />
                  <TextField label={t("placement.fieldBond")} name="bond" maxLength={300} />
                  <TextField label={t("placement.fieldLocations")} name="locations" maxLength={300} />
                  <TextField label={t("placement.fieldCgpaMin")} name="cgpaMin" type="number" step="0.01" min="0" max="10" />
                  <label className={CHECK}><input type="checkbox" name="noLiveBacklogs" />{t("placement.fieldNoBacklogs")}</label>
                  <TextField label={t("placement.fieldDates")} name="datesProposed" maxLength={300} className="sm:col-span-2" />
                  <div className="grid gap-2 sm:col-span-2 sm:grid-cols-4">
                    {[1, 2, 3, 4].map((n) => (
                      <SelectField key={n} label={t("placement.roundN", { round: n })} name="roundKinds" defaultValue="">
                        <option value="">{t("placement.noRound")}</option>
                        {ROUND_KINDS.map((k) => <option key={k} value={k}>{t(ROUND_KIND_KEY[k]!)}</option>)}
                      </SelectField>
                    ))}
                  </div>
                  <fieldset className="grid gap-1 text-sm sm:col-span-2 sm:grid-cols-2">
                    <legend className="mb-1 font-medium">{t("placement.fieldColleges")}</legend>
                    {colleges.map((c) => (
                      <label key={c.id} className={CHECK}>
                        <input type="checkbox" name="targetSchoolIds" value={c.id} />
                        {c.name}{c.city ? ` · ${c.city}` : ""}
                      </label>
                    ))}
                  </fieldset>
                  <Button type="submit" className="sm:justify-self-start">{t("placement.sendRequirement")}</Button>
                </form>
              )}
            </CardBody>
          </Card>

          {requirements.length ? (
            <Card>
              <CardHeader title={t("placement.yourRequirements")} />
              <CardBody className="space-y-2 text-sm">
                {requirements.map((r) => (
                  <div key={r.id}>
                    <span className="font-medium">{r.role}</span> · {lpa(r.packageRupees, t)} · <span className="text-fg-muted">{r.targetSchools.map((s) => s.name).join(", ")}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </>
      )}
      <Card>
        <CardBody className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/account">
              <UserCircleIcon weight="duotone" className="size-5" aria-hidden />
              {t("nav.account")}
            </Link>
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
