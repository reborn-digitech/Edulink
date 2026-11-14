import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, DownloadSimpleIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { certificateView } from "@/lib/certificates";
import { formatDate } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { PrintButton } from "../../reports/[studentMembershipId]/print-button";
import { RevokeForm } from "./revoke-form";
import { SignPaper } from "@/components/certificates/sign-paper";
import { fontStack, paragraphFont } from "@/lib/fonts";
import { TableScroll } from "@/components/ui/table-scroll";
import { wordsFor } from "@/lib/certificate-rules";
import { signerLine } from "@/lib/signer-line";
import type { WordsLocale } from "@/lib/words";

/**
 * The address a printed page names for its check: the configured app address, else the host this page was served
 * on. A paper that leaves the screen cannot follow "/certificates/check" (A3-journeys-30); the PDF already printed the
 * whole address.
 */
async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return host ? `${proto}://${host}` : "";
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("certificates.metaTitle"), robots: { index: false, follow: false } };
}

/**
 * One issued certificate, as it will be printed.
 *
 * THE WORDING IS FROZEN: what this page shows is what was filled at issue,
 * in the language the template was written in — hence `lang` on the article,
 * so a Hindi document is read as Hindi by a screen reader and hyphenated as
 * such by the browser. The reader's own language is on the chrome around it.
 *
 * `certificateView` throws for a reader who may not see it — another
 * school's office, a classmate, a guessed id — and this renders that as a
 * 404. Not "forbidden": a document somebody may not read should not confirm
 * that it exists.
 */
