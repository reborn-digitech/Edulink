"use client";

import { useState } from "react";
import { DateField, TextField } from "./field";
import { useT } from "@/lib/i18n";
import { useFormFeedback } from "./action-form";

/** What the hidden input posts: `YYYY-MM-DDTHH:mm`, or "" with no date; a time that is not HH:mm falls back to `defaultTime`. */
export function dateTimeValue(date: string, time: string, defaultTime: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  return `${date}T${/^\d{2}:\d{2}$/.test(time) ? time : defaultTime}`;
}

/**
 * A date and a time, for a form that used `type="datetime-local"` (B-16,
 * 4 Oct 2026). The native control draws the BROWSER's shape —
 * "mm/dd/yyyy, --:-- --" in the exam cell — and gives the page no say, for
 * the reason DateField explains. This is DateField (dd/mm/yyyy with the
 * calendar button) beside a time box, the way the meetings form does it.
 *
 * A DROP-IN FOR THE SERVER ACTION: one hidden input carries `name` as
 * `YYYY-MM-DDTHH:mm`, exactly what a datetime-local field posted, so no
 * action that parses it changes. No date means an empty value (an optional
 * field stays optional); a date with no time takes `defaultTime`, which is
 * shown in the box so nothing is assumed out of sight.
 */
export function DateTimeField({
  label,
  name,
  defaultValue,
  defaultTime = "09:00",
  required,
  hint,
  className,
}: {
  label: string;
  name: string;
  /** `YYYY-MM-DDTHH:mm`, as a datetime-local field's value. */
  defaultValue?: string;
  defaultTime?: string;
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  const t = useT();
  // Inside an <ActionForm>: the refusal about this field, and what was typed before it.
  const fed = useFormFeedback(name);
  const start = fed.value ?? defaultValue;
  const [date, setDate] = useState(start ? start.slice(0, 10) : "");
  const [time, setTime] = useState(start && start.length >= 16 ? start.slice(11, 16) : defaultTime);
  const value = dateTimeValue(date, time, defaultTime);
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_8rem] items-start gap-2 ${className ?? ""}`}>
      <DateField label={label} hint={hint} error={fed.error} required={required} value={date} onChange={(e) => setDate(e.target.value)} />
      <TextField label={t("field.time")} aria-label={t("field.timeOf", { label })} type="time" value={time} onChange={(e) => setTime(e.target.value)} required={required} />
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
