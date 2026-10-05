"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EnvelopeSimpleIcon, LinkIcon, SignOutIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { resendAdminInviteAction, sendAdminSignInLinkAction, signOutAdminAction } from "../actions";
import { useLocale, useT } from "@/lib/i18n";
import { relativeTime } from "@/lib/dates";

export type AdminView = { userId: string; name: string; email: string | null; role: string; liveSessions: number; lastSeenAt: string | null };
export type PendingInviteView = { id: string; email: string | null; role: string };

/**
 * The three support doors, each aimed at a person the school already made
 * its administrator or head, each behind a plain confirm, each recorded in
 * the school's own Safety Centre by the lib. Nothing here signs the
 * operator in as anybody.
 */
export function SupportPanel({ schoolId, admins, pending }: { schoolId: string; admins: AdminView[]; pending: PendingInviteView[] }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  function run(key: string, work: () => Promise<{ ok: boolean; error?: string; sessionsEnded?: number }>, done: (r: { sessionsEnded?: number }) => string) {
    setError(null);
    setActing(key);
    startTransition(async () => {
      const result = await work();
      setActing(null);
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: done(result) });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {pending.length > 0 && (
        <ul className="space-y-2">
          {pending.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm">
              <span className="min-w-0 truncate">
                {inv.email ?? "—"} <span className="text-xs text-fg-muted">· {inv.role === "PRINCIPAL" ? t("role.principal") : t("root.administrator")}</span>
              </span>
              <Button size="sm" variant="secondary" icon={<EnvelopeSimpleIcon weight="bold" />} loading={busy && acting === `resend:${inv.id}`} onClick={() => run(`resend:${inv.id}`, () => resendAdminInviteAction(schoolId, inv.id), () => t("root.supportResendDone"))}>
                {t("root.supportResend")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {admins.length === 0 ? (
        <p className="text-sm text-fg-muted">{t("root.supportNoAdmins")}</p>
      ) : (
        <ul className="space-y-2">
          {admins.map((a) => (
            <li key={a.userId} className="space-y-2 rounded-[var(--radius-md)] border border-border px-3 py-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-fg">{a.name}</span>
                <span className="text-xs text-fg-muted">{a.role === "PRINCIPAL" ? t("role.principal") : t("root.administrator")}</span>
                {a.email && <span className="truncate text-xs text-fg-muted">{a.email}</span>}
                <Badge size="sm" tone={a.liveSessions > 0 ? "accent" : "neutral"}>
                  {a.liveSessions === 0 ? t("root.supportLiveSessionsNone") : a.liveSessions === 1 ? t("root.supportLiveSessionsOne") : t("root.supportLiveSessionsMany", { count: a.liveSessions })}
                </Badge>
                {a.lastSeenAt && <span className="text-xs text-fg-subtle">{t("root.supportLastSeen", { when: relativeTime(new Date(a.lastSeenAt), new Date(), locale) })}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<LinkIcon weight="bold" />}
                  loading={busy && acting === `link:${a.userId}`}
                  onClick={() => {
                    if (!window.confirm(t("root.supportSignInLinkConfirm", { name: a.name }))) return;
                    run(`link:${a.userId}`, () => sendAdminSignInLinkAction(schoolId, a.userId), () => t("root.supportSignInLinkDone"));
                  }}
                >
                  {t("root.supportSignInLink")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<SignOutIcon weight="bold" />}
                  loading={busy && acting === `out:${a.userId}`}
                  onClick={() => {
                    if (!window.confirm(t("root.supportSignOutConfirm", { name: a.name }))) return;
                    run(`out:${a.userId}`, () => signOutAdminAction(schoolId, a.userId), (r) => ((r.sessionsEnded ?? 0) === 1 ? t("root.supportSignOutDoneOne") : t("root.supportSignOutDoneMany", { count: r.sessionsEnded ?? 0 })));
                  }}
                >
                  {t("root.supportSignOut")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
