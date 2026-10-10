"use client";

import { useState } from "react";
import { useDoor } from "./use-door";
import { ChatsCircleIcon } from "@phosphor-icons/react";
import { Spinner } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { call, type DoorFailure } from "./doors";
import { FailureLine } from "./chat";

type Rule = { assignmentId: string; workedAnswerOnSecondAsk: boolean };

export const assignmentDoor = (assignmentId: string) => `/api/v1/teacher/assignments/${encodeURIComponent(assignmentId)}/assistant`;

/**
 * The teacher's per-assignment switch (the assessment rule, the plan's section 5 Phase B): a pupil's question that
 * matches this assignment gets a hint first; ticked (the default), the same question asked again in the same
 * conversation gets the worked answer, unticked it stays a hint.
 */
export function AssignmentAssistantSwitch({ assignmentId }: { assignmentId: string }) {
  const t = useT();
  const { toast } = useToast();
  const read = useDoor<Rule>(assignmentDoor(assignmentId));
  const worked = read.data ? read.data.workedAnswerOnSecondAsk : null;
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<DoorFailure | null>(null);

  const save = async (next: boolean) => {
    setBusy(true);
    setFailure(null);
    const got = await call<Rule>("POST", assignmentDoor(assignmentId), { workedAnswerOnSecondAsk: next });
    setBusy(false);
    if (!got.ok) return setFailure(got);
    read.setData(got.data);
    toast({ tone: "ok", title: t("assistantUi.assignmentSaved") });
  };

  return (
    <section aria-labelledby="assignment-assistant-title" className="rounded-[var(--radius-md)] border border-border bg-surface p-4" data-testid="assignment-assistant">
      <h2 id="assignment-assistant-title" className="flex items-center gap-2 text-sm font-semibold text-fg">
        <ChatsCircleIcon weight="duotone" className="size-5 text-accent-strong" aria-hidden="true" />
        {t("assistantUi.assignmentTitle")}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t("assistantUi.assignmentBody")}</p>
      <div className="mt-3">
        {read.failure ? <FailureLine failure={read.failure} t={t} onRetry={read.retry} /> : null}
        {failure ? <FailureLine failure={failure} t={t} /> : null}
        {worked === null && !read.failure ? (
          <div role="status" aria-label={t("ui.loading")} className="grid min-h-11 place-items-center">
            <Spinner className="size-5 text-accent-strong" />
          </div>
        ) : null}
        {worked !== null ? <CheckboxField label={t("assistantUi.assignmentSwitch")} checked={worked} disabled={busy} onChange={(event) => void save(event.target.checked)} /> : null}
      </div>
    </section>
  );
}
