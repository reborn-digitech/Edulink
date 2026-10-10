import { View } from "react-native";
import { Image } from "expo-image";
import { API_BASE } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { useAuthHeaders } from "../family/shared";

/**
 * A practice question's figure above the stem (the quiz bank's figure builder, 10 Oct 2026): the PNG
 * the importer stored for the language the stem is served in, drawn by expo-image so the bearer token
 * rides in a header (RN's Image cannot send one), with the figure in words as its accessibility label.
 * Full width at the figures' own 16 : 10, on white whatever the tone, since a textbook figure is ink on
 * paper; the space is held while the token is read so the stem below does not jump.
 */
export function QuestionFigure({ fileId, alt }: { fileId: string; alt: string }) {
  const th = useTheme();
  const headers = useAuthHeaders();
  const frame = { width: "100%" as const, aspectRatio: 16 / 10, borderRadius: th.radius.md, borderWidth: 1, borderColor: th.border, backgroundColor: "#ffffff", overflow: "hidden" as const };
  return (
    <View style={frame} testID="question-figure">
      {headers ? (
        <Image
          source={{ uri: `${API_BASE}/api/files/${encodeURIComponent(fileId)}`, headers }}
          accessible
          accessibilityLabel={alt}
          contentFit="contain"
          style={{ width: "100%", height: "100%" }}
        />
      ) : null}
    </View>
  );
}
