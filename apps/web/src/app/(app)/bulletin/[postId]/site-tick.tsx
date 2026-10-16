"use client";

import { useState, useTransition } from "react";
import { CheckboxField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { setPostOnSiteAction } from "@/app/(app)/admin/website/actions";

/**
 * "Show on the website" (website-two, 16 Oct 2026): the office or the head puts an approved school-wide post into the
 * website's news, or takes it out, from the post itself. The draft changes; the site changes when they publish.
 */
export function SiteTick({ postId, on }: { postId: string; on: boolean }) {
  const t = useT();
  const { toast } = useToast();
  const [checked, setChecked] = useState(on);
  const [pending, start] = useTransition();
  return (
    <div data-testid="post-on-site">
      <CheckboxField
        label={t("siteEditor.postOnSite")}
        description={t("siteEditor.postOnSiteHint")}
        checked={checked}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          setChecked(next);
          start(async () => {
            const r = await setPostOnSiteAction(postId, next);
            if (!r.ok) {
              setChecked(!next);
              toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
            }
          });
        }}
      />
    </div>
  );
}
