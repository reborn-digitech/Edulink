import { Platform, Text } from "react-native";
import { type } from "@edulink/tokens";
import { useTheme } from "@/lib/theme";

/**
 * A tab's label, which shrinks to fit rather than end in "…". Five labels
 * share the bar, and Android lets a person scale text up: at 130 %
 * "Assignments" no longer fits a fifth of 390 pt. adjustsFontSizeToFit
 * shrinks it — to no less than 70 % of its size, on iOS and Android alike —
 * and only past that does the ellipsis come back. The web target ignores the
 * prop and keeps the ellipsis, which is what e2e/ux.spec.ts measures.
 *
 * iOS 13 and later never scale a tab label (a long press shows the large
 * content viewer instead), so, as the library's own label does, font scaling
 * is off there. A function label bypasses tabBarLabelStyle, so everything
 * that style carried is here: the size the layout picks for the width, and
 * below the icon, the 5 pt the library pads each pressable with, taken back.
 */
export function TabLabel({ children, color, position, size }: { children: string; color: string; position: "beside-icon" | "below-icon"; size: number }) {
  const th = useTheme();
  const largeContentViewer = Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 13;
  const place = position === "beside-icon" ? { lineHeight: type.base.line, marginStart: th.space[1], marginEnd: th.space[3] } : { marginHorizontal: -th.space[1], maxWidth: "120%" as const };
  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.7}
      allowFontScaling={!largeContentViewer}
      maxFontSizeMultiplier={2}
      style={[{ color, fontSize: size, fontWeight: "600", textAlign: "center" }, place]}
    >
      {children}
    </Text>
  );
}
