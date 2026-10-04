import { View } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import type { Translate, TranslationKey } from "@edulink/i18n";
import { useTheme } from "@/lib/theme";
import { Text } from "./text";

/**
 * Avatars — the web's components/ui/avatar.tsx, drawn with react-native-svg.
 *
 * Presets are drawings rather than pictures: 72 of them cost nothing to
 * download, stay crisp at any size and cannot leak a child's photo. The key
 * is "preset:<creature>-<palette>", e.g. "preset:fox-sunset" — the same
 * strings the web saves, so a look chosen on a laptop is the look here.
 *
 * With no preset (nothing chosen yet, or a key this build does not know) the
 * person's initials stand in, on the role's accent.
 */

type Creature = {
  id: string;
  /** A key, not a word — "Sunset fox" is read aloud in the reader's language. */
  nameKey: TranslationKey;
  ears: "pointed" | "round" | "tall" | "none" | "horns" | "tuft";
  muzzle: boolean;
  marks: "none" | "patch" | "stripes" | "spots" | "beak" | "blush";
};

export const CREATURES: Creature[] = [
  { id: "fox", nameKey: "avatar.fox", ears: "pointed", muzzle: true, marks: "patch" },
  { id: "cat", nameKey: "avatar.cat", ears: "pointed", muzzle: true, marks: "stripes" },
  { id: "panda", nameKey: "avatar.panda", ears: "round", muzzle: true, marks: "patch" },
  { id: "bear", nameKey: "avatar.bear", ears: "round", muzzle: true, marks: "none" },
  { id: "bunny", nameKey: "avatar.bunny", ears: "tall", muzzle: true, marks: "blush" },
  { id: "owl", nameKey: "avatar.owl", ears: "tuft", muzzle: false, marks: "beak" },
  { id: "frog", nameKey: "avatar.frog", ears: "none", muzzle: false, marks: "blush" },
  { id: "penguin", nameKey: "avatar.penguin", ears: "none", muzzle: false, marks: "beak" },
  { id: "dino", nameKey: "avatar.dino", ears: "horns", muzzle: true, marks: "spots" },
  { id: "koala", nameKey: "avatar.koala", ears: "round", muzzle: true, marks: "none" },
  { id: "tiger", nameKey: "avatar.tiger", ears: "pointed", muzzle: true, marks: "stripes" },
  { id: "monkey", nameKey: "avatar.monkey", ears: "round", muzzle: true, marks: "blush" },
];

type Palette = { id: string; nameKey: TranslationKey; bg: string; body: string; accent: string; dark: string };

/** The drawings' own colours — data, the same six the web draws, not the app's theme. */
export const PALETTES: Palette[] = [
  { id: "sunset", nameKey: "avatar.sunset", bg: "#ffe8d6", body: "#f4956a", accent: "#ffd9c0", dark: "#7c3f22" },
  { id: "mint", nameKey: "avatar.mint", bg: "#d9f5e7", body: "#5cc9a0", accent: "#e6fbf1", dark: "#1e5c46" },
  { id: "sky", nameKey: "avatar.sky", bg: "#dcecff", body: "#6fa8f5", accent: "#eaf3ff", dark: "#20406e" },
  { id: "grape", nameKey: "avatar.grape", bg: "#ece0ff", body: "#a984ea", accent: "#f5efff", dark: "#442a75" },
  { id: "lemon", nameKey: "avatar.lemon", bg: "#fff2c9", body: "#f2c14e", accent: "#fff8e0", dark: "#7a5a12" },
  { id: "berry", nameKey: "avatar.berry", bg: "#ffe0ec", body: "#ef7ea6", accent: "#fff0f5", dark: "#7a2547" },
];

/** Eyes, their shine, cheeks and a beak — the same on every creature. */
const INK = "#1f2430";
const SHINE = "#ffffff";
const BLUSH = "#ff8fa8";
const BEAK = "#f5a623";

/** Every preset the server accepts, in the web's order (creature by creature, palette by palette). */
export const AVATAR_PRESETS: string[] = CREATURES.flatMap((c) => PALETTES.map((p) => `preset:${c.id}-${p.id}`));

export function parseAvatarKey(key: string | null | undefined): { creature: Creature; palette: Palette } | null {
  if (!key?.startsWith("preset:")) return null;
  const [creatureId, paletteId] = key.slice(7).split("-");
  const creature = CREATURES.find((c) => c.id === creatureId);
  const palette = PALETTES.find((p) => p.id === paletteId);
  if (!creature || !palette) return null;
  return { creature, palette };
}

/** "Sunset fox", in the reader's language — the web's describeAvatar. */
export function describeAvatar(key: string | null | undefined, t: Translate): string {
  const parsed = parseAvatarKey(key);
  if (!parsed) return t("avatar.plain");
  return t("avatar.name", { color: t(parsed.palette.nameKey), animal: t(parsed.creature.nameKey) });
}

/** "ZZ Head" → "ZH"; one word gives its first two letters' first; nothing gives "?". */
export function initials(name: string): string {
  // A bracketed note ("ZZ Apte (parent)") is not part of the name, and a word
  // counts from its first letter or digit: the initials were "Z(" (B-25).
  const words = name
    .replace(/\([^)]*\)?/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+/u, ""))
    .filter(Boolean);
  if (words.length === 0) return "?";
  const letters = words.length === 1 ? [...words[0]!].slice(0, 1) : [[...words[0]!][0]!, [...words[words.length - 1]!][0]!];
  return letters.join("").toUpperCase();
}

