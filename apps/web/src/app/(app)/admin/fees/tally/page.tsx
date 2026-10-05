import type { Metadata } from "next";
import { FileArrowDownIcon, NotebookIcon } from "@phosphor-icons/react/ssr";
import { TALLY_LEDGERS, TALLY_MAX_DAYS } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { tallyChoices } from "@/lib/tally-export";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateField, SelectField } from "@/components/ui/field";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("tally.title"), robots: { index: false, follow: false } };
}

/**
 * The Tally export (R-2, 5 Oct 2026), for the office and the accounts desk:
 * the receipts and refunds of a span, and a locked payroll month, as a file
 * the accountant imports into Tally. Export only; money never touches the
 * platform (decision 0003). Each form asks the export door directly, which
 * answers with the file and audits it.
 */
export default async function TallyPage() {
  const ctx = await requireRole("ADMIN", "ACCOUNTS");
  const t = await getT();
  const choices = await tallyChoices(ctx);
  const from = `${choices.today.slice(0, 7)}-01`;
  const ledgers = Object.entries(TALLY_LEDGERS).filter(([k]) => k !== "feesPrefix").map(([, v]) => v);
  const format = (
    <SelectField name="format" label={t("tally.fieldFormat")} defaultValue="XML">
      <option value="XML">{t("tally.formatXML")}</option>
      <option value="CSV">{t("tally.formatCSV")}</option>
    </SelectField>
  );
  return (
    <div className="space-y-5">
      <PageHeader title={t("tally.title")} description={t("tally.intro")} back={{ href: "/admin/fees", label: t("collegeOffice.navFeeLedger") }} />
      <Card>
        <CardHeader icon={<FileArrowDownIcon weight="duotone" className="size-5" />} title={t("tally.receiptsTitle")} description={t("tally.receiptsIntro", { days: TALLY_MAX_DAYS })} />
        <CardBody>
          <form method="get" action="/api/v1/tally/receipts" className="grid gap-3 sm:grid-cols-4">
            <DateField name="from" label={t("tally.fieldFrom")} required defaultValue={from} max={choices.today} />
            <DateField name="to" label={t("tally.fieldTo")} required defaultValue={choices.today} max={choices.today} />
            {format}
            <div className="flex items-end">
              <Button type="submit">{t("tally.download")}</Button>
            </div>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<FileArrowDownIcon weight="duotone" className="size-5" />} title={t("tally.payrollTitle")} description={t("tally.payrollIntro")} />
        <CardBody>
          {!choices.payrollOn ? (
            <p className="text-sm text-fg-muted">{t("tally.payrollOff")}</p>
          ) : choices.lockedMonths.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("tally.noLockedMonths")}</p>
          ) : (
            <form method="get" action="/api/v1/tally/payroll" className="grid gap-3 sm:grid-cols-3">
              <SelectField name="month" label={t("tally.fieldMonth")} required defaultValue={choices.lockedMonths[0]}>
                {choices.lockedMonths.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </SelectField>
              {format}
              <div className="flex items-end">
                <Button type="submit">{t("tally.download")}</Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<NotebookIcon weight="duotone" className="size-5" />} title={t("tally.ledgersTitle")} description={t("tally.ledgersIntro")} />
        <CardBody className="space-y-2 text-sm">
          <ul className="grid gap-1 sm:grid-cols-2">
            {ledgers.map((l) => (
              <li key={l} className="font-mono">{l}</li>
            ))}
            <li className="font-mono">{`${TALLY_LEDGERS.feesPrefix}…`}</li>
          </ul>
          <p className="text-fg-muted">{t("tally.untested")}</p>
        </CardBody>
      </Card>
    </div>
  );
}
