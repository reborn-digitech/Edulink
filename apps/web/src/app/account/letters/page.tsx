import type { Metadata } from "next";
import Link from "next/link";
import { EnvelopeSimpleIcon, FilePdfIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { LINK } from "@/components/module-flash";
import { requireUser } from "@/lib/tenancy";
import { myAppointmentLetters } from "@/lib/certificates";
import { SCHOOL_STAFF_ROLES } from "@/lib/staff-records";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("appointmentLetters.mineTitle") };
}

/**
 * My appointment letters (R-2, risks batch 5A, 5 Oct 2026): the letters the
 * office issued to me at the school I am signed in to, each as it prints and
 * as a PDF. Under /account because it is the person's own, as the payslips are.
 */
export default async function MyLettersPage() {
  const ctx = await requireUser();
  const t = await getT();
  const staff = ctx.schoolId && ctx.role && (SCHOOL_STAFF_ROLES as readonly string[]).includes(ctx.role);
  const letters = staff ? (await myAppointmentLetters(ctx)).items : [];
  return (
    <div className="space-y-6">
      <PageHeader title={t("appointmentLetters.mineTitle")} description={t("appointmentLetters.mineIntro")} />
      <Card>
        <CardHeader icon={<EnvelopeSimpleIcon weight="duotone" className="size-5" />} title={t("appointmentLetters.mineListTitle")} />
        <CardBody>
          {letters.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("appointmentLetters.mineNone")} description={staff ? t("appointmentLetters.mineNoneBody") : t("appointmentLetters.mineNotStaff")} />
          ) : (
            <ul className="divide-y divide-border">
              {letters.map((l) => (
                <li key={l.id} className="flex min-h-11 flex-wrap items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <Link href={`/account/letters/${l.id}?from=/account/letters`} className={LINK}>{l.title}</Link>
                    <span className="block text-xs text-fg-muted">{`${l.serial} · ${formatDate(new Date(l.issuedAt), "Asia/Kolkata")}`}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-3">
                    {l.revokedAt ? <Badge tone="danger" size="sm">{t("appointmentLetters.revoked")}</Badge> : null}
                    <a className={`${LINK} inline-flex min-h-11 items-center gap-1.5`} href={`/api/v1/account/appointment-letters/${l.id}/pdf`} target="_blank" rel="noreferrer">
                      <FilePdfIcon className="size-4" aria-hidden /> {t("appointmentLetters.pdf")}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
