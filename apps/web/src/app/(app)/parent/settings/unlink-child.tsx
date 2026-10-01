"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { unlinkChildAction } from "./actions";

/**
 * "Remove this child from my account", with the child's name typed back as
 * the confirmation: a guardianship is not a setting to flip by accident on
 * a staff-room machine. The name is compared trimmed and case-folded — a
 * parent who types "asha" for "Asha" meant it.
 */
export function UnlinkChild({ studentMembershipId, name }: { studentMembershipId: string; name: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const matches = typed.trim().localeCompare(name.trim(), undefined, { sensitivity: "base" }) === 0;

  // Hoisted so the audit sees a translated variable, not a template literal it cannot read.
  const removeLabel = `${t("common.remove")}: ${name}`;
  if (!open) {
    return (
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label={removeLabel} data-testid="unlink-child-open">
        {t("common.remove")}
      </Button>
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!matches) {
      setError(t("familyCare.unlinkNameMismatch"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await unlinkChildAction(studentMembershipId);
      if (!result.ok) {
        setError(t(result.errorKey, result.errorVars));
        return;
      }
      toast({ tone: "ok", title: t(result.data.schoolStandsIn ? "familyCare.unlinkDoneStandin" : "familyCare.unlinkDone", { name }) });
      // With no child left there is no parent page to stand on: the link page is where they go.
      if (result.data.remaining === 0) router.push("/parent/link");
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="w-full space-y-3 rounded-[--radius-md] border border-danger/30 bg-danger-soft/40 p-3" data-testid="unlink-child-form">
      <p className="text-sm font-semibold text-fg">{t("familyCare.unlinkTitle")}</p>
      <p className="text-xs leading-relaxed text-fg-muted">{t("familyCare.unlinkBody", { name })}</p>
      <TextField label={t("familyCare.unlinkTypeName", { name })} value={typed} onChange={(e) => setTyped(e.target.value)} error={error ?? undefined} autoComplete="off" />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" variant="danger" loading={pending} disabled={!matches}>
          {t("familyCare.unlinkButton", { name })}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { setOpen(false); setTyped(""); setError(null); }}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
