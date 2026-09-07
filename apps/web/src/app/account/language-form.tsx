"use client";

import { LanguageSwitch } from "@/components/language-switch";
import { useT } from "@/lib/i18n";

/**
 * The language section of the account page.
 *
 * The control itself is the shared one — this only adds the sentence that admits
 * the translation is partial. A reader who switches to Marathi and then meets an
 * English grades page should have been TOLD that would happen, not left deciding
 * whether something is broken. When coverage is complete, this paragraph and its
 * dictionary key go, and nothing else here changes.
 */
export function LanguageForm() {
  const t = useT();
  return (
    <div className="space-y-3">
      <LanguageSwitch />
      <p className="text-xs leading-relaxed text-fg-muted">{t("language.partial")}</p>
    </div>
  );
}
