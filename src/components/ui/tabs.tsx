import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Plain-link tabs: each tab is a URL, so a tab can be bookmarked, shared and
 * landed on from a card or a notification. No client state — the server
 * renders the chosen one. Used wherever two pages became one.
 */
export function TabBar({
  tabs,
  current,
  ariaLabel,
}: {
  tabs: { key: string; href: string; label: string; count?: number }[];
  current: string;
  ariaLabel: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="-mx-1 overflow-x-auto">
      <ul className="flex gap-1 border-b border-border px-1">
        {tabs.map((tab) => {
          const active = tab.key === current;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex min-h-11 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors",
                  active
                    ? "border-accent text-accent-strong"
                    : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[0.65rem] font-bold tabular-nums",
                      active ? "bg-accent-soft text-accent-strong" : "bg-surface-muted text-fg-muted",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
