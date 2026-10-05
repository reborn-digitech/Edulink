import type { Metadata } from "next";
import { HandCoinsIcon } from "@phosphor-icons/react/ssr";
import { isCollegeKind, SCHOLARSHIP_SCHEMES, SCHOLARSHIP_SOURCE, SCHOLARSHIP_STATUSES, type ScholarshipScheme, type ScholarshipStatus } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { listClaims } from "@/lib/scholarships";
import { getLocale, getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { currentAcademicYear } from "@/lib/academic-year";
import { yearKeyOf } from "@/lib/college-office";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { ActionForm } from "@/components/ui/action-form";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { CLAIM_STATUS_KEY, Flash, Hidden, NotCollege, SCHEME_KEY, Table, money } from "@/components/college-office/parts";
import { createClaimAction, updateClaimAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.navScholarships") };
}

/**
 * SCHOLARSHIPS (module SCHOLARSHIPS; 4 Oct 2026): one claim per student,
 * scheme and year, with the portal's application id; sanctioned, disbursed
 * (written on the ledger as the bank credit it is), lapsed or rejected (the
 * student is told and the demand is theirs again); the reconciliation sheet
 * per scheme and year.
 */
export default async function ScholarshipsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; status?: string; scheme?: string }> }) {
  const ctx = await requireRole("ACCOUNTS", "ADMIN", "PRINCIPAL");
  const [t, locale, kind] = await Promise.all([getT(), getLocale(), institutionKindOf(ctx.schoolId)]);
  const sp = await searchParams;
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  if (!(await isModuleOn(ctx.schoolId, "SCHOLARSHIPS"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("collegeOffice.navScholarships")} />
        <ModuleOff module="SCHOLARSHIPS" t={t} college />
      </div>
    );
  }
  const status = (SCHOLARSHIP_STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as ScholarshipStatus) : undefined;
  const scheme = (SCHOLARSHIP_SCHEMES as readonly string[]).includes(sp.scheme ?? "") ? (sp.scheme as ScholarshipScheme) : undefined;
  const year = await currentAcademicYear(ctx.schoolId);
  const yearKey = year ? yearKeyOf(year.startDate) : null;
  const [claims, students] = await Promise.all([
    listClaims(ctx, { ...(status ? { status } : {}), ...(scheme ? { scheme } : {}) }),
    db.membership.findMany({ where: { schoolId: ctx.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null }, orderBy: { user: { name: "asc" } }, take: 1000, select: { id: true, studentCode: true, user: { select: { name: true } } } }),
  ]);
  const canWrite = ctx.role !== "PRINCIPAL";
  const back = `/accounts/scholarships${status || scheme ? `?${new URLSearchParams({ ...(status ? { status } : {}), ...(scheme ? { scheme } : {}) })}` : ""}`;
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.navScholarships")} description={t("collegeOffice.scholarshipsIntro", { source: SCHOLARSHIP_SOURCE.title, dated: SCHOLARSHIP_SOURCE.dated })} />
      <Flash ok={sp.ok} error={sp.error} />
      <Card>
        <CardBody className="flex flex-wrap items-end gap-3 pt-5">
          <form className="flex flex-wrap items-end gap-3">
            <SelectField name="status" label={t("collegeOffice.colStatus")} defaultValue={status ?? ""}>
              <option value="">{t("collegeOffice.all")}</option>
              {SCHOLARSHIP_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(CLAIM_STATUS_KEY(s))}
                </option>
              ))}
            </SelectField>
            <SelectField name="scheme" label={t("collegeOffice.colScheme")} defaultValue={scheme ?? ""}>
              <option value="">{t("collegeOffice.all")}</option>
              {SCHOLARSHIP_SCHEMES.map((s) => (
                <option key={s} value={s}>
                  {t(SCHEME_KEY(s))}
                </option>
              ))}
            </SelectField>
            <Button type="submit" variant="secondary">{t("collegeOffice.filter")}</Button>
          </form>
          {scheme && yearKey ? (
            <Button asChild variant="secondary">
              <a href={`/accounts/export/reconciliation?scheme=${scheme}&year=${yearKey}`} download>
                {t("collegeOffice.reconciliationDownload")}
              </a>
            </Button>
          ) : (
            <p className="text-xs text-fg-muted">{t("collegeOffice.reconciliationHint")}</p>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<HandCoinsIcon weight="duotone" className="size-5" />} title={t("collegeOffice.claimsTitle")} />
        <CardBody>
          {claims.items.length === 0 ? (
            <EmptyState title={t("collegeOffice.claimsEmpty")} description={t("collegeOffice.claimsEmptyBody")} action={<Button asChild size="sm"><a href="#new-claim">{t("collegeOffice.claimNew")}</a></Button>} />
          ) : (
            <Table head={[t("collegeOffice.colName"), t("collegeOffice.colScheme"), t("collegeOffice.colPortalId"), t("collegeOffice.colExpected"), t("collegeOffice.colSanctioned"), t("collegeOffice.colDisbursed"), t("collegeOffice.colStatus"), ""]} testId="scholarship-claims">
              {claims.items.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="py-2 pr-3">{c.studentName}</td>
                  <td className="py-2 pr-3">{t(SCHEME_KEY(c.scheme))} · {c.academicYear}</td>
                  <td className="py-2 pr-3">{c.portalApplicationId ?? "—"}</td>
                  <td className="py-2 pr-3 tabular-nums">{money(c.expectedPaise, locale)}</td>
                  <td className="py-2 pr-3 tabular-nums">{c.sanctionedPaise === null ? "—" : money(c.sanctionedPaise, locale)}</td>
                  <td className="py-2 pr-3 tabular-nums">{c.disbursedPaise === null ? "—" : money(c.disbursedPaise, locale)}</td>
                  <td className="py-2 pr-3">
                    <Badge tone={c.status === "DISBURSED" ? "ok" : c.status === "LAPSED" || c.status === "REJECTED" ? "danger" : "warn"}>{t(CLAIM_STATUS_KEY(c.status))}</Badge>
                    {c.ageDays !== null ? <span className="ml-2 text-xs text-fg-muted">{t("collegeOffice.ageDays", { n: c.ageDays })}</span> : null}
                  </td>
                  <td className="py-2">
                    {canWrite && (c.status === "APPLIED" || c.status === "SANCTIONED") ? (
                      <details>
                        <summary className="cursor-pointer text-sm text-accent-strong">{t("collegeOffice.claimUpdate")}</summary>
                        <div className="mt-2 grid gap-2">
                          <ActionForm action={updateClaimAction} className="flex flex-wrap items-end gap-2">
                            <Hidden fields={{ back, claimId: c.id, action: c.status === "APPLIED" ? "SANCTION" : "DISBURSE" }} />
                            <TextField name="amount" inputMode="decimal" required label={t("collegeOffice.amount")} />
                            <DateField name="on" required label={t("collegeOffice.on")} />
                            {c.status === "SANCTIONED" ? <TextField name="reference" required minLength={3} label={t("collegeOffice.bankReference")} /> : null}
                            <Button type="submit" size="sm">{c.status === "APPLIED" ? t("collegeOffice.sanction") : t("collegeOffice.disburse")}</Button>
                          </ActionForm>
                          <ActionForm action={updateClaimAction} className="flex flex-wrap items-end gap-2">
                            <Hidden fields={{ back, claimId: c.id }} />
                            <SelectField name="action" label={t("collegeOffice.colStatus")}>
                              <option value="LAPSE">{t("collegeOffice.claimLAPSED")}</option>
                              <option value="REJECT">{t("collegeOffice.claimREJECTED")}</option>
                            </SelectField>
                            <TextField name="reason" required minLength={3} label={t("collegeOffice.colReason")} />
                            <Button type="submit" size="sm" variant="danger">{t("collegeOffice.close")}</Button>
                          </ActionForm>
                        </div>
                      </details>
                    ) : null}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </CardBody>
      </Card>
      {canWrite ? (
        <Card id="new-claim">
          <CardHeader title={t("collegeOffice.claimNew")} description={t("collegeOffice.claimNewIntro")} />
          <CardBody>
            {/* The claim forms answer in place (A3-journeys-27): a refusal keeps what was typed, under the box it is about. */}
            <ActionForm action={createClaimAction} className="grid gap-4 sm:grid-cols-2">
              <Hidden fields={{ back }} />
              <SelectField name="studentMembershipId" required label={t("collegeOffice.colName")}>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name} {s.studentCode ? `(${s.studentCode})` : ""}
                  </option>
                ))}
              </SelectField>
              <SelectField name="scheme" required label={t("collegeOffice.colScheme")}>
                {SCHOLARSHIP_SCHEMES.map((s) => (
                  <option key={s} value={s}>
                    {t(SCHEME_KEY(s))}
                  </option>
                ))}
              </SelectField>
              <TextField name="portalApplicationId" minLength={4} label={t("collegeOffice.colPortalId")} />
              <DateField name="appliedOn" label={t("collegeOffice.appliedOn")} />
              <TextField name="expected" inputMode="decimal" label={t("collegeOffice.colExpected")} hint={t("collegeOffice.expectedHint")} />
              <div className="sm:col-span-2">
                <Button type="submit">{t("collegeOffice.claimSave")}</Button>
              </div>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
