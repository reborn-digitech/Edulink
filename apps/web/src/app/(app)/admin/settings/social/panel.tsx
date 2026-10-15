"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { cancelPickAction, choosePageAction, disconnectAction, retrySocialAction } from "./actions";

type Result = { ok: true } | { ok: false; error: string };

/** The Pages Facebook Login returned: the admin picks one (meta-posting, 16 Oct 2026). */
export function PagePicker({ pages }: { pages: { id: string; name: string; igUsername: string | null }[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState(pages.length === 1 ? pages[0]!.id : "");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!chosen) return void setError(t("social.pickOne"));
        setError(null);
        startTransition(async () => {
          const result: Result = await choosePageAction(chosen);
          if (!result.ok) return void setError(result.error);
          toast({ tone: "ok", title: t("social.connected") });
          router.replace("/admin/settings/social");
          router.refresh();
        });
      }}
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg">{t("social.pickLegend")}</legend>
        {pages.map((page) => (
          <label key={page.id} className="flex min-h-11 items-start gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3.5">
            <input type="radio" name="page" value={page.id} checked={chosen === page.id} onChange={() => setChosen(page.id)} className="mt-0.5 size-4 accent-[var(--accent)]" data-testid="social-page-option" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-fg">{page.name}</span>
              <span className="mt-0.5 block text-xs text-fg-muted">{page.igUsername ? t("social.instagramLinked", { username: page.igUsername }) : t("social.instagramNone")}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending} disabled={!chosen} data-testid="social-pick">
          {t("social.useThisPage")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await cancelPickAction();
              router.replace("/admin/settings/social");
              router.refresh();
            })
          }
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}

/** Disconnect the Page the screen shows, after a confirm. */
export function DisconnectButton({ pageId, pageName }: { pageId: string; pageName: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      loading={pending}
      data-testid="social-disconnect"
      onClick={() => {
        if (!window.confirm(t("social.confirmDisconnect", { page: pageName }))) return;
        startTransition(async () => {
          const result: Result = await disconnectAction(pageId);
          if (!result.ok) return void toast({ tone: "danger", title: result.error });
          toast({ tone: "ok", title: t("social.disconnected") });
          router.refresh();
        });
      }}
    >
      {t("social.disconnect")}
    </Button>
  );
}

/** Retry a failed copy, on the post's own page. */
export function RetryButton({ socialPostId, postId }: { socialPostId: string; postId: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      loading={pending}
      data-testid="social-retry"
      onClick={() =>
        startTransition(async () => {
          const result: Result = await retrySocialAction(socialPostId, postId);
          if (!result.ok) return void toast({ tone: "danger", title: result.error });
          toast({ tone: "ok", title: t("social.retried") });
          router.refresh();
        })
      }
    >
      {t("social.retry")}
    </Button>
  );
}
