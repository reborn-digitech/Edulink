"use client";

import { useEffect } from "react";

/**
 * Opens every closed <details> around the element the address's #fragment
 * names, then scrolls to it. A page that folds its long sections (the NAAC
 * predictor folds each criterion, A3-states-4) still lands a link such as
 * /iqac/predictor#metric-2-6-3 on the open metric; browsers that expand a
 * <details> on fragment navigation do it themselves, the rest get it here.
 */
export function OpenHashTarget() {
  useEffect(() => {
    const open = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      for (let el: HTMLElement | null = target; el; el = el.parentElement) {
        if (el instanceof HTMLDetailsElement) el.open = true;
      }
      target.scrollIntoView({ block: "start" });
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  return null;
}
