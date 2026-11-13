import { Fragment, useMemo, type ReactNode } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRole } from "@/lib/session";
import { TABS } from "@/lib/nav";
import { BackCtx } from "./chrome";

/**
 * The route's params as one string, the same for the same params in any order:
 * the key a route's screen is drawn under (TA-013, 13 Nov 2026). Every route is
 * a screen of one Tabs navigator, which keeps a visited screen mounted and
 * hands it the next visit's params; a screen that read its pupil, class, paper
 * or child once (a useState seeded from a param, a form typed for the first
 * one) went on showing and acting on the first. Keyed by its params, a screen
 * asked for something else is drawn afresh, as a stack would push a new one;
 * asked for the same thing again, it keeps what it had.
 */
export function useParamsKey(): string {
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  return JSON.stringify(
    Object.keys(params)
      .filter((name) => params[name] !== undefined)
      .sort()
      .map((name) => [name, params[name]]),
  );
}

/**
 * Wraps a screen that is not a tab so Screen draws "‹ Back". Back goes to the
 * previous screen (the tab navigator keeps history), or to `fallback` when
 * there is none — a notification or a link opened the app straight onto it.
 * Imported by route files only, never by a screen. `unlessTab` names the
 * route for a screen that is a tab for some roles (Attendance for a teacher)
 * and a More entry for others (the office): a tab never shows back. The
 * screen is drawn under its route's params (useParamsKey), so opening it
 * again for another pupil, class, paper or child draws it for that one.
 */
export function BackTo({ fallback = "/(app)/more", unlessTab, children }: { fallback?: string; unlessTab?: string; children: ReactNode }) {
  const router = useRouter();
  const role = useRole();
  const asked = useParamsKey();
  const isTab = Boolean(unlessTab && role && TABS[role].some((tab) => tab.name === unlessTab));
  const value = useMemo(
    () => ({
      onBack: () => {
        if (router.canGoBack?.()) router.back();
        else router.replace(fallback as never);
      },
    }),
    [router, fallback],
  );
  if (isTab) return <Fragment key={asked}>{children}</Fragment>;
  return (
    <BackCtx.Provider value={value}>
      <Fragment key={asked}>{children}</Fragment>
    </BackCtx.Provider>
  );
}
