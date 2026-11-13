"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { askAboutAdmission } from "./actions";
import { useT } from "@/lib/i18n";
import { actionError } from "@/lib/action-error";
import { fieldClass } from "@/components/ui/field-class";

/** The admissions composer on a school's profile page. Parents only — the
 *  page only renders it for them. */
export function EnquireForm({ schoolId }: { schoolId: string }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent) {
    return <p className="text-sm font-medium text-success">{t("explore.enquireSent")}</p>;
  }

  return (
    <div className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder={t("explore.enquirePlaceholder")}
        className={fieldClass()}
      />
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      <Button
        size="sm"
        loading={pending}
        disabled={body.trim().length === 0}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await askAboutAdmission(schoolId, body);
            if (!result.ok) {
              setError(actionError(t, result, "common.somethingWrong"));
              return;
            }
            setSent(true);
            router.refresh();
          })
        }
      >
        {t("explore.enquireCta")}
      </Button>
    </div>
  );
}
