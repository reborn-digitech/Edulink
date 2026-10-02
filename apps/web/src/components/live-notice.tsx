"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const SHOWN_MS = 4_000;
const FADE_MS = 700;

/**
 * One quiet line that says a page just changed under the reader's eyes —
 * "Updated by a colleague" — shown for four seconds and faded out. Each new
 * `stamp` shows it again; null shows nothing. It is a status region, so a
 * screen reader hears it once, and it leaves the layout when it has gone
 * rather than holding a blank line open.
 */
export function LiveNotice({ stamp, children, className }: { stamp: number | null; children: ReactNode; className?: string }) {
  const [phase, setPhase] = useState<{ stamp: number; fading: boolean; gone: boolean } | null>(null);

  useEffect(() => {
    if (stamp === null) return;
    const fade = setTimeout(() => setPhase({ stamp, fading: true, gone: false }), SHOWN_MS);
    const gone = setTimeout(() => setPhase({ stamp, fading: true, gone: true }), SHOWN_MS + FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(gone);
    };
  }, [stamp]);

  if (stamp === null) return null;
  const current = phase && phase.stamp === stamp ? phase : null;
  if (current?.gone) return null;
  return (
    <p
      key={stamp}
      role="status"
      data-testid="live-notice"
      className={cn(
        // No entrance animation: a background tab does not run one, and a
        // line that waits at its first keyframe is a line at opacity 0.
        "text-xs font-medium text-fg-muted transition-opacity duration-700",
        current?.fading ? "opacity-0" : "opacity-100",
        className,
      )}
    >
      {children}
    </p>
  );
}
