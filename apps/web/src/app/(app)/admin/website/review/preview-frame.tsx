"use client";

import Link from "next/link";
import { useState } from "react";
import { LOCALES } from "@edulink/i18n";
import type { SiteLanguage } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/** The draft in a frame: a phone's width or a desk's, a language at a time, and a link to open it whole. */
export function PreviewFrame({ html, languages, current, openHref }: { html: string; languages: SiteLanguage[]; current: SiteLanguage; openHref: string }) {
  const t = useT();
  const [width, setWidth] = useState<"phone" | "desktop">("desktop");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label={t("website.previewWidth")} className="flex gap-2">
          <Button type="button" size="sm" variant={width === "phone" ? "primary" : "secondary"} aria-pressed={width === "phone"} onClick={() => setWidth("phone")}>
            {t("website.previewPhone")}
          </Button>
          <Button type="button" size="sm" variant={width === "desktop" ? "primary" : "secondary"} aria-pressed={width === "desktop"} onClick={() => setWidth("desktop")}>
            {t("website.previewDesktop")}
          </Button>
        </div>
        {languages.length > 1 ? (
          <nav aria-label={t("website.previewLanguage")} className="flex gap-2">
            {LOCALES.filter((l) => languages.includes(l.code)).map((l) => (
              <Button key={l.code} asChild size="sm" variant={l.code === current ? "primary" : "secondary"}>
                <Link href={`/admin/website/review?lang=${l.code}`} aria-current={l.code === current ? "page" : undefined}>
                  {l.native}
                </Link>
              </Button>
            ))}
          </nav>
        ) : null}
        <Button asChild size="sm" variant="link">
          <a href={openHref} target="_blank" rel="noopener">
            {t("website.previewOpen")}
          </a>
        </Button>
      </div>
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-muted p-2">
        <iframe
          title={t("website.previewFrameTitle")}
          srcDoc={html}
          sandbox="allow-same-origin"
          className={cn("mx-auto block h-[70vh] w-full rounded-[var(--radius-sm)] border border-border bg-white", width === "phone" && "max-w-[390px]")}
        />
      </div>
    </div>
  );
}
