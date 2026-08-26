"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { post } from "../actions";
import { useT } from "@/lib/i18n";
import { actionError } from "@/lib/action-error";
import { useToast } from "@/components/ui/toast";
import { EMPLOYMENT_TYPES } from "@/lib/constants";

const TYPE_KEYS = {
  FULL_TIME: "vacancies.typeFullTime",
  PART_TIME: "vacancies.typePartTime",
  TEMPORARY: "vacancies.typeTemporary",
} as const;

export function NewVacancyForm({
  candidates,
  defaultContactId,
}: {
  candidates: { membershipId: string; name: string; role: string }[];
  defaultContactId: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subjects, setSubjects] = useState("");
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [contactId, setContactId] = useState(
    // The select must show what will be submitted: a default that the
    // deduped candidate list does not carry falls back to the first option.
    candidates.some((c) => c.membershipId === defaultContactId)
      ? defaultContactId
      : (candidates[0]?.membershipId ?? ""),
  );
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "mt-1 w-full rounded-[--radius-md] border border-border bg-surface px-3 py-2 text-sm text-fg";

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-fg">
        {t("vacancies.titleLabel")}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("vacancies.titlePlaceholder")}
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium text-fg">
        {t("vacancies.bodyLabel")}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder={t("vacancies.bodyPlaceholder")}
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-medium text-fg">
        {t("vacancies.subjectsLabel")}
        <input
          type="text"
          value={subjects}
          onChange={(e) => setSubjects(e.target.value)}
          placeholder={t("vacancies.subjectsHint")}
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-fg">
          {t("vacancies.typeLabel")}
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className={inputClass}
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(TYPE_KEYS[type])}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-fg">
          {t("vacancies.contactLabel")}
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className={inputClass}
          >
            {candidates.map((candidate) => (
              <option key={candidate.membershipId} value={candidate.membershipId}>
                {candidate.name}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs font-normal text-fg-muted">
            {t("vacancies.contactHint")}
          </span>
        </label>
      </div>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <Button
        loading={pending}
        disabled={title.trim().length === 0 || body.trim().length === 0}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await post({
              title,
              body,
              subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
              employmentType,
              hiringContactMembershipId: contactId,
            });
            if (!result.ok) {
              setError(actionError(t, result, "common.somethingWrong"));
              return;
            }
            toast({ tone: "ok", title: t("vacancies.posted") });
            router.push("/admin/vacancies");
          })
        }
      >
        {t("vacancies.postCta")}
      </Button>
    </div>
  );
}
