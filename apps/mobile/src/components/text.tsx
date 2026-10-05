import { Text as RNText, type TextProps } from "react-native";
import { type } from "@edulink/tokens";
import { useTheme } from "@/lib/theme";

type Variant = keyof typeof type;
type Tone = "fg" | "muted" | "subtle" | "accent" | "danger" | "ok" | "warn" | "inverse";

/**
 * Every word on a screen goes through this: the type scale in points from
 * the tokens, a tone from the palette, and `allowFontScaling` left ON so a
 * person's 200% setting is honoured (the plan's accessibility line). Bold is
 * a prop, never a second font.
 *
 * A heading (accessibilityRole "header") has a level: the web target draws
 * a header with no level as an <h1>, so every card title on a screen was a
 * first-level heading beside the screen's own (A3-journeys-29). The screen's
 * title passes 1; anything else is a section, 2, unless it says otherwise
 * (3 for a heading inside a card's section). A phone's screen reader has no
 * levels and ignores it.
 */
export function Text({ variant = "base", tone = "fg", bold, style, level, ...rest }: TextProps & { variant?: Variant; tone?: Tone; bold?: boolean; level?: 1 | 2 | 3 | 4 }) {
  const t = useTheme();
  const color = { fg: t.fg, muted: t.fgMuted, subtle: t.fgSubtle, accent: t.accentStrong, danger: t.danger, ok: t.ok, warn: t.warn, inverse: t.fgInverse }[tone];
  const heading = rest.accessibilityRole === "header" || rest.role === "heading" ? ({ "aria-level": level ?? 2 } as Partial<TextProps>) : null;
  return <RNText {...rest} {...heading} maxFontSizeMultiplier={2} style={[{ fontSize: type[variant].size, lineHeight: type[variant].line, color, fontWeight: bold ? "700" : "400" }, style]} />;
}
