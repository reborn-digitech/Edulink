"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "@/lib/navigation";
import {
  LockKeyIcon,
  LockKeyOpenIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import type { CycleStatus } from "@/components/admissions/labels";
import { purgeCycleAction, setCycleStatusAction } from "./actions";

/**
 * One cycle's verbs: open or close the door, edit, and — for a closed
 * cycle only — delete the forms of the families it did not admit. The
 * purge asks once, because it takes papers away from families who may still
 * want them back; the toast says how many it removed. `canPurge` is the
 * admin's: the head opens and closes the door and never deletes a form.
 */
export function CycleRowActions({
  cycleId,
  status,
  name,
  canPurge = true,
}: {
  cycleId: string;
  status: CycleStatus;
  name: string;
  canPurge?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function setStatus(next: "OPEN" | "CLOSED") {
    startTransition(async () => {
      const result = await setCycleStatusAction(cycleId, next);
      if (!result.ok) {
        toast({
          tone: "danger",
          title: actionError(t, result, "common.tryAgain"),
        });
        return;
      }
      toast({
        tone: "ok",
        title:
          next === "OPEN" ? t("admissions.opened") : t("admissions.closed"),
      });
      router.refresh();
    });
  }

  function purge() {
    if (!window.confirm(`${name}: ${t("admissions.purgeConfirm")}`)) return;
    startTransition(async () => {
      const result = await purgeCycleAction(cycleId);
      if (!result.ok) {
        toast({
          tone: "danger",
          title: actionError(t, result, "common.tryAgain"),
        });
        return;
      }
      toast({
        tone: "ok",
        title: t("admissions.purged", { count: result.count ?? 0 }),
      });
      router.refresh();
    });
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      {status === "OPEN" ? (
        <Button
          variant="secondary"
          size="sm"
          icon={<LockKeyIcon weight="bold" />}
          loading={pending}
          onClick={() => setStatus("CLOSED")}
          data-testid={`close-${cycleId}`}
        >
          {t("admissions.closeCycle")}
        </Button>
      ) : (
        <Button
          size="sm"
          icon={<LockKeyOpenIcon weight="bold" />}
          loading={pending}
          onClick={() => setStatus("OPEN")}
          data-testid={`open-${cycleId}`}
        >
          {t("admissions.openCycle")}
        </Button>
      )}
      <Button
        asChild
        variant="secondary"
        size="sm"
        icon={<PencilSimpleIcon weight="bold" />}
      >
        <Link href={`/admin/admissions/${cycleId}`}>{t("common.edit")}</Link>
      </Button>
      {status === "CLOSED" && canPurge && (
        <Button
          variant="ghost"
          size="sm"
          icon={<TrashIcon weight="bold" />}
          loading={pending}
          onClick={purge}
          title={t("admissions.purgeHint")}
          data-testid={`purge-${cycleId}`}
        >
          {t("admissions.purge")}
        </Button>
      )}
    </span>
  );
}
