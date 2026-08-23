"use client";

import { PrinterIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function PrintButton({ label }: { label: string }) {
  return (
    <Button size="sm" icon={<PrinterIcon weight="bold" />} onClick={() => window.print()}>
      {label}
    </Button>
  );
}
