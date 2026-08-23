import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/tenancy";
import { certificateFor } from "@/lib/school-record";
import { formatDate } from "@/lib/dates";
import { getT, getLocale } from "@/lib/i18n/server";
import { PrintButton } from "./print-button";
import type { TranslationKey } from "@/lib/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("tc.title"), robots: { index: false, follow: false } };
}

const REASON_KEY: Record<string, TranslationKey> = {
  TRANSFERRED: "tc.reasonTransferred",
  GRADUATED: "tc.reasonGraduated",
  LEFT: "tc.reasonLeft",
};
const CONDUCT_KEY: Record<string, TranslationKey> = {
  EXCELLENT: "tc.conductExcellent",
  GOOD: "tc.conductGood",
  SATISFACTORY: "tc.conductSatisfactory",
};

/**
 * The transfer certificate, as a document.
 *
 * THE RECORD PAGE WAS A SCREEN; THE NEXT SCHOOL ASKS FOR PAPER. Every leaver
 * already had a record — reason, dates, attendance — readable by the family
 * and the school that wrote it. What an admitting office asks for is the
 * board-format sheet: serial number, admission number, date of birth as the
 * school held it, class and year left, conduct, the head's signature. This
 * page is that sheet, laid out for A4, with a print button and nothing else
 * on it — no shell, no nav — because everything on it is a fact about one
 * child and the person printing it is handing it across a counter.
 *
 * WHO MAY OPEN IT is settled in `certificateFor`: the child, a guardian, or
 * the issuing office. Anybody else — and any guessed id — gets the same 404.
 */
export default async function CertificatePage({ params }: { params: Promise<{ recordId: string }> }) {
  const session = await requireUser();
  const t = await getT();
  // Tracking splits Devanagari conjuncts ("स्था नां तरण"); it is a Latin flourish only.
  const latin = (await getLocale()) === "en";
  const { recordId } = await params;
  const tc = await certificateFor(session, recordId);
  if (!tc) notFound();

  const dash = "—";
  const rows: { label: string; value: string }[] = [
    { label: t("tc.fieldName"), value: tc.studentName || dash },
    { label: t("tc.fieldAdmissionNo"), value: tc.studentCode ?? dash },
    { label: t("tc.fieldBirthdate"), value: tc.birthdate ? formatDate(tc.birthdate) : dash },
    { label: t("tc.fieldAdmitted"), value: formatDate(tc.joinedAt) },
    { label: t("tc.fieldLeft"), value: formatDate(tc.leftAt) },
    { label: t("tc.fieldClass"), value: tc.className ?? (tc.gradeLevel ? t("tc.gradeOnly", { grade: tc.gradeLevel }) : dash) },
    { label: t("tc.fieldReason"), value: REASON_KEY[tc.reason] ? t(REASON_KEY[tc.reason]!) : tc.reason },
    { label: t("tc.fieldConduct"), value: tc.conduct && CONDUCT_KEY[tc.conduct] ? t(CONDUCT_KEY[tc.conduct]!) : dash },
    {
      label: t("tc.fieldAttendance"),
      value:
        tc.attendancePercent === null
          ? t("tc.attendanceNone")
          : t("tc.attendanceOf", { present: tc.attendancePresent, marked: tc.attendanceMarked, percent: tc.attendancePercent }),
    },
    { label: t("tc.fieldReportCards"), value: String(tc.reportCardCount) },
    { label: t("tc.fieldDestination"), value: tc.destination ?? dash },
    { label: t("tc.fieldRemarks"), value: tc.note ?? dash },
  ];

  return (
    <div className="min-h-safe bg-bg px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 print:hidden">
        <Link href={tc.issuedHere ? "/admin/people?status=LEFT" : "/record"} className="text-sm font-medium text-fg-muted hover:text-fg">
          ← {t("common.back")}
        </Link>
        <PrintButton label={t("tc.print")} />
      </div>

      <article
        data-testid="transfer-certificate"
        className="mx-auto max-w-[210mm] rounded-[--radius-lg] border border-border bg-white p-10 text-[#111] shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <header className="flex items-start gap-4 border-b-2 border-[#111] pb-4">
          {tc.school.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/files/${tc.school.logoPath}`} alt="" className="size-16 object-contain" />
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{tc.school.name}</h1>
            {tc.school.addressLine && <p className="text-sm text-[#444]">{tc.school.addressLine}</p>}
          </div>
          <div className="text-right text-xs text-[#444]">
            <p className={`font-semibold uppercase ${latin ? "tracking-widest" : ""}`}>{t("tc.serialLabel")}</p>
            <p className="font-mono text-sm text-[#111]" data-testid="tc-serial">{tc.serial ?? dash}</p>
          </div>
        </header>

        <h2 className={`mt-8 text-center text-xl font-bold uppercase ${latin ? "tracking-[0.2em]" : ""}`}>{t("tc.heading")}</h2>
        <p className="mx-auto mt-4 max-w-prose text-center text-sm leading-relaxed text-[#333]">
          {t("tc.certify", { name: tc.studentName || dash, school: tc.school.name })}
        </p>

        <dl className="mt-8 grid grid-cols-[minmax(12rem,auto)_1fr] border-t border-[#bbb] text-sm">
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <dt className="border-b border-[#ddd] py-2 pr-4 text-[#444]">{row.label}</dt>
              <dd className="border-b border-[#ddd] py-2 font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="text-[#444]">{t("tc.issuedOn")}</p>
            <p className="font-medium">{formatDate(tc.issuedAt)}</p>
            {tc.issuedBy && <p className="mt-1 text-xs text-[#444]">{t("tc.issuedBy", { name: tc.issuedBy })}</p>}
          </div>
          <div className="text-right">
            <div className={`mt-8 border-t border-[#111] pt-1 text-xs uppercase text-[#444] ${latin ? "tracking-widest" : ""}`}>{t("tc.signature")}</div>
          </div>
        </div>

        <p className="mt-8 text-[0.7rem] leading-relaxed text-[#666]">{t("tc.footer", { code: tc.school.code, serial: tc.serial ?? dash })}</p>
      </article>
    </div>
  );
}
