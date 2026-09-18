import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * The Relay mark: the R from pitch/relay-logo.jpg on its white tile, the
 * same image as the PWA and store icons, with the tile's corners rounded.
 * The tile is what keeps the dark-blue letter legible on a dark header;
 * public/icons/logo.png is the cutout, for print and light surfaces.
 */
export function Logo({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/icons/icon-192.png"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      priority
      className={cn("shrink-0 select-none rounded-[22%]", className)}
    />
  );
}

export function Wordmark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Logo size={size} />
      <span className="text-[1.35rem] font-bold tracking-tight text-fg">Relay</span>
    </span>
  );
}
