"use client";

import Link from "next/link";
import { useEffect } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";

/**
 * A PAGE THAT FAILED, SHOWN AS THE APP (A3-states-2, 5 Oct 2026). Before,
 * there was no error boundary under src/app, so any exception in a signed-in
 * page's render was Next's bare "Application error: a server-side exception
 * has occurred" — no shell, no menu, English only, no way back. This keeps
 * the person's shell around the failure, says so in their language, offers a
 * retry and the way home, and prints the digest the server logged
 * (instrumentation.ts) so the office can quote it. Refusals no longer come
 * here: AccessError renders not-found.tsx beside this file.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="mx-auto grid max-w-md place-items-center py-12 text-center">
      <WarningCircleIcon weight="duotone" aria-hidden className="size-14 text-danger" />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-fg">{t("appError.title")}</h1>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t("appError.body")}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={reset}>
          {t("appError.retry")}
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">{t("appError.home")}</Link>
        </Button>
      </div>
      {error.digest ? <p className="mt-4 font-mono text-xs text-fg-subtle">{t("appError.reference", { digest: error.digest })}</p> : null}
    </div>
  );
}
