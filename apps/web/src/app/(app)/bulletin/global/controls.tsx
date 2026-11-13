"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { EyeSlashIcon, EyeIcon, GlobeIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { hide, unhide, unpublish } from "./actions";

/**
 * The admin controls on one global post.
 *
 * WHICH CONTROLS APPEAR DEPENDS ON WHOSE POST IT IS, and the difference is the
 * feature rather than a detail. On another school's post the only lever is
 * "hide for my school" — there is deliberately no delete, no edit and no
 * report-to-a-moderator, because there is no moderator above a school to report
 * to. On this school's own post there is also "take off the global feed", which
 * removes it for everybody, because this school wrote it.
 */
export function GlobalPostControls({
  postId,
  ours,
  hiddenHere,
}: {
  postId: string;
  ours: boolean;
  hiddenHere: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function act(work: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        setError(result.error ?? t("bulletin.couldNotDo"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hiddenHere ? (
        <Button
          size="sm"
          variant="secondary"
          loading={pending}
          icon={<EyeIcon weight="bold" className="size-4" />}
          onClick={() => act(() => unhide(postId))}
        >
          {t("bulletin.showAgain")}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          loading={pending}
          icon={<EyeSlashIcon weight="bold" className="size-4" />}
          onClick={() => act(() => hide(postId))}
        >
          {t("bulletin.hideHere")}
        </Button>
      )}

      {ours && (
        <Button
          size="sm"
          variant="ghost"
          loading={pending}
          icon={<GlobeIcon weight="bold" className="size-4" />}
          onClick={() => act(() => unpublish(postId))}
        >
          {t("bulletin.takeOffGlobal")}
        </Button>
      )}

      {error && <span className="text-xs font-medium text-danger">{error}</span>}
    </div>
  );
}
