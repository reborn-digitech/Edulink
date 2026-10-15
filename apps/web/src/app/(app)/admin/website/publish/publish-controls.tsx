"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { markSiteEnquiryAction, publishSiteAction, unpublishSiteAction } from "../actions";

/** Publish (or publish the changes), Unpublish with a confirm, Back to the preview. */
export function PublishControls({ published, warnings }: { published: boolean; warnings: number }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [downPending, startDown] = useTransition();
  return (
    <div className="space-y-3">
      {warnings > 0 ? <p className="text-sm text-warn">{t("website.publishWarnings", { count: warnings })}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/admin/website/review">{t("website.back")}</Link>
        </Button>
        <Button
          type="button"
          loading={pending}
          onClick={() =>
            start(async () => {
              const r = await publishSiteAction();
              if (!r.ok) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
              toast({ tone: "ok", title: t("website.published") });
              router.refresh();
            })
          }
        >
          {published ? t("website.publishChanges") : t("website.publish")}
        </Button>
        {published ? (
          <Button
            type="button"
            variant="danger"
            loading={downPending}
            onClick={() => {
              if (!window.confirm(t("website.unpublishConfirm"))) return;
              startDown(async () => {
                const r = await unpublishSiteAction();
                if (!r.ok) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
                toast({ tone: "ok", title: t("website.unpublished") });
                router.refresh();
              });
            }}
          >
            {t("website.unpublish")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Mark one enquiry read, or new again. */
export function EnquiryRead({ id, read }: { id: string; read: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      loading={pending}
      onClick={() =>
        start(async () => {
          const r = await markSiteEnquiryAction(id, !read);
          if (!r.ok) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
          router.refresh();
        })
      }
    >
      {read ? t("website.enquiryMarkNew") : t("website.enquiryMarkRead")}
    </Button>
  );
}
