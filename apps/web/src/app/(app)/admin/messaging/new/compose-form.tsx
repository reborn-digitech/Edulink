"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTiltIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useLocale, useT } from "@/lib/i18n";
import { MAX_NOTICE_LENGTH, renderTemplate } from "@/lib/message-templates";
import type { Audience, AudiencePreview } from "@/lib/messaging";
import { broadcastHref } from "../labels";
import { createBroadcastAction, previewBroadcastAction } from "../actions";

type AudienceKind = Audience["kind"];
const KINDS: Exclude<AudienceKind, "PEOPLE">[] = ["ALL_PARENTS", "CLASS", "GRADE", "OVERDUE_FEES"];

/**
 * The compose form. The preview is rendered with the same `renderTemplate`
 * the router uses, so what the office reads is what arrives; "Check reach"
 * writes nothing and says who would be texted; "Send now" creates the
 * broadcast and lands on its delivery report.
 */
export function ComposeForm({ school, classes, grades }: { school: string; classes: { id: string; name: string }[]; grades: string[] }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [checking, startCheck] = useTransition();
  const [sending, startSend] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<AudienceKind>("ALL_PARENTS");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [gradeLevel, setGradeLevel] = useState(grades[0] ?? "");
  const [text, setText] = useState(true);
  const [push, setPush] = useState(false);
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmed = body.replace(/\s+/g, " ").trim();
  const audience = (): Audience | null => {
    if (kind === "CLASS") return classId ? { kind, classId } : null;
    if (kind === "GRADE") return gradeLevel ? { kind, gradeLevel } : null;
    if (kind === "OVERDUE_FEES") return { kind };
    return { kind: "ALL_PARENTS" };
  };
  const channels = [...(text ? (["TEXT"] as const) : []), ...(push ? (["PUSH"] as const) : [])];
  const kindLabel: Record<(typeof KINDS)[number], string> = {
    ALL_PARENTS: t("messaging.audienceAll"),
    CLASS: t("messaging.audienceClass"),
    GRADE: t("messaging.audienceGrade"),
    OVERDUE_FEES: t("messaging.audienceOverdue"),
  };

  function validate(): { audience: Audience } | null {
    setError(null);
    if (title.trim().length < 2) return setError(t("messaging.refuseTitle")), null;
    if (trimmed.length < 5 || trimmed.length > MAX_NOTICE_LENGTH) return setError(t("messaging.refuseBody")), null;
    if (channels.length === 0) return setError(t("messaging.refuseChannels")), null;
    const a = audience();
    if (!a) return setError(kind === "CLASS" ? t("messaging.composeChooseClass") : t("messaging.composeChooseGrade")), null;
    return { audience: a };
  }

  function check() {
    const v = validate();
    if (!v) return;
    startCheck(async () => {
      const result = await previewBroadcastAction({ audience: v.audience, body: trimmed });
      if (!result.ok || !result.preview) return setError(actionError(t, result, "common.tryAgain"));
      setPreview(result.preview);
    });
  }

  function send(event: React.FormEvent) {
    event.preventDefault();
    const v = validate();
    if (!v) return;
    startSend(async () => {
      const result = await createBroadcastAction({ title: title.trim(), body: trimmed, audience: v.audience, channels: [...channels] });
      if (!result.ok || !result.broadcastId) return setError(actionError(t, result, "common.tryAgain"));
      toast({ tone: "ok", title: t("messaging.composeSent", { queued: result.queued ?? 0, skipped: result.skipped ?? 0 }) });
      router.push(broadcastHref(result.broadcastId));
    });
  }

  return (
    <form onSubmit={send} noValidate className="space-y-6">
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <TextField label={t("messaging.composeLabel")} required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} />

      <TextAreaField
        label={t("messaging.composeBody")}
        required
        rows={4}
        maxLength={MAX_NOTICE_LENGTH}
        hint={t("messaging.composeCounter", { count: trimmed.length, max: MAX_NOTICE_LENGTH })}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setPreview(null);
        }}
      />

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-fg">{t("messaging.templatePreview")}</p>
        <p className="rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-sm leading-relaxed text-fg" aria-live="polite">
          {renderTemplate("circular", locale, { school, notice: trimmed || "…" })}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg">{t("messaging.composeAudience")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {KINDS.map((k) => (
            <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-border p-3 text-sm hover:bg-surface-muted">
              <input
                type="radio"
                name="audience"
                value={k}
                checked={kind === k}
                onChange={() => {
                  setKind(k);
                  setPreview(null);
                }}
                className="size-4 accent-[var(--accent)]"
              />
              <span className="font-medium text-fg">{kindLabel[k]}</span>
            </label>
          ))}
        </div>
        {kind === "CLASS" && (
          <SelectField label={t("messaging.composeChooseClass")} value={classId} onChange={(e) => (setClassId(e.target.value), setPreview(null))}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        )}
        {kind === "GRADE" && (
          <SelectField label={t("messaging.composeChooseGrade")} value={gradeLevel} onChange={(e) => (setGradeLevel(e.target.value), setPreview(null))}>
            {grades.map((g) => (
              <option key={g} value={g}>
                {t("messaging.audienceGradeNamed", { grade: g })}
              </option>
            ))}
          </SelectField>
        )}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg">{t("messaging.composeChannels")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <CheckboxField label={t("messaging.channelText")} checked={text} onChange={(e) => setText(e.target.checked)} />
          <CheckboxField label={t("messaging.channelPush")} checked={push} onChange={(e) => setPush(e.target.checked)} />
        </div>
      </fieldset>

      {preview && (
        <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted p-4 text-sm" aria-live="polite">
          <p className="font-semibold text-fg">{t("messaging.previewTitle")}</p>
          <ul className="mt-1.5 space-y-0.5 text-fg-muted tabular-nums">
            <li>{t("messaging.previewRecipients", { count: preview.recipients })}</li>
            <li>{t("messaging.previewWhatsapp", { count: preview.whatsapp })}</li>
            <li>{t("messaging.previewSms", { count: preview.sms, segments: preview.estimatedSegments })}</li>
            <li className={preview.unreachable > 0 ? "text-warn" : undefined}>{t("messaging.previewUnreachable", { count: preview.unreachable })}</li>
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" loading={checking} disabled={sending} icon={<UsersThreeIcon weight="bold" />} onClick={check}>
          {t("messaging.composePreview")}
        </Button>
        <Button type="submit" loading={sending} disabled={checking} icon={<PaperPlaneTiltIcon weight="bold" />}>
          {t("messaging.composeSend")}
        </Button>
      </div>
    </form>
  );
}
