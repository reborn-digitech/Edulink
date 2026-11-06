"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, HourglassMediumIcon, TrophyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { enterAction } from "@/app/(app)/competitions/actions";

export type EnrolState = "OPEN" | "ENROLLED" | "CONSENT_WAITING" | "CLOSED";

/**
 * THE AGENDA'S ENROL BUTTON (decision 0007, 6 November 2026): on a COMPETITION row a pupil enrols themself and a
 * guardian enrols the agenda's child, right there, without a Competitions section. The other three states are
 * said in words — "Enrolled", "Consent waiting" (the pupil asked; a guardian has not said yes) and "Closed" (the
 * office's switch off, the date past, or not the pupil's class). Stops the row's link from following a press.
 */
export function EnrolButton({ competitionId, state, studentMembershipId, role }: { competitionId: string; state: EnrolState; studentMembershipId: string; role: "STUDENT" | "PARENT" }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  if (state === "ENROLLED") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-ok" data-testid="agenda-enrol" data-state={state}>
        <CheckCircleIcon weight="fill" className="size-4" />
        {t("agenda.enrolled")}
      </span>
    );
  }
  if (state === "CONSENT_WAITING") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-warn" data-testid="agenda-enrol" data-state={state}>
        <HourglassMediumIcon weight="fill" className="size-4" />
        {t("agenda.consentWaiting")}
      </span>
    );
  }
  if (state === "CLOSED") {
    return (
      <span className="text-xs font-medium text-fg-muted" data-testid="agenda-enrol" data-state={state}>
        {t("agenda.enrolClosed")}
      </span>
    );
  }
  return (
    <Button
      size="sm"
      icon={<TrophyIcon weight="bold" className="size-4" />}
      loading={pending}
      data-testid="agenda-enrol"
      data-state={state}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        startTransition(async () => {
          const result = await enterAction({ id: competitionId, ...(role === "PARENT" ? { studentMembershipId } : {}) });
          if (!result.ok) {
            toast({ tone: "danger", title: t("competitions.thatDidNotGo"), description: result.error });
            return;
          }
          toast({ tone: "ok", title: t("agenda.enrolDone"), description: result.message });
          router.refresh();
        });
      }}
    >
      {t("agenda.enrol")}
    </Button>
  );
}
