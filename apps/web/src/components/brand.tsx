import { cn } from "@/lib/cn";

/** The EduLink mark, matching the generated PWA icon. */
export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="edulink-mark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f8dfb" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" fill="url(#edulink-mark)" />
      <path d="M50 27 L82 42 L50 57 L18 42 Z" fill="#fff" />
      <path d="M34 48 L66 48 L62 71 L38 71 Z" fill="#fff" />
      <path d="M78 44 v18" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="78" cy="67" r="6" fill="#fff" />
    </svg>
  );
}

export function Wordmark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Logo size={size} />
      <span className="text-[1.35rem] font-bold tracking-tight text-fg">EduLink</span>
    </span>
  );
}
