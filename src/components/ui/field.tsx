"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { CalendarBlankIcon } from "@phosphor-icons/react";
import { displayDateToIso, isoToDisplayDate } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

/**
 * Form field with label, hint, inline error and character counter.
 *
 * The error is wired with aria-describedby and aria-invalid rather than being
 * red text sitting nearby, so a screen-reader user hears *why* the field was
 * rejected when they focus it — not just that something is wrong.
 */

type FieldShellProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
  className?: string;
};

export function Field({ label, hint, error, required, children, className }: FieldShellProps) {
  const t = useT();
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
        {required && (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
        {/* The asterisk beside the label is decoration a screen reader cannot
            read; THIS is what it means. It was the last English word left on a
            fully translated login form — visible to exactly the readers least
            able to work around it. */}
        {required && <span className="sr-only"> {t("field.required")}</span>}
      </label>

      {children({ id, describedBy: describedBy || undefined, invalid: Boolean(error) })}

      {hint && !error && (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium text-danger animate-in-up"
        >
          <svg viewBox="0 0 16 16" className="mt-px size-3.5 shrink-0" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.5v4.2M8 11.2v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const inputClasses = (invalid: boolean) =>
  cn(
    "w-full rounded-[--radius-md] border bg-surface px-3.5 py-3 text-[0.9375rem] text-fg",
    "min-h-12 placeholder:text-fg-subtle",
    "transition-[border-color,box-shadow] duration-[--dur-fast]",
    "focus:outline-none focus-visible:outline-none",
    invalid
      ? "border-danger ring-2 ring-danger/25"
      : "border-border hover:border-border-strong focus:border-accent focus:ring-2 focus:ring-accent-ring/40",
  );

export function TextField({
  label,
  hint,
  error,
  required,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: string }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={inputClasses(invalid)}
          {...props}
        />
      )}
    </Field>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  required,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          rows={4}
          className={cn(inputClasses(invalid), "resize-y leading-relaxed")}
          {...props}
        />
      )}
    </Field>
  );
}

export function SelectField({
  label,
  hint,
  error,
  required,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          className={cn(inputClasses(invalid), "appearance-none bg-no-repeat pr-10")}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%2357607a' stroke-width='1.75' stroke-linecap='round'%3E%3Cpath d='M4 6.5 8 10.5 12 6.5'/%3E%3C/svg%3E\")",
            backgroundPosition: "right 0.85rem center",
            backgroundSize: "1rem",
          }}
          {...props}
        >
          {children}
        </select>
      )}
    </Field>
  );
}

/** Large, obvious checkbox — used for consent screens where clarity matters. */
export function CheckboxField({
  label,
  description,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  description?: ReactNode;
  error?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-[--radius-md] border p-3.5",
          "transition-colors duration-[--dur-fast] hover:bg-surface-muted",
          error ? "border-danger" : "border-border",
        )}
      >
        <input
          id={id}
          type="checkbox"
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error) || undefined}
          className="mt-0.5 size-5 shrink-0 accent-[--accent]"
          {...props}
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-fg">{label}</span>
          {description && <span className="mt-0.5 block text-xs text-fg-muted">{description}</span>}
        </span>
      </label>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * A date, written the way people here write it: dd/mm/yyyy.
 *
 * WHY THIS EXISTS RATHER THAN `type="date"`. A native date input renders in the
 * BROWSER's locale and gives the page no say. `lang="en-GB"` on the input, on a
 * wrapper and on `<html>` were all tried in Chromium; all three still drew
 * `mm/dd/yyyy`. So a school in Pune was being asked for the month first with no
 * sign that it was — and 05/04 is two different days depending on who reads it.
 *
 * A DROP-IN FOR `<TextField type="date">`. Same props, same `name`, same
 * `value`/`onChange` contract — and the value on both is the ISO `YYYY-MM-DD`
 * every action, query and `dateKey` in this codebase already speaks. Only what
 * the human sees and types is day-first, which is the whole of the change.
 *
 * THE NATIVE PICKER IS KEPT, not thrown away. A visually-hidden `type="date"`
 * sits alongside and the calendar button opens it through `showPicker()`, so a
 * phone user still gets the wheel and a keyboard user still gets to type four
 * digits without touching a mouse. If `showPicker` is unavailable the button
 * hides itself rather than sitting there doing nothing.
 *
 * INVALID INPUT IS HELD, NOT DISCARDED. Half-typed text stays in the box while
 * it is being typed; only a complete, real date is reported upwards. `31/02` is
 * refused rather than rolled to 3 March — see `displayDateToIso`.
 */
