"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { AVATAR_PRESETS, Avatar, describeAvatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { saveProfile } from "./actions";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";

export function ProfileForm({
  fullName,
  preferredName,
  bio,
  avatarKey,
  handle,
  studentCode,
  bioHintKey,
}: {
  fullName: string;
  preferredName: string;
  bio: string;
  avatarKey: string | null;
  handle: string | null;
  studentCode: string | null;
  /** The teacher profile reuses this form; its bio is read by colleagues,
   * not classmates, and the hint must say so. */
  bioHintKey?: TranslationKey;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [draft, setDraft] = useState({
    preferredName,
    bio,
    avatarKey: avatarKey ?? AVATAR_PRESETS[0]!,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [picking, setPicking] = useState(false);

  const dirty =
    draft.preferredName !== preferredName ||
    draft.bio !== bio ||
    draft.avatarKey !== (avatarKey ?? AVATAR_PRESETS[0]!);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await saveProfile(draft);
      if (!result.ok) {
        setErrors(result.errors);
        toast({ tone: "danger", title: t("student.notSaved"), description: result.errors._form });
        return;
      }
      toast({ tone: "ok", title: t("student.saved") });
      setPicking(false);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {errors._form && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      <div className="flex items-center gap-4">
        <Avatar avatarKey={draft.avatarKey} name={fullName} size="xl" ring />
        <div className="min-w-0">
          <p className="text-lg font-bold text-fg">{draft.preferredName || fullName}</p>
          <p className="text-sm text-fg-muted">{describeAvatar(draft.avatarKey, t)}</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-2"
            onClick={() => setPicking((v) => !v)}
          >
            {picking ? t("student.doneChoosing") : t("student.changeMyLook")}
          </Button>
        </div>
      </div>

      {picking && (
        <div
          role="radiogroup"
          aria-label={t("student.chooseAvatar")}
          className="grid max-h-72 grid-cols-5 gap-2 overflow-y-auto rounded-[--radius-lg] border border-border bg-surface p-3 scrollbar-thin sm:grid-cols-6"
        >
          {AVATAR_PRESETS.map((preset) => {
            const selected = preset === draft.avatarKey;
            return (
              <button
                key={preset}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={describeAvatar(preset, t)}
                onClick={() => setDraft((d) => ({ ...d, avatarKey: preset }))}
                className={cn(
                  "rounded-full transition-transform duration-[--dur-fast] active:scale-90",
                  selected
                    ? "ring-[3px] ring-accent ring-offset-2 ring-offset-[--surface]"
                    : "hover:scale-105",
                )}
              >
                <Avatar avatarKey={preset} name={describeAvatar(preset, t)} size="md" />
              </button>
            );
          })}
        </div>
      )}

      <TextField
        label={t("student.callYou")}
        placeholder={fullName.split(" ")[0]}
        value={draft.preferredName}
        error={errors.preferredName}
        maxLength={60}
        onChange={(e) => setDraft((d) => ({ ...d, preferredName: e.target.value }))}
        hint={t("student.nameYoullSee")}
      />

      <TextAreaField
        label={t("student.aboutYou")}
        placeholder={t("student.aboutPlaceholder")}
        value={draft.bio}
        error={errors.bio}
        rows={3}
        maxLength={600}
        onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
        hint={t(bioHintKey ?? "student.bioHint")}
      />

      {/* Read-only facts, kept together so they are easy to find and hard to
          mistake for something editable. */}
      <dl className="divide-y divide-border rounded-[--radius-md] border border-border">
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-fg-muted">{t("student.fullName")}</dt>
          <dd className="text-right text-sm font-medium text-fg">{fullName}</dd>
        </div>
        {handle && (
          <div className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-fg-muted">{t("student.loginName")}</dt>
            <dd className="text-right font-mono text-sm font-medium text-fg">{handle}</dd>
          </div>
        )}
        {studentCode && (
          <div className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-fg-muted">
              {t("student.studentCode")}
              <span className="mt-0.5 block text-xs text-fg-subtle">
                {t("student.codeHint")}
              </span>
            </dt>
            <dd className="text-right font-mono text-sm font-medium text-fg">{studentCode}</dd>
          </div>
        )}
      </dl>
      <p className="text-xs text-fg-muted">{t("student.nameHint")}</p>

      {dirty && (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] flex items-center gap-3 rounded-[--radius-lg] border border-accent bg-surface p-3 shadow-lg lg:bottom-4">
          <p className="min-w-0 flex-1 text-sm font-medium text-fg">{t("student.unsaved")}</p>
          <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />}>
            {t("student.save")}
          </Button>
        </div>
      )}
    </form>
  );
}
