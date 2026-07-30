"use client";

import {
  CalendarCheckIcon,
  ChartLineUpIcon,
  ClipboardTextIcon,
  FireIcon,
  MegaphoneIcon,
  SealCheckIcon,
  StarIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

type Badge = {
  id: string;
  label: string;
  description: string;
  earned: boolean;
  progress?: { current: number; target: number };
  icon: string;
};

const ICONS: Record<string, React.ComponentType<{ className?: string; weight?: "fill" | "duotone" }>> = {
  fire: FireIcon,
  calendar: CalendarCheckIcon,
  clipboard: ClipboardTextIcon,
  chart: ChartLineUpIcon,
  star: StarIcon,
  megaphone: MegaphoneIcon,
};

/**
 * Badge grid.
 *
 * Unearned badges are shown, but quietly: dimmed, no lock icon, no "0 of 5" in
 * red, and no total score anywhere. The spec asks for gamification that is never
 * stress-inducing, which mostly means removing the things that make a child feel
 * behind — so there is no leaderboard, nothing expires, and progress is only
 * shown where being part-way is genuinely encouraging.
 */
export function BadgeGrid({ badges }: { badges: Badge[] }) {
  const earned = badges.filter((b) => b.earned);
  const rest = badges.filter((b) => !b.earned);

  return (
    <div className="space-y-4">
      {earned.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {earned.map((badge) => (
            <li key={badge.id}>
              <BadgeCard badge={badge} />
            </li>
          ))}
        </ul>
      )}

      {earned.length === 0 && (
        <p className="rounded-[--radius-md] bg-surface-muted p-4 text-center text-sm text-fg-muted">
          Badges turn up on their own as you go. Nothing to chase.
        </p>
      )}

      {rest.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            On the way
          </p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {rest.map((badge) => (
              <li key={badge.id}>
                <BadgeCard badge={badge} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const Icon = ICONS[badge.icon] ?? SealCheckIcon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[--radius-md] border p-3",
        badge.earned ? "border-accent/40 bg-accent-soft" : "border-border bg-surface",
      )}
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-full",
          badge.earned ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-subtle",
        )}
      >
        <Icon className="size-6" weight={badge.earned ? "fill" : "duotone"} />
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-bold", badge.earned ? "text-fg" : "text-fg-muted")}>
          {badge.label}
        </p>
        <p className="text-xs leading-relaxed text-fg-muted">{badge.description}</p>

        {badge.progress && (
          <div className="mt-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-[--dur-slow]"
                style={{
                  width: `${Math.min(100, (badge.progress.current / badge.progress.target) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs tabular-nums text-fg-subtle">
              {badge.progress.current} of {badge.progress.target}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
