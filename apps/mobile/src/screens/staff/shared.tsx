import { Linking, Pressable, View } from "react-native";
import type { TranslationKey } from "@edulink/i18n";
import type { ApiResult } from "@edulink/contracts";
import { Text } from "@/components";
import { API_BASE, errorText } from "@/lib/api";
import { formatWith } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

/**
 * What the office's screens share: the head's window picker, a chip group
 * for filters, dates as the school reads them, and the door to the web for
 * the heavy configuration the phone does not carry (timetable editing, exam
 * series, intake, the class staffing page).
 */
export type Span = "7" | "30" | "90" | "year";
export const DEFAULT_SPAN: Span = "30";

export const SPANS: { span: Span; labelKey: TranslationKey }[] = [
  { span: "7", labelKey: "principal.days7" },
  { span: "30", labelKey: "principal.days30" },
  { span: "90", labelKey: "principal.aTerm" },
  { span: "year", labelKey: "principal.yearSoFar" },
];

/** Opens the same page on the web, signed in there; the plan keeps heavy configuration off the phone. */
export function openWeb(path: string): void {
  void Linking.openURL(`${API_BASE}${path}`);
}

/** "2026-09-07" → "07/09/2026"; the key itself if the date cannot be read. */
export function formatDateKey(key: string, locale?: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }): string {
  // dd/mm/yyyy whenever a day is asked for (src/lib/dates.ts, A3-journeys-31).
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? formatWith(key, options, locale ?? "en") : key;
}

/** A from–to line, or the one day when both are the same. */
export function formatRange(t: (key: TranslationKey, vars?: Record<string, string | number>) => string, from: string, to: string, locale?: string): string {
  return from === to ? formatDateKey(from, locale) : t("calendar.rangeTo", { from: formatDateKey(from, locale), to: formatDateKey(to, locale) });
}

export function pct(n: number | null | undefined): string {
  return n === null || n === undefined ? "—" : `${Math.round(n)}%`;
}

const LEAVE_STATUSES = ["pending", "approved", "declined", "cancelled"];
export function leaveStatusKey(status: string): TranslationKey {
  const s = status.toLowerCase();
  return (LEAVE_STATUSES.includes(s) ? `leaveStatus.${s}` : "leaveStatus.pending") as TranslationKey;
}

const LEAVE_KINDS = ["casual", "sick", "unpaid", "other"];
export function leaveKindLabel(t: (key: TranslationKey) => string, kind: string): string {
  const k = kind.toLowerCase();
  return LEAVE_KINDS.includes(k) ? t(`leaveKind.${k}` as TranslationKey) : kind;
}

// The one helper that names a role (TA-327), moved to lib so a component and every screen can use it.
export { roleLabel } from "@/lib/role-label";

export type ChipOption<T extends string> = { value: T; label: string };

/**
 * A row of chips that behaves as a radio group (one checked) or, with
 * `multiple`, as checkboxes. Every chip is a named pressable at least the
 * tap height, and wraps rather than scrolls so nothing hides off-screen.
 */
export function Chips<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: ChipOption<T>[];
  onChange: (next: T) => void;
  disabled?: boolean;
}) {
  const th = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: th.space[1] }}>
      <Text variant="xs" tone="subtle" bold>
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              aria-checked={on}
              accessibilityState={{ checked: on, disabled: Boolean(disabled) }}
              accessibilityLabel={o.label}
              disabled={disabled}
              onPress={() => onChange(o.value)}
              style={({ pressed }) => ({
                minHeight: th.tap,
                // A long reason wraps inside its chip instead of running past the card (A3-states-15).
                maxWidth: "100%",
                paddingHorizontal: th.space[4],
                paddingVertical: th.space[2],
                borderRadius: th.radius.md,
                justifyContent: "center",
                backgroundColor: on ? th.accent : th.surfaceMuted,
                borderWidth: 1,
                borderColor: on ? th.accent : th.border,
                opacity: pressed || disabled ? 0.7 : 1,
              })}
            >
              <Text variant="sm" bold={on} style={{ color: on ? th.accentFg : th.fg, flexShrink: 1 }}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** The same chips as checkboxes: many may be on. */
