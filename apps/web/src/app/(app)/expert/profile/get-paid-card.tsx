"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WalletIcon } from "@phosphor-icons/react";
import { expertPayoutSchema, type ExpertPayout } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const STATUS_KEY: Record<ExpertPayout["payout"]["status"], TranslationKey> = { NONE: "gigs.payoutNONE", PENDING: "gigs.payoutPENDING", ACTIVE: "gigs.payoutACTIVE" };
const STATUS_TONE: Record<ExpertPayout["payout"]["status"], "neutral" | "warn" | "ok"> = { NONE: "neutral", PENDING: "warn", ACTIVE: "ok" };

/**
 * "Get paid": the account at the company's gateway a paid seat's money is
 * settled into, linked once (decision 0004, amended 2026-10-02). Under
 * devbox the button pretends and the account is active at once; with the
 * real gateway it waits on the gateway's checks and may hand back a page to
 * finish on. KYC first: the button says so until the papers are verified.
 */
export function GetPaidCard({ initial }: { initial: ExpertPayout }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const payout = state.payout;

  async function link() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/expert/payout/link", { method: "POST" });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? t("common.tryAgainMoment"));
      const next = expertPayoutSchema.parse(body);
      setState(next);
      toast({ tone: "ok", title: t("gigs.payoutLinked") });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.tryAgainMoment"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card data-testid="expert-get-paid">
      <CardHeader icon={<WalletIcon weight="duotone" className="size-5" />} title={t("gigs.getPaidTitle")} description={t("gigs.getPaidBody")} action={<Badge tone={STATUS_TONE[payout.status]}>{t(STATUS_KEY[payout.status])}</Badge>} />
      <CardBody className="space-y-3">
        {payout.note && <p className="text-sm text-fg-muted">{t("gigs.payoutNote", { note: payout.note })}</p>}
        {!state.gate.kycVerified && <p className="text-sm text-fg-muted">{t("gigs.payoutNeedKyc")}</p>}
        {payout.transport === "off" && <p className="text-sm text-fg-muted">{t("gigs.payoutOff")}</p>}
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {payout.status !== "ACTIVE" && payout.transport !== "off" && (
            <Button type="button" loading={busy} disabled={!state.gate.kycVerified} onClick={() => void link()} data-testid="payout-link">
              {t("gigs.payoutLink")}
            </Button>
          )}
          {payout.status === "PENDING" && payout.onboardingUrl && (
            <Button asChild variant="secondary">
              <a href={payout.onboardingUrl} target="_blank" rel="noreferrer noopener">
                {t("gigs.payoutOnboarding")}
              </a>
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link href="/expert/earnings">{t("gigs.earningsTitle")}</Link>
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
