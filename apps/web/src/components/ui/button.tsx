import { Children, cloneElement } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "./slot";
import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

/**
 * Every variant clears the 48dp touch floor at default size and carries a
 * visible press state — the spec's "micro-interaction on every button" is
 * implemented as scale-on-press rather than colour-only, so it still reads for
 * users who cannot distinguish the hover tint.
 */
const button = cva(
  [
    "relative inline-flex select-none items-center justify-center gap-2",
    "font-semibold whitespace-nowrap",
    "rounded-[--radius-md]",
    "transition-[transform,background-color,border-color,color,box-shadow,opacity]",
    "duration-[--dur-fast] ease-[--ease-out]",
    "active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-55",
    "aria-busy:cursor-progress",
  ],
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg shadow-sm hover:brightness-110 active:brightness-95",
        secondary:
          "bg-surface text-fg border border-border shadow-sm hover:bg-surface-muted hover:border-border-strong",
        soft: "bg-accent-soft text-accent-strong hover:brightness-95",
        ghost: "text-fg-muted hover:bg-surface-muted hover:text-fg",
        danger: "bg-danger text-danger-fg shadow-sm hover:brightness-110",
        outline: "border-2 border-accent text-accent-strong hover:bg-accent-soft",
        link: "text-accent-strong underline underline-offset-4 hover:brightness-125",
      },
      size: {
        sm: "h-10 min-h-10 px-3 text-sm",
        md: "h-12 min-h-12 px-5 text-[0.9375rem]",
        lg: "h-14 min-h-14 px-7 text-base",
        icon: "h-12 w-12 min-h-12 min-w-12 p-0",
        "icon-sm": "h-10 w-10 min-h-10 min-w-10 p-0",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & {
    asChild?: boolean;
    /** Renders a spinner, disables interaction and announces busy state. */
    loading?: boolean;
    icon?: ReactNode;
    iconRight?: ReactNode;
  };

export function Button({
  className,
  variant,
  size,
  block,
  asChild,
  loading,
  icon,
  iconRight,
  children,
  disabled,
  type,
  ...props
}: ButtonProps) {
  const classes = cn(button({ variant, size, block }), className);
  const leading = loading ? <Spinner /> : icon;
  const trailing = loading ? null : iconRight;

  // With asChild the caller's element (usually a <Link>) IS the button, so the
  // icons have to be injected as ITS children — passing them as siblings would
  // hand Slot three children and Children.only would throw.
  if (asChild) {
    return (
      <Slot className={classes} aria-busy={loading || undefined} {...props}>
        {wrapChild(children, leading, trailing)}
      </Slot>
    );
  }

  return (
    <button
      // A <button> inside a <form> defaults to type="submit", which has
      // double-submitted more forms than any other HTML default.
      type={type ?? "button"}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {leading}
      {children}
      {trailing}
    </button>
  );
}

function wrapChild(children: ReactNode, leading: ReactNode, trailing: ReactNode): ReactNode {
  if (!leading && !trailing) return children;
  const child = Children.only(children) as ReactElement<{ children?: ReactNode }>;
  return cloneElement(child, undefined, leading, child.props.children, trailing);
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-[1.15em] shrink-0 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { button as buttonVariants };
