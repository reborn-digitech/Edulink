"use client";

import { COMPETITION_INTERNAL_BOARDS, type CompetitionEventBody, type CompetitionInternalBoard } from "@edulink/contracts";
import { CheckboxField, DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * THE COMPETITION HALF OF A CALENDAR ENTRY (decision 0007, 6 November 2026). When the office picks the kind
 * COMPETITION, the plain name-and-dates form grows these: a one-line summary, when enrolment closes, the classes
 * it is for, whether pupils may enrol at all, who may see the internal board, and whether a pupil's own
 * enrolment waits for a guardian's yes. Shared by the add form and the in-place edit so the two never ask
 * different questions.
 */
export type CompetitionFields = {
  summary: string;
  registrationClosesDateKey: string;
  gradeLow: string;
  gradeHigh: string;
  enrolmentOpen: boolean;
  internalBoard: CompetitionInternalBoard;
  requiresParentConsent: boolean;
  body: string;
};

export const EMPTY_COMPETITION_FIELDS: CompetitionFields = {
  summary: "",
  registrationClosesDateKey: "",
  gradeLow: "",
  gradeHigh: "",
  enrolmentOpen: true,
  internalBoard: "OFF",
  requiresParentConsent: true,
  body: "",
};

export const BOARD_OPTION_KEY: Record<CompetitionInternalBoard, TranslationKey> = {
  OFF: "calendar.boardOff",
  STAFF: "calendar.boardStaff",
  SCHOOL: "calendar.boardSchool",
};
export const BOARD_HINT_KEY: Record<CompetitionInternalBoard, TranslationKey> = {
  OFF: "calendar.boardOffHint",
  STAFF: "calendar.boardStaffHint",
  SCHOOL: "calendar.boardSchoolHint",
};

/** The body the server takes, from the plain entry's name and dates and these fields. */
export function competitionBody(entry: { name: string; startDateKey: string; endDateKey: string; note: string }, f: CompetitionFields): CompetitionEventBody {
  return {
    title: entry.name.trim(),
    summary: f.summary.trim(),
    startDateKey: entry.startDateKey,
    endDateKey: entry.endDateKey || entry.startDateKey,
    ...(f.registrationClosesDateKey ? { registrationClosesDateKey: f.registrationClosesDateKey } : {}),
    ...(f.gradeLow.trim() ? { gradeLow: f.gradeLow.trim() } : {}),
    ...(f.gradeHigh.trim() ? { gradeHigh: f.gradeHigh.trim() } : {}),
    enrolmentOpen: f.enrolmentOpen,
    internalBoard: f.internalBoard,
    requiresParentConsent: f.requiresParentConsent,
    ...(f.body.trim() ? { body: f.body.trim() } : {}),
    ...(entry.note.trim() ? { note: entry.note.trim() } : {}),
  };
}

export function CompetitionFieldset({ value, onChange, compact = false }: { value: CompetitionFields; onChange: (next: CompetitionFields) => void; compact?: boolean }) {
  const t = useT();
  const set = <K extends keyof CompetitionFields>(key: K, v: CompetitionFields[K]) => onChange({ ...value, [key]: v });
  return (
    <div className="space-y-4" data-testid="competition-fields">
      <TextField
        label={t("calendar.competitionSummary")}
        required
        maxLength={200}
        value={value.summary}
        onChange={(e) => set("summary", e.target.value)}
        placeholder={t("calendar.competitionSummaryPlaceholder")}
      />
      <div className={compact ? "grid gap-3 sm:grid-cols-3" : "grid gap-4 sm:grid-cols-3"}>
        <DateField label={t("calendar.enrolmentCloses")} value={value.registrationClosesDateKey} onChange={(e) => set("registrationClosesDateKey", e.target.value)} hint={t("calendar.enrolmentClosesHint")} />
        <TextField label={t("competitions.lowestYear")} maxLength={10} value={value.gradeLow} onChange={(e) => set("gradeLow", e.target.value)} placeholder="4" />
        <TextField label={t("competitions.highestYear")} maxLength={10} value={value.gradeHigh} onChange={(e) => set("gradeHigh", e.target.value)} placeholder="6" />
      </div>
      <CheckboxField label={t("calendar.enrolmentOn")} description={t("calendar.enrolmentOnHint")} checked={value.enrolmentOpen} onChange={(e) => set("enrolmentOpen", e.target.checked)} />
      <SelectField label={t("calendar.board")} value={value.internalBoard} onChange={(e) => set("internalBoard", e.target.value as CompetitionInternalBoard)} hint={t(BOARD_HINT_KEY[value.internalBoard])}>
        {COMPETITION_INTERNAL_BOARDS.map((option) => (
          <option key={option} value={option}>
            {t(BOARD_OPTION_KEY[option])}
          </option>
        ))}
      </SelectField>
      <CheckboxField label={t("calendar.consentNeeded")} description={t("calendar.consentNeededHint")} checked={value.requiresParentConsent} onChange={(e) => set("requiresParentConsent", e.target.checked)} />
      {!compact && <TextAreaField label={t("competitions.details")} rows={3} maxLength={5000} value={value.body} onChange={(e) => set("body", e.target.value)} hint={t("competitions.detailsHint")} />}
    </div>
  );
}
