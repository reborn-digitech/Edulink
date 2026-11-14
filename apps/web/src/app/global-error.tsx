"use client";

import { useEffect } from "react";
import { fallbackT } from "@/lib/i18n/provider";
import "./globals.css";

/**
 * THE ROOT LAYOUT ITSELF FAILED (TA-406): Next draws this in its place, so it brings its own <html> and <body> and
 * has no provider around it. The words come from the dictionary this tab already holds (fallbackT), the look from
 * the stylesheet, and the way out is a plain link home, since the router's own state may be what failed.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = fallbackT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="en">
      <body className="min-h-safe antialiased">
        <main id="main" role="alert" className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 py-12 text-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-fg">{t("appError.title")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t("appError.body")}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={reset} className="min-h-11 rounded-[var(--radius-md)] bg-accent px-5 text-sm font-semibold text-accent-fg">
                {t("appError.retry")}
              </button>
              {/* A full load, not the router: the router's state may be what failed. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className="grid min-h-11 place-items-center rounded-[var(--radius-md)] border border-border px-5 text-sm font-semibold text-fg">
                {t("appError.home")}
              </a>
            </div>
            {error.digest ? <p className="mt-4 font-mono text-xs text-fg-subtle">{t("appError.reference", { digest: error.digest })}</p> : null}
          </div>
        </main>
      </body>
    </html>
  );
}
