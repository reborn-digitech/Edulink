"use client";

import { useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { CheckboxField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { guidanceAction } from "@/app/(app)/sessions/actions";

/** The school's switch: its teachers may offer free one-to-one guidance to its own pupils. */
export function GuidanceSwitch({ on, canSwitch }: { on: boolean; canSwitch: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <CheckboxField
      label={t("gigs.guidanceSwitch")}
      checked={on}
      disabled={!canSwitch || pending}
      onChange={(event) => {
        const next = event.target.checked;
        startTransition(async () => {
          const result = await guidanceAction(next);
          toast(result.ok ? { tone: "ok", title: next ? t("gigs.guidanceOnNote") : t("gigs.guidanceOffNote") } : { tone: "danger", title: result.error });
          router.refresh();
        });
      }}
      data-testid="guidance-switch"
    />
  );
}
