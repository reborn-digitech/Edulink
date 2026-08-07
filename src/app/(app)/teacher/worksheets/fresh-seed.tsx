"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

/**
 * Seed-minting lives in the CLIENT, in an effect or an event handler, because
 * a server component must render purely — the same URL must render the same
 * page, which is the whole worksheet promise. The randomness happens exactly
 * once per form load (or per tap), never during a render.
 */
function mintSeed(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** A hidden seed field whose value is minted after mount. */
export function FreshSeedInput() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current && !ref.current.value) ref.current.value = mintSeed();
  }, []);
  return <input ref={ref} type="hidden" name="seed" defaultValue="" />;
}

/** "Reshuffle": the same worksheet parameters under a brand-new seed. */
export function ReshuffleButton({
  slug,
  level,
  count,
}: {
  slug: string;
  level: number;
  count: number;
}) {
  const t = useT();
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      size="sm"
      icon={<ArrowsClockwiseIcon weight="bold" />}
      onClick={() =>
        router.push(
          `/teacher/worksheets/print?slug=${encodeURIComponent(slug)}&level=${level}&count=${count}&seed=${mintSeed()}`,
        )
      }
    >
      {t("worksheets.reshuffle")}
    </Button>
  );
}
