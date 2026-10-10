import Link from "next/link";
import { BooksIcon } from "@phosphor-icons/react/ssr";
import type { QuizBoardChoice } from "@edulink/contracts";
import { cn } from "@/lib/cn";

/**
 * THE PRACTICE LIST'S BOARD SWITCH (quiz-board, 11 October 2026): NCERT, Balbharati or both, the
 * school's own board first. It looks like the "Read in" language switch beside it — a row of buttons,
 * the whole choice visible before it is made — but it is a set of links, because the board is a view
 * of the list, kept in the URL like the class and subject chips, not a preference saved on the account.
 * The pupil's page and the guardian's use it; the phone draws the same three as chips.
 */
export function PracticeBoardSwitch({
  label,
  options,
  current,
  hrefFor,
  className,
}: {
  /** "Board", in the reader's language. */
  label: string;
  options: { value: QuizBoardChoice; label: string }[];
  current: QuizBoardChoice;
  hrefFor: (value: QuizBoardChoice) => string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("flex flex-wrap items-center gap-2", className)} data-testid="practice-board-switch">
      <span className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
        <BooksIcon weight="bold" className="size-4" aria-hidden="true" />
        {label}
      </span>
      <div className="flex flex-1 flex-wrap gap-1 rounded-[var(--radius-md)] bg-surface-muted p-1">
        {options.map((option) => {
          const active = option.value === current;
          return (
            <Link
              key={option.value}
              href={hrefFor(option.value)}
              aria-current={active ? "true" : undefined}
              data-board={option.value}
              className={cn(
                "inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
