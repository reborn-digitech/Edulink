import { ScrollView, View } from "react-native";
import { parseAnswer, type AnswerBlock, type AnswerInline } from "@edulink/contracts";
import { useTheme } from "@/lib/theme";
import { Text } from "./text";

/**
 * An answer of Vidura's as its restricted Markdown (docs/plans/vidura.md, decision 6; pass 1, 17 Oct 2026), drawn from
 * the parser the web uses too (packages/contracts v1/assistant-markdown.ts): headings, numbered and bulleted lists,
 * bold, platform links and tables, and nothing else. A platform path is a link the caller opens (`onPath`); a
 * citation mark stays a small "[2]" pointing at the sources below the answer. A table scrolls sideways in its own box.
 */
export function AnswerMarkdown({ text, onPath, blocks: given }: { text: string; onPath?: (path: string) => void; blocks?: AnswerBlock[] }) {
  const th = useTheme();
  const blocks = given ?? parseAnswer(text);
  return (
    <View style={{ gap: th.space[2] }} testID="vidura-answer">
      {blocks.map((b, i) => {
        if (b.kind === "heading")
          return (
            <Text key={i} variant="base" bold accessibilityRole="header" level={3}>
              <Inlines items={b.inlines} onPath={onPath} />
            </Text>
          );
        if (b.kind === "paragraph")
          return (
            <Text key={i} variant="base">
              <Inlines items={b.inlines} onPath={onPath} />
            </Text>
          );
        if (b.kind === "list")
          return (
            <View key={i} style={{ gap: th.space[1] }}>
              {b.items.map((item, n) => (
                <View key={n} style={{ flexDirection: "row", gap: th.space[2] }}>
                  <Text variant="base" tone="muted" accessibilityElementsHidden importantForAccessibility="no">
                    {b.ordered ? `${b.start + n}.` : "•"}
                  </Text>
                  <Text variant="base" style={{ flex: 1 }}>
                    <Inlines items={item} onPath={onPath} />
                  </Text>
                </View>
              ))}
            </View>
          );
        return (
          <ScrollView key={i} horizontal style={{ borderWidth: 1, borderColor: th.border, borderRadius: th.radius.sm }}>
            <View>
              {[b.header, ...b.rows].map((row, r) => (
                <View key={r} style={{ flexDirection: "row", borderTopWidth: r === 0 ? 0 : 1, borderColor: th.border, backgroundColor: r === 0 ? th.surfaceMuted : undefined }}>
                  {row.map((cell, c) => (
                    <View key={c} style={{ minWidth: 96, maxWidth: 200, padding: th.space[2] }}>
                      <Text variant="sm" bold={r === 0}>
                        <Inlines items={cell} onPath={onPath} variant="sm" />
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        );
      })}
    </View>
  );
}

function Inlines({ items, onPath, variant = "base" }: { items: AnswerInline[]; onPath?: (path: string) => void; variant?: "base" | "sm" }) {
  return (
    <>
      {items.map((x, i) => {
        if (x.kind === "bold")
          return (
            <Text key={i} variant={variant} bold>
              {x.text}
            </Text>
          );
        if (x.kind === "cite")
          return (
            <Text key={i} variant="xs" tone="muted" bold>
              {`[${x.n}]`}
            </Text>
          );
        if (x.kind === "path")
          return onPath ? (
            <Text key={i} variant={variant} tone="accent" bold accessibilityRole="link" onPress={() => onPath(x.path)} style={{ textDecorationLine: "underline" }}>
              {x.path}
            </Text>
          ) : (
            <Text key={i} variant={variant}>
              {x.path}
            </Text>
          );
        return (
          <Text key={i} variant={variant}>
            {x.text}
          </Text>
        );
      })}
    </>
  );
}
