import { useEffect, useState, type ReactNode } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import type { z } from "zod";
import type { FamilyChild, familyExamsSchema } from "@edulink/contracts";
import type { Translate, TranslationKey } from "@edulink/i18n";
import { Button, Card, Row, Text } from "@/components";
import { API_BASE } from "@/lib/api";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { KEYS, keyStore } from "@/lib/storage";

/**
 * What the family screens share: the child switcher and the "has left"
 * banner (the web's parent/child-switcher and child-left), the words for a
 * register status, the tabs and chips the web draws as links, and the date
 * helpers the web keeps in lib/dates — written here because a screen may not
 * reach into src/lib, and Intl is the same on both sides.
 */

/** Opens the same page on the web, signed in there — for what the phone does not carry (practice questions, linking a child, a new post). */
export function openWeb(path: string): void {
  void Linking.openURL(`${API_BASE}${path}`);
}

/** The reader's locale with Latin digits pinned — the web's labelLocale: "१४" never comes back beside "सप्टेंबर", and a date's digits match the counts around it. */
export function latn(locale = "en"): string {
  return locale === "en" ? "en" : `${locale}-u-nu-latn`;
}

/* ------------------------------------------------------------------------- */
/* Route params and query strings                                            */
/* ------------------------------------------------------------------------- */

