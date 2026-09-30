import { useEffect, useRef, useState, type Ref } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { transliterateWord, type TypingLanguage } from "@edulink/i18n/transliterate";
import { useTheme } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { TYPING_LANGUAGES, useTyping } from "@/lib/typing";
import { type } from "@edulink/tokens";
import { Text } from "./text";
import { Icon } from "./icon";

/** A Latin word at the very end of the text, and the one just closed by a space or a punctuation mark. */
const ENDED = /([A-Za-z~.]+)([\s.,;:!?()"'\-/])$/;
const PENDING = /([A-Za-z~.]+)$/;

/**
 * A labelled input with an error line the screen reader reads with it. A ref
 * reaches the input, so a screen can bring it into focus.
 *
 * THE KEYBOARD'S LANGUAGE, as on the web (components/typing-switch.tsx
 * there): with Hindi or Marathi on, a word typed in English letters becomes
 * Devanagari the moment a space or a punctuation mark ends it, and what it
 * will become is shown under the box while it is typed. The chip beside the
 * label, shown while the box has focus or its language is not English, cycles
 * EN → हिंदी → मराठी: for every box when the box follows the person's choice,
 * for this box alone when it has a language of its own (`typing`). Only a
 * word ended at the end of the text is converted; a word edited in the
 * middle is left as typed, the caret being the phone's to place.
 */
export function Field({ label, error, hint, style, typing, onChangeText, onFocus, onBlur, ...rest }: TextInputProps & { label: string; error?: string | null; hint?: string; ref?: Ref<TextInput>; typing?: TypingLanguage }) {
  const t = useTheme();
  const tr = useT();
  const { language: chosen, setLanguage } = useTyping();
  const [own, setOwn] = useState<TypingLanguage | null>(null);
  const [focused, setFocused] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  // The chip outlives the box's focus by a moment, so that a press on it, which on a web target takes the focus first, still lands.
  const leaving = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (leaving.current) clearTimeout(leaving.current); }, []);
  const language = own ?? typing ?? chosen;
  const chipLabel = { en: "EN", hi: "हिंदी", mr: "मराठी" }[language];
  const cycle = () => {
    const next = TYPING_LANGUAGES[(TYPING_LANGUAGES.indexOf(language) + 1) % TYPING_LANGUAGES.length]!;
    if (typing) setOwn(next);
    else setLanguage(next);
    setPending(null);
  };
  const change = (text: string) => {
    let next = text;
    if (language !== "en") {
      const ended = ENDED.exec(text);
      if (ended) {
        const becomes = transliterateWord(ended[1]!, language);
        if (becomes !== ended[1]) next = text.slice(0, ended.index) + becomes + ended[2];
        setPending(null);
      } else {
        const open = PENDING.exec(text);
        const becomes = open ? transliterateWord(open[1]!, language) : null;
        setPending(open && becomes !== open[1] ? `${open[1]} → ${becomes}` : null);
      }
    } else if (pending) {
      setPending(null);
    }
    onChangeText?.(next);
  };
  return (
    <View style={{ gap: t.space[1] }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: t.space[2] }}>
        <Text variant="sm" bold style={{ flexShrink: 1 }}>
          {label}
        </Text>
        {focused || language !== "en" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr("typing.switch", { language: tr(`typing.${language}`) })}
            testID="typing-switch"
            onPress={cycle}
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: t.space[1], minHeight: 44, paddingHorizontal: t.space[3], borderRadius: t.radius.xl, borderWidth: 1, borderColor: t.border, backgroundColor: pressed ? t.surfaceMuted : t.surface })}
          >
            <Icon name="keyboard" size={16} color={language === "en" ? t.fgMuted : t.accentStrong} weight="regular" />
            <Text variant="xs" bold tone={language === "en" ? "muted" : "accent"}>
              {tr("typing.label", { language: chipLabel })}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={t.fgSubtle}
        style={[
          { minHeight: t.tap, borderWidth: 1, borderColor: error ? t.danger : t.border, borderRadius: t.radius.md, paddingHorizontal: t.space[4], fontSize: type.base.size, color: t.fg, backgroundColor: t.surface },
          style,
        ]}
        onChangeText={change}
        onFocus={(event) => {
          if (leaving.current) clearTimeout(leaving.current);
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          if (leaving.current) clearTimeout(leaving.current);
          leaving.current = setTimeout(() => setFocused(false), 400);
          onBlur?.(event);
        }}
        {...rest}
      />
      {pending ? (
        <Text variant="xs" tone="subtle" accessibilityLiveRegion="polite" testID="typing-hint">
          {pending}
        </Text>
      ) : error ? (
        <Text variant="xs" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="xs" tone="subtle">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
