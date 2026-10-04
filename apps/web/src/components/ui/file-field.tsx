"use client";

import { useId, useRef, useState } from "react";
import { UploadSimpleIcon } from "@phosphor-icons/react";
import { Button } from "./button";
import { useT } from "@/lib/i18n";

/**
 * One file for a plain `<form action={…}>` (B-16, 4 Oct 2026). The bare
 * native control read "Choose File / No file chosen" in English on every
 * page, whatever the language, and sat unlabelled. This is the signatures
 * page's pattern — the input visually hidden, a button that opens it, the
 * chosen name said back — with a real label FOR the input (axe found the
 * sr-only inputs nameless, B-08) and the input keeping its `name`, so the
 * form posts the file exactly as before.
 */
export function FileField({
  label,
  name,
  accept,
  required,
  hint,
  className,
}: {
  label: string;
  name: string;
  accept?: string;
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  const t = useT();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
      </label>
      <input
        ref={input}
        id={id}
        type="file"
        name={name}
        accept={accept}
        required={required}
        aria-label={label}
        aria-describedby={`${id}-chosen`}
        className="sr-only"
        onChange={(event) => setChosen(event.target.files?.[0]?.name ?? null)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" size="sm" icon={<UploadSimpleIcon weight="bold" />} onClick={() => input.current?.click()}>
          {t("field.chooseFile")}
        </Button>
        <span id={`${id}-chosen`} className="min-w-0 truncate text-sm text-fg-muted">
          {chosen ?? t("field.noFileChosen")}
        </span>
      </div>
      {hint && <p className="text-xs text-fg-muted">{hint}</p>}
    </div>
  );
}
