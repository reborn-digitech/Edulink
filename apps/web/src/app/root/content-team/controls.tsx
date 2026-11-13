"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { UserMinusIcon, UserPlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { appointAppAdminAction, dismissAppAdminAction } from "../actions";
import { useT } from "@/lib/i18n";

/**
 * Appoint by email. The interesting error is "no account with that email",
 * which the action words as the instruction it implies — register first,
 * appoint second — so it stays visible under the field rather than in a toast
 * that vanishes before the operator has copied the registration link.
 */
export function AppointForm() {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await appointAppAdminAction(email);
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      setEmail("");
      toast({ tone: "ok", title: t("root.contentTeamAppointed") });
      router.refresh();
    });
  }

  return (
    <Card className="p-4">
      <h2 className="font-semibold text-fg">{t("root.contentTeamAppoint")}</h2>
      <p className="mt-1 text-sm text-fg-muted">{t("root.contentTeamAppointHint")}</p>
      <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <TextField
            label={t("root.contentTeamEmailLabel")}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={error ?? undefined}
            required
          />
        </div>
        <Button type="submit" loading={pending} icon={<UserPlusIcon weight="bold" />}>
          {t("root.contentTeamAppointButton")}
        </Button>
      </form>
    </Card>
  );
}

/** Dismissal only takes the flag, so a plain confirm is proportionate. */
export function DismissButton({ userId, name }: { userId: string; name: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function dismiss() {
    if (!window.confirm(t("root.contentTeamDismissConfirm", { name }))) return;
    startTransition(async () => {
      const result = await dismissAppAdminAction(userId);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("root.didNotWork") });
        return;
      }
      toast({ tone: "ok", title: t("root.contentTeamDismissed") });
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      loading={pending}
      onClick={dismiss}
      icon={<UserMinusIcon weight="bold" />}
    >
      {t("root.contentTeamDismiss")}
    </Button>
  );
}
