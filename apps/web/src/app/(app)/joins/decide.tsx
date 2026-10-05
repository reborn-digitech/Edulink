"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { decideGuardianClaim, decideJoinRequest } from "./actions";
import { fieldClass } from "@/components/ui/field-class";

/**
 * The two decisions on somebody waiting. Letting in is one press. Declining
 * opens a box first: a sentence for the asker, which the decider may leave
 * empty. It is read by a person the school does not know yet, so the hint
 * says so — and for a claim, says not to name the child, whom the claimant
 * has not been told the code belongs to.
 */
export function Decide({ kind, id, name }: { kind: "join" | "claim"; id: string; name: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const reasonId = useId();
  const [pending, startTransition] = useTransition();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "APPROVE" | "DECLINE") {
    setError(null);
    startTransition(async () => {
      const said = decision === "DECLINE" && reason.trim() ? reason.trim() : undefined;
      const result = kind === "join" ? await decideJoinRequest(id, decision, said) : await decideGuardianClaim(id, decision, said);
      if (!result.ok) {
        setError(result.error ?? t("common.somethingWrong"));
        return;
      }
      const done = decision === "DECLINE" ? "joinRequests.declinedToast" : kind === "join" ? "joinRequests.letInToast" : "joinRequests.claimApprovedToast";
      toast({ tone: "ok", title: t(done) });
      setDeclining(false);
      setReason("");
      router.refresh();
    });
  }

  const yes = t(kind === "join" ? "joinRequests.letInCta" : "joinRequests.approveClaimCta");
  const no = t("joinRequests.declineCta");
  // Named for a screen reader by who is waiting: a queue is many of the same two buttons.
  const yesLabel = yes + ": " + name;
  const noLabel = no + ": " + name;
  const hintId = reasonId + "-hint";
  const approve = () => decide("APPROVE");
  const decline = () => decide("DECLINE");
  const ask = () => setDeclining(true);
  const keep = () => setDeclining(false);

  return (
    <div className="mt-3 space-y-2">
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      {declining ? (
        <div className="space-y-2">
          <label htmlFor={reasonId} className="block text-xs font-semibold text-fg">
            {t("joinRequests.declineReasonLabel")}
          </label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={300}
            rows={2}
            aria-describedby={hintId}
            className={fieldClass()}
          />
          <p id={hintId} className="text-xs text-fg-muted">
            {t(kind === "join" ? "joinRequests.declineReasonHint" : "joinRequests.declineReasonHintClaim")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="danger" loading={pending} onClick={decline} aria-label={noLabel}>
              {no}
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={keep}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" icon={<CheckIcon weight="bold" />} loading={pending} onClick={approve} aria-label={yesLabel}>
            {yes}
          </Button>
          <Button size="sm" variant="secondary" icon={<XIcon weight="bold" />} disabled={pending} onClick={ask} aria-label={noLabel}>
            {no}
          </Button>
        </div>
      )}
    </div>
  );
}
