"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CheckCircleIcon, HandHeartIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { claimChild } from "@/app/join/actions";
import { GUARDIAN_RELATIONS } from "@/lib/constants";
import { useT } from "@/lib/i18n";

/**
 * ⚠ NOT CAUGHT BY `npm run i18n`, and worth saying so where somebody will read
 * it. The audit reads JSX text and reader-facing props; these are values in a
 * lookup table, so they were invisible to it and would have stayed English
 * inside an otherwise Marathi form. Keys, resolved at render.
 */
const RELATION_KEYS = {
  PARENT: "parent.relationParent",
  GUARDIAN: "parent.relationGuardian",
  OTHER: "parent.relationOther",
} as const;

export function ClaimChildForm({
  className,
  hasChildren,
}: {
  className?: string;
  hasChildren: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [studentCode, setStudentCode] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [relation, setRelation] = useState("PARENT");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [linked, setLinked] = useState<{ name: string; schoolName: string } | null>(null);

  function formatCode(raw: string): string {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    // Student codes are STU-XXXX-XXXX.
    const body = clean.startsWith("STU") ? clean.slice(3) : clean;
    const parts = [body.slice(0, 4), body.slice(4, 8)].filter(Boolean);
    return parts.length > 0 ? `STU-${parts.join("-")}` : clean;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    const next: Record<string, string> = {};
    if (studentCode.replace(/[^A-Z0-9]/g, "").length < 6) {
      next.studentCode = "Enter the full student code.";
    }
    if (!birthdate) next.birthdate = "Enter their date of birth.";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    startTransition(async () => {
      const result = await claimChild({ studentCode, birthdate, relation });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setLinked(result.child!);
      router.refresh();
    });
  }

  if (linked) {
    return (
      <div className={cn("rounded-[--radius-lg] border border-border bg-surface p-6 text-center", className)}>
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-ok-soft text-ok animate-confetti">
          <CheckCircleIcon weight="fill" className="size-10" />
        </div>
        <h2 className="text-xl font-bold text-fg">{t("parent.youreLinkedTo", { name: linked.name })}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-fg-muted">
          {t("parent.canNowSeeAt", { school: linked.schoolName })}
        </p>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <Button
            block
            variant="secondary"
            onClick={() => {
              setLinked(null);
              setStudentCode("");
              setBirthdate("");
            }}
          >
            {t("parent.linkAnother")}
          </Button>
          <Button block onClick={() => router.push("/parent")} iconRight={<ArrowRightIcon weight="bold" />}>
            {t("parent.seeDashboard")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn("space-y-5", className)} noValidate>
      {errors._form && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      <TextField
        label={t("parent.studentCode")}
        required
        autoFocus
        autoComplete="off"
        spellCheck={false}
        placeholder="STU-4KDF-3MQ7"
        value={studentCode}
        error={errors.studentCode}
        onChange={(e) => setStudentCode(formatCode(e.target.value))}
        className="[&_input]:font-mono [&_input]:text-lg [&_input]:tracking-widest"
        hint={t("parent.codeHint")}
      />

      <DateField
        label={t("parent.dateOfBirth")}
        required
        value={birthdate}
        error={errors.birthdate}
        onChange={(e) => setBirthdate(e.target.value)}
        hint={t("parent.dobHint")}
      />

      <SelectField
        label={t("parent.youAreTheir")}
        value={relation}
        onChange={(e) => setRelation(e.target.value)}
      >
        {GUARDIAN_RELATIONS.map((r) => (
          <option key={r} value={r}>
            {t(RELATION_KEYS[r as keyof typeof RELATION_KEYS])}
          </option>
        ))}
      </SelectField>

      <Button
        type="submit"
        block
        size="lg"
        loading={pending}
        icon={<HandHeartIcon weight="bold" />}
      >
        {pending ? t("parent.checkingLink") : t("parent.linkToMyChild")}
      </Button>

      {!hasChildren && (
        <p className="rounded-[--radius-md] bg-surface-muted p-4 text-xs leading-relaxed text-fg-muted">
          Cannot find the code? The school can link you directly — they will see your
          request as soon as you ask them. Nothing about your child is visible to you
          until a link exists.
        </p>
      )}
    </form>
  );
}