/** A route param as expo-router hands it over: one string, or nothing. */
export function param(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * The query string for a guardian's endpoints. Nothing at all when the
 * server should pick the first child, exactly as the web pages do. Built by
 * hand: React Native's URLSearchParams is only a partial polyfill.
 */
export function childQuery(childId: string | null | undefined, extra: Record<string, string | null | undefined> = {}): string {
  const parts: string[] = [];
  if (childId) parts.push(`childId=${encodeURIComponent(childId)}`);
  for (const [key, value] of Object.entries(extra)) if (value) parts.push(`${key}=${encodeURIComponent(value)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

/* ------------------------------------------------------------------------- */
/* Words: the register, exam kinds, subjects, practice levels               */
/* ------------------------------------------------------------------------- */

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";

/** Keys, not words — the web's ATTENDANCE_META; `marked` is the whole sentence the notification uses. */
export const ATTENDANCE = {
  PRESENT: { label: "attendance.present", hint: "attendance.presentHint", marked: "notifTitle.markedPresent", colour: "attPresent", soft: "attPresentSoft" },
  LATE: { label: "attendance.late", hint: "attendance.lateHint", marked: "notifTitle.markedLate", colour: "attLate", soft: "attLateSoft" },
  ABSENT: { label: "attendance.absent", hint: "attendance.absentHint", marked: "notifTitle.markedAbsent", colour: "attAbsent", soft: "attAbsentSoft" },
  EXCUSED: { label: "attendance.excused", hint: "attendance.excusedHint", marked: "notifTitle.markedExcused", colour: "attExcused", soft: "attExcusedSoft" },
} as const satisfies Record<AttendanceStatus, { label: TranslationKey; hint: TranslationKey; marked: TranslationKey; colour: string; soft: string }>;

export type ExamKind = "UNIT_TEST" | "MID_TERM" | "FINAL";
export const EXAM_KIND: Record<ExamKind, TranslationKey> = { UNIT_TEST: "exams.kindUnitTest", MID_TERM: "exams.kindMidTerm", FINAL: "exams.kindFinal" };

export type CertificateKind = "TC" | "NIRGAM" | "BONAFIDE" | "CHARACTER" | "STUDY" | "CUSTOM";
/** A certificate kind's name in the reader's language — the kinds a template is designed for and a family asks for. */
export const CERTIFICATE_KIND: Record<CertificateKind, TranslationKey> = { TC: "certificates.kindTc", NIRGAM: "certificates.kindNirgam", BONAFIDE: "certificates.kindBonafide", CHARACTER: "certificates.kindCharacter", STUDY: "certificates.kindStudy", CUSTOM: "certificates.kindCustom" };
export type CertificateRequestStatus = "PENDING" | "ISSUED" | "DECLINED" | "CANCELLED";
/** A request's status as a label key and a pill tone. */
export const CERTIFICATE_REQUEST_STATUS: Record<CertificateRequestStatus, { label: TranslationKey; tone: "warn" | "ok" | "danger" | "muted" }> = {
  PENDING: { label: "certificateRequests.statusPending", tone: "warn" },
  ISSUED: { label: "certificateRequests.statusIssued", tone: "ok" },
  DECLINED: { label: "certificateRequests.statusDeclined", tone: "danger" },
  CANCELLED: { label: "certificateRequests.statusCancelled", tone: "muted" },
};

const SUBJECT: Record<string, TranslationKey> = {
  MATHS: "subject.MATHS", SCIENCE: "subject.SCIENCE", PHYSICS: "subject.PHYSICS", CHEMISTRY: "subject.CHEMISTRY", BIOLOGY: "subject.BIOLOGY",
  EVS: "subject.EVS", HISTORY: "subject.HISTORY", GEOGRAPHY: "subject.GEOGRAPHY", CIVICS: "subject.CIVICS", ECONOMICS: "subject.ECONOMICS",
};
/** A quiz subject code in the reader's language; an unknown code stays as it came. */
export function subjectName(t: Translate, code: string): string {
  const key = SUBJECT[code];
  return key ? t(key) : code;
}

const LEVELS: TranslationKey[] = ["practice.level1", "practice.level2", "practice.level3", "practice.level4", "practice.level5", "practice.level6"];
export function levelName(t: Translate, level: number): string {
  return t(LEVELS[level - 1] ?? "practice.level1");
}

/* ------------------------------------------------------------------------- */
/* Dates and numbers                                                         */
/* ------------------------------------------------------------------------- */

/** A YYYY-MM-DD day key, formatted without a time zone ever moving it. */
export function formatDateKey(dateKey: string, locale = "en", opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  try {
    return new Intl.DateTimeFormat(latn(locale), { ...opts, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
  } catch {
    return dateKey;
  }
}

/** An ISO instant, in the school's zone when one is given (a meeting happens at the school). */
export function formatInstant(iso: string, locale = "en", opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }, timeZone?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(latn(locale), { ...opts, ...(timeZone ? { timeZone } : {}) }).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat(latn(locale), opts).format(date);
    } catch {
      return date.toISOString().slice(0, 16).replace("T", " ");
    }
  }
}

/** "in 2 days", "3 hours ago" — the web's relativeTime, in the reader's language. */
export function relativeTime(iso: string, locale = "en", now: Date = new Date()): string {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return iso;
  const diffMs = target.getTime() - now.getTime();
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31_536_000_000], ["month", 2_592_000_000], ["week", 604_800_000], ["day", 86_400_000], ["hour", 3_600_000], ["minute", 60_000]];
  try {
    const rtf = new Intl.RelativeTimeFormat(latn(locale), { numeric: "auto" });
    for (const [unit, ms] of units) if (Math.abs(diffMs) >= ms) return rtf.format(Math.round(diffMs / ms), unit);
    return rtf.format(Math.round(diffMs / 1000), "second");
  } catch {
    return formatInstant(iso, locale);
  }
}

export function hhmm(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

export function formatTimeRange(start: number | null, end: number | null): string {
  if (start === null || end === null) return "";
  return `${hhmm(start)} – ${hhmm(end)}`;
}

/** Thousandths as the web prints them: 67500 → "67.5", 80000 → "80", null → "—". */
export function formatMilli(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const whole = Math.trunc(value / 1000);
  const frac = Math.abs(value % 1000);
  if (frac === 0) return String(whole);
  return `${whole}.${String(frac).padStart(3, "0").replace(/0+$/, "")}`;
}

/** 0 = Sunday … 6 = Saturday, as the timetable's weekday numbers run. */
export function weekdayName(weekday: number, locale = "en"): string {
  try {
    return new Intl.DateTimeFormat(latn(locale), { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + weekday)));
  } catch {
    return String(weekday);
  }
}

/* ------------------------------------------------------------------------- */
/* The bearer token for an image the API serves                              */
/* ------------------------------------------------------------------------- */

/** `Authorization` for expo-image, which can send headers where RN's Image cannot; null until storage has been read. */
export function useAuthHeaders(): Record<string, string> | null {
  const [headers, setHeaders] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    let live = true;
    void keyStore()
      .get(KEYS.token)
      .then((token) => {
        if (live) setHeaders(token ? { Authorization: `Bearer ${token}` } : {});
      });
    return () => {
      live = false;
    };
  }, []);
  return headers;
}

/* ------------------------------------------------------------------------- */
/* Small pieces                                                              */
/* ------------------------------------------------------------------------- */

/** The web's ChildSwitcher: a horizontal rail, shown only with more than one child. */
export function ChildSwitcher({ pupils, selectedId, onSelect }: { pupils: FamilyChild[]; selectedId: string | null; onSelect: (studentMembershipId: string) => void }) {
  const th = useTheme();
  const t = useT();
  if (pupils.length < 2) return null;
  const active = selectedId ?? pupils[0]?.studentMembershipId;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={t("parent.chooseChild")} contentContainerStyle={{ gap: th.space[2] }}>
      {pupils.map((child) => {
        const on = child.studentMembershipId === active;
        return (
          <Pressable
            key={child.studentMembershipId}
            accessibilityRole="button"
            accessibilityLabel={`${child.name}, ${child.schoolName}`}
            accessibilityState={{ selected: on }}
            onPress={() => onSelect(child.studentMembershipId)}
            style={{ minHeight: th.tap, justifyContent: "center", paddingHorizontal: th.space[4], borderRadius: th.radius.xl, borderWidth: 1, borderColor: on ? th.accent : th.border, backgroundColor: on ? th.accentSoft : th.surface }}
          >
            <Text variant="sm" bold tone={on ? "accent" : "fg"}>
              {child.name}
            </Text>
            <Text variant="xs" tone="muted">
              {child.schoolName}
              {child.leftAt ? ` · ${t("record.left")}` : ""}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** The banner every child page carries once the child has left the school. */
export function ChildLeftBanner({ name, leftAt }: { name: string; leftAt: string }) {
  const t = useT();
  const { locale } = useLocale();
  return (
    <Note tone="warn">
      <Text variant="sm">{t("parent.childLeftBanner", { name, date: formatDateKey(leftAt.slice(0, 10), locale) })}</Text>
    </Note>
  );
}

/** A soft box: a note, a warning, a cheer. */
export function Note({ tone, children }: { tone: "warn" | "ok" | "accent" | "danger"; children: ReactNode }) {
  const th = useTheme();
  const bg = { warn: th.warnSoft, ok: th.okSoft, accent: th.accentSoft, danger: th.dangerSoft }[tone];
  return <View style={{ backgroundColor: bg, borderRadius: th.radius.md, padding: th.space[3], gap: th.space[2] }}>{children}</View>;
}

/**
 * A step that cannot be undone, asked about where it was pressed: the
 * sentence, the step named again on a danger button, and a way back. In
 * place rather than a system dialog — Alert does nothing on the web target,
 * and a question beside the row it is about needs no context to read.
 */
export function Confirm({ question, confirmLabel, onConfirm, onCancel, busy, cancelLabel }: { question: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; busy?: boolean; cancelLabel?: string }) {
  const th = useTheme();
  const t = useT();
  return (
    <Note tone="warn">
      <Text variant="sm" bold accessibilityLiveRegion="polite">
        {question}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        <Button label={confirmLabel} variant="danger" busy={busy} onPress={onConfirm} />
        <Button label={cancelLabel ?? t("common.cancel")} variant="secondary" disabled={busy} onPress={onCancel} />
      </View>
    </Note>
  );
}

/** A small label pill — the web's Badge. */
export function Pill({ label, tone = "muted" }: { label: string; tone?: "muted" | "ok" | "warn" | "danger" | "accent" }) {
  const th = useTheme();
  const bg = { muted: th.surfaceMuted, ok: th.okSoft, warn: th.warnSoft, danger: th.dangerSoft, accent: th.accentSoft }[tone];
  return (
    <View style={{ alignSelf: "flex-start", backgroundColor: bg, borderRadius: th.radius.sm, paddingHorizontal: th.space[2], paddingVertical: 2 }}>
      <Text variant="xs" bold tone={tone}>
        {label}
      </Text>
    </View>
  );
}

/** A register status in its own colour — the web's AttendanceBadge. */
export function StatusBadge({ status }: { status: AttendanceStatus }) {
  const th = useTheme();
  const t = useT();
  const meta = ATTENDANCE[status];
  return (
    <View style={{ backgroundColor: th[meta.soft], borderRadius: th.radius.sm, paddingHorizontal: th.space[2], paddingVertical: 2 }}>
      <Text variant="xs" bold style={{ color: th[meta.colour] }}>
        {t(meta.label)}
      </Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <Text variant="xs" bold tone="muted" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
      {children}
    </Text>
  );
}

/** The web's TabBar: one row, the current one raised. */
export function Tabs<K extends string>({ tabs, current, onChange, label }: { tabs: { key: K; label: string; count?: number }[]; current: K; onChange: (key: K) => void; label: string }) {
  const th = useTheme();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={{ flexDirection: "row", backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[1], gap: th.space[1] }}>
      {tabs.map((tab) => {
        const on = tab.key === current;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            aria-selected={on}
            accessibilityLabel={tab.count !== undefined ? `${tab.label} (${tab.count})` : tab.label}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(tab.key)}
            style={{ flex: 1, minHeight: th.tap, alignItems: "center", justifyContent: "center", borderRadius: th.radius.sm, backgroundColor: on ? th.surface : undefined }}
          >
            <Text variant="sm" bold={on} tone={on ? "fg" : "muted"}>
              {tab.count !== undefined ? `${tab.label} ${tab.count}` : tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A row of filter chips — the web's rounded-full links. */
export function Chips<V extends string>({ options, value, onChange, label }: { options: { value: V; label: string }[]; value: V; onChange: (value: V) => void; label: string }) {
  const th = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={label} contentContainerStyle={{ gap: th.space[2] }}>
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(option.value)}
            style={{ minHeight: th.tap, justifyContent: "center", paddingHorizontal: th.space[4], borderRadius: th.radius.xl, backgroundColor: on ? th.accent : th.surfaceMuted }}
          >
            <Text variant="sm" bold style={{ color: on ? th.accentFg : th.fgMuted }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ------------------------------------------------------------------------- */
/* The day's lessons and the exam marks — on both overviews and on Exams     */
/* ------------------------------------------------------------------------- */

type Lesson = { id: string; periodName: string | null; startMinute: number | null; endMinute: number | null; subject: string; room: string | null; teacherName: string | null };

export function LessonList({ lessons, closedToday, closedName }: { lessons: Lesson[]; closedToday: boolean; closedName: string | null }) {
  const t = useT();
  const th = useTheme();
  if (lessons.length === 0) {
    return (
      <Text variant="sm" tone="muted" style={{ textAlign: "center", paddingVertical: th.space[3] }}>
        {closedToday ? t("teacher.closedToday", { name: closedName ?? "" }) : t("teacher.noLessonsToday")}
      </Text>
    );
  }
  return (
    <View style={{ gap: th.space[2] }}>
      {lessons.map((lesson) => (
        <View key={lesson.id} accessible style={{ flexDirection: "row", gap: th.space[3], minHeight: th.tap, alignItems: "center" }}>
          <View style={{ width: 96 }}>
            <Text variant="sm" bold>
              {lesson.periodName ?? ""}
            </Text>
            <Text variant="xs" tone="muted">
              {formatTimeRange(lesson.startMinute, lesson.endMinute)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="sm" bold>
              {lesson.subject}
            </Text>
            <Text variant="xs" tone="muted">
              {[lesson.teacherName, lesson.room].filter(Boolean).join(" · ")}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export type ExamMarks = z.infer<typeof familyExamsSchema>["marks"][number];

/** One pupil's exam marks, series by series — the web's ExamMarksCards; compact keeps the latest series and a way to the rest. */
export function ExamMarksCards({ marks, compact = false, showStudent = false, onSeeAll }: { marks: ExamMarks; compact?: boolean; showStudent?: boolean; onSeeAll?: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const series = compact ? marks.series.slice(-1) : marks.series;
  if (series.length === 0) return null;
  return (
    <>
      {series.map((s) => {
        const marked = s.papers.filter((p) => p.marks !== null).length;
        return (
          <Card
            key={s.id}
            title={showStudent ? `${marks.studentName} · ${s.name}` : s.name}
            action={
              s.percent !== null ? (
                <View style={{ alignItems: "flex-end" }}>
                  <Text variant="xl" bold>{`${s.percent}%`}</Text>
                  <Text variant="xs" tone="muted">{`${s.totalMarks} / ${s.totalMax}`}</Text>
                </View>
              ) : (
                <Pill label={t("exams.noMarksYet")} />
              )
            }
          >
            <Text variant="xs" tone="muted">
              {[t(EXAM_KIND[s.kind]), marks.className].join(" · ")}
            </Text>
            {s.papers.map((paper) => (
              <Row
                key={paper.subject}
                title={paper.subject}
                caption={formatDateKey(paper.dateKey, locale)}
                right={
                  paper.marks === null ? (
                    <Text variant="sm" tone="subtle">
                      {t("exams.awaitingMarks")}
                    </Text>
                  ) : (
                    <Text variant="sm">
                      <Text variant="sm" bold>{String(paper.marks)}</Text>
                      <Text variant="sm" tone="muted">{` / ${paper.maxMarks}`}</Text>
                    </Text>
                  )
                }
              />
            ))}
            {compact && onSeeAll ? <Button variant="ghost" label={marked < s.papers.length ? t("exams.markedOf", { marked, total: s.papers.length }) : t("exams.seeAllMarks")} onPress={onSeeAll} /> : null}
          </Card>
        );
      })}
    </>
  );
}
