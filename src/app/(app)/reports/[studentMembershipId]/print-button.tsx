"use client";

import { PrinterIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

/**
 * The whole "export".
 *
 * `window.print()` and a print stylesheet, rather than a PDF library: every
 * browser already turns this into a PDF, on any platform, with no dependency and
 * no server-side rendering of documents. The same choice the printable join-code
 * card made. `.no-print` (globals.css) takes the nav and this button off the
 * sheet, which is why the report has to be a page rather than a modal.
 */
export function PrintButton() {
  return (
    <Button variant="secondary" size="sm" icon={<PrinterIcon weight="bold" />} onClick={() => window.print()}>
      Print or save as PDF
    </Button>
  );
}
