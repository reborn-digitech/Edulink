import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { KEYS, keyStore } from "./storage";
import { accents, canvas, familyFor, frame, frameAccents, palette, radius, space, tap, wash, type Accent, type Frame, type Palette, type Theme } from "@edulink/tokens";

/**
 * Colours from @edulink/tokens, the same numbers as the web's stylesheet:
 * the scheme from the OS (light or dark) and the accent family from the
 * active role — a teacher's blue, a pupil's green, a guardian's purple, the
 * office's slate — exactly as data-role does on the web. `canvas` is the
 * ground a screen draws on (tinted in light, so cards stand off it), `frame`
 * the tab bar's colours (dark's navy in both themes, with dark's accents) and
 * `wash` the role's colour fading behind a page title in light: the two
 * tones light was given on 30 Sep 2026, as the web's shell has them.
 */
export type Tokens = Palette & Accent & { theme: Theme; radius: typeof radius; space: typeof space; tap: number; canvas: string; frame: Frame & Accent; wash: typeof wash };

const RoleCtx = createContext<string | null>(null);

export function RoleThemeProvider({ role, children }: { role: string | null; children: ReactNode }) {
  return <RoleCtx.Provider value={role}>{children}</RoleCtx.Provider>;
}

/**
 * Light, dark, or the phone's own setting: the web's three-way choice, on
 * the phone since 2026-10-01 (the owner asked for a light option). Kept on
 * the device so the sign-in screen is already right next time, and, once
 * signed in, written to the account's prefs.theme by the account screen so
 * the web follows; the account's own choice, once read there, wins here as
 * the language's does.
 */
export type ThemeChoice = "system" | "light" | "dark";
type ThemeChoiceCtx = { choice: ThemeChoice; setChoice: (next: ThemeChoice) => void };
const ChoiceCtx = createContext<ThemeChoiceCtx | null>(null);

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "system" || value === "light" || value === "dark";
}

export function ThemeChoiceProvider({ children, initial }: { children: ReactNode; initial?: ThemeChoice }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(initial ?? "system");
  useEffect(() => {
    if (initial) return;
    void keyStore()
      .get(KEYS.theme)
      .then((saved) => {
        if (isThemeChoice(saved)) setChoiceState(saved);
      });
  }, [initial]);
  const value = useMemo<ThemeChoiceCtx>(
    () => ({
      choice,
      setChoice: (next) => {
        setChoiceState(next);
        void keyStore().set(KEYS.theme, next);
      },
    }),
    [choice],
  );
  return <ChoiceCtx.Provider value={value}>{children}</ChoiceCtx.Provider>;
}

export function useThemeChoice(): ThemeChoiceCtx {
  const ctx = useContext(ChoiceCtx);
  return ctx ?? { choice: "system", setChoice: () => {} };
}

/** The scheme the app draws in: the choice, or the phone's when the choice is "system". */
export function useScheme(): Theme {
  const os = useColorScheme() === "dark" ? "dark" : "light";
  const { choice } = useThemeChoice();
  return choice === "system" ? os : choice;
}

export function useTheme(): Tokens {
  const scheme = useScheme();
  const role = useContext(RoleCtx);
  return useMemo(() => {
    const family = familyFor(role);
    return { ...palette[scheme], ...accents[scheme][family], theme: scheme, radius, space, tap, canvas: canvas[scheme], frame: { ...frame[scheme], ...frameAccents[scheme][family] }, wash };
  }, [scheme, role]);
}
