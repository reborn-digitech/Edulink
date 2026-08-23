"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { inviteParentAction } from "./actions";
import { actionError } from "@/lib/action-error";
import { GUARDIAN_RELATIONS } from "@/lib/constants";
import { useT } from "@/lib/i18n";

const RELATION_KEY = {
  PARENT: "parent.relationParent",
  GUARDIAN: "parent.relationGuardian",
  OTHER: "parent.relationOther",
} as const;

/**
 * "Link a parent", from the pupil's row. An email address and a relation;
 * the rest is the invitation's. Nothing about the child is shared until the
 * parent accepts — the panel says so, because the office will be asked.
 */
export function ParentLinkPanel({
  membershipId,
  name,
  onClose,
}: {
  membershipId: string;
  name: string;
  onClose: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [parentName, setParentName] = useState("");
  const [relation, setRelation] = useState<(typeof GUARDIAN_RELATIONS)[number]>("PARENT");
  const [error, setError] = useState<string | null>(null);

  function send() {
    setError(null);
    startTransition(async () => {
      const result = await inviteParentAction(membershipId, { email, name: parentName, relation });
      if (!result.ok) {
        setError(actionError(t, result, "people.linkNotSent"));
        return;
      }
      toast({
        tone: "ok",
        title: t("people.linkSent"),
        description: t("people.linkSentBody", { email: email.trim().toLowerCase(), name }),
      });
      onClose();
      router.refresh();
    });
  }

  const inputClass =
    "w-full rounded-[--radius-sm] border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent";

  return (
    <div className="w-full rounded-[--radius-md] border border-border bg-surface-muted p-3">
      <p className="text-sm font-semibold text-fg">{t("people.linkParentTitle", { name })}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t("people.linkParentBody", { name })}</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <label className="block sm:col-span-1">
          <span className="block text-xs font-medium text-fg">{t("people.parentEmail")}</span>
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1 ${inputClass}`}
            data-testid="parent-email"
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="block text-xs font-medium text-fg">{t("people.parentName")}</span>
          <input
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            className={`mt-1 ${inputClass}`}
            data-testid="parent-name"
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="block text-xs font-medium text-fg">{t("people.parentRelation")}</span>
          <select
            value={relation}
            onChange={(e) => setRelation(e.target.value as (typeof GUARDIAN_RELATIONS)[number])}
            className={`mt-1 ${inputClass}`}
          >
            {GUARDIAN_RELATIONS.map((r) => (
              <option key={r} value={r}>
                {t(RELATION_KEY[r])}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={send} loading={pending} disabled={email.trim().length === 0}>
          {t("people.sendLink")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} disabled={pending}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
