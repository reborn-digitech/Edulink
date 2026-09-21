"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArchiveIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { archiveTemplateAction } from "./actions";

/**
 * One template row's verbs: edit, and retire. Retiring asks once, because
 * it takes the template off the issue screen for everybody in the office;
 * the certificates already issued from it stand, which the toast says.
 */
export function TemplateRowActions({ templateId, name, active }: { templateId: string; name: string; active: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function retire() {
    if (!window.confirm(`${t("certificates.archive")}: ${name}?`)) return;
    startTransition(async () => {
      const result = await archiveTemplateAction(templateId);
      if (!result.ok) {
        toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: t("certificates.archived") });
      router.refresh();
    });
  }

  return (
    <span className="flex shrink-0 items-center gap-2">
      <Button asChild variant="secondary" size="sm" icon={<PencilSimpleIcon weight="bold" />}>
        <Link href={`/admin/certificates/${templateId}`}>{t("common.edit")}</Link>
      </Button>
      {active && (
        <Button variant="ghost" size="sm" icon={<ArchiveIcon weight="bold" />} loading={pending} onClick={retire} data-testid={`retire-${templateId}`}>
          {t("certificates.archive")}
        </Button>
      )}
    </span>
  );
}