export function DateField({
  label,
  hint,
  error,
  required,
  className,
  value,
  defaultValue,
  onChange,
  name,
  min,
  max,
  disabled,
  onInvalidChange,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  /**
   * Fires when the TYPED text flips between parseable and not. The onChange
   * contract reports "" for junk — correct for the server, but it left a
   * wizard's Next button no way to tell "no date" from "31/02"; the join flow
   * used to walk a child straight past a birthday that was never saved.
   */
  onInvalidChange?: (invalid: boolean) => void;
}) {
  const t = useT();
  const nativeRef = useRef<HTMLInputElement>(null);

  const controlled = value !== undefined;
  const [typed, setTyped] = useState(() =>
    isoToDisplayDate((controlled ? value : defaultValue) as string | undefined),
  );
  const [canPick, setCanPick] = useState(false);

  // Only after mount: `showPicker` is a browser capability, and deciding on the
  // server would render a button that may not work.
  useEffect(() => {
    setCanPick(typeof nativeRef.current?.showPicker === "function");
  }, []);

  // A controlled value changed underneath us — a form reset, or a parent
  // clearing the field. Do not stamp on what somebody is mid-way through typing.
  const iso = controlled ? ((value as string) ?? "") : undefined;
  useEffect(() => {
    if (iso === undefined) return;
    if (displayDateToIso(typed) === (iso || null)) return;
    setTyped(isoToDisplayDate(iso));
    // `typed` is deliberately absent: this syncs FROM the prop, and including it
    // would fight the user keystroke by keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso]);

  const asIso = displayDateToIso(typed);
  const incomplete = typed.trim().length > 0 && asIso === null;

  useEffect(() => {
    onInvalidChange?.(incomplete);
    // The callback identity is the caller's business; what matters is the flip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomplete]);

  function report(next: string) {
    setTyped(next);
    if (!onChange) return;
    const parsed = displayDateToIso(next);
    // The ISO value, never the typed text — every caller expects YYYY-MM-DD.
    onChange({
      target: { value: parsed ?? "", name: name ?? "" },
    } as React.ChangeEvent<HTMLInputElement>);
  }

  return (
    <Field
      label={label}
      hint={hint ?? t("field.dateHint")}
      error={error ?? (incomplete ? t("field.dateInvalid") : undefined)}
      required={required}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <div className="flex gap-2">
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={t("field.datePlaceholder")}
            value={typed}
            disabled={disabled}
            required={required}
            aria-describedby={describedBy}
            aria-invalid={invalid || incomplete || undefined}
            onChange={(event) => report(event.target.value)}
            className={inputClasses(invalid || incomplete)}
            {...rest}
          />

          {/* What actually goes to the server, and what a native picker writes
              into. Hidden rather than absent so an uncontrolled <form> still
              submits `name` as ISO exactly as `type="date"` did. */}
          <input
            ref={nativeRef}
            type="date"
            name={name}
            value={asIso ?? ""}
            min={min}
            max={max}
            disabled={disabled}
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => setTyped(isoToDisplayDate(event.target.value))}
            className="sr-only"
          />

          {canPick && !disabled && (
            <button
              type="button"
              onClick={() => nativeRef.current?.showPicker?.()}
              aria-label={t("field.openCalendar")}
              className="grid min-h-11 w-11 shrink-0 place-items-center rounded-[--radius-md] border border-border text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
            >
              <CalendarBlankIcon weight="regular" className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </Field>
  );
}
