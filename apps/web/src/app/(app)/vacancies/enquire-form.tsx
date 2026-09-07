"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { askAboutVacancy } from "./actions";
import { useT } from "@/lib/i18n";
import { actionError } from "@/lib/action-error";

/** The composer on a vacancy page. Teachers of other schools only — the
 *  page only renders it for them. */
export function EnquireForm({
  schoolId,
  postingId,
}: {
  schoolId: string;
  postingId: string;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) {
    return <p className="text-sm font-medium text-success">{t("vacancies.enquireSent")}</p>;
  }

  return (
    <div className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder={t("vacancies.enquirePlaceholder")}
        className="w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg"
      />
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      <Button
        size="sm"
        loading={pending}
        disabled={body.trim().length === 0}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await askAboutVacancy(schoolId, postingId, body);
            if (!result.ok) {
              setError(actionError(t, result, "common.somethingWrong"));
              return;
            }
            setSent(true);
            router.refresh();
          })
        }
      >
        {t("vacancies.enquireCta")}
      </Button>
    </div>
  );
}
