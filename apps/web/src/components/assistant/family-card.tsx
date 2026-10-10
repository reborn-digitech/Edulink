"use client";

import { useState } from "react";
import { useDoor } from "./use-door";
import { ChatsCircleIcon } from "@phosphor-icons/react";
import type { FamilyAssistant } from "@edulink/contracts";
import { Spinner } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { call, type DoorFailure } from "./doors";
import { FailureLine } from "./chat";

export const FAMILY_DOOR = "/api/v1/family/assistant";
export const OPT_OUT_DOOR = "/api/v1/family/assistant/opt-out";

/**
 * The guardian's opt-out per child (Phase C; the plan's section 8.2 and decision 0005): one box per child, ticked while
 * the child may use the assistant. A child whose school has the assistant off is listed without a box. The anchor
 * #assistant is where the assistant's first screen sends a guardian.
 */
export function FamilyAssistantCard() {
  const t = useT();
  const { toast } = useToast();
  const { data: view, failure: readFailure, retry, setData: setView } = useDoor<FamilyAssistant>(FAMILY_DOOR);
  const [failure, setFailure] = useState<DoorFailure | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const flip = async (childId: string, name: string, allowed: boolean) => {
    setBusy(childId);
    setFailure(null);
    const got = await call<{ childId: string; optedOut: boolean; changedAt: string }>("POST", OPT_OUT_DOOR, { childId, optedOut: !allowed });
    setBusy(null);
    if (!got.ok) return setFailure(got);
    if (view) setView({ children: view.children.map((c) => (c.childId === childId ? { ...c, optedOut: got.data.optedOut, changedAt: got.data.changedAt } : c)) });
    toast({ tone: "ok", title: t(got.data.optedOut ? "assistantUi.familyOff" : "assistantUi.familyOn", { name }) });
  };

  return (
    <Card id="assistant" className="scroll-mt-20" data-testid="family-assistant-card">
      <CardHeader icon={<ChatsCircleIcon weight="duotone" className="size-5" />} title={t("assistantUi.familyTitle")} description={t("assistantUi.familyBody")} />
      <CardBody className="space-y-2">
        {readFailure ? <FailureLine failure={readFailure} t={t} onRetry={retry} /> : null}
        {failure ? <FailureLine failure={failure} t={t} /> : null}
        {!view && !readFailure ? (
          <div className="grid min-h-16 place-items-center" role="status" aria-label={t("ui.loading")}>
            <Spinner className="size-5 text-accent-strong" />
          </div>
        ) : null}
        {view?.children.map((child) =>
          child.schoolOn ? (
            <CheckboxField
              key={child.childId}
              label={t("assistantUi.familyAllow", { name: child.name })}
              checked={!child.optedOut}
              disabled={busy === child.childId}
              onChange={(event) => void flip(child.childId, child.name, event.target.checked)}
            />
          ) : (
            <p key={child.childId} className="rounded-[var(--radius-md)] border border-border p-3 text-sm text-fg-muted">
              {t("assistantUi.familySchoolOff", { name: child.name })}
            </p>
          ),
        )}
      </CardBody>
    </Card>
  );
}
