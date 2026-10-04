import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  className,
  interactive,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        // min-w-0: a card in a grid or flex row is sized by its column, not by the widest table inside it, which once pushed the fees page 110 px past a phone's edge.
        "min-w-0 rounded-[--radius-lg] border border-border bg-surface shadow-sm",
        interactive &&
          "transition-[transform,box-shadow,border-color] duration-[--dur] ease-[--ease-out] hover:-translate-y-0.5 hover:shadow-md hover:border-border-strong active:translate-y-0",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  className,
  id,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  /** An anchor a link can open the card at. */
  id?: string;
}) {
  // The action wraps beneath the title on a narrow screen rather than
  // squeezing it to a word: a 311px pane once showed "Y…" for "Your lessons"
  // beside an "Open the timetable" button, and at 390px the title still had
  // a third of the width beside that link (the walk of 2026-10-01). The title
  // block asks for 14 rem before it shares a line, so a short "See all" sits
  // beside it and anything wider goes underneath.
  return (
    <div id={id} className={cn("flex flex-wrap items-start justify-between gap-3 p-5 pb-3", className)}>
      <div className="flex min-w-0 flex-1 basis-56 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[--radius-sm] bg-accent-soft text-accent-strong">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
        </div>
      </div>
      {/* A bare text link as the action ("Items", "Asks", "See all") is a control, not a link in running text: it gets
          the 44 px row every other control has (the walk of 4 October measured 36×18 on /admin/inventory). */}
      {action && <div className="max-w-full shrink-0 [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-border px-5 py-3.5",
        className,
      )}
      {...props}
    />
  );
}

/** Big number + label, the unit the dashboards are built from. */
export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "danger" | "accent";
  className?: string;
}) {
  const tones = {
    neutral: "text-fg",
    ok: "text-ok",
    warn: "text-warn",
    danger: "text-danger",
    accent: "text-accent-strong",
  } as const;

  return (
    <div
      className={cn(
        "rounded-[--radius-lg] border border-border bg-surface p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</span>
        {icon && <span className="text-fg-subtle">{icon}</span>}
      </div>
      <div className={cn("mt-1.5 text-2xl font-bold tabular-nums", tones[tone])}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-fg-muted">{hint}</div>}
    </div>
  );
}
