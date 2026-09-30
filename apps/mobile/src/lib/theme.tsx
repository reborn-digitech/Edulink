import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
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

export function useTheme(): Tokens {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const role = useContext(RoleCtx);
  return useMemo(() => {
    const family = familyFor(role);
    return { ...palette[scheme], ...accents[scheme][family], theme: scheme, radius, space, tap, canvas: canvas[scheme], frame: { ...frame[scheme], ...frameAccents[scheme][family] }, wash };
  }, [scheme, role]);
}
