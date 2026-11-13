"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { reviewComment } from "./actions";
import { fieldClass } from "@/components/ui/field-class";

/**
 * The two decisions on a held comment. Approve is one press: it is the safe
 * direction, and a comment approved by mistake can still be reported and
 * removed. Remove opens a reason first, because the author is told it — a
 * comment that vanishes without a word teaches a child the system is
 * arbitrary, the same rule a rejected post follows.
 */
export function CommentReview({ commentId, postId, authorName }: { commentId: string; postId: string; authorName: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const reasonId = useId();
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "APPROVE" | "REMOVE") {
    setError(null);
    startTransition(async () => {
      const result = await reviewComment(commentId, postId, decision, decision === "REMOVE" ? reason : undefined);
      if (!result.ok) {
        setError(result.error ?? t("common.somethingWrong"));
        return;
      }
      toast({ tone: "ok", title: t(decision === "APPROVE" ? "bulletin.commentApprovedToast" : "bulletin.commentRemovedToast") });
      setRemoving(false);
      setReason("");
      router.refresh();
    });
  }

  // Named for a screen reader by whose comment it is: a queue is many of the same two buttons.
  const approveLabel = t("bulletin.commentApproveCta") + ": " + authorName;
  const removeLabel = t("bulletin.commentRemoveCta") + ": " + authorName;
  const hintId = reasonId + "-hint";
  const approve = () => decide("APPROVE");
  const remove = () => decide("REMOVE");
  const askWhy = () => setRemoving(true);
  const keep = () => setRemoving(false);

  return (
    <div className="mt-2 space-y-2">
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      {removing ? (
        <div className="space-y-2">
          <label htmlFor={reasonId} className="block text-xs font-semibold text-fg">
            {t("bulletin.commentRemoveReason")}
          </label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={2}
            aria-describedby={hintId}
            className={fieldClass()}
          />
          <p id={hintId} className="text-xs text-fg-muted">
            {t("bulletin.commentRemoveReasonHint")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="danger" loading={pending} disabled={!reason.trim()} onClick={remove} aria-label={removeLabel}>
              {t("bulletin.commentRemoveCta")}
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={keep}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" icon={<CheckIcon weight="bold" />} loading={pending} onClick={approve} aria-label={approveLabel}>
            {t("bulletin.commentApproveCta")}
          </Button>
          <Button size="sm" variant="secondary" icon={<XIcon weight="bold" />} disabled={pending} onClick={askWhy} aria-label={removeLabel}>
            {t("bulletin.commentRemoveCta")}
          </Button>
        </div>
      )}
    </div>
  );
}
