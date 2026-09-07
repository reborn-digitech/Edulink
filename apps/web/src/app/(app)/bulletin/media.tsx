"use client";

import { useEffect, useState } from "react";
import { CaretLeftIcon, CaretRightIcon, PlayIcon, XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

type Item = { fileId: string; kind: string; alt: string };

/**
 * A post's media: one item inline, several as a TILED MOSAIC with a lightbox —
 * the layout every feed has taught people to read. One item keeps its own
 * proportions; two sit side by side; three put the first tall on the left and
 * two on the right; four make a grid; more than four put "+N" on the last tile.
 * Tapping any tile (or a lone image) opens the viewer: full-size, swipe order
 * preserved, arrows and Esc, the alt text as the caption.
 *
 * Everything is served through /api/files, which re-checks who may see the
 * post before returning a byte and speaks Range so video seeking works. Plain
 * <img>, never next/image — the optimiser fetches with no session and would
 * take the route's refusal (or worse, cache one child's photo past the check).
 *
 * In the grid a video tile is a muted, metadata-only <video> wearing a play
 * badge — the browser paints the first frame as the thumbnail — and plays for
 * real only in the viewer, where it has controls and room.
 */
export function PostMedia({ media }: { media: Item[] }) {
  const t = useT();
  const items = media.filter((item) => item.kind === "image" || item.kind === "video");
  const [open, setOpen] = useState<number | null>(null);

  /**
   * The viewer owns the keyboard while it exists: Esc closes, arrows move.
   * On the window rather than the dialog so it works without a focus dance;
   * mounted only while open, so the feed's own keys are untouched.
   */
  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i + items.length - 1) % items.length));
      if (event.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % items.length));
    };
    window.addEventListener("keydown", onKey);
    // The page behind the viewer must not scroll out from under it.
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = previous;
    };
  }, [open, items.length]);

  if (items.length === 0) return null;

  /* ---- one item: inline, full width, uncropped ---- */
  if (items.length === 1) {
    const item = items[0]!;
    return (
      <>
        {item.kind === "video" ? (
          <video
            src={`/api/files/${item.fileId}`}
            controls
            playsInline
            preload="metadata"
            aria-label={item.alt}
            className="mt-3 max-h-[32rem] w-full rounded-[--radius-md] border border-border bg-black object-contain"
          />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(0)}
            aria-label={t("bulletin.openMedia", { n: 1, count: 1 })}
            className="mt-3 block w-full cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/files/${item.fileId}?w=1280`}
              srcSet={`/api/files/${item.fileId}?w=640 640w, /api/files/${item.fileId}?w=1280 1280w`}
              sizes="(min-width: 1024px) 640px, 100vw"
              alt={item.alt}
              loading="lazy"
              className="max-h-[28rem] w-full rounded-[--radius-md] border border-border bg-surface-muted object-contain"
            />
          </button>
        )}
        {open !== null && <Lightbox items={items} index={open} setIndex={setOpen} />}
      </>
    );
  }

  /* ---- several: the mosaic ---- */
  const shown = items.slice(0, 4);
  const hidden = items.length - shown.length;

  return (
    <>
      <ul
        className={cn(
          "mt-3 grid gap-1 overflow-hidden rounded-[--radius-md]",
          items.length === 2 && "aspect-[2/1] grid-cols-2",
          items.length === 3 && "aspect-[3/2] grid-cols-2 grid-rows-2",
          items.length >= 4 && "aspect-square grid-cols-2 grid-rows-2 sm:aspect-[3/2]",
        )}
      >
        {shown.map((item, index) => {
          const last = index === shown.length - 1;
          return (
            <li
              key={item.fileId}
              className={cn("relative min-h-0", items.length === 3 && index === 0 && "row-span-2")}
            >
              <button
                type="button"
                onClick={() => setOpen(index)}
                aria-label={t("bulletin.openMedia", { n: index + 1, count: items.length })}
                className="group relative block size-full cursor-zoom-in"
              >
                {item.kind === "video" ? (
                  <video
                    src={`/api/files/${item.fileId}`}
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                    tabIndex={-1}
                    className="pointer-events-none size-full bg-black object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/files/${item.fileId}?w=640`}
                    srcSet={`/api/files/${item.fileId}?w=320 320w, /api/files/${item.fileId}?w=640 640w`}
                    sizes="(min-width: 1024px) 320px, 50vw"
                    alt={item.alt}
                    loading="lazy"
                    className="size-full bg-surface-muted object-cover"
                  />
                )}
                {item.kind === "video" && !(last && hidden > 0) && (
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-12 place-items-center rounded-full bg-black/60 text-white transition-transform group-hover:scale-110">
                      <PlayIcon weight="fill" className="size-5" />
                    </span>
                  </span>
                )}
                {last && hidden > 0 && (
                  <span className="absolute inset-0 grid place-items-center bg-black/60 text-2xl font-bold text-white">
                    {t("bulletin.moreMedia", { count: hidden })}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {open !== null && <Lightbox items={items} index={open} setIndex={setOpen} />}
    </>
  );
}

/**
 * The expanded viewer. A fixed overlay rather than a route: the feed stays
 * where it was, and closing is instant. The backdrop closes it, the media
 * itself does not — a mis-tap while pinching should not throw the reader out.
 */
function Lightbox({
  items,
  index,
  setIndex,
}: {
  items: Item[];
  index: number;
  setIndex: (value: number | null) => void;
}) {
  const t = useT();
  const item = items[index]!;
  const many = items.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.alt}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      onClick={() => setIndex(null)}
    >
      <div className="flex items-center justify-between p-3">
        {many ? (
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold tabular-nums text-white">
            {index + 1}/{items.length}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          aria-label={t("bulletin.closeViewer")}
          onClick={() => setIndex(null)}
          className="grid size-11 place-items-center rounded-full text-white hover:bg-white/10"
        >
          <XIcon weight="bold" className="size-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center gap-2 px-2 pb-2">
        {many && (
          <button
            type="button"
            aria-label={t("bulletin.prevMedia")}
            onClick={(event) => {
              event.stopPropagation();
              setIndex((index + items.length - 1) % items.length);
            }}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <CaretLeftIcon weight="bold" className="size-5" />
          </button>
        )}

        <figure
          className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-2 self-stretch"
          onClick={(event) => event.stopPropagation()}
        >
          {item.kind === "video" ? (
            <video
              key={item.fileId}
              src={`/api/files/${item.fileId}`}
              controls
              autoPlay
              playsInline
              aria-label={item.alt}
              className="min-h-0 max-w-full flex-1 object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.fileId}
              src={`/api/files/${item.fileId}`}
              alt={item.alt}
              className="min-h-0 max-w-full flex-1 object-contain"
            />
          )}
          <figcaption className="max-w-prose text-center text-sm text-white/80">{item.alt}</figcaption>
        </figure>

        {many && (
          <button
            type="button"
            aria-label={t("bulletin.nextMedia")}
            onClick={(event) => {
              event.stopPropagation();
              setIndex((index + 1) % items.length);
            }}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <CaretRightIcon weight="bold" className="size-5" />
          </button>
        )}
      </div>
    </div>
  );
}
