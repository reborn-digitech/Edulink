import Link from "next/link";

/**
 * Previous / "n–m of total" / Next for a list served a page at a time, the page in the URL (?page=) so a reload and
 * the back button keep the place. The caller builds each page's link (hrefFor) with its filters kept and the page
 * changed; a filter's own link leaves the page out, which is how a filter resets it to 1. Nothing is drawn for a
 * single page. First used by the bank desk's chapters and a chapter's questions (the owner's ask of 12 Nov 2026).
 */
export function Pager({
  page,
  pages,
  from,
  to,
  total,
  hrefFor,
  labels,
  className,
}: {
  page: number;
  pages: number;
  /** The first and last row on this page, counted from 1 over the whole set (0 and 0 when the page is empty). */
  from: number;
  to: number;
  total: number;
  hrefFor: (page: number) => string;
  labels: { previous: string; next: string; range: string; pageOf: string };
  className?: string;
}) {
  if (pages <= 1) return null;
  const link = "inline-flex min-h-11 items-center text-accent-strong underline-offset-4 hover:underline";
  return (
    <nav aria-label={labels.pageOf} className={["flex flex-wrap items-center justify-between gap-2", className].filter(Boolean).join(" ")} data-testid="pager" data-page={page}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={link} rel="prev">
          {labels.previous}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-fg-muted tabular-nums" data-testid="pager-range" data-from={from} data-to={to} data-total={total}>
        {labels.range} · {labels.pageOf}
      </span>
      {page < pages ? (
        <Link href={hrefFor(page + 1)} className={link} rel="next">
          {labels.next}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
