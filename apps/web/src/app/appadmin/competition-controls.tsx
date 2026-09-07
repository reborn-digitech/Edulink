"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { setCompetitionStatusAction } from "./actions";
import { useT } from "@/lib/i18n";

/**
 * Publish / withdraw controls for one platform competition.
 *
 * Publishing puts the competition in front of every child at every school, so
 * the button says "Publish" and nothing publishes by accident — creation always
 * lands in DRAFT.
 */
export function CompetitionControls({
  competitionId,
  status,
}: {
  competitionId: string;
  status: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function set(next: "PUBLISHED" | "ARCHIVED" | "DRAFT", done: string) {
    startTransition(async () => {
      const result = await setCompetitionStatusAction(competitionId, next);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("root.didNotWork") });
        return;
      }
      toast({ tone: "ok", title: done });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        size="sm"
        tone={status === "PUBLISHED" ? "ok" : status === "ARCHIVED" ? "neutral" : "warn"}
      >
        {status === "PUBLISHED"
          ? t("appadmin.statusLive")
          : status === "ARCHIVED"
            ? t("appadmin.statusWithdrawn")
            : t("appadmin.statusDraft")}
      </Badge>
      {status !== "PUBLISHED" && (
        <Button
          size="sm"
          loading={pending}
          onClick={() => set("PUBLISHED", t("appadmin.published"))}
        >
          {t("appadmin.publish")}
        </Button>
      )}
      {status === "PUBLISHED" && (
        <Button
          size="sm"
          variant="secondary"
          loading={pending}
          onClick={() => set("ARCHIVED", t("appadmin.withdrawn"))}
        >
          {t("appadmin.withdraw")}
        </Button>
      )}
    </div>
  );
}
