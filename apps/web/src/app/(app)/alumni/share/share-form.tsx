"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { sharePostAction } from "../actions";

/** A title and a few lines for the old school's feed: the office checks it before anyone sees it. */
export function ShareForm() {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function send(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await sharePostAction({ title, body });
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: t("alumni.shareSent") });
      router.push("/alumni");
    });
  }

  return (
    <form onSubmit={send} className="space-y-4">
      <TextField label={t("alumni.shareTitleField")} value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={200} />
      <TextAreaField label={t("alumni.shareBodyField")} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} rows={6} />
      <Button type="submit" loading={pending}>
        {t("alumni.shareSend")}
      </Button>
    </form>
  );
}
