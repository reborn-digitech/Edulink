import { useMemo, type ReactNode } from "react";
import { useRouter } from "expo-router";
import { useRole } from "@/lib/session";
import { TABS } from "@/lib/nav";
import { BackCtx } from "./chrome";

/**
 * Wraps a screen that is not a tab so Screen draws "‹ Back". Back goes to the
 * previous screen (the tab navigator keeps history), or to `fallback` when
 * there is none — a notification or a link opened the app straight onto it.
 * Imported by route files only, never by a screen. `unlessTab` names the
 * route for a screen that is a tab for some roles (Attendance for a teacher)
 * and a More entry for others (the office): a tab never shows back.
 */
export function BackTo({ fallback = "/(app)/more", unlessTab, children }: { fallback?: string; unlessTab?: string; children: ReactNode }) {
  const router = useRouter();
  const role = useRole();
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
  if (isTab) return <>{children}</>;
  return <BackCtx.Provider value={value}>{children}</BackCtx.Provider>;
}
