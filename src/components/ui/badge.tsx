"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { ATTENDANCE_META, type AttendanceStatus } from "@/lib/constants";
import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-surface-muted text-fg-muted",
        accent: "bg-accent-soft text-accent-strong",
        ok: "bg-ok-soft text-ok",
        warn: "bg-warn-soft text-warn",
        danger: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info",
        outline: "border border-border-strong text-fg-muted",
      },
      size: {
        sm: "px-2 py-0.5 text-[0.6875rem]",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export function Badge({
  className,
  tone,
  size,
  children,
  dot,
}: VariantProps<typeof badge> & { className?: string; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cn(badge({ tone, size }), className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

/**
 * Attendance status is never communicated by colour alone — each pill carries
 * its label, and the compact variant carries a letter. WCAG 1.4.1. (§6)
 */
export function AttendanceBadge({
  status,
  compact,
  className,
}: {
  status: AttendanceStatus;
  compact?: boolean;
  className?: string;
}) {
  const t = useT();
  const meta = ATTENDANCE_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        compact ? "size-7 justify-center text-xs" : "px-2.5 py-1 text-xs",
        className,
      )}
      style={{
        backgroundColor: `var(--att-${meta.token}-soft)`,
        color: `var(--att-${meta.token})`,
      }}
    >
      {compact ? (
        <>
          <span aria-hidden="true">{t(meta.shortKey)}</span>
          <span className="sr-only">{t(meta.labelKey)}</span>
        </>
      ) : (
        t(meta.labelKey)
      )}
    </span>
  );
}
