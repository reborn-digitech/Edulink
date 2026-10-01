import { View } from "react-native";
import Svg, { G, Path, Circle } from "react-native-svg";
import { wordmarks, type WordmarkLocale } from "@edulink/tokens";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

/**
 * The Shalaghar wordmark: the name under its roof, in the language the
 * person reads in — "Shalaghar", शालाघर or शाळाघर — drawn from the same
 * outlines the web draws (@edulink/tokens, written by the web's
 * brand-assets script), in the theme's text colour, the ridge dot in the
 * brand's accent. It follows the language switch because the locale picks
 * the outline.
 */
export function Wordmark({ height = 30, color, testID }: { height?: number; color?: string; testID?: string }) {
  const { locale } = useLocale();
  const tr = useT();
  const t = useTheme();
  const mark = wordmarks[locale as WordmarkLocale] ?? wordmarks.en;
  const width = Math.round((mark.width / mark.height) * height);
  const ink = color ?? t.fg;
  const paths = parse(mark.ink);
  const dot = /cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)" fill="(#[0-9a-f]+)"/i.exec(mark.accent);
  return (
    <View testID={testID} accessibilityRole="image" accessibilityLabel={tr("brand.name")} style={{ width, height }}>
      <Svg width={width} height={height} viewBox={mark.viewBox}>
        <G>
          {paths.map((p, i) =>
            p.stroke ? (
              <Path key={i} d={p.d} fill="none" stroke={ink} strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <Path key={i} d={p.d} fill={ink} transform={p.transform} />
            ),
          )}
        </G>
        {dot ? <Circle cx={dot[1]} cy={dot[2]} r={dot[3]} fill={dot[4]} /> : null}
      </Svg>
    </View>
  );
}

type Drawn = { d: string; transform?: string; stroke?: boolean; strokeWidth?: string };

/** The outline's <path> elements, as the SVG string the generator wrote carries them: filled glyphs with a transform, and the stroked roof. */
function parse(ink: string): Drawn[] {
  const out: Drawn[] = [];
  for (const m of ink.matchAll(/<path ([^>]*)\/>/g)) {
    const attrs = m[1]!;
    const d = /d="([^"]+)"/.exec(attrs)?.[1];
    if (!d) continue;
    const transform = /transform="([^"]+)"/.exec(attrs)?.[1];
    const strokeWidth = /stroke-width="([^"]+)"/.exec(attrs)?.[1];
    out.push(strokeWidth ? { d, stroke: true, strokeWidth } : { d, transform });
  }
  return out;
}
