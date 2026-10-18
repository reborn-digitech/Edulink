"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { createSiteShareAction, revokeSiteShareAction } from "../actions";
import type { EditorShare } from "./types";

/**
 * SHARE FOR REVIEW (website-two, 16 October 2026), on the editor's header: a link a principal or a colleague opens with
 * no account to read the draft, read-only, for up to seven days; shown once when it is made (only its hash is kept),
 * revocable; a new link revokes the one before. On a phone the header's buttons wrap and this one sits near the left,
 * so the panel opens from its left edge there and from its right edge from `sm` up (at 390 px it began 189 px off the
 * screen; loose-ends walk, 18 Oct 2026).
 */
export function ShareButton({ shares, when }: { shares: EditorShare[]; when: (iso: string) => string }) {
  const t = useT();
  const id = useId();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(7);
  const [made, setMade] = useState<{ url: string; expiresAt: string } | null>(null);
  const [pending, start] = useTransition();
  const current = shares[0] ?? null;

  const make = () =>
    start(async () => {
      const r = await createSiteShareAction(days);
      if (!r.ok || !r.url || !r.expiresAt) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
      setMade({ url: r.url, expiresAt: r.expiresAt });
      router.refresh();
    });
  const revoke = (shareId: string) =>
    start(async () => {
      const r = await revokeSiteShareAction(shareId);
      if (!r.ok) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
      setMade(null);
      toast({ tone: "ok", title: t("siteEditor.shareRevoked") });
      router.refresh();
    });
  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ tone: "ok", title: t("siteEditor.shareCopied") });
    } catch {
      toast({ tone: "danger", title: t("siteEditor.shareCopyFailed") });
    }
  };

  return (
    <div className="relative">
      <Button type="button" variant="ghost" size="sm" aria-expanded={open} aria-controls={`${id}-share`} onClick={() => setOpen((o) => !o)} data-testid="site-share">
        {current ? t("siteEditor.shareOpenUntil", { when: when(current.expiresAt) }) : t("siteEditor.share")}
      </Button>
      {open ? (
        <div id={`${id}-share`} className="absolute left-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] sm:left-auto sm:right-0 space-y-3 rounded-[var(--radius-md)] border border-border bg-surface p-3 shadow-lg">
          <p className="text-sm text-fg">{t("siteEditor.shareIntro")}</p>
          {made ? (
            <div className="space-y-2" data-testid="site-share-made">
              <p className="break-all rounded-[var(--radius-sm)] bg-surface-muted p-2 text-xs text-fg">{made.url}</p>
              <p className="text-xs text-fg-muted">{t("siteEditor.shareOnce", { when: when(made.expiresAt) })}</p>
              <Button type="button" size="sm" onClick={() => void copy(made.url)}>
                {t("siteEditor.shareCopy")}
              </Button>
            </div>
          ) : current ? (
            <p className="text-xs text-fg-muted">{t("siteEditor.shareCurrent", { when: when(current.expiresAt), name: current.byName ?? "—" })}</p>
          ) : null}
          <SelectField label={t("siteEditor.shareDays")} value={String(days)} onChange={(e) => setDays(Number(e.target.value))}>
            {[1, 2, 3, 5, 7].map((d) => (
              <option key={d} value={d}>
                {d === 1 ? t("siteEditor.shareDayOne") : t("siteEditor.shareDaysN", { count: d })}
              </option>
            ))}
          </SelectField>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" loading={pending} onClick={make}>
              {current ? t("siteEditor.shareNew") : t("siteEditor.shareMake")}
            </Button>
            {current ? (
              <Button type="button" size="sm" variant="danger" loading={pending} onClick={() => revoke(current.id)}>
                {t("siteEditor.shareRevoke")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
