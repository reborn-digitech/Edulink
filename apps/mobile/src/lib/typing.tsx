import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { TypingLanguage } from "@edulink/i18n/transliterate";
import { KEYS, keyStore } from "./storage";

/**
 * What the keyboard writes — English letters, or Hindi or Marathi typed in
 * English letters and turned into Devanagari as each word ends — the web's
 * typing switch, on the phone since 2026-10-01 (the owner: "this should be
 * enabled for mobile app as well"). One choice for the person, kept on the
 * device; every Field reads it and shows a chip to change it while the box
 * has focus. A box with a language of its own (a Marathi question) starts
 * there and its chip cycles that box alone (components/field.tsx).
 */
type Typing = { language: TypingLanguage; setLanguage: (next: TypingLanguage) => void };
const Ctx = createContext<Typing | null>(null);

export const TYPING_LANGUAGES: TypingLanguage[] = ["en", "hi", "mr"];

export function isTypingLanguage(value: unknown): value is TypingLanguage {
  return value === "en" || value === "hi" || value === "mr";
}

export function TypingProvider({ children, initial }: { children: ReactNode; initial?: TypingLanguage }) {
  const [language, setState] = useState<TypingLanguage>(initial ?? "en");
  useEffect(() => {
    if (initial) return;
    void keyStore()
      .get(KEYS.typing)
      .then((saved) => {
        if (isTypingLanguage(saved)) setState(saved);
      });
  }, [initial]);
  const value = useMemo<Typing>(
    () => ({
      language,
      setLanguage: (next) => {
        setState(next);
        void keyStore().set(KEYS.typing, next);
      },
    }),
    [language],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTyping(): Typing {
  const ctx = useContext(Ctx);
  return ctx ?? { language: "en", setLanguage: () => {} };
}
