"use client";

import { useRouter as useNextRouter } from "next/navigation";
import { useEffect, useMemo, useReducer } from "react";

/**
 * THE ROUTER, WITH A NUDGE AFTER EVERY REFRESH (13 November 2026).
 *
 * Measured against a production build of Next 15.5.28 (its vendored React
 * 19.2.0-canary-0bdb9206): after a server action, `router.refresh()` fetches
 * the page again at once and the answer is in within a tenth of a second, yet
 * the page is drawn with it only five seconds later — React's deadline for a
 * starved lane — or the moment ANY other state update lands (a keystroke in a
 * box, the toast closing). Six expert offers in a row: five drawn at 5.1 s,
 * one at 85 ms; with a keystroke a second after the click, every one at 1.1 s.
 * Wrapping the updates after the await in a transition did not change it, and
 * neither did running the work outside useTransition. So every refresh asked
 * through this hook is followed by a few cheap state updates in a component
 * that draws nothing (<RouterNudge />, mounted once by the app runtime), the
 * first once a fast answer is in and the last before React's own deadline. A
 * page that never stuck loses nothing; a stuck one is drawn at the first nudge.
 *
 * Use this hook, not next/navigation's, wherever a component refreshes the
 * page after a server action (tests/router-nudge.test.ts holds the rule).
 */
const listeners = new Set<() => void>();
/** Milliseconds after the refresh at which the nudges land. */
export const NUDGE_AT = [150, 600, 1500, 3500] as const;

export function nudgeRouter(): void {
  for (const ms of NUDGE_AT) {
    setTimeout(() => {
      for (const listener of listeners) listener();
    }, ms);
  }
}

/** Mounted once; a state update here is what un-sticks a held redraw. */
export function RouterNudge(): null {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    listeners.add(bump);
    return () => {
      listeners.delete(bump);
    };
  }, []);
  return null;
}

export function useRouter(): ReturnType<typeof useNextRouter> {
  const router = useNextRouter();
  return useMemo(
    () => ({
      ...router,
      refresh: () => {
        router.refresh();
        nudgeRouter();
      },
    }),
    [router],
  );
}
