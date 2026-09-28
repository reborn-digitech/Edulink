"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { decideGuardianClaim, decideJoinRequest } from "./actions";

/**
 * The two decisions on somebody waiting. One press each, and no reason asked
 * for a decline: the asker is a stranger to the school until somebody says
 * otherwise, and is told only that the request was not accepted and whom to
 * ask.
 */
export function Decide({ kind, id, name }: { kind: "join" | "claim"; id: string; name: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "APPROVE" | "DECLINE") {
    setError(null);
    startTransition(async () => {
      const result = kind === "join" ? await decideJoinRequest(id, decision) : await decideGuardianClaim(id, decision);
      if (!result.ok) {
        setError(result.error ?? t("common.somethingWrong"));
        return;
      }
      const done = decision === "DECLINE" ? "joinRequests.declinedToast" : kind === "join" ? "joinRequests.letInToast" : "joinRequests.claimApprovedToast";
      toast({ tone: "ok", title: t(done) });
      router.refresh();
    });
  }

  const yes = t(kind === "join" ? "joinRequests.letInCta" : "joinRequests.approveClaimCta");
  const no = t("joinRequests.declineCta");
  // Named for a screen reader by who is waiting: a queue is many of the same two buttons.
  const yesLabel = yes + ": " + name;
  const noLabel = no + ": " + name;
  const approve = () => decide("APPROVE");
  const decline = () => decide("DECLINE");

  return (
    <div className="mt-3 space-y-2">
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" icon={<CheckIcon weight="bold" />} loading={pending} onClick={approve} aria-label={yesLabel}>
          {yes}
        </Button>
        <Button size="sm" variant="secondary" icon={<XIcon weight="bold" />} disabled={pending} onClick={decline} aria-label={noLabel}>
          {no}
        </Button>
      </div>
    </div>
  );
}
