import { useEffect, useRef, useState, type Ref } from "react";
import { AccessibilityInfo, Platform, Pressable, TextInput, View, type TextInputProps } from "react-native";
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
 * Boxes whose letters are not words (TA-165, 13 Nov 2026): a password, an e-mail address, a link, a number, a code typed
 * in capitals. The keyboard's language never converts them, shows no preview of what is typed and draws no chip, as the
 * web converts only plain text boxes (typing-switch.tsx's editableOf). A password's letters were shown in clear under
 * its box and turned to Devanagari at a hyphen, so the right password was refused.
 */
const NOT_WORDS_KEYBOARDS = new Set(["email-address", "url", "number-pad", "decimal-pad", "numeric", "phone-pad", "numbers-and-punctuation", "visible-password", "ascii-capable-number-pad"]);
const NOT_WORDS_INPUT_MODES = new Set(["email", "url", "numeric", "decimal", "tel"]);
const NOT_WORDS_CONTENT = /password|email|url|telephone|onetimecode|one-time-code|sms-otp|username|^tel/i;
export function takesWords(props: Pick<TextInputProps, "secureTextEntry" | "keyboardType" | "inputMode" | "autoCapitalize" | "textContentType" | "autoComplete">): boolean {
  if (props.secureTextEntry) return false;
  if (props.keyboardType && NOT_WORDS_KEYBOARDS.has(props.keyboardType)) return false;
  if (props.inputMode && NOT_WORDS_INPUT_MODES.has(props.inputMode)) return false;
  if (props.autoCapitalize === "characters") return false;
  if (props.textContentType && NOT_WORDS_CONTENT.test(props.textContentType)) return false;
  if (props.autoComplete && NOT_WORDS_CONTENT.test(props.autoComplete)) return false;
  return true;
}

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
  // A box whose letters are not words is typed as it is, whatever the keyboard's language (TA-165).
  const words = takesWords(rest);
  const language = words ? (own ?? typing ?? chosen) : "en";
  // The refusal is said when it appears on an iPhone too (TA-236): accessibilityLiveRegion below is Android's alone, so
  // VoiceOver said nothing when "Wrong password" came up. Android's TalkBack hears the live region and is not told twice.
  useEffect(() => {
    if (error && Platform.OS !== "android") AccessibilityInfo.announceForAccessibility?.(error);
  }, [error]);
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
        {words && (focused || language !== "en") ? (
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
        // While an error stands it is the box's hint, as it is drawn under the box in the hint's place (TA-236).
        accessibilityHint={error ? error : hint}
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
