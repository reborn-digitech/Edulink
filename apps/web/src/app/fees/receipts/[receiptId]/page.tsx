import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { receiptFor } from "@/lib/fees-payments";
import { formatDate } from "@/lib/dates";
import { formatPaise } from "@edulink/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { PrintButton } from "@/app/certificate/[recordId]/print-button";
import { FEE_METHOD_KEY } from "@/app/(app)/parent/fees/labels";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.feeReceipt"), robots: { index: false, follow: false } };
}

/**
 * A fee receipt, as a document.
 *
 * THE SNAPSHOT IS THE DOCUMENT. Everything printed here was frozen the
 * moment the receipt was numbered — school name, pupil, class, the lines and
 * their heads — so a later rename changes nothing on paper already handed
 * across the counter. Only two things are read live: whether the payment
 * was since reversed, and whether any of it went back — both banners, not
 * edits, because the ledger is append-only.
 *
 * WHO MAY OPEN IT is settled in `receiptFor`: the issuing office, or an
 * active guardian of the pupil named. Anybody else, and any guessed id,
 * gets the same 404. No shell, no nav: a document for printing.
 */
export default async function FeeReceiptPage({ params }: { params: Promise<{ receiptId: string }> }) {
  const session = await requireUser();
  const t = await getT();
  const locale = await getLocale();
  const latin = locale === "en";
  const { receiptId } = await params;
  const receipt = await receiptFor(session, receiptId);
  if (!receipt) notFound();

  const school = await db.school.findUnique({ where: { id: receipt.schoolId }, select: { timezone: true, logoPath: true } });
  const timezone = school?.timezone ?? "UTC";
  const { snapshot } = receipt;
  const money = (paise: number) => formatPaise(paise, locale, { always: true });
  const dash = "—";
  const method = FEE_METHOD_KEY[snapshot.payment.method] ? t(FEE_METHOD_KEY[snapshot.payment.method]!) : snapshot.payment.method;
  const methodLine = snapshot.payment.gatewayMethod ? `${method} · ${snapshot.payment.gatewayMethod}` : method;
  const backHref = session.role === "PARENT" ? "/parent/fees" : "/admin/fees";

  const facts: { label: string; value: string }[] = [
    { label: t("fees.receiptSerial"), value: receipt.serial },
    { label: t("fees.receiptDate"), value: formatDate(new Date(snapshot.payment.paidAt), timezone) },
    { label: t("fees.receiptPupil"), value: snapshot.pupil.name || dash },
    { label: t("fees.receiptCode"), value: snapshot.pupil.studentCode ?? dash },
    { label: t("fees.receiptClass"), value: snapshot.pupil.className ?? snapshot.pupil.gradeLevel ?? dash },
    { label: t("fees.receiptYear"), value: snapshot.year || dash },
  ];

  return (
    <div className="min-h-safe bg-bg px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 print:hidden">
        <Link href={backHref} className="text-sm font-medium text-fg-muted hover:text-fg">
          ← {t("fees.receiptBack")}
        </Link>
        <PrintButton label={t("fees.receiptPrint")} />
      </div>

      <article
        data-testid="fee-receipt"
        className="mx-auto max-w-[210mm] rounded-[--radius-lg] border border-border bg-white p-10 text-[#111] shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <header className="flex items-start gap-4 border-b-2 border-[#111] pb-4">
          {school?.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/files/${school.logoPath}`} alt="" className="size-16 object-contain" />
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{snapshot.school.name}</h1>
            {(snapshot.school.addressLine || snapshot.school.city) && (
              <p className="text-sm text-[#444]">{[snapshot.school.addressLine, snapshot.school.city].filter(Boolean).join(", ")}</p>
            )}
            {snapshot.school.contactPhone && <p className="text-sm text-[#444]">{snapshot.school.contactPhone}</p>}
          </div>
          <div className="text-right text-xs text-[#444]">
            <p className={`font-semibold uppercase ${latin ? "tracking-widest" : ""}`}>{t("fees.receiptSerial")}</p>
            <p className="font-mono text-sm text-[#111]" data-testid="receipt-serial">
              {receipt.serial}
            </p>
          </div>
        </header>

        <h2 className={`mt-8 text-center text-xl font-bold uppercase ${latin ? "tracking-[0.2em]" : ""}`}>{t("fees.receiptDocTitle")}</h2>

        {receipt.reversed && (
          <p className="mt-4 border-2 border-[#b00020] px-4 py-2 text-center text-sm font-bold uppercase text-[#b00020]" data-testid="receipt-reversed">
            {t("fees.receiptReversedBanner", { reason: receipt.reversalReason ?? dash })}
          </p>
        )}
        {receipt.refundedPaise > 0 && (
          <p className="mt-4 border-2 border-[#8a6d00] px-4 py-2 text-center text-sm font-bold text-[#8a6d00]" data-testid="receipt-refunded">
            {t("fees.receiptRefundedBanner", { amount: money(receipt.refundedPaise) })}
          </p>
        )}

        <dl className="mt-6 grid grid-cols-[minmax(10rem,auto)_1fr] border-t border-[#bbb] text-sm">
          {facts.map((row) => (
            <div key={row.label} className="contents">
              <dt className="border-b border-[#ddd] py-2 pr-4 text-[#444]">{row.label}</dt>
              <dd className="border-b border-[#ddd] py-2 font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>

        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-[#111] text-left text-xs uppercase text-[#444]">
              <th className="py-2 pr-3 font-semibold">{t("fees.receiptFor")}</th>
              <th className="py-2 pr-3 font-semibold">{t("fees.receiptHead")}</th>
              <th className="py-2 text-right font-semibold">{t("fees.receiptAmount")}</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.lines.map((line, i) => (
              <tr key={i} className="border-b border-[#ddd]">
                <td className="py-2 pr-3">{line.demandLabel}</td>
                <td className="py-2 pr-3 text-[#444]">
                  {line.head}
                  {line.code ? ` (${line.code})` : ""}
                </td>
                <td className="py-2 text-right tabular-nums">{money(line.amountPaise)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#111]">
              <td colSpan={2} className="py-2 pr-3 font-bold">
                {t("fees.receiptTotal")}
              </td>
              <td className="py-2 text-right font-bold tabular-nums" data-testid="receipt-total">
                {money(snapshot.payment.amountPaise)}
              </td>
            </tr>
          </tfoot>
        </table>

        <dl className="mt-6 grid grid-cols-[minmax(10rem,auto)_1fr] text-sm">
          <dt className="py-1 pr-4 text-[#444]">{t("fees.receiptMethod")}</dt>
          <dd className="py-1 font-medium">{methodLine}</dd>
          <dt className="py-1 pr-4 text-[#444]">{t("fees.receiptReference")}</dt>
          <dd className="py-1 font-mono">{snapshot.payment.reference ?? dash}</dd>
          <dt className="py-1 pr-4 text-[#444]">{t("fees.receiptTakenBy")}</dt>
          <dd className="py-1 font-medium">{snapshot.payment.collectedBy ?? dash}</dd>
          {snapshot.payment.note && (
            <>
              <dt className="py-1 pr-4 text-[#444]">{t("fees.takeNote")}</dt>
              <dd className="py-1">{snapshot.payment.note}</dd>
            </>
          )}
        </dl>

        {snapshot.school.bankNote && <p className="mt-8 whitespace-pre-wrap border-t border-[#bbb] pt-3 text-xs leading-relaxed text-[#444]">{snapshot.school.bankNote}</p>}

        <p className="mt-6 text-[0.7rem] leading-relaxed text-[#666]">{t("fees.receiptFooter", { school: snapshot.school.name })}</p>
      </article>
    </div>
  );
}
