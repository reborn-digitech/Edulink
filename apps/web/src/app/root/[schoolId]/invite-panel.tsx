"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { inviteAdminAction, revokeInviteAction } from "../actions";
import { useT } from "@/lib/i18n";

type Invite = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
};

/**
 * Inviting the people who will run a school.
 *
 * AN INVITATION, NOT AN ACCOUNT. The operator does not create the user, set a
 * password or mint a membership — they send a link, and the person accepts it
 * through the ordinary `/invite/[token]` flow like everybody else. That is a
 * deliberate limit: an operator who could mint memberships directly could mint
 * one for themselves, in any school, and the two-table boundary would be
 * decoration.
 *
 * ADMIN and PRINCIPAL are both offered because a new school usually needs both
 * and neither can invite the other into existence: the admin runs setup, the
 * principal approves leave, and until one of them exists nobody inside the
 * school can invite anybody.
 */
export function InvitePanel({ schoolId, invites }: { schoolId: string; invites: Invite[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "PRINCIPAL">("ADMIN");
  const [error, setError] = useState<string | null>(null);

  function send(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await inviteAdminAction(schoolId, { email, name, role });
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      setEmail("");
      setName("");
      toast({ tone: "ok", title: t("root.invitationSent") });
      router.refresh();
    });
  }

  function revoke(inviteId: string) {
    startTransition(async () => {
      const result = await revokeInviteAction(schoolId, inviteId);
      if (!result.ok) {
        toast({ tone: "danger", title: t("root.notRevoked"), description: result.error });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <form onSubmit={send} className="space-y-4" noValidate>
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <fieldset>
          <legend className="text-sm font-medium text-fg">{t("root.inviteAs")}</legend>
          <div
            role="radiogroup"
            aria-label={t("root.role")}
            className="mt-2 flex gap-1 rounded-[var(--radius-md)] bg-surface-muted p-1"
          >
            {(["ADMIN", "PRINCIPAL"] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={role === option}
                onClick={() => setRole(option)}
                className={cn(
                  "min-h-11 flex-1 rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors",
                  role === option ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
                )}
              >
                {option === "ADMIN" ? t("root.administrator") : t("role.principal")}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
            {role === "ADMIN" ? t("root.adminExplainer") : t("root.principalExplainer")}
          </p>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("root.email")}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label={t("root.nameOptional")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          loading={pending}
          disabled={!email.trim()}
          icon={<PaperPlaneTiltIcon weight="bold" />}
        >
          {t("root.sendInvitation")}
        </Button>
      </form>

      {invites.length > 0 && (
        <ul className="space-y-1.5 border-t border-border pt-4">
          {invites.map((invite) => (
            <li
              key={invite.id}
              className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] bg-surface-muted p-3"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">{invite.email}</span>
                <span className="block truncate text-xs text-fg-muted">
                  {invite.role === "PRINCIPAL" ? t("role.principal") : t("root.administrator")}
                  {invite.name ? ` · ${invite.name}` : ""}
                </span>
              </span>
              <Badge
                tone={
                  invite.status === "ACCEPTED"
                    ? "ok"
                    : invite.status === "PENDING"
                      ? "warn"
                      : "neutral"
                }
                size="sm"
              >
                {invite.status.toLowerCase()}
              </Badge>
              {invite.status === "PENDING" && (
                <Button size="sm" variant="ghost" loading={pending} onClick={() => revoke(invite.id)}>
                  {t("root.revoke")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
