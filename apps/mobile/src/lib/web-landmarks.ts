import { useEffect } from "react";
import { Platform } from "react-native";

/** As much of the DOM as the marking reads: elements found by a selector, their parent and attributes. */
type El = { parentElement: El | null; closest(selector: string): unknown; getAttribute(name: string): string | null; setAttribute(name: string, value: string): void };
type Root = { querySelectorAll(selector: string): ArrayLike<El> | Iterable<El> };

/**
 * Names the navigator's tab bar a navigation landmark: the parent of the tablist that sits outside every screen's main
 * (a screen's own tabs live inside its main). Returns whether a bar was found. Pure but for the attributes it sets.
 */
export function markTabBar(root: Root, label: string): boolean {
  const bar = Array.from(root.querySelectorAll('[role="tablist"]') as Iterable<El>).find((list) => !list.closest('main, [role="main"]'));
  const host = bar?.parentElement;
  if (!host) return false;
  if (host.getAttribute("role") !== "navigation") host.setAttribute("role", "navigation");
  if (host.getAttribute("aria-label") !== label) host.setAttribute("aria-label", label);
  return true;
}

/**
 * THE TAB BAR AS A NAVIGATION LANDMARK ON THE WEB TARGET (QA-67, QA campaign of 24 October 2026). Every screen's body
 * is a `main` (components/screen.tsx), but the navigator's bar is a bare tablist, and axe's `region` found its tabs
 * outside any landmark on 849 of 862 loads: a screen-reader user of the web target could not jump to the menu. The
 * bar's container is the navigator's own (expo-router's Tabs, which takes no role), so on the web target alone it is
 * named once drawn and again whenever the navigator draws it anew. Native apps are untouched.
 */
export function useTabBarLandmark(label: string): void {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const mark = () => void markTabBar(document as unknown as Root, label);
    mark();
    const watch = new MutationObserver(mark);
    watch.observe(document.body, { childList: true, subtree: true });
    return () => watch.disconnect();
  }, [label]);
}
