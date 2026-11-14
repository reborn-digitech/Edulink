"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { GUARDIAN_END_REASONS, type GuardianEndReason } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { endFamilyLinkAction, familyLinksAction, type FamilyLinksResult } from "./actions";
import { actionError } from "@/lib/action-error";
import { formatDate } from "@/lib/dates";
import { useT } from "@/lib/i18n";

const RELATION_KEY = {
  PARENT: "parent.relationParent",
  GUARDIAN: "parent.relationGuardian",
  OTHER: "parent.relationOther",
} as const;

const REASON_KEY = {
  COURT_ORDER: "people.familyLinkReasonCourtOrder",
  WRONG_PERSON: "people.familyLinkReasonWrongPerson",
  FAMILY_REQUEST: "people.familyLinkReasonFamilyRequest",
  OTHER: "people.familyLinkReasonOther",
} as const satisfies Record<GuardianEndReason, string>;

type Guardian = NonNullable<FamilyLinksResult["guardians"]>[number];

/**
 * The office's Family links panel (TA-177): the guardians who see the pupil on the app, and ending one link for a
 * coded reason. It says before anything is ended who will be told what: the guardian only that the link has ended
 * and to contact the office, the head the reason, the other guardians that it ended.
 */
export function FamilyLinksPanel({ membershipId, name, onClose }: { membershipId: string; name: string; onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [guardians, setGuardians] = useState<Guardian[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ending, setEnding] = useState<string | null>(null);
  const [reason, setReason] = useState<GuardianEndReason | "">("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void familyLinksAction(membershipId).then((result) => {
      if (!live) return;
      if (!result.ok) setLoadError(actionError(t, result, "people.familyLinksLoadFailed"));
      else setGuardians(result.guardians ?? []);
    });
    return () => {
      live = false;
    };
  }, [membershipId, t]);

  function end(guardian: Guardian) {
    setError(null);
    startTransition(async () => {
      const result = await endFamilyLinkAction(membershipId, guardian.guardianshipId, reason);
      if (!result.ok) {
        setError(actionError(t, result, "people.familyLinkNotEnded"));
        return;
      }
      toast({ tone: "ok", title: t("people.familyLinkEnded"), description: result.schoolStandsIn ? t("people.familyLinkEndedStandin", { name }) : undefined });
      setGuardians((rows) => (rows ?? []).filter((g) => g.guardianshipId !== guardian.guardianshipId));
      setEnding(null);
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="w-full rounded-[var(--radius-md)] border border-border bg-surface-muted p-3">
      <p className="text-sm font-semibold text-fg">{t("people.familyLinksTitle", { name })}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t("people.familyLinksBody", { name })}</p>

      {loadError && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {loadError}
        </p>
      )}
      {guardians && guardians.length === 0 && <p className="mt-3 text-sm text-fg-muted">{t("people.familyLinksNone", { name })}</p>}
      {guardians && guardians.length > 0 && (
        <ul className="mt-3 space-y-2">
          {guardians.map((g) => (
            <li key={g.guardianshipId} className="rounded-[var(--radius-md)] border border-border bg-surface p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">{g.name}</p>
                  <p className="text-xs text-fg-muted">
                    {t(RELATION_KEY[g.relation])} · {t("people.familyLinkSince", { date: formatDate(new Date(g.since)) })}
                  </p>
                </div>
                {ending !== g.guardianshipId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEnding(g.guardianshipId);
                      setReason("");
                      setError(null);
                    }}
                    disabled={pending}
                  >
                    {t("people.familyLinkEnd", { parent: g.name })}
                  </Button>
                )}
              </div>
              {ending === g.guardianshipId && (
                <div className="mt-2">
                  <SelectField className="max-w-md" label={t("people.familyLinkReason")} value={reason} onChange={(e) => setReason(e.target.value as GuardianEndReason | "")} error={error ?? undefined}>
                    <option value="">{t("people.familyLinkChoose")}</option>
                    {GUARDIAN_END_REASONS.map((code) => (
                      <option key={code} value={code}>
                        {t(REASON_KEY[code])}
                      </option>
                    ))}
                  </SelectField>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" variant="danger" onClick={() => end(g)} loading={pending} disabled={reason === ""}>
                      {t("people.familyLinkEnd", { parent: g.name })}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEnding(null)} disabled={pending}>
                      {t("common.cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="ghost" onClick={onClose} disabled={pending}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
