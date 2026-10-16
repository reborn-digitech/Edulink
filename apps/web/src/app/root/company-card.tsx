import { IdentificationCardIcon } from "@phosphor-icons/react/ssr";
import { COMPANY_FIELD_KEY, COMPANY_RUNBOOK_URL, company, companyDetailsMissing, companyRequiredMissing } from "@/lib/company";
import { getT } from "@/lib/i18n/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * The operator's home (/root): which of the company's details the home page still lacks (company-site, 16 Oct 2026).
 * Shown until every required one is set (src/lib/company.ts COMPANY_REQUIRED); it names everything still unset, and
 * links to the runbook section that lists the variables. Nothing is filled in for the owner.
 */
export async function CompanyDetailsCard() {
  const c = company();
  if (companyRequiredMissing(c).length === 0) return null;
  const t = await getT();
  const missing = companyDetailsMissing(c);
  return (
    <Card data-testid="company-details-card">
      <CardHeader
        icon={<IdentificationCardIcon weight="duotone" className="size-5" />}
        title={t("company.missingTitle")}
        description={t("company.missingRequired")}
        action={
          <Button asChild size="sm" variant="ghost">
            <a href={COMPANY_RUNBOOK_URL} target="_blank" rel="noreferrer">
              {t("company.missingHow")}
            </a>
          </Button>
        }
      />
      <CardBody>
        <p className="text-sm leading-relaxed text-fg-muted">
          {t("company.missingBody", { fields: missing.map((field) => t(COMPANY_FIELD_KEY[field])).join(", ") })}
        </p>
      </CardBody>
    </Card>
  );
}
