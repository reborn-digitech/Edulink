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
 */
export function Text({ variant = "base", tone = "fg", bold, style, ...rest }: TextProps & { variant?: Variant; tone?: Tone; bold?: boolean }) {
  const t = useTheme();
  const color = { fg: t.fg, muted: t.fgMuted, subtle: t.fgSubtle, accent: t.accentStrong, danger: t.danger, ok: t.ok, warn: t.warn, inverse: t.fgInverse }[tone];
  return <RNText {...rest} maxFontSizeMultiplier={2} style={[{ fontSize: type[variant].size, lineHeight: type[variant].line, color, fontWeight: bold ? "700" : "400" }, style]} />;
}
