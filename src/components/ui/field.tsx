"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

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
        {required && <span className="sr-only"> (required)</span>}
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
