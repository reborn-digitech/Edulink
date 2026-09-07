import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand";
import { getT } from "@/lib/i18n/server";
import { RetryButton } from "./retry-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
  title: t("meta.offline"),
  description: t("offline.metaDescription"),
};
}

/**
 * Service-worker navigation fallback.
 *
 * Deliberately reassuring rather than apologetic: the most important thing a
 * teacher needs to know here is that their register was NOT lost.
 */
export default async function OfflinePage() {
  const t = await getT();
  return (
    <main id="main" className="grid min-h-safe place-items-center bg-bg px-4 py-16">
      <div className="w-full max-w-md text-center">
        <Wordmark className="mb-8 justify-center" />

        <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-warn-soft text-warn">
          <svg viewBox="0 0 24 24" className="size-10" fill="none" aria-hidden="true">
            <path
              d="M1.5 8.5a15 15 0 0 1 21 0M5 12.2a10 10 0 0 1 14 0M8.5 15.9a5 5 0 0 1 7 0M12 19.5v.1"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-fg">{t("offline.title")}</h1>
        <p className="mt-3 leading-relaxed text-fg-muted">{t("offline.body")}</p>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <RetryButton label={t("offline.retry")} />
          <Button asChild variant="secondary">
            <Link href="/">{t("offline.goHome")}</Link>
          </Button>
        </div>

        <p className="mt-8 text-xs text-fg-muted">
          {t("offline.stillWorks")}
        </p>
      </div>
    </main>
  );
}
