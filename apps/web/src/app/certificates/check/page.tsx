import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon, MagnifyingGlassIcon, QuestionIcon, XCircleIcon } from "@phosphor-icons/react/ssr";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { verifyByCode } from "@/lib/certificates";
import { formatDate } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { CERTIFICATE_KIND_KEY } from "@/components/certificates/labels";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("certificates.verifyTitle"), robots: { index: false, follow: false } };
}

/**
 * The page the certificate's footer names: anyone holding the paper types
 * the code and learns that it is real, from which school, of which kind
 * and when — never whose. OUTSIDE EVERY SHELL and with no session, because
 * the person checking is an admitting office or an employer signed in to
 * nothing. The code is in the query string, which is fine: it identifies a
 * document, not a person, and the page shows nothing about the pupil.
 */
export default async function CertificateCheckPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const t = await getT();
  const { code: rawCode } = await searchParams;
  const code = rawCode?.trim().toUpperCase().slice(0, 16) ?? "";
  const result = code ? await verifyByCode(code) : null;

  return (
    <div className="flex min-h-safe flex-col justify-center bg-bg px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="mb-8 inline-block" aria-label={t("common.homeLink")}>
          <Wordmark />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t("certificates.verifyTitle")}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t("certificates.verifyIntro")}</p>

        <form method="get" action="/certificates/check" className="mt-6 space-y-3">
          <label className="block">
            <span className="block text-sm font-medium text-fg">{t("certificates.verifyCode")}</span>
            <input
              type="text"
              name="code"
              defaultValue={code}
              maxLength={16}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              required
              className="mt-1.5 min-h-12 w-full rounded-[--radius-md] border border-border bg-surface px-3 font-mono text-[0.9375rem] uppercase tracking-widest text-fg outline-none focus:border-accent"
              data-testid="verify-code"
            />
          </label>
          <Button type="submit" block icon={<MagnifyingGlassIcon weight="bold" />}>
            {t("certificates.verifyCheck")}
          </Button>
        </form>

        {result && (
          <section className="mt-8" aria-live="polite" data-testid="verify-result">
            {result.valid ? (
              <>
                <CheckCircleIcon weight="duotone" className="size-9 text-ok" />
                <h2 className="mt-3 text-xl font-bold tracking-tight text-fg">{t("certificates.verifyValid")}</h2>
              </>
            ) : result.serial ? (
              <>
                <XCircleIcon weight="duotone" className="size-9 text-danger" />
                <h2 className="mt-3 text-xl font-bold tracking-tight text-fg">{t("certificates.verifyRevoked")}</h2>
              </>
            ) : (
              <>
                <QuestionIcon weight="duotone" className="size-9 text-warn" />
                <h2 className="mt-3 text-xl font-bold tracking-tight text-fg">{t("certificates.verifyNotFound")}</h2>
              </>
            )}
            {result.serial && (
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-fg-muted">{t("certificates.kind")}</dt>
                <dd className="font-medium text-fg">{result.kind ? t(CERTIFICATE_KIND_KEY[result.kind]) : "—"}</dd>
                <dt className="text-fg-muted">{t("certificates.heading")}</dt>
                <dd className="font-medium text-fg">{result.title}</dd>
                <dt className="text-fg-muted">{t("certificates.serial")}</dt>
                <dd className="font-mono text-fg">{result.serial}</dd>
                <dt className="text-fg-muted">{t("tc.issuedOn")}</dt>
                <dd className="text-fg">{[result.schoolName, result.issuedAt ? formatDate(new Date(result.issuedAt)) : null].filter(Boolean).join(" · ")}</dd>
                {result.revokedAt && (
                  <>
                    <dt className="text-fg-muted">{t("certificates.revoke")}</dt>
                    <dd className="text-fg">{formatDate(new Date(result.revokedAt))}</dd>
                  </>
                )}
              </dl>
            )}
            <p className="mt-4 text-xs leading-relaxed text-fg-muted">{t("certificates.verifyNote")}</p>
          </section>
        )}
      </div>
    </div>
  );
}
