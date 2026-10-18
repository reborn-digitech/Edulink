import Link from "next/link";
import type { Translate } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/** Vidura's four desks on the operator's panel (passes 2 and 3), one row of links on each of them. */
const DESKS = [
  { href: "/root/vidura-answers", key: "viduraOps.navAnswers" },
  { href: "/root/vidura-unanswered", key: "viduraOps.navUnanswered" },
  { href: "/root/vidura-evals", key: "viduraOps.navEvals" },
  { href: "/root/vidura-review", key: "viduraReview.nav" },
] as const;

/** Drawn by the page with its own `t` (a server page's words), so it stays a plain component. */
export function ViduraOpsNav({ current, t }: { current: (typeof DESKS)[number]["href"]; t: Translate }) {
  return (
    <nav aria-label={t("viduraOps.navLabel")} className="flex flex-wrap gap-1">
      {DESKS.map((d) => (
        <Link
          key={d.href}
          href={d.href}
          aria-current={d.href === current ? "page" : undefined}
          className={cn("inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm font-medium", d.href === current ? "border-accent bg-accent-soft text-accent-strong" : "border-border text-fg-muted hover:bg-surface-muted")}
        >
          {t(d.key)}
        </Link>
      ))}
    </nav>
  );
}
