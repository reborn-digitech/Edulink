"use client";

import { createContext, useContext } from "react";
import { LightbulbIcon } from "@phosphor-icons/react";
import type { AssistantAbout } from "@edulink/contracts";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * "EXPLAIN THIS TO ME" (docs/plans/vidura.md, the coordinator's recommendation; pass 2, 17 Oct 2026): a small link
 * beside a fee demand, a report card's line and an attendance figure on the family's and the staff's own pages. It
 * opens Vidura's drawer on a new conversation and asks, in the reader's language, for that row to be explained; the
 * row goes as `about` (its kind and id, and a guardian's child), and the service reads it again through the person's
 * own door (src/lib/assistant/explain.ts). Drawn only where the shell offers Vidura to this person (the context is
 * null otherwise), so a page never shows a link that leads nowhere.
 */
export type ExplainRequest = { question: string; about: AssistantAbout };
export const ViduraExplainContext = createContext<((request: ExplainRequest) => void) | null>(null);

const QUESTION_KEY = { FEE_DEMAND: "viduraUi.explainFeeQuestion", REPORT_LINE: "viduraUi.explainLineQuestion", ATTENDANCE: "viduraUi.explainAttendanceQuestion" } as const;
const LABEL_KEY = { FEE_DEMAND: "viduraUi.explainFeeLabel", REPORT_LINE: "viduraUi.explainLineLabel", ATTENDANCE: "viduraUi.explainAttendanceLabel" } as const;

export function ExplainThis({ about, label, className }: { about: AssistantAbout; /** What the row is, for the accessible name: "Term 1 fee", "Mathematics". */ label: string; className?: string }) {
  const t = useT();
  const explain = useContext(ViduraExplainContext);
  if (!explain) return null;
  return (
    <button
      type="button"
      onClick={() => explain({ question: t(QUESTION_KEY[about.kind]), about })}
      aria-label={t(LABEL_KEY[about.kind], { label })}
      data-testid="vidura-explain"
      data-explain-kind={about.kind}
      className={cn("inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-sm)] px-1.5 text-xs font-semibold text-accent-strong underline-offset-4 hover:underline print:hidden", className)}
    >
      <LightbulbIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />
      <span>{t("viduraUi.explainThis")}</span>
    </button>
  );
}