export function MultiChips<T extends string>({ label, values, options, onToggle }: { label: string; values: T[]; options: ChipOption<T>[]; onToggle: (value: T) => void }) {
  const th = useTheme();
  return (
    <View accessibilityLabel={label} style={{ gap: th.space[1] }}>
      <Text variant="xs" tone="subtle" bold>
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        {options.map((o) => {
          const on = values.includes(o.value);
          return (
            <Pressable
              key={o.value}
              accessibilityRole="checkbox"
              aria-checked={on}
              accessibilityState={{ checked: on }}
              accessibilityLabel={o.label}
              onPress={() => onToggle(o.value)}
              style={({ pressed }) => ({
                minHeight: th.tap,
                paddingHorizontal: th.space[4],
                borderRadius: th.radius.md,
                justifyContent: "center",
                backgroundColor: on ? th.accentSoft : th.surfaceMuted,
                borderWidth: 1,
                borderColor: on ? th.accent : th.border,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text variant="sm" bold={on} tone={on ? "accent" : "fg"}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** How far back the figures look — the web's WindowPicker, as a radio group. */
export function WindowPicker({ value, onChange }: { value: Span; onChange: (next: Span) => void }) {
  const t = useT();
  return <Chips label={t("principal.howFarBack")} value={value} options={SPANS.map((s) => ({ value: s.span, label: t(s.labelKey) }))} onChange={onChange} />;
}

/** A line of secondary text that a screen reader announces once (a saved-decision notice, a sent count). */
export function Notice({ text, tone = "ok" }: { text: string; tone?: "ok" | "danger" }) {
  const th = useTheme();
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ padding: th.space[3], borderRadius: th.radius.md, backgroundColor: tone === "ok" ? th.okSoft : th.dangerSoft }}>
      <Text variant="sm" bold tone={tone}>
        {text}
      </Text>
    </View>
  );
}

/** A date key moved by whole days — "2026-09-07" + 7 → "2026-09-14"; the key itself if it cannot be read. */
export function addDaysToKey(key: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return key;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days)).toISOString().slice(0, 10);
}

/** A month key moved by whole months — "2026-09" − 1 → "2026-08"; the key itself if it cannot be read. */
export function shiftMonth(month: string, delta: number): string {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return month;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1 + delta, 1)).toISOString().slice(0, 7);
}

/** This month as the school day counts it, for "no further forward than now". */
export function thisMonthKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 7);
}

/** A pasted-list row the server could not use, in the reader's language: the parser sends a key and its numbers, never a sentence. */
export function problemLine(
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
  p: { line: number; value: string; reasonKey: string; reasonVars?: Record<string, string | number> },
): { title: string; caption: string } {
  return { title: `${t("invites.line", { line: p.line })} · ${p.value || t("invites.blankRow")}`, caption: t(p.reasonKey as TranslationKey, p.reasonVars) };
}

/** "09:30" → 570, the minutes after midnight the server counts in; null for anything that is not a 24-hour time. */
export function parseClock(text: string): number | null {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(text.trim());
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  return hours > 23 || minutes > 59 ? null : hours * 60 + minutes;
}

/**
 * A write the server refused: its sentence, its status (0 when the phone
 * never reached it) and the fields it named in `issues`, so a form can put
 * each sentence under its own field and the rest above the button.
 */
export class Refusal extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly issues: Record<string, string>,
  ) {
    super(message);
    this.name = "Refusal";
  }
}

/** A write's data, or a Refusal carrying the server's sentence (the fallback when it gave none) and its fields. */
export function must<T>(result: ApiResult<T>, fallback: string): T {
  if (result.ok) return result.data;
  throw new Refusal(errorText(result, fallback), result.status, result.issues ?? {});
}
