import type { Metadata } from "next";
import Link from "next/link";
import { BuildingsIcon, EnvelopeSimpleIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { PLACEMENT_SECTORS } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { listCompanies, listRequirements } from "@/lib/placement";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextField } from "@/components/ui/field";
import { CellFrame, LINK, ROUND_KIND_KEY, SECTOR_KEY, TABLE, TD, TH, cellContext, lpa } from "@/components/placement/parts";
import { acceptRequirementAction, addCompanyAction, inviteRecruiterAction, verifyCompanyAction } from "../actions";
import { TableScroll } from "@/components/ui/table-scroll";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("placement.tabCompanies"), robots: { index: false, follow: false } };
}

/**
 * The companies the college works with — the same company row on every
 * college, by its GSTIN or CIN — with the TPO's verification, the year it
 * first came, its drives and the college's alumni who work there; and the
 * recruiters' requirements addressed to this college, each to be made a drive.
 */
export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, on, college, canWrite } = await cellContext();
  const { ok, error } = await searchParams;
  if (!on) return <CellFrame t={t} on={false} college={college} current="companies" title={t("placement.tabCompanies")}>{null}</CellFrame>;
  const [{ companies }, { requirements }, alumni] = await Promise.all([listCompanies(ctx), listRequirements(ctx), db.alumniCompanyLink.groupBy({ by: ["companyId"], where: { schoolId: ctx.schoolId }, _count: { _all: true } })]);
  const alumniAt = new Map(alumni.map((a) => [a.companyId, a._count._all]));
  const back = "/placement/companies";
  return (
    <CellFrame t={t} on college={college} current="companies" title={t("placement.tabCompanies")} description={t("placement.companiesIntro")} ok={ok} error={error}>
      <Card>
        <CardHeader icon={<EnvelopeSimpleIcon weight="duotone" className="size-5" />} title={t("placement.requirementsTitle", { count: requirements.length })} description={t("placement.requirementsIntro")} />
        <CardBody className="space-y-3">
          {requirements.length === 0 ? <p className="text-sm text-fg-muted">{t("placement.noRequirements")}</p> : null}
          {requirements.map((r) => (
            <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-[var(--radius-md)] border border-border p-3 text-sm">
              <div className="space-y-1">
                <div className="font-medium">
                  {r.role} · {r.companyName} {r.companyVerified ? null : <Badge tone="warn">{t("placement.unverified")}</Badge>}
                </div>
                <div className="text-fg-muted">
                  {lpa(r.packageRupees, t)}
                  {r.locations ? ` · ${r.locations}` : ""}
                  {r.bond ? ` · ${t("placement.bondShort", { bond: r.bond })}` : ""}
                </div>
                {r.rounds.length ? <div className="text-xs text-fg-muted">{r.rounds.map((x) => t(ROUND_KIND_KEY[x.kind]!)).join(" → ")}</div> : null}
                {r.datesProposed ? <div className="text-xs text-fg-muted">{t("placement.datesProposed", { dates: r.datesProposed })}</div> : null}
              </div>
              {r.driveId ? (
                <Link className={LINK} href={`/placement/drives/${r.driveId}`}>
                  {t("placement.openTheDrive")}
                </Link>
              ) : canWrite ? (
                <ActionForm action={acceptRequirementAction}>
                  <input type="hidden" name="back" value={back} />
                  <input type="hidden" name="requirementId" value={r.id} />
                  <Button type="submit" size="sm" disabled={!r.companyVerified}>
                    {t("placement.acceptRequirement")}
                  </Button>
                </ActionForm>
              ) : null}
            </div>
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<BuildingsIcon weight="duotone" className="size-5" />} title={t("placement.companiesTitle", { count: companies.length })} />
        <CardBody className="p-0">
          <TableScroll>
            <table className={TABLE}>
              <thead>
                <tr className="border-b border-border">
                  <th className={TH}>{t("placement.colCompany")}</th>
                  <th className={TH}>{t("placement.colIdentifier")}</th>
                  <th className={TH}>{t("placement.colSectors")}</th>
                  <th className={TH}>{t("placement.colFirstVisit")}</th>
                  <th className={TH}>{t("placement.colDrives")}</th>
                  <th className={TH}>{t("placement.colAlumni")}</th>
                  <th className={TH}>{t("placement.colVerified")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {companies.map((c) => (
                  <tr key={c.id}>
                    <td className={TD}>
                      {c.name}
                      <div className="text-xs text-fg-muted">{c.pointOfContact}</div>
                    </td>
                    <td className={TD}>{c.identifier}</td>
                    <td className={TD}>{c.sectors.map((s) => t(SECTOR_KEY[s] ?? "placement.sectorOTHER")).join(", ")}</td>
                    <td className={TD}>{c.firstVisitYear ?? "—"}</td>
                    <td className={TD}>{c.drives}</td>
                    <td className={TD}>{alumniAt.get(c.id) ?? 0}</td>
                    <td className={TD}>
                      {c.verifiedAt ? (
                        <div className="space-y-2">
                          <Badge tone="ok">{t("placement.verified")}</Badge>
                          {/* TA-090: no recruiter accepted yet; the cell that verified it invites one (the server refuses any other cell). */}
                          {canWrite && c.recruiters === 0 ? (
                            <ActionForm action={inviteRecruiterAction} className="flex flex-wrap items-end gap-2">
                              <input type="hidden" name="back" value={back} />
                              <input type="hidden" name="companyId" value={c.id} />
                              <TextField label={t("placement.fieldColleagueEmail")} name="email" type="email" required maxLength={200} hint={t("placement.inviteRecruiterHint")} />
                              <Button type="submit" size="sm" variant="secondary">
                                {t("placement.inviteRecruiter")}
                              </Button>
                            </ActionForm>
                          ) : null}
                        </div>
                      ) : canWrite ? (
                        <ActionForm action={verifyCompanyAction}>
                          <input type="hidden" name="back" value={back} />
                          <input type="hidden" name="companyId" value={c.id} />
                          <Button type="submit" size="sm" variant="secondary">
                            {t("placement.verify")}
                          </Button>
                        </ActionForm>
                      ) : (
                        <Badge tone="warn">{t("placement.unverified")}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </CardBody>
      </Card>
      {canWrite ? (
        <Card>
          <CardHeader icon={<PlusIcon weight="bold" className="size-5" />} title={t("placement.addCompany")} description={t("placement.addCompanyIntro")} />
          <CardBody>
            <ActionForm action={addCompanyAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="back" value={back} />
              <TextField label={t("placement.fieldCompanyName")} name="name" required maxLength={160} />
              <TextField label={t("placement.fieldIdentifier")} name="identifier" required maxLength={30} hint={t("placement.fieldIdentifierHint")} />
              <TextField label={t("placement.fieldPointOfContact")} name="pointOfContact" required maxLength={200} className="sm:col-span-2" />
              <fieldset className="grid gap-1 text-sm sm:col-span-2 sm:grid-cols-3">
                <legend className="mb-1 font-medium">{t("placement.fieldSectors")}</legend>
                {PLACEMENT_SECTORS.map((s) => (
                  <label key={s} className="flex items-center gap-2">
                    <input type="checkbox" name="sectors" value={s} />
                    {t(SECTOR_KEY[s]!)}
                  </label>
                ))}
              </fieldset>
              <Button type="submit" className="sm:justify-self-start">
                {t("placement.addCompany")}
              </Button>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
    </CellFrame>
  );
}