export default async function CertificatePage({ params, searchParams }: { params: Promise<{ certificateId: string }>; searchParams: Promise<{ from?: string }> }) {
  const session = await requireUser();
  const t = await getT();
  const readerLocale = await getLocale();
  const { certificateId } = await params;
  const { from } = await searchParams;
  const backHref = from && from.startsWith("/") && !from.startsWith("//") && !from.includes("\\") ? from : session.role === "PARENT" ? "/parent/certificates" : session.role === "STUDENT" ? "/student/certificates" : "/admin/certificates/issued";

  let cert;
  try {
    cert = await certificateView(session, certificateId);
  } catch {
    notFound();
  }

  const { layout, school } = cert;
  const logoUrl = layout.showLogo && school.logoPath ? `/api/files/${school.logoPath}` : null;
  const brand = layout.useBrandColour && school.brandPrimary ? { color: school.brandPrimary } : undefined;
  const addressLine = [school.addressLine, school.city, school.region, school.postalCode].filter(Boolean).join(", ");
  const contactLine = [school.contactPhone, school.contactEmail].filter(Boolean).join(" · ");
  const staff = session.role === "ADMIN" || session.role === "PRINCIPAL" || session.role === "TEACHER";
  // The dictionary's keys cannot hold a dot: "record.conduct" is filed as "record_conduct".
  const missingLabels = cert.missing.map((key) => t(`certificatePlaceholders.${key.replace(".", "_")}` as TranslationKey));
  const latin = cert.locale === "en";
  const muted = "text-fg-muted print:text-black/70";
  // The line naming who signed is part of the sheet, so it is in the paper's language, as the PDF prints it (TA-326).
  const paperWords = wordsFor(cert.locale as WordsLocale);

  return (
    <article lang={cert.locale} className="mx-auto max-w-2xl print:max-w-none" data-testid="certificate-document">
      <style>{`@page { size: ${layout.paper === "LETTER" ? "letter" : "A4"}; margin: 16mm }`}</style>

      {/* Off the sheet: the way back, the file, the printer, and the office's revoke. */}
      <div lang={readerLocale} className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
          <ArrowLeftIcon weight="bold" className="size-4" />
          {t("common.back")}
        </Link>
        <span className="flex flex-wrap items-center gap-2">
          <a href={`/api/v1/shared/certificates/${cert.id}/pdf`} target="_blank" rel="noopener" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-accent-strong underline underline-offset-2 hover:text-accent" data-testid="download-pdf">
            <DownloadSimpleIcon weight="bold" className="size-4" aria-hidden="true" />
            {t("certificates.downloadPdf")}
          </a>
          <PrintButton />
        </span>
      </div>

      {staff && cert.missing.length > 0 && (
        <p className="mb-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-warn print:hidden" data-testid="missing-banner">
          <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{t("certificates.missingWarning", { fields: missingLabels.join(", ") })}</span>
        </p>
      )}

      {/* The reader whose signature this paper waits for signs it here, having read it. */}
      {!cert.revokedAt &&
        cert.signatures
          .filter((s) => s.can.decide)
          .map((s) => (
            <div key={s.id} lang={readerLocale} className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft px-4 py-3 text-sm text-fg print:hidden" data-testid="signature-waits">
              <span>{t("signatures.yourWord")}</span>
              <SignPaper signatureId={s.id} label={[cert.studentName, cert.title].join(", ")} />
            </div>
          ))}

      {cert.revokedAt && (
        <p className="mb-4 rounded-[var(--radius-md)] border border-danger/40 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger print:border-black print:bg-transparent print:text-black" data-testid="revoked-banner">
          {t("certificates.revokedBanner", { date: formatDate(new Date(cert.revokedAt)), reason: cert.revokedReason ?? "—" })}
        </p>
      )}

      <div style={{ fontFamily: fontStack(layout.font, cert.locale) }} className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black sm:p-8" data-testid="certificate-sheet">
        {/* ---------------- letterhead ---------------- */}
        <header className="flex items-start gap-4 border-b border-border pb-5 print:border-black/20">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="size-16 shrink-0 rounded-[var(--radius-md)] object-contain" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-fg print:text-black sm:text-2xl" style={brand}>
              {school.name}
            </h1>
            {layout.showAddress && (addressLine || contactLine) && (
              <p className={`text-xs ${muted}`}>
                {addressLine}
                {addressLine && contactLine ? " · " : ""}
                {contactLine}
              </p>
            )}
          </div>
          <div className={`text-right text-xs ${muted}`}>
            <p className="font-mono text-sm text-fg print:text-black" data-testid="certificate-serial">
              {cert.serial}
            </p>
            <p>{formatDate(new Date(cert.issuedAt))}</p>
          </div>
        </header>

        {/* ---------------- the document ---------------- */}
        <h2 className={`mt-8 text-center text-xl font-bold uppercase underline decoration-1 underline-offset-8 text-fg print:text-black ${latin ? "tracking-[0.2em]" : ""}`}>{cert.title}</h2>

        {cert.intro && (
          <p style={{ fontFamily: fontStack(paragraphFont(layout.introFont, layout.font), cert.locale) }} className="mx-auto mt-6 max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-fg print:text-black" data-testid="certificate-intro">
            {cert.intro}
          </p>
        )}

        {cert.rows.length > 0 && (
          <TableScroll className="mt-6 print:overflow-visible">
            <table className="w-full text-sm" data-testid="certificate-rows">
              <tbody>
                {cert.rows.map((row, index) => (
                  <tr key={index} className="border-b border-border/60 print:border-black/10">
                    <td className={`w-8 py-2 pr-2 align-top tabular-nums ${muted}`}>{index + 1}.</td>
                    <th scope="row" className={`py-2 pr-4 text-left align-top font-medium ${muted}`}>
                      {row.label}
                    </th>
                    <td className="py-2 align-top font-medium text-fg print:text-black">{row.value || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}

        {cert.outro && (
          <p style={{ fontFamily: fontStack(paragraphFont(layout.outroFont, layout.font), cert.locale) }} className="mx-auto mt-6 max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-fg print:text-black" data-testid="certificate-outro">
            {cert.outro}
          </p>
        )}

        {/* ---------------- signatures ----------------
            The paper's own copy of each picture, above the line it signs, and the
            seal between them. A line whose signature still waits is printed bare;
            that it waits is said on the screen and not on the sheet. */}
        <section className={`mt-10 grid grid-cols-[1fr_auto_1fr] items-end gap-6 text-center text-xs ${muted}`} data-testid="signatures">
          {(["LEFT", "SEAL", "RIGHT"] as const).map((slot) => {
            if (slot === "SEAL") {
              return (
                <div key={slot} className="w-20">
                  {/* eslint-disable-next-line @next/next/no-img-element -- the paper's own copy, handed over as a data URL */}
                  {cert.seal && <img src={cert.seal} alt={t("signatures.sealTitle")} className="mx-auto size-20 object-contain" data-testid="certificate-seal" />}
                </div>
              );
            }
            const signature = cert.signatures.find((s) => s.slot === slot);
            // Who signed, under the school's caption as typed (TA-326).
            const signer = signerLine(signature, paperWords);
            return (
              <div key={slot}>
                <div className="grid h-14 place-items-end justify-center">
                  {signature?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- the paper's own copy, handed over as a data URL
                    <img src={signature.image} alt={t("signatures.signedBy", { name: signature.signerName ?? "" })} className="max-h-14 max-w-full object-contain" data-testid={`certificate-signature-${slot.toLowerCase()}`} />
                  ) : signature ? (
                    <span lang={readerLocale} className="mb-1 rounded-full border border-border px-2 py-0.5 text-[0.6875rem] print:hidden" data-testid={`certificate-signature-${slot.toLowerCase()}-${signature.status.toLowerCase()}`}>
                      {t(signature.status === "DECLINED" ? "signatures.declinedLine" : "signatures.awaiting")}
                    </span>
                  ) : null}
                </div>
                <div className="border-t border-border pt-2 print:border-black/40">{slot === "LEFT" ? layout.signatureLeft : layout.signatureRight}</div>
                {signer && (
                  <div className="mt-0.5 text-[0.6875rem]" data-testid={`certificate-signer-${slot.toLowerCase()}`}>
                    {signer}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <footer lang={readerLocale} className={`mt-8 border-t border-border pt-4 text-xs ${muted} print:border-black/20`}>
          {layout.footerNote && <p className="mb-1">{layout.footerNote}</p>}
          <p>{t("certificates.verifyLine", { url: `${await siteOrigin()}/certificates/check`, code: cert.code })}</p>
          <p className="mt-1">
            {[cert.issuedByName ? t("certificates.issuedBy", { name: cert.issuedByName }) : null, t("certificates.issuedOn", { date: formatDate(new Date(cert.issuedAt)) })].filter(Boolean).join(" · ")}
          </p>
        </footer>
      </div>

      {cert.canRevoke && (
        <div lang={readerLocale} className="mt-6 print:hidden">
          <RevokeForm certificateId={cert.id} />
        </div>
      )}
    </article>
  );
}
