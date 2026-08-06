import { cn } from "@/lib/cn";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * Avatars.
 *
 * Presets are drawn as inline SVG rather than shipped as images: 72 options
 * cost zero network requests, stay crisp at any size, recolour with the theme,
 * and cannot leak a child's photo by accident. A moderated photo upload is a
 * later increment; `upload:<fileId>` keys already route through the authorized
 * file handler.
 *
 * Key format: "preset:<creature>-<palette>", e.g. "preset:fox-sunset".
 */

type Creature = {
  id: string;
  /** ⚠ A KEY, not a word — "Coral fox" is read aloud on the join screen, in
      the reader's language. */
  nameKey: TranslationKey;
  /** ear/topper geometry, drawn behind the head */
  ears: "pointed" | "round" | "tall" | "none" | "horns" | "tuft";
  muzzle: boolean;
  /** simple identity marks drawn over the face */
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

export const PALETTES: Palette[] = [
  { id: "sunset", nameKey: "avatar.sunset", bg: "#ffe8d6", body: "#f4956a", accent: "#ffd9c0", dark: "#7c3f22" },
  { id: "mint", nameKey: "avatar.mint", bg: "#d9f5e7", body: "#5cc9a0", accent: "#e6fbf1", dark: "#1e5c46" },
  { id: "sky", nameKey: "avatar.sky", bg: "#dcecff", body: "#6fa8f5", accent: "#eaf3ff", dark: "#20406e" },
  { id: "grape", nameKey: "avatar.grape", bg: "#ece0ff", body: "#a984ea", accent: "#f5efff", dark: "#442a75" },
  { id: "lemon", nameKey: "avatar.lemon", bg: "#fff2c9", body: "#f2c14e", accent: "#fff8e0", dark: "#7a5a12" },
  { id: "berry", nameKey: "avatar.berry", bg: "#ffe0ec", body: "#ef7ea6", accent: "#fff0f5", dark: "#7a2547" },
];

export const AVATAR_PRESETS: string[] = CREATURES.flatMap((c) =>
  PALETTES.map((p) => `preset:${c.id}-${p.id}`),
);

/**
 * "Sunset fox", in the reader's language. `t` is required — the two screens
 * that read this aloud (the pupil's join flow and their profile) both have it,
 * and an English fallback here would be the last English on a Marathi screen.
 * The creature values are stored lowercase in English because they only ever
 * appear mid-phrase; Devanagari has no case to worry about.
 */
export function describeAvatar(key: string, t: Translate): string {
  const parsed = parseKey(key);
  if (!parsed) return t("avatar.plain");
  return t("avatar.name", {
    color: t(parsed.palette.nameKey),
    animal: t(parsed.creature.nameKey),
  });
}

function parseKey(key: string | null | undefined) {
  if (!key?.startsWith("preset:")) return null;
  const [creatureId, paletteId] = key.slice(7).split("-");
  const creature = CREATURES.find((c) => c.id === creatureId);
  const palette = PALETTES.find((p) => p.id === paletteId);
  if (!creature || !palette) return null;
  return { creature, palette };
}

/**
 * Deterministic fallback so a user with no avatar still gets a stable one.
 *
 * Both shifts are unsigned (`>>>`). With the signed `>>`, any seed hashing above
 * 2^31 yields a negative shifted value, and `negative % length` is negative in
 * JavaScript — indexing off the front of the array and returning undefined.
 * That crashed the dashboard for roughly half of all possible names.
 */
export function fallbackKey(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const creature = CREATURES[(hash >>> 0) % CREATURES.length]!;
  const palette = PALETTES[(hash >>> 5) % PALETTES.length]!;
  return `preset:${creature.id}-${palette.id}`;
}

const SIZES = {
  xs: "size-7",
  sm: "size-9",
  md: "size-11",
  lg: "size-16",
  xl: "size-24",
  "2xl": "size-32",
} as const;

export function Avatar({
  avatarKey,
  name,
  size = "md",
  className,
  ring,
}: {
  avatarKey?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}) {
  const key = avatarKey?.startsWith("preset:") ? avatarKey : fallbackKey(avatarKey ?? name);
  const parsed = parseKey(key) ?? parseKey(fallbackKey(name))!;

  return (
    <span
      className={cn(
        "relative inline-block shrink-0 overflow-hidden rounded-full",
        SIZES[size],
        ring && "ring-2 ring-accent ring-offset-2 ring-offset-[--surface]",
        className,
      )}
      // The visible name is almost always adjacent, so the image itself is
      // decorative; announcing "Sunset fox" too would just add noise.
      role="img"
      aria-label={`${name}'s avatar`}
    >
      <CreatureSvg creature={parsed.creature} palette={parsed.palette} />
    </span>
  );
}

export function CreatureSvg({ creature, palette }: { creature: Creature; palette: Palette }) {
  const { body, bg, accent, dark } = palette;

  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
      <rect width="100" height="100" fill={bg} />

      {/* ears / toppers, behind the head */}
      {creature.ears === "pointed" && (
        <>
          <path d="M26 40 L24 16 L45 30 Z" fill={body} />
          <path d="M74 40 L76 16 L55 30 Z" fill={body} />
          <path d="M29 37 L28 24 L40 32 Z" fill={accent} />
          <path d="M71 37 L72 24 L60 32 Z" fill={accent} />
        </>
      )}
      {creature.ears === "round" && (
        <>
          <circle cx="26" cy="30" r="13" fill={body} />
          <circle cx="74" cy="30" r="13" fill={body} />
          <circle cx="26" cy="30" r="6.5" fill={accent} />
          <circle cx="74" cy="30" r="6.5" fill={accent} />
        </>
      )}
      {creature.ears === "tall" && (
        <>
          <ellipse cx="36" cy="21" rx="8" ry="20" fill={body} />
          <ellipse cx="64" cy="21" rx="8" ry="20" fill={body} />
          <ellipse cx="36" cy="22" rx="3.8" ry="14" fill={accent} />
          <ellipse cx="64" cy="22" rx="3.8" ry="14" fill={accent} />
        </>
      )}
      {creature.ears === "tuft" && (
        <>
          <path d="M28 34 L30 18 L44 28 Z" fill={body} />
          <path d="M72 34 L70 18 L56 28 Z" fill={body} />
        </>
      )}
      {creature.ears === "horns" && (
        <>
          <path d="M34 26 q4 -14 12 -6" stroke={dark} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M66 26 q-4 -14 -12 -6" stroke={dark} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* head */}
      <ellipse cx="50" cy="56" rx="32" ry="30" fill={body} />

      {/* identity marks */}
      {creature.marks === "patch" && (
        <>
          <ellipse cx="36" cy="52" rx="10" ry="9" fill={dark} opacity="0.85" />
          <ellipse cx="64" cy="52" rx="10" ry="9" fill={dark} opacity="0.85" />
        </>
      )}
      {creature.marks === "stripes" && (
        <>
          <path d="M38 32 l4 8" stroke={dark} strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
          <path d="M50 30 l0 9" stroke={dark} strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
          <path d="M62 32 l-4 8" stroke={dark} strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
        </>
      )}
      {creature.marks === "spots" && (
        <>
          <circle cx="30" cy="44" r="3.2" fill={accent} opacity="0.9" />
          <circle cx="70" cy="46" r="2.6" fill={accent} opacity="0.9" />
          <circle cx="38" cy="72" r="2.4" fill={accent} opacity="0.9" />
        </>
      )}
      {creature.marks === "blush" && (
        <>
          <ellipse cx="29" cy="62" rx="6" ry="4" fill="#ff8fa8" opacity="0.55" />
          <ellipse cx="71" cy="62" rx="6" ry="4" fill="#ff8fa8" opacity="0.55" />
        </>
      )}

      {/* muzzle */}
      {creature.muzzle && <ellipse cx="50" cy="64" rx="15" ry="11" fill={accent} />}

      {/* eyes — offset highlight is what makes them read as friendly */}
      <circle cx="39" cy="52" r="5.4" fill="#1f2430" />
      <circle cx="61" cy="52" r="5.4" fill="#1f2430" />
      <circle cx="40.8" cy="50.2" r="1.9" fill="#fff" />
      <circle cx="62.8" cy="50.2" r="1.9" fill="#fff" />

      {/* nose / beak / mouth */}
      {creature.marks === "beak" ? (
        <path d="M50 56 L58 63 L50 69 L42 63 Z" fill="#f5a623" />
      ) : (
        <>
          <ellipse cx="50" cy="60" rx="4" ry="3" fill="#1f2430" />
          <path
            d="M50 63 v3 M50 66 q-5 4 -9 0 M50 66 q5 4 9 0"
            stroke="#1f2430"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
