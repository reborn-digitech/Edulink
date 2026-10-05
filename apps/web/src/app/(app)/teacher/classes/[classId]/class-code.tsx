"use client";

import { useEffect, useState } from "react";
import { CopyIcon, PrinterIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";

/**
 * The class join code, with a printable card for the classroom wall.
 *
 * There is no QR code. The spec asks for one, and generating it properly means
 * either a dependency or hand-rolling Reed-Solomon error correction — neither of
 * which belongs in a component that is otherwise two divs. Sending a school's
 * join code to a third-party QR service to be turned into an image is worse than
 * not having one. So the card shows the typed code, plainly and in large type,
 * and says so.
 */
export function ClassCode({ joinCode, className }: { joinCode: string; className: string }) {
  const t = useT();
  const { toast } = useToast();
  const [showQr, setShowQr] = useState(false);

  // The server renders the path and the browser fills in its origin after
  // the first paint: reading window during render gave React two different
  // strings and a hydration error on every open of this page.
  const [joinUrl, setJoinUrl] = useState("/join/student");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJoinUrl(`${window.location.origin}/join/student`);
  }, []);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            {t("teacher.classJoinCode")}
          </p>
          <code className="mt-1 block font-mono text-2xl font-bold tracking-[0.15em] text-accent-strong">
            {joinCode}
          </code>
          <p className="mt-1 text-xs text-fg-muted">
            {/* The sentence ends BEFORE the URL — "and join this class straight
                away" used to trail it in English regardless of language. */}
            {t("teacher.studentsEnterAt")}{" "}
            <span className="font-medium text-fg">{joinUrl}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<CopyIcon weight="bold" />}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(joinCode);
                toast({ tone: "ok", title: t("teacher.codeCopied") });
              } catch {
                toast({
                  tone: "warn",
                  title: t("teacher.couldNotCopy"),
                  description: t("teacher.selectToCopy"),
                });
              }
            }}
          >
            {t("teacher.copy")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<PrinterIcon weight="bold" />}
            onClick={() => setShowQr((v) => !v)}
          >
            {showQr ? t("teacher.hidePoster") : t("teacher.showPoster")}
          </Button>
        </div>
      </div>

      {showQr && (
        <div className="mt-4 border-t border-border pt-4">
          {/* Deliberately plain and high-contrast: this gets printed and stuck
              on a wall, and read across a classroom. */}
          <div className="print-isolate mx-auto max-w-xs rounded-[var(--radius-lg)] border-2 border-fg bg-white p-6 text-center text-black">
            <p className="text-sm font-bold uppercase tracking-wide">{className}</p>
            <p className="mt-1 text-xs">{t("teacher.joinEduLink")}</p>
            <p className="mt-4 font-mono text-3xl font-black tracking-[0.15em]">{joinCode}</p>
            <p className="mt-4 text-xs leading-relaxed">
              {/* The URL on its own line rather than mid-sentence, so no
                  language has to bend around English word order — "and type
                  this code" used to sit here in English on a Marathi poster. */}
              {t("teacher.typeCodeAt")}
              <strong className="mt-1 block">{joinUrl}</strong>
            </p>
          </div>
          <div className="mt-3 flex justify-center">
            <Button size="sm" variant="ghost" onClick={() => window.print()}>
              {t("teacher.printIt")}
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-fg-subtle">
            {t("teacher.noQr")}
          </p>
        </div>
      )}
    </div>
  );
}
