"use client";

import { useState } from "react";
import { useDoor } from "./use-door";
import { ChatsCircleIcon } from "@phosphor-icons/react";
import { ASSISTANT_HELPLINE_MAX, type AssistantUsage } from "@edulink/contracts";
import { Button, Spinner } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useLocale, useT, type Translate, type TranslationKey } from "@/lib/i18n";
import { call, type DoorFailure } from "./doors";
import { FailureLine } from "./chat";

export const USAGE_DOOR = "/api/v1/admin/assistant/usage";
export const SETTINGS_DOOR = "/api/v1/admin/assistant/settings";

/** The month's counts as the card lists them: every one a count, never a word anyone typed. */
export const USAGE_COUNTS: [keyof AssistantUsage, TranslationKey][] = [
  ["questions", "assistantUi.cardQuestions"],
  ["refused", "assistantUi.cardRefused"],
  ["counsellorRoutes", "assistantUi.cardCounsellor"],
  ["people", "assistantUi.cardPeople"],
  ["helpful", "assistantUi.cardHelpful"],
  ["notHelpful", "assistantUi.cardNotHelpful"],
];

/** The share of the month's budget used, whole percent, 0 with no budget. */
export function budgetPercent(u: Pick<AssistantUsage, "tokens" | "tokenBudget">): number {
  return u.tokenBudget > 0 ? Math.min(100, Math.round((u.tokens / u.tokenBudget) * 100)) : 0;
}

/**
 * The office's card on its home (Phase C; /admin is the school office's and the college registrar's): the school's
 * month against its budget and the helpline sentence, from GET /api/v1/admin/assistant/usage and saved through POST
 * …/settings (the office only; the head reads the same counts and is not offered the form). Counts only. No switch
 * since 16 Oct 2026: the platform's operator switches the assistant on for a school, and the card says so.
 */
export function AssistantUsageCard({ canEdit }: { canEdit: boolean }) {
  const t = useT();
  const { data: usage, failure, retry, setData: setUsage } = useDoor<AssistantUsage>(USAGE_DOOR);

  return (
    <Card id="assistant" data-testid="assistant-usage-card">
      <CardHeader icon={<ChatsCircleIcon weight="duotone" className="size-5" />} title={t("assistantUi.cardTitle")} description={t("assistantUi.cardBody")} />
      <CardBody>
        {failure ? (
          <FailureLine failure={failure} t={t} onRetry={retry} />
        ) : !usage ? (
          <div className="grid min-h-24 place-items-center" role="status" aria-label={t("ui.loading")}>
            <Spinner className="size-6 text-accent-strong" />
          </div>
        ) : (
          <UsageBody usage={usage} canEdit={canEdit} t={t} onSaved={setUsage} />
        )}
      </CardBody>
    </Card>
  );
}

export function UsageBody({ usage, canEdit, t, onSaved }: { usage: AssistantUsage; canEdit: boolean; t: Translate; onSaved?: (u: AssistantUsage) => void }) {
  const locale = useLocale();
  const { toast } = useToast();
  const [helpline, setHelpline] = useState(usage.helplineText ?? "");
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<DoorFailure | null>(null);
  const number = (n: number) => new Intl.NumberFormat(`${locale}-IN`).format(n);
  const percent = budgetPercent(usage);

  const save = async () => {
    setSaving(true);
    setFailure(null);
    const got = await call<AssistantUsage>("POST", SETTINGS_DOOR, { helplineText: helpline.trim() ? helpline.trim() : null });
    setSaving(false);
    if (!got.ok) return setFailure(got);
    onSaved?.(got.data);
    toast({ tone: "ok", title: t("assistantUi.cardSaved") });
  };

  return (
    <div className="space-y-4">
      {!usage.platformOn ? (
        <p role="note" className="rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft p-3 text-sm font-medium text-warn">
          {t("assistantUi.cardKilled")}
        </p>
      ) : null}
      <div>
        <p className="text-sm font-medium text-fg">{usage.tokenBudget > 0 ? t("assistantUi.cardUsed", { used: number(usage.tokens), budget: number(usage.tokenBudget), percent }) : t("assistantUi.cardUsedNoBudget", { used: number(usage.tokens) })}</p>
        {usage.tokenBudget > 0 && (
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={t("assistantUi.cardTitle")}>
            <div className={percent >= 90 ? "h-full rounded-full bg-danger" : percent >= 70 ? "h-full rounded-full bg-warn" : "h-full rounded-full bg-accent"} style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="assistant-usage-counts">
        {USAGE_COUNTS.map(([field, key]) => (
          <div key={field} className="rounded-[var(--radius-md)] bg-surface-muted p-3">
            <dt className="text-xs text-fg-muted">{t(key)}</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-fg">{number(usage[field] as number)}</dd>
          </div>
        ))}
      </dl>
      {canEdit ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <p className="text-sm text-fg-muted" data-testid="assistant-by-operator">
            {t("modules.assistantByOperator")}
          </p>
          <TextAreaField
            label={t("assistantUi.cardHelpline")}
            hint={t("assistantUi.cardHelplineHint")}
            name="helplineText"
            rows={2}
            maxLength={ASSISTANT_HELPLINE_MAX}
            value={helpline}
            placeholder={usage.helplineDefault}
            onChange={(event) => setHelpline(event.target.value)}
          />
          {failure ? <FailureLine failure={failure} t={t} /> : null}
          <Button type="submit" size="sm" loading={saving}>
            {t("assistantUi.cardSave")}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
