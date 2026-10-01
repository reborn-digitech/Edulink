"use client";

import Image from "next/image";
import { wordmarks, type WordmarkLocale } from "@edulink/tokens";
import { cn } from "@/lib/cn";
import { useLocale, useT } from "@/lib/i18n";

/**
 * The Shalaghar marks (apps/web/scripts/brand-assets.ts draws them; nothing
 * here is drawn by hand).
 *
 * `Logo` is the monogram — "Sg" under its roof on the navy tile — the same
 * image as the PWA and store icons, with the tile's corners rounded. The
 * tile is what keeps the mark legible on the frame's navy and on a white
 * card alike.
 *
 * `Wordmark` is the name under its roof, in the language the person reads
 * in: "Shalaghar" in Inter, शालाघर in Hindi, शाळाघर in Marathi, with the
 * Devanagari word's own headline carried up into the roof. It is drawn
 * inline from the outlines in @edulink/tokens, in currentColor, so it takes
 * the colour of the text around it and follows the language switch.
 */
export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <Image
      // The query is a cache key: the file's name is the one the Relay mark
      // had, and every browser that saw it holds that URL for a year.
      src="/icons/icon-192.png?v=shalaghar"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      priority
      className={cn("shrink-0 select-none rounded-[22%]", className)}
    />
  );
}

/** The wordmark alone, `height` pixels tall, in the current language and colour. */
export function WordmarkSvg({ className, height = 28, locale }: { className?: string; height?: number; locale?: WordmarkLocale }) {
  const current = useLocale();
  const t = useT();
  const mark = wordmarks[locale ?? (current as WordmarkLocale)] ?? wordmarks.en;
  const width = Math.round((mark.width / mark.height) * height);
  return (
    <svg
      viewBox={mark.viewBox}
      width={width}
      height={height}
      role="img"
      aria-label={t("brand.name")}
      className={cn("shrink-0 select-none", className)}
      dangerouslySetInnerHTML={{ __html: mark.ink + mark.accent }}
    />
  );
}

export function Wordmark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-fg", className)}>
      <Logo size={size} />
      <WordmarkSvg height={Math.round(size * 1.5)} />
    </span>
  );
}
