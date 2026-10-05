import type { Metadata } from "next";
import Link from "next/link";
import { HandCoinsIcon } from "@phosphor-icons/react/ssr";
import { isCollegeKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { myScholarships } from "@/lib/scholarships";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { CATEGORY_KEY, CLAIM_STATUS_KEY, Flash, Hidden, NotCollege, SCHEME_KEY, Table, money } from "@/components/college-office/parts";
import { claimDocumentAction } from "../../accounts/actions";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.navScholarships") };
}

/**
 * THE STUDENT'S SCHOLARSHIPS (module SCHOLARSHIPS; 4 Oct 2026): the schemes
 * open to their category and income band, their claims with the portal's id,
 * what was sanctioned and paid, and the documents the portal asks for.
 */
export default async function StudentScholarshipsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("STUDENT");
  const [t, locale, kind] = await Promise.all([getT(), getLocale(), institutionKindOf(ctx.schoolId)]);
  const sp = await searchParams;
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  if (!(await isModuleOn(ctx.schoolId, "SCHOLARSHIPS"))) return <ModuleOff page module="SCHOLARSHIPS" t={t} college />;
  const s = await myScholarships(ctx);
  const back = "/student/scholarships";
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.navScholarships")} description={s.category ? t("collegeOffice.myCategory", { category: t(CATEGORY_KEY(s.category)) }) : t("collegeOffice.noCategory")} />
      <Flash ok={sp.ok} error={sp.error} />
      <Card>
        <CardHeader icon={<HandCoinsIcon weight="duotone" className="size-5" />} title={t("collegeOffice.myClaims")} />
        <CardBody>
          {s.claims.length === 0 ? (
            <EmptyState title={t("collegeOffice.myClaimsEmpty")} description={t("collegeOffice.myClaimsEmptyBody")} action={<Button asChild size="sm" variant="secondary"><Link href="/student/money">{t("collegeOffice.moneyTitle")}</Link></Button>} />
          ) : (
            <Table head={[t("collegeOffice.colScheme"), t("collegeOffice.colPortalId"), t("collegeOffice.colSanctioned"), t("collegeOffice.colDisbursed"), t("collegeOffice.colStatus"), t("collegeOffice.colDocuments")]} testId="my-claims">
              {s.claims.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="py-2 pr-3">{t(SCHEME_KEY(c.scheme))} · {c.academicYear}</td>
                  <td className="py-2 pr-3">{c.portalApplicationId ?? "—"}</td>
                  <td className="py-2 pr-3 tabular-nums">{c.sanctionedPaise === null ? "—" : money(c.sanctionedPaise, locale)}</td>
                  <td className="py-2 pr-3 tabular-nums">{c.disbursedPaise === null ? "—" : money(c.disbursedPaise, locale)}</td>
                  <td className="py-2 pr-3">
                    <Badge tone={c.status === "DISBURSED" ? "ok" : c.status === "LAPSED" || c.status === "REJECTED" ? "danger" : "warn"}>{t(CLAIM_STATUS_KEY(c.status))}</Badge>
                  </td>
                  <td className="py-2">
                    <ul className="text-xs">
                      {c.documents.map((d) => (
                        <li key={d.fileId}>
                          <a className="text-accent-strong hover:underline" href={`/api/files/${d.fileId}`} target="_blank" rel="noreferrer">
                            {d.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                    {c.status === "APPLIED" || c.status === "SANCTIONED" ? (
                      <ActionForm action={claimDocumentAction} encType="multipart/form-data" className="mt-2 flex flex-wrap items-end gap-2">
                        <Hidden fields={{ back, claimId: c.id }} />
                        <SelectField name="key" label={t("collegeOffice.colDocument")}>
                          {["income", "caste", "domicile", "fee_receipt", "bank_passbook", "marksheet", "other"].map((k) => (
                            <option key={k} value={k}>
                              {t(`collegeOffice.claimDoc_${k}` as TranslationKey)}
                            </option>
                          ))}
                        </SelectField>
                        <input type="file" name="file" required accept="image/png,image/jpeg,application/pdf" className="text-xs" aria-label={t("collegeOffice.attachScan")} />
                        <Button type="submit" size="sm" variant="secondary">{t("collegeOffice.add")}</Button>
                      </ActionForm>
                    ) : null}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t("collegeOffice.schemesTitle")} description={t("collegeOffice.schemesIntro")} />
        <CardBody>
          <Table head={[t("collegeOffice.colScheme"), t("collegeOffice.colIncome"), t("collegeOffice.colCovers"), ""]}>
            {s.schemes.filter((x) => x.scheme !== "OTHER").map((x) => (
              <tr key={x.scheme}>
                <td className="py-2 pr-3">{t(SCHEME_KEY(x.scheme))}</td>
                <td className="py-2 pr-3 tabular-nums">{x.incomeCeilingRupees === null ? "—" : money(x.incomeCeilingRupees * 100, locale)}</td>
                <td className="py-2 pr-3 tabular-nums">{x.coversPercent > 0 ? `${x.coversPercent} %` : "—"}</td>
                <td className="py-2">{x.eligible ? <Badge tone="ok">{t("collegeOffice.openToYou")}</Badge> : null}</td>
              </tr>
            ))}
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
