"use client";

import { STREAMS, type StreamCode } from "@edulink/contracts";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

/**
 * A COLLEGE'S STREAMS, chosen (5 Oct 2026): the operator's onboarding, a
 * college's own registration and the registrar's profile page all draw this
 * one list — every stream with its name and the sentence of what it brings,
 * as a checkbox each. At least one is required for a college; the server
 * says so (`streams.refuseNone`) and so does `error` here.
 */
export function StreamPicker({
  value,
  onChange,
  error,
  disabled,
}: {
  value: readonly string[];
  onChange: (next: StreamCode[]) => void;
  error?: string;
  disabled?: boolean;
}) {
  const t = useT();
  const toggle = (code: StreamCode, on: boolean) => {
    const set = new Set(value);
    if (on) set.add(code);
    else set.delete(code);
    onChange(STREAMS.filter((s) => set.has(s)));
  };
  return (
    <fieldset className="space-y-2" aria-describedby={error ? "stream-picker-error" : undefined}>
      <legend className="text-sm font-medium text-fg">{t("streams.pickerLabel")}</legend>
      <p className="text-xs leading-relaxed text-fg-muted">{t("streams.pickerHint")}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {STREAMS.map((code) => {
          const on = value.includes(code);
          return (
            <label
              key={code}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-[--radius-md] border p-3 transition-colors hover:bg-surface-muted",
                on ? "border-accent bg-accent-soft/30" : error ? "border-danger" : "border-border",
              )}
            >
              <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[--accent]" checked={on} disabled={disabled} onChange={(e) => toggle(code, e.target.checked)} data-stream={code} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-fg">{t(`streams.${code}.name`)}</span>
                <span className="block text-xs leading-relaxed text-fg-muted">{t(`streams.${code}.what`)}</span>
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id="stream-picker-error" role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** The streams as chips, for a list or a card. */
export function StreamChips({ streams, className }: { streams: readonly string[]; className?: string }) {
  const t = useT();
  const known = STREAMS.filter((s) => streams.includes(s));
  if (known.length === 0) return <span className={cn("text-xs text-fg-subtle", className)}>{t("streams.noneChosen")}</span>;
  return (
    <span className={cn("inline-flex flex-wrap gap-1", className)}>
      {known.map((s) => (
        <span key={s} className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg">
          {t(`streams.${s}.name`)}
        </span>
      ))}
    </span>
  );
}
