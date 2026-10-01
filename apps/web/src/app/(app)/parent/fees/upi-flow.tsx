"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, CopyIcon, DeviceMobileIcon, WarningIcon } from "@phosphor-icons/react";
import { Button, Spinner } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { formatPaise } from "@edulink/i18n";
import { useLocale, useT } from "@/lib/i18n";
import { feesApi, feesErrorMessage, type UpiStart } from "./api";

/**
 * Paying by UPI id: the gateway-free way.
 *
 * The server mints an intent link with the SCHOOL as payee and the amount
 * filled in; the parent's own UPI app does the paying; the parent types the
 * UTR back and the office confirms it against the bank statement. Nothing
 * here talks to a gateway, and nothing is settled until the office says so.
 */
type Phase = { kind: "starting" } | { kind: "ready" } | { kind: "claiming" } | { kind: "claimed" } | { kind: "error"; message: string };

export function UpiFlow({ studentMembershipId, demandIds, onClose }: { studentMembershipId: string; demandIds: string[]; onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "starting" });
  const [start, setStart] = useState<UpiStart | null>(null);
  const [utr, setUtr] = useState("");
  const [utrError, setUtrError] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // ⚠ ONE START PER MOUNT, AND THE ANSWER IS ALWAYS KEPT. React's strict
    // mode runs this effect twice in development: the first run's cleanup
    // used to flip a `live` flag so its answer was thrown away, and the
    // second run bailed on `started` — so the panel sat on "opening…" for
    // ever with a 201 in the network tab. The ref stops the second start;
    // nothing stops the first answer.
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const s = await feesApi<UpiStart>("/api/v1/fees/family/upi", { method: "POST", body: { studentMembershipId, demandIds } });
        setStart(s);
        setPhase({ kind: "ready" });
      } catch (error) {
        setPhase({ kind: "error", message: feesErrorMessage(error, t("common.tryAgainMoment")) });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyVpa() {
    if (!start) return;
    try {
      await navigator.clipboard.writeText(start.payeeVpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      // No clipboard (an old WebView): the id is printed beside the button anyway.
    }
  }

  async function claim() {
    if (!start) return;
    const value = utr.trim();
    if (!/^[A-Za-z0-9]{12,22}$/.test(value)) {
      setUtrError(t("fees.refuseUtr"));
      return;
    }
    setUtrError(undefined);
    setPhase({ kind: "claiming" });
    try {
      await feesApi("/api/v1/fees/family/upi/claim", { method: "POST", body: { paymentId: start.paymentId, utr: value } });
      setPhase({ kind: "claimed" });
      router.refresh();
    } catch (error) {
      setUtrError(feesErrorMessage(error, t("common.tryAgainMoment")));
      setPhase({ kind: "ready" });
    }
  }

  return (
    <div className="space-y-4 rounded-[--radius-md] border border-border bg-surface-muted p-4" aria-live="polite" data-testid="fees-upi-flow">
      <div>
        <p className="text-sm font-semibold text-fg">{t("fees.upiFlowTitle")}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{t("fees.upiFlowIntro")}</p>
      </div>

      {phase.kind === "starting" && (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner className="size-4" />
          {t("fees.onlineOpening")}
        </p>
      )}
      {phase.kind === "error" && (
        <p className="flex items-center gap-2 text-sm text-danger">
          <WarningIcon weight="fill" className="size-4 shrink-0" />
          {phase.message}
        </p>
      )}

      {start && phase.kind !== "error" && (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-fg-muted">{t("fees.upiPayTo")}</dt>
            <dd className="min-w-0 font-medium text-fg">
              {start.payeeName}
              <span className="block break-all font-mono text-xs text-fg-muted">{start.payeeVpa}</span>
            </dd>
            <dt className="text-fg-muted">{t("fees.upiAmount")}</dt>
            <dd className="font-semibold tabular-nums text-fg">{formatPaise(start.amountPaise, locale)}</dd>
            <dt className="text-fg-muted">{t("fees.upiReference")}</dt>
            <dd className="font-mono text-fg">{start.reference}</dd>
          </dl>

          {phase.kind !== "claimed" && (
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" icon={<DeviceMobileIcon weight="bold" />}>
                <a href={start.link}>{t("fees.upiOpen")}</a>
              </Button>
              <Button size="sm" variant="secondary" icon={<CopyIcon weight="bold" />} onClick={() => void copyVpa()}>
                {copied ? t("fees.upiCopied") : t("fees.upiCopy")}
              </Button>
            </div>
          )}
          {phase.kind !== "claimed" && <p className="break-all font-mono text-[0.6875rem] leading-relaxed text-fg-subtle">{start.link}</p>}

          {phase.kind === "claimed" ? (
            <p className="flex items-start gap-2 text-sm font-medium text-ok" data-testid="fees-upi-claimed">
              <CheckCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0" />
              {t("fees.upiClaimed")}
            </p>
          ) : (
            <div className="space-y-2 border-t border-border pt-3">
              <TextField
                label={t("fees.upiEnterUtr")}
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                error={utrError}
                data-testid="fees-upi-utr"
                inputMode="text"
                autoComplete="off"
                maxLength={22}
              />
              <Button size="sm" data-testid="fees-upi-claim" onClick={() => void claim()} loading={phase.kind === "claiming"} disabled={utr.trim().length < 12}>
                {t("fees.upiClaim")}
              </Button>
            </div>
          )}
        </>
      )}

      {phase.kind !== "starting" && phase.kind !== "claiming" && (
        <div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            {phase.kind === "claimed" ? t("common.back") : t("common.cancel")}
          </Button>
        </div>
      )}
    </div>
  );
}
