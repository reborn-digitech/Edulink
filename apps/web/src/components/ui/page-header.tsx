import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { PAGE_TITLE } from "./page-title";

/**
 * The top of a page: one title, one line under it, the page's actions on
 * the right. Every page used to hand-roll this — same three classes, same
 * flex-wrap — and drifted a little each time (a 2xl here, a 3xl there, an
 * action that sat below on one page and beside on the next). One component
 * means the heading is the same weight everywhere and an action is always in
 * the same corner, which is what lets a person stop reading and start
 * recognising.
 *
 * `back` is a plain link to the parent, for pages that are one level deep.
 * `meta` is a small badge-like slot beside the title (a count, a status).
 */
/** An intro longer than this is clamped on a phone. About two lines at 390 px. */
const LONG = 110;

export { PAGE_TITLE };

/** PageHeader's way back to the parent, for the pages that keep their own hero (see page-title.ts). 44 px tall, the kit's floor (A3-states-11). */
export function BackLink({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg", className)}>
      <ArrowLeftIcon weight="bold" className="size-4" />
      {label}
    </Link>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  meta,
  back,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <header className={cn("space-y-3", className)}>
      {back && <BackLink href={back.href} label={back.label} />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className={PAGE_TITLE}>

            {title}
            {meta}
          </h1>
          {description &&
            (typeof description === "string" && description.length > LONG ? (
              // A long intro is two lines on a phone, and opens to the whole
              // on a press; a desk reads it all. Every page opened with a
              // paragraph (the walk of 2026-10-01), and on a phone the
              // paragraph was the screen. The summary is the text itself, so
              // there is nothing extra to find: the ellipsis is the handle.
              <details className="group mt-1 max-w-prose">
                <summary className="cursor-pointer list-none text-sm text-fg-muted [&::-webkit-details-marker]:hidden max-sm:line-clamp-2 max-sm:group-open:line-clamp-none">{description}</summary>
              </details>
            ) : (
              <p className="mt-1 max-w-prose text-sm text-fg-muted">{description}</p>
            ))}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
