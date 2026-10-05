"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { reply, close } from "../actions";
import { useT } from "@/lib/i18n";
import { actionError } from "@/lib/action-error";
import { useToast } from "@/components/ui/toast";
import { fieldClass } from "@/components/ui/field-class";

/** The reply box, and — on the school's side — the close switch. */
export function ThreadControls({
  enquiryId,
  canClose,
}: {
  enquiryId: string;
  canClose: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={t("enquiries.replyPlaceholder")}
        className={fieldClass()}
      />
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          loading={pending}
          disabled={body.trim().length === 0}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await reply(enquiryId, body);
              if (!result.ok) {
                setError(actionError(t, result, "common.somethingWrong"));
                return;
              }
              setBody("");
              router.refresh();
            })
          }
        >
          {t("enquiries.replyCta")}
        </Button>

        {canClose &&
          (confirming ? (
            <span className="ml-auto flex items-center gap-1">
              <Button
                size="sm"
                variant="danger"
                loading={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await close(enquiryId);
                    if (!result.ok) {
                      toast({
                        tone: "danger",
                        title: actionError(t, result, "common.somethingWrong"),
                      });
                      return;
                    }
                    toast({ tone: "ok", title: t("enquiries.closedToast") });
                    router.refresh();
                  })
                }
              >
                {t("enquiries.closeCta")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                {t("common.cancel")}
              </Button>
            </span>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => setConfirming(true)}
            >
              {t("enquiries.closeCta")}
            </Button>
          ))}
      </div>
    </div>
  );
}
