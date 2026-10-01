"use client";

import { useState, useTransition } from "react";
import { CalendarXIcon } from "@phosphor-icons/react";
import {
  ABSENCE_REASONS,
  type AbsenceNotes,
  type AbsenceReason,
} from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { formatDateKey, addDaysToKey } from "@/lib/dates";
import { useLocale, useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { deleteAbsenceNoteAction, fileAbsenceNoteAction } from "./actions";

/** The dictionary key for a coded reason, one per code so the audit sees a key and not a template. */
export const REASON_KEY: Record<AbsenceReason, TranslationKey> = {
  ILLNESS: "familyCare.reasonILLNESS",
  FAMILY: "familyCare.reasonFAMILY",
  RELIGIOUS: "familyCare.reasonRELIGIOUS",
  TRAVEL: "familyCare.reasonTRAVEL",
  OTHER: "familyCare.reasonOTHER",
};

/**
 * The family tells the school ahead of a day away: the notes still to come,
 * each one its author can take back until the register has marked the day,
 * and the form for another. Shared by the guardian's attendance page (for a
 * child) and the pupil's (for themselves); the server decides who may file
 * for whom.
 */
export function AbsenceNotesCard({
  initial,
  self,
}: {
  initial: AbsenceNotes;
  self?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const { toast } = useToast();
  const [data, setData] = useState(initial);
  const [dateKey, setDateKey] = useState("");
  const [reason, setReason] = useState<AbsenceReason>("ILLNESS");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const name = data.childName;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!dateKey) {
      setError(t("common.checkTheForm"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await fileAbsenceNoteAction(data.studentMembershipId, {
        dateKey,
        reason,
        text,
      });
      if (!result.ok) {
        setError(t(result.errorKey, result.errorVars));
        return;
      }
      setData(result.data);
      setDateKey("");
      setText("");
      toast({ tone: "ok", title: t("familyCare.absenceFiled") });
    });
  }

  function withdraw(noteId: string) {
    startTransition(async () => {
      const result = await deleteAbsenceNoteAction(
        data.studentMembershipId,
        noteId,
      );
      if (!result.ok) {
        toast({ tone: "danger", title: t(result.errorKey, result.errorVars) });
        return;
      }
      setData(result.data);
      toast({ tone: "ok", title: t("familyCare.absenceWithdrawn") });
    });
  }

  return (
    <Card data-testid="absence-notes">
      <CardHeader
        icon={<CalendarXIcon weight="duotone" className="size-5" />}
        title={t("familyCare.absenceTitle")}
        description={
          self
            ? t("familyCare.absenceIntroSelf")
            : t("familyCare.absenceIntro", { name })
        }
      />
      <CardBody className="space-y-5">
        {data.notes.length === 0 ? (
          <EmptyState
            className="border-0 bg-transparent py-4"
            title={t("familyCare.absenceNone")}
            description={t("familyCare.absenceNoneBody")}
          />
        ) : (
          <ul
            className="divide-y divide-border"
            aria-label={t("familyCare.absenceComing")}
          >
            {data.notes.map((note) => {
              // Hoisted so the audit sees a translated variable, not a template literal it cannot read.
              const withdrawLabel = `${t("familyCare.absenceWithdraw")}: ${formatDateKey(note.dateKey, { day: "numeric", month: "long" }, locale)}`;
              return (
                <li
                  key={note.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                  data-testid="absence-note"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">
                      {formatDateKey(
                        note.dateKey,
                        { weekday: "long", day: "numeric", month: "long" },
                        locale,
                      )}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {t(REASON_KEY[note.reason])}
                      {note.text ? ` · “${note.text}”` : ""}
                      {` · ${t("familyCare.absenceBy", { name: note.authorName })}`}
                    </p>
                  </div>
                  {note.canDelete && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => withdraw(note.id)}
                      disabled={pending}
                      aria-label={withdrawLabel}
                    >
                      {t("familyCare.absenceWithdraw")}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <form
          onSubmit={submit}
          noValidate
          className="space-y-3 border-t border-border pt-4"
          data-testid="absence-note-form"
        >
          {error && (
            <p
              role="alert"
              className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField
              label={t("familyCare.absenceDate")}
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              min={data.today}
              max={addDaysToKey(data.today, 60)}
              required
            />
            <SelectField
              label={t("familyCare.absenceReason")}
              value={reason}
              onChange={(e) => setReason(e.target.value as AbsenceReason)}
            >
              {ABSENCE_REASONS.map((code) => (
                <option key={code} value={code}>
                  {t(REASON_KEY[code])}
                </option>
              ))}
            </SelectField>
          </div>
          <TextField
            label={t("familyCare.absenceText")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            placeholder={t("familyCare.absenceTextPlaceholder")}
          />
          <Button type="submit" size="sm" loading={pending}>
            {t("familyCare.absenceSend")}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
