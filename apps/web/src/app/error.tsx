"use client";

import Link from "next/link";
import { useEffect } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/provider";

/**
 * A PAGE OUTSIDE THE SIGNED-IN SHELL THAT FAILED (TA-406). (app)/error.tsx covers the shell's pages since
 * A3-states-2; everything beside (app) — the operator's /root, the content team's /appadmin, /account, a parent's
 * /join link, /register, /invite, /certificate, /verify, a school's public site under /sites — fell to Next's bare
 * English "Application error" with no way back. This boundary sits under the root layout, so it is drawn inside the
 * reader's language (the layout's provider) and offers a retry and the way home, with the digest the server logged.
 */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" role="alert" className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 py-12 text-center">
      <div>
        <WarningCircleIcon weight="duotone" aria-hidden className="mx-auto size-14 text-danger" />
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
    </main>
  );
}
