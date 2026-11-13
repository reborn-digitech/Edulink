"use client";

import { useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { TranslateIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { LOCALES, useLocale, useT, type Locale } from "@/lib/i18n";
import { setLocale } from "@/app/account/actions";

/**
 * The language control. ONE OF THESE, used everywhere.
 *
 * There used to be a switcher on the Practice page and nothing anywhere else,
 * writing `prefs.locale` through its own action. It was already the app's
 * language field — Practice was simply the only screen that read it. Adding a
 * second control in Settings would have meant two buttons for one preference,
 * which is how a Marathi app ends up asking questions in Hindi.
 *
 * A ROW OF BUTTONS, not a select. Three short options, and somebody picking a
 * language they read should not have to open a menu written in a language they
 * may not: the whole choice is visible before it is made.
 *
 * Each is labelled in its OWN script. "मराठी" is recognisable to a reader of
 * Marathi even when "Marathi" is not, which is exactly the reader this exists
 * for. `lang` on each button is what stops a screen reader announcing Devanagari
 * with an English voice.
 *
 * SAVES ON CLICK, with no Save button. A reader who cannot read the page cannot
 * reliably find the button that would fix it.
 */
export function LanguageSwitch({
  showLabel = false,
  className,
}: {
  /** Prefixes the row with "Read in", for use inline in a page header. */
  showLabel?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const current = useLocale();
  const t = useT();
  const [pending, startTransition] = useTransition();

  function choose(code: Locale) {
    if (code === current || pending) return;
    startTransition(async () => {
      await setLocale(code);
      // The provider takes its locale from the server render, so the shell and
      // any server-rendered strings re-label only once the route re-renders.
      router.refresh();
    });
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {showLabel && (
        <span className="flex items-center gap-1.5 text-xs font-medium text-fg-muted">
          <TranslateIcon weight="bold" className="size-4" aria-hidden="true" />
          {t("language.readIn")}
        </span>
      )}
      <div
        role="radiogroup"
        aria-label={t("language.groupLabel")}
        className="flex flex-1 flex-wrap gap-1 rounded-[var(--radius-md)] bg-surface-muted p-1"
      >
        {LOCALES.map((language) => {
          const active = language.code === current;
          return (
            <button
              key={language.code}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={pending}
              lang={language.code}
              onClick={() => choose(language.code)}
              className={cn(
                "min-h-11 flex-1 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors",
                "disabled:opacity-60",
                active ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
              )}
            >
              <span className="block leading-tight">{language.native}</span>
              {language.native !== language.english && (
                <span className="block text-[0.6875rem] leading-tight opacity-90">
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
