"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The controls of `root` a keyboard can reach, in order. */
function focusables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute("hidden") && el.getAttribute("aria-hidden") !== "true");
}

/**
 * What a modal dialog owes the keyboard (TA-232): while it is open, focus moves into it (its first control, or the
 * dialog itself), Tab and Shift+Tab stay inside it, Escape closes it; when it closes, focus goes back to whatever had
 * it before, or to `returnTo` when that control is gone (a menu item that unmounted as the dialog opened).
 *
 * `ref` is the element with role="dialog". Used by the More sheet, the archive confirm, the post report dialog.
 */
export function useModalFocus(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  returnTo?: RefObject<HTMLElement | null>,
): void {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const fallback = returnTo?.current ?? null;
    const dialog = ref.current;
    if (dialog) {
      const first = focusables(dialog)[0];
      if (first) first.focus();
      else {
        if (!dialog.hasAttribute("tabindex")) dialog.setAttribute("tabindex", "-1");
        dialog.focus();
      }
    }
    const onKey = (event: KeyboardEvent) => {
      const root = ref.current;
      if (!root) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
        return;
      }
      if (event.key !== "Tab") return;
      const list = focusables(root);
      if (list.length === 0) {
        event.preventDefault();
        return;
      }
      const first = list[0]!;
      const last = list[list.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !root.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      const back = opener && opener !== document.body && opener.isConnected ? opener : fallback;
      back?.focus();
    };
  }, [open, ref, returnTo]);
}
