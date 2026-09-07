"use client";

import { Button } from "@/components/ui/button";

/** Reloads the page the person was on; the service worker serves it again
    the moment the signal is back. */
export function RetryButton({ label }: { label: string }) {
  return (
    <Button type="button" onClick={() => window.location.reload()}>
      {label}
    </Button>
  );
}
