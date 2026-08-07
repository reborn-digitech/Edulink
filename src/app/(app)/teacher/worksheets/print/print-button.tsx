"use client";

import { PrinterIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

/** Same choice as the report surfaces: the browser is the PDF engine. */
export function PrintButton() {
  const t = useT();
  return (
    <Button size="sm" icon={<PrinterIcon weight="bold" />} onClick={() => window.print()}>
      {t("reportView.printOrSave")}
    </Button>
  );
}
