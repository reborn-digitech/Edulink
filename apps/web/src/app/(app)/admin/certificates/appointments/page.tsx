import type { Metadata } from "next";
import Link from "next/link";
import { EnvelopeSimpleIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleFlash } from "@/components/module-flash";
import { requireRole } from "@/lib/tenancy";
import { appointmentLettersView } from "@/lib/certificates";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { ROLE_META, type Role } from "@/lib/constants";
import { issueAppointmentAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("appointmentLetters.title") };
}

/**
 * Appointment letters (R-2, risks batch 5A, 5 Oct 2026): the office issues one
 * to a member of staff from an APPOINTMENT template — filled from the staff
 * record, numbered, frozen — and the letters issued are listed with a link to
 * each as it prints. A template is made from the preset in English, Hindi or
 * Marathi on the templates page.
 */
export default async function AppointmentLettersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const sp = await searchParams;
  const view = await appointmentLettersView(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title={t("appointmentLetters.title")} description={t("appointmentLetters.intro")} back={{ href: "/admin/certificates", label: t("certificates.title") }} />
      <ModuleFlash t={t} params={sp} />
      <Card>
        <CardHeader icon={<SealCheckIcon weight="duotone" className="size-5" />} title={t("appointmentLetters.issueTitle")} description={t("appointmentLetters.issueBody")} />
        <CardBody>
          {view.templates.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("appointmentLetters.noTemplate")} description={t("appointmentLetters.noTemplateBody")} action={ctx.role === "ADMIN" ? <Button asChild variant="secondary"><Link href="/admin/certificates/new">{t("certificates.newTemplate")}</Link></Button> : undefined} />
          ) : (
            <form action={issueAppointmentAction} className="grid gap-4 sm:grid-cols-2">
              <SelectField label={t("appointmentLetters.fieldTemplate")} name="templateId" required>
                {view.templates.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </SelectField>
              <SelectField label={t("appointmentLetters.fieldStaff")} name="staffMembershipId" required>
                {view.staff.map((m) => <option key={m.membershipId} value={m.membershipId}>{[m.name, m.designation ?? (ROLE_META[m.role as Role] ? t(ROLE_META[m.role as Role].labelKey) : m.role)].join(" · ")}</option>)}
              </SelectField>
              <TextField label={t("appointmentLetters.fieldPurpose")} name="purpose" maxLength={200} />
              <TextField label={t("appointmentLetters.fieldRemark")} name="remark" maxLength={200} />
              <div className="sm:col-span-2">
                <Button type="submit">{t("appointmentLetters.issueButton")}</Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<EnvelopeSimpleIcon weight="duotone" className="size-5" />} title={t("appointmentLetters.issuedTitle")} />
        <CardBody>
          {view.letters.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("appointmentLetters.noneIssued")} description={t("appointmentLetters.noneIssuedBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {view.letters.map((l) => (
                <li key={l.id}>
                  <Link href={`/certificates/${l.id}?from=/admin/certificates/appointments`} className="flex min-h-11 flex-wrap items-center justify-between gap-3 py-3 hover:bg-surface-muted/60">
                    <span className="min-w-0">
                      <span className="block font-semibold text-fg">{l.studentName}</span>
                      <span className="block text-xs text-fg-muted">{`${l.serial} · ${formatDate(new Date(l.issuedAt), "Asia/Kolkata")}`}</span>
                    </span>
                    {l.revokedAt ? <Badge tone="danger" size="sm">{t("appointmentLetters.revoked")}</Badge> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
