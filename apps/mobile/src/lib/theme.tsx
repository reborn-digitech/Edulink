import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { accents, familyFor, palette, radius, space, tap, type Accent, type Palette, type Theme } from "@edulink/tokens";

/**
 * Colours from @edulink/tokens, the same numbers as the web's stylesheet:
 * the scheme from the OS (light or dark) and the accent family from the
 * active role — a teacher's blue, a pupil's green, a guardian's purple, the
 * office's slate — exactly as data-role does on the web.
 */
export type Tokens = Palette & Accent & { theme: Theme; radius: typeof radius; space: typeof space; tap: number };

const RoleCtx = createContext<string | null>(null);

export function RoleThemeProvider({ role, children }: { role: string | null; children: ReactNode }) {
  return <RoleCtx.Provider value={role}>{children}</RoleCtx.Provider>;
}

export function useTheme(): Tokens {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const role = useContext(RoleCtx);
  return useMemo(() => ({ ...palette[scheme], ...accents[scheme][familyFor(role)], theme: scheme, radius, space, tap }), [scheme, role]);
}
