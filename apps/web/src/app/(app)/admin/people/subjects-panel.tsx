"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { setSubjects } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { fieldClass } from "@/components/ui/field-class";

/**
 * The office's editor for what a teacher teaches, opened from the row's kebab.
 * Same chips idiom as the invite form where the teacher first chose them —
 * this is the other end of that decision, and it feeds the subject-aware
 * cover suggestions the moment it is saved.
 */
export function SubjectsPanel({
  membershipId,
  name,
  initial,
  onClose,
}: {
  membershipId: string;
  name: string;
  initial: string[];
  onClose: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [subjects, setLocal] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add() {
    const value = draft.trim().replace(/\s+/g, " ");
    setDraft("");
    if (!value) return;
    if (subjects.some((s) => s.toLowerCase() === value.toLowerCase())) return;
    if (subjects.length >= 20) return;
    setLocal([...subjects, value]);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await setSubjects(membershipId, subjects);
      if (!result.ok) {
        setError(actionError(t, result, "people.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t("reviews.subjectsSaved") });
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="w-full rounded-[var(--radius-md)] border border-border bg-surface-muted p-3">
      <p className="text-sm font-semibold text-fg">{t("reviews.subjectsFor", { name })}</p>

      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          autoFocus
          maxLength={60}
          placeholder={t("reviews.addSubject")}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          className={fieldClass()}
        />
        <Button size="sm" variant="ghost" onClick={add}>
          {t("common.add")}
        </Button>
      </div>

      {subjects.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {subjects.map((subject) => (
            <li key={subject}>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-fg">
                {subject}
                <button
                  type="button"
                  aria-label={`${t("common.remove")} — ${subject}`}
                  onClick={() => setLocal(subjects.filter((s) => s !== subject))}
                  className="text-fg-muted hover:text-danger"
                >
                  <XIcon weight="bold" className="size-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button size="sm" loading={pending} onClick={save}>
          {t("common.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
