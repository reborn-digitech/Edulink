"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ConfettiIcon,
  HandsClappingIcon,
  HandsPrayingIcon,
  HeartIcon,
  LightbulbIcon,
  StarIcon,
  TrophyIcon,
} from "@phosphor-icons/react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { react } from "./actions";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { REACTION_KINDS, type ReactionKind } from "@/lib/constants";

/**
 * Keys, not words — the ROLE_META precedent. The label is looked up at render
 * time in the reader's language. Shared by the school feed's card and the
 * global feed, which is the point of this module existing: one vocabulary.
 */
export const REACTION_META: Record<
  ReactionKind,
  { icon: React.ComponentType<{ className?: string; weight?: "fill" | "bold" }>; labelKey: TranslationKey }
> = {
  CLAP: { icon: HandsClappingIcon, labelKey: "bulletin.reactClap" },
  STAR: { icon: StarIcon, labelKey: "bulletin.reactStar" },
  IDEA: { icon: LightbulbIcon, labelKey: "bulletin.reactIdea" },
  HEART: { icon: HeartIcon, labelKey: "bulletin.reactHeart" },
  // The school's own three: results and events, somebody's work in the
  // spotlight, and the thanks a school community runs on.
  CELEBRATE: { icon: ConfettiIcon, labelKey: "bulletin.reactCelebrate" },
  PROUD: { icon: TrophyIcon, labelKey: "bulletin.reactProud" },
  THANKS: { icon: HandsPrayingIcon, labelKey: "bulletin.reactThanks" },
};

/**
 * The row of reaction pills, optimistic on tap. Used standalone on the global
 * feed, where readers from every school may react to a global post — the
 * server action and the row policies behind it enforce exactly that.
 */
export function ReactionRow({
  postId,
  reactions,
  myReactions,
}: {
  postId: string;
  reactions: Record<string, number>;
  myReactions: string[];
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<{ kind: ReactionKind; added: boolean } | null>(null);

  /**
   * The optimistic state applies only WHILE THE TRANSITION IS IN FLIGHT.
   * `router.refresh()` runs inside the transition, so `isPending` stays true
   * until the refreshed server data has actually rendered — at which point the
   * props are fresh and the override simply stops applying. Clearing the state
   * eagerly after `refresh()` (the old code) un-applied the override seconds
   * before the new props arrived, and the pill visibly snapped back.
   */
  const active = isPending ? optimistic : null;

  const count = (kind: ReactionKind) => {
    const base = reactions[kind] ?? 0;
    if (active?.kind !== kind) return base;
    return base + (active.added ? 1 : -1);
  };
  const mine = (kind: ReactionKind) => {
    const base = myReactions.includes(kind);
    if (active?.kind !== kind) return base;
    return active.added;
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {REACTION_KINDS.map((kind) => {
        const meta = REACTION_META[kind];
        const label = t(meta.labelKey);
        const Icon = meta.icon;
        const n = count(kind);
        const pressed = mine(kind);
        return (
          /**
           * Each pill carries its own tooltip: the label appears instantly
           * above the icon on hover and on keyboard focus, because an icon
           * whose meaning arrives after the browser's one-second `title`
           * delay may as well have none. `peer` on the button drives the
           * bubble; `aria-hidden` keeps it out of the accessibility tree —
           * the aria-label on the button is the accessible name already.
           */
          <span key={kind} className="relative inline-flex">
            <button
              type="button"
              aria-label={n > 0 ? `${label} (${n})` : label}
              aria-pressed={pressed}
              className={cn(
                "peer inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold",
                "transition-[transform,background-color] duration-[var(--dur-fast)] active:scale-90",
                pressed
                  ? "bg-accent-soft text-accent-strong"
                  : "text-fg-muted hover:bg-surface-muted hover:text-fg",
              )}
              onClick={() => {
                setOptimistic({ kind, added: !pressed });
                startTransition(async () => {
                  const result = await react({ postId, kind });
                  if (!result.ok) {
                    setOptimistic(null);
                    toast({ tone: "danger", title: t("bulletin.couldNotReact"), description: result.error });
                    return;
                  }
                  // Inside the transition on purpose: `isPending` holds the
                  // optimistic override up until this refresh has rendered.
                  router.refresh();
                });
              }}
            >
              <Icon className="size-4" weight={pressed ? "fill" : "bold"} />
              {n > 0 && <span className="tabular-nums">{n}</span>}
            </button>
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap",
                "rounded-[var(--radius-sm)] bg-fg px-2 py-1 text-xs font-semibold text-surface shadow-md",
                "opacity-0 transition-opacity duration-[var(--dur-fast)]",
                "peer-hover:opacity-100 peer-focus-visible:opacity-100",
              )}
            >
              {label}
            </span>
          </span>
        );
      })}
    </div>
  );
}
