import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react/ssr";
import { Wordmark } from "@/components/brand";
import { checkExamDocument } from "@/lib/exam-cell-after";
import { CODE_LOOKUPS, consumeByCaller } from "@/lib/rate-limit";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { DOC_KIND_KEY } from "@/components/exam-cell/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("examCell.checkTitle"), robots: { index: false, follow: false } };
}

/**
 * THE PUBLIC CHECK of an exam paper — the address a grade card, transcript,
 * degree certificate or hall ticket prints beside its QR: the paper is real,
 * from which college, of which kind and when; never whose. Outside every
 * shell, signed out, counted like the certificate check.
 */
export default async function ExamCheckPage({ searchParams }: { searchParams: Promise<{ school?: string; code?: string }> }) {
  const t = await getT();
  const { school = "", code: raw = "" } = await searchParams;
  const code = raw.trim().toUpperCase().slice(0, 16);
  const gate = code ? await consumeByCaller("certificate-check", CODE_LOOKUPS) : null;
  const limited = gate !== null && !gate.allowed;
  const result = code && !limited ? await checkExamDocument(school, code) : null;
  return (
    <main id="main" className="flex min-h-safe flex-col justify-center bg-bg px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="mb-8 inline-block" aria-label={t("common.homeLink")}>
          <Wordmark />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t("examCell.checkTitle")}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t("examCell.checkIntro")}</p>
        {limited ? (
          <p role="alert" className="mt-6 text-sm font-medium text-warn">
            {t("common.tryAgainMoment")}
          </p>
        ) : null}
        {result ? (
          <section className="mt-8" aria-live="polite">
            {result.valid ? <CheckCircleIcon weight="duotone" className="size-9 text-ok" /> : <XCircleIcon weight="duotone" className="size-9 text-danger" />}
            <h2 className="mt-3 text-xl font-bold tracking-tight text-fg">{result.valid ? t("examCell.checkValid") : result.serial ? t("examCell.checkRevoked") : t("examCell.checkUnknown")}</h2>
            {result.serial ? (
              <dl className="mt-4 space-y-1 text-sm">
                <div>
                  <dt className="inline text-fg-muted">{t("examCell.checkKind")} </dt>
                  <dd className="inline font-medium">{result.kind === "HALL_TICKET" ? t("examCell.ticketTitle") : t(DOC_KIND_KEY[result.kind ?? "GRADE_CARD"]!)}</dd>
                </div>
                <div>
                  <dt className="inline text-fg-muted">{t("examCell.pdfSerial")} </dt>
                  <dd className="inline font-medium">{result.serial}</dd>
                </div>
                <div>
                  <dt className="inline text-fg-muted">{t("examCell.checkCollege")} </dt>
                  <dd className="inline font-medium">{result.schoolName ?? "—"}</dd>
                </div>
                <div>
                  <dt className="inline text-fg-muted">{t("examCell.pdfIssued")} </dt>
                  <dd className="inline font-medium">{result.issuedAt ? formatDate(new Date(result.issuedAt), "Asia/Kolkata") : "—"}</dd>
                </div>
              </dl>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
