"use client";

import { useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import type { StudentConsentGrant } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { answerGuardianClaim, endGuardianLink, saveConsent } from "./actions";

/** One grant's button for ONE guardian: let them see it, or stop (a grant is one guardian's, TA-555). */
export function GrantSwitch({ grant, on, guardianshipId, guardianName }: { grant: StudentConsentGrant; on: boolean; guardianshipId: string; guardianName: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  function press() {
    startTransition(async () => {
      const result = await saveConsent({ grant, on: !on, guardianshipId });
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: on ? t("consent.guardianRevoked", { name: guardianName }) : t("consent.guardianGranted", { name: guardianName }) });
      router.refresh();
    });
  }
  const label = on ? t("consent.revokeButton") : t("consent.grantButton");
  // Named for a screen reader by the grant and the guardian: a page of guardians is many of the same two buttons.
  const named = label + ": " + t(`consent.grant.${grant}.name`) + ", " + guardianName;
  return (
    <Button type="button" size="sm" variant={on ? "secondary" : "primary"} loading={pending} onClick={press} aria-label={named} data-testid={`consent-${grant}`}>
      {label}
    </Button>
  );
}

/** Ends one guardian's link, after the reader's own yes: the guardian stops seeing anything at once and is told. */
export function EndLink({ guardianshipId, guardianName }: { guardianshipId: string; guardianName: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  function press() {
    if (!window.confirm(t("consent.endLinkConfirm", { name: guardianName }))) return;
    startTransition(async () => {
      const result = await endGuardianLink(guardianshipId);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: t("consent.linkEnded", { name: guardianName }) });
      router.refresh();
    });
  }
  return (
    <Button type="button" size="sm" variant="danger" loading={pending} onClick={press} data-testid="consent-end-link">
      {t("consent.endLink", { name: guardianName })}
    </Button>
  );
}

/** The student's yes or no to somebody asking to be their guardian. */
export function ClaimAnswer({ claimId, claimantName }: { claimId: string; claimantName: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  function answer(decision: "APPROVE" | "DECLINE") {
    startTransition(async () => {
      const result = await answerGuardianClaim(claimId, decision);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: decision === "APPROVE" ? t("consent.claimAccepted", { name: claimantName }) : t("consent.claimDeclined", { name: claimantName }) });
      router.refresh();
    });
  }
  const accept = () => answer("APPROVE");
  const decline = () => answer("DECLINE");
  // Named for a screen reader by who is asking: a list of claims is many of the same two buttons.
  const acceptLabel = t("consent.claimAccept") + ": " + claimantName;
  const declineLabel = t("consent.claimDecline") + ": " + claimantName;
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="primary" loading={pending} onClick={accept} aria-label={acceptLabel} data-testid="consent-claim-accept">
        {t("consent.claimAccept")}
      </Button>
      <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={decline} aria-label={declineLabel} data-testid="consent-claim-decline">
        {t("consent.claimDecline")}
      </Button>
    </div>
  );
}
