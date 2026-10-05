"use client";

import { useRef } from "react";
import { PaperclipIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "./button";
import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/json";
import { useT } from "@/lib/i18n";

/**
 * Attach-a-file control.
 *
 * Both checks below are re-done on the server, which sniffs the actual bytes
 * rather than trusting `file.type` — a `.pdf` renamed to `.png` is refused
 * there, not here. This exists so someone is told before sending five megabytes
 * over a school's connection, not after. (§6: client validation is decoration.)
 *
 * The picker's own value is cleared after every change. Without that, removing
 * a file and choosing the same one again fires no `change` event at all, and the
 * control silently does nothing.
 */

/** Mirrors MAX_UPLOAD_BYTES in storage.ts, which is `server-only` and cannot be imported here. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const DOCUMENT_TYPES = "image/png,image/jpeg,image/webp,image/gif,application/pdf";

export function FilePicker({
  files,
  onChange,
  max = 5,
  accept = DOCUMENT_TYPES,
  label = "Attachments",
  hint,
  error,
  idPrefix,
  className,
}: {
  files: File[];
  onChange: (files: File[], error?: string) => void;
  max?: number;
  accept?: string;
  label?: string;
  hint?: string;
  error?: string;
  idPrefix: string;
  className?: string;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `${idPrefix}-files`;
  const full = files.length >= max;

  function add(picked: FileList | null) {
    if (!picked) return;
    const incoming = Array.from(picked);

    const room = max - files.length;
    if (incoming.length > room) {
      onChange(files, max === 1 ? t("ui.upToFilesOne") : t("ui.upToFilesMany", { max }));
      return;
    }
    const tooBig = incoming.find((f) => f.size > MAX_FILE_BYTES);
    if (tooBig) {
      onChange(files, t("ui.biggerThan5MB", { name: tooBig.name }));
      return;
    }

    onChange([...files, ...incoming]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={className}>
      {/* A label FOR the file input, not a span beside it: the input is
          visually hidden behind the button, and axe found it nameless on the
          expert's KYC card (CI run 36871181377, "label (critical)"). */}
      <label htmlFor={inputId} className="block text-sm font-medium text-fg">
        {label}
      </label>

      {files.length > 0 && (
        <ul className="mt-1.5 space-y-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border bg-surface p-2.5"
            >
              <PaperclipIcon weight="bold" className="size-4 shrink-0 text-fg-subtle" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{file.name}</span>
                <span className="block text-xs text-fg-muted">{formatBytes(file.size)}</span>
              </span>
              <button
                type="button"
                aria-label={t("ui.removeFile", { name: file.name })}
                onClick={() => {
                  onChange(files.filter((_, i) => i !== index));
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="grid size-8 shrink-0 place-items-center rounded-full text-fg-muted hover:bg-surface-muted hover:text-fg"
              >
                <XIcon weight="bold" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={cn("mt-1.5", files.length === 0 && "w-full")}
            icon={<PaperclipIcon weight="bold" />}
            onClick={() => inputRef.current?.click()}
          >
            {files.length === 0 ? t("ui.attachFile") : t("ui.addAnotherFile")}
          </Button>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            multiple={max > 1}
            accept={accept}
            className="sr-only"
            onChange={(e) => add(e.target.files)}
          />
        </>
      )}

      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
      {hint && !error && <p className="mt-1 text-xs text-fg-muted">{hint}</p>}
    </div>
  );
}
