"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon } from "@phosphor-icons/react";
import { useT } from "@/lib/i18n";

/**
 * A phone number (or anything short) that copies itself on a tap. Falls
 * back to selecting nothing where the clipboard is unavailable (an http
 * origin, an old browser): the text is still readable and the tap is
 * harmless.
 */
export function CopyChip({ text, label }: { text: string; label?: string }) {
  const t = useT();
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      // Nothing to say: the number is on the screen.
    }
  }
  const aria = [label ?? t("root.copyPhone"), text].join(": ");
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={aria}
      title={done ? t("root.copied") : t("root.copyPhone")}
      className="inline-flex min-h-7 items-center gap-1 rounded-full border border-border px-2 py-0.5 font-mono text-xs text-fg hover:bg-surface-muted"
    >
      {text}
      {done ? <CheckIcon weight="bold" className="size-3 text-ok" /> : <CopyIcon weight="bold" className="size-3 text-fg-subtle" />}
    </button>
  );
}