/**
 * A person's avatar. `name` is what a screen reader hears (the name alone, as
 * on the web — "'s avatar" would be English on a Marathi screen). Inside a
 * control that already says what it is (a picker's option), pass `decorative`
 * so the drawing is not announced a second time.
 */
export function Avatar({ avatarKey, name, size = 40, decorative }: { avatarKey?: string | null; name: string; size?: number; decorative?: boolean }) {
  const th = useTheme();
  const parsed = parseAvatarKey(avatarKey);
  const a11y = decorative
    ? { accessible: false, importantForAccessibility: "no-hide-descendants" as const, accessibilityElementsHidden: true }
    : { accessible: true, accessibilityRole: "image" as const, accessibilityLabel: name };
  return (
    <View {...a11y} style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", backgroundColor: parsed ? parsed.palette.bg : th.accentSoft, alignItems: "center", justifyContent: "center" }}>
      {parsed ? (
        <CreatureSvg creature={parsed.creature} palette={parsed.palette} size={size} />
      ) : (
        <Text variant={size >= 80 ? "2xl" : size >= 48 ? "lg" : size >= 32 ? "sm" : "xs"} bold style={{ color: th.accentStrong }}>
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

/** The drawing itself, in a 100 × 100 box — the web's CreatureSvg, shape for shape. */
export function CreatureSvg({ creature, palette, size }: { creature: Creature; palette: Palette; size: number }) {
  const { body, bg, accent, dark } = palette;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Rect width="100" height="100" fill={bg} />
      {creature.ears === "pointed" ? (
        <>
          <Path d="M26 40 L24 16 L45 30 Z" fill={body} />
          <Path d="M74 40 L76 16 L55 30 Z" fill={body} />
          <Path d="M29 37 L28 24 L40 32 Z" fill={accent} />
          <Path d="M71 37 L72 24 L60 32 Z" fill={accent} />
        </>
      ) : null}
      {creature.ears === "round" ? (
        <>
          <Circle cx="26" cy="30" r="13" fill={body} />
          <Circle cx="74" cy="30" r="13" fill={body} />
          <Circle cx="26" cy="30" r="6.5" fill={accent} />
          <Circle cx="74" cy="30" r="6.5" fill={accent} />
        </>
      ) : null}
      {creature.ears === "tall" ? (
        <>
          <Ellipse cx="36" cy="21" rx="8" ry="20" fill={body} />
          <Ellipse cx="64" cy="21" rx="8" ry="20" fill={body} />
          <Ellipse cx="36" cy="22" rx="3.8" ry="14" fill={accent} />
          <Ellipse cx="64" cy="22" rx="3.8" ry="14" fill={accent} />
        </>
      ) : null}
      {creature.ears === "tuft" ? (
        <>
          <Path d="M28 34 L30 18 L44 28 Z" fill={body} />
          <Path d="M72 34 L70 18 L56 28 Z" fill={body} />
        </>
      ) : null}
      {creature.ears === "horns" ? (
        <>
          <Path d="M34 26 q4 -14 12 -6" stroke={dark} strokeWidth="5" fill="none" strokeLinecap="round" />
          <Path d="M66 26 q-4 -14 -12 -6" stroke={dark} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      ) : null}

      <Ellipse cx="50" cy="56" rx="32" ry="30" fill={body} />

      {creature.marks === "patch" ? (
        <>
          <Ellipse cx="36" cy="52" rx="10" ry="9" fill={dark} opacity="0.85" />
          <Ellipse cx="64" cy="52" rx="10" ry="9" fill={dark} opacity="0.85" />
        </>
      ) : null}
      {creature.marks === "stripes" ? (
        <>
          <Path d="M38 32 l4 8" stroke={dark} strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
          <Path d="M50 30 l0 9" stroke={dark} strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
          <Path d="M62 32 l-4 8" stroke={dark} strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
        </>
      ) : null}
      {creature.marks === "spots" ? (
        <>
          <Circle cx="30" cy="44" r="3.2" fill={accent} opacity="0.9" />
          <Circle cx="70" cy="46" r="2.6" fill={accent} opacity="0.9" />
          <Circle cx="38" cy="72" r="2.4" fill={accent} opacity="0.9" />
        </>
      ) : null}
      {creature.marks === "blush" ? (
        <>
          <Ellipse cx="29" cy="62" rx="6" ry="4" fill={BLUSH} opacity="0.55" />
          <Ellipse cx="71" cy="62" rx="6" ry="4" fill={BLUSH} opacity="0.55" />
        </>
      ) : null}

      {creature.muzzle ? <Ellipse cx="50" cy="64" rx="15" ry="11" fill={accent} /> : null}

      <Circle cx="39" cy="52" r="5.4" fill={INK} />
      <Circle cx="61" cy="52" r="5.4" fill={INK} />
      <Circle cx="40.8" cy="50.2" r="1.9" fill={SHINE} />
      <Circle cx="62.8" cy="50.2" r="1.9" fill={SHINE} />

      {creature.marks === "beak" ? (
        <Path d="M50 56 L58 63 L50 69 L42 63 Z" fill={BEAK} />
      ) : (
        <>
          <Ellipse cx="50" cy="60" rx="4" ry="3" fill={INK} />
          <Path d="M50 63 v3 M50 66 q-5 4 -9 0 M50 66 q5 4 9 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
