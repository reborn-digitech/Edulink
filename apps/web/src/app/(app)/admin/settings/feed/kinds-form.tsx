"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GLOBAL_FEED_KIND_CHOICES, type GlobalFeedKindChoice } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { saveFeedKinds } from "./actions";

/** Schools, colleges or both: the one choice of the global feed's kind filter. The head sees it and no button. */
export function FeedKindsForm({ choice, canWrite }: { choice: GlobalFeedKindChoice; canWrite: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState<GlobalFeedKindChoice>(choice);
  const [pending, startTransition] = useTransition();
  function save() {
    startTransition(async () => {
      const result = await saveFeedKinds(value);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: t("feedKinds.saved") });
      router.refresh();
    });
  }
  return (
    <div className="space-y-4">
      <SelectField label={t("feedKinds.label")} value={value} disabled={!canWrite} onChange={(e) => setValue(e.target.value as GlobalFeedKindChoice)}>
        {GLOBAL_FEED_KIND_CHOICES.map((c) => (
          <option key={c} value={c}>
            {t(`feedKinds.choice.${c}`)}
          </option>
        ))}
      </SelectField>
      {canWrite && (
        <Button type="button" variant="primary" loading={pending} disabled={value === choice} onClick={save}>
          {t("feedKinds.save")}
        </Button>
      )}
    </div>
  );
}
