"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field-class";
import { saveProfile, setPublished } from "./actions";
import { useT } from "@/lib/i18n";
import { actionError } from "@/lib/action-error";
import { useToast } from "@/components/ui/toast";

export function DirectoryForm({
  initialAbout,
  initialContactId,
  contactStillValid,
  published,
  candidates,
}: {
  initialAbout: string;
  initialContactId: string | null;
  contactStillValid: boolean;
  published: boolean;
  candidates: { membershipId: string; name: string; role: string }[];
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [about, setAbout] = useState(initialAbout);
  const [contactId, setContactId] = useState(initialContactId ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-fg">
        {t("explore.aboutLabel")}
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={6}
          placeholder={t("explore.aboutHint")}
          className={fieldClass("mt-1")}
        />
      </label>

      <label className="block text-sm font-medium text-fg">
        {t("explore.contactLabel")}
        <select value={contactId} onChange={(e) => setContactId(e.target.value)} className={fieldClass("mt-1")}>
          <option value="">{t("explore.noContact")}</option>
          {candidates.map((candidate) => (
            <option key={candidate.membershipId} value={candidate.membershipId}>
              {candidate.name}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs font-normal text-fg-muted">
          {t("explore.contactHint")}
        </span>
      </label>

      {initialContactId && !contactStillValid && (
        <p className="text-sm font-medium text-warning">{t("explore.contactGoneWarning")}</p>
      )}

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await saveProfile({
                about,
                admissionsContactMembershipId: contactId || null,
              });
              if (!result.ok) {
                setError(actionError(t, result, "common.somethingWrong"));
                return;
              }
              toast({ tone: "ok", title: t("explore.saved") });
              router.refresh();
            })
          }
        >
          {t("explore.saveCta")}
        </Button>

        <Button
          variant="secondary"
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              // PUBLISHING saves first, so it acts on the words and the
              // contact on screen rather than the last saved ones.
              // UNPUBLISHING deliberately does not: a cleared contact plus
              // save-first would trip the published-needs-a-contact rule on
              // the way OUT of the directory, which is exactly backwards.
              if (!published) {
                const saved = await saveProfile({
                  about,
                  admissionsContactMembershipId: contactId || null,
                });
                if (!saved.ok) {
                  setError(actionError(t, saved, "common.somethingWrong"));
                  return;
                }
              }
              const result = await setPublished(!published);
              if (!result.ok) {
                setError(actionError(t, result, "common.somethingWrong"));
                return;
              }
              toast({
                tone: "ok",
                title: published ? t("explore.unpublished") : t("explore.published"),
              });
              router.refresh();
            })
          }
        >
          {published ? t("explore.unpublishCta") : t("explore.publishCta")}
        </Button>
      </div>
    </div>
  );
}
