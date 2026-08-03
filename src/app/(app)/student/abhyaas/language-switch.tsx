"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { TranslateIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { QUIZ_LANGUAGES, type QuizLanguage } from "@/lib/quiz-languages";
import { setLanguage } from "./actions";

/**
 * Which language Abhyaas is read in.
 *
 * A ROW OF BUTTONS, not a select. There are three options, they are short, and
 * a child picking a language they read should not have to open a menu written
 * in a language they may not — the whole choice is visible before it is made.
 *
 * Each is labelled in its OWN script. "हिन्दी" is recognisable to a child who
 * reads Hindi even if "Hindi" is not, which is precisely the child this control
 * exists for. The English name goes underneath for everyone else.
 *
 * Marked `aria-pressed` rather than styled alone, so the current choice is
 * announced and not merely coloured — the same rule the answer options follow.
 */
export function LanguageSwitch({ current }: { current: QuizLanguage }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(code: QuizLanguage) {
    if (code === current || pending) return;
    startTransition(async () => {
      await setLanguage(code);
      // The questions themselves are fetched by the player through server
      // actions, so refreshing the route is what makes an open topic re-read in
      // the new language rather than only the list behind it.
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
        <TranslateIcon weight="bold" className="size-4" aria-hidden="true" />
        Read in
      </span>
      <div
        role="group"
        aria-label="Reading language"
        className="flex flex-wrap gap-1 rounded-full bg-surface-muted p-1"
      >
        {QUIZ_LANGUAGES.map((language) => {
          const active = language.code === current;
          return (
            <button
              key={language.code}
              type="button"
              disabled={pending}
              aria-pressed={active}
              onClick={() => choose(language.code)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                "disabled:opacity-60",
                active
                  ? "bg-accent text-accent-fg"
                  : "text-fg-muted hover:bg-surface hover:text-fg",
              )}
            >
              <span className="block leading-tight">{language.native}</span>
              {language.native !== language.english && (
                <span className="block text-[0.625rem] leading-tight opacity-75">
                  {language.english}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
