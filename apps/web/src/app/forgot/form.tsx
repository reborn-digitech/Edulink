"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTiltIcon, LockKeyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { identifierKind } from "@/lib/phone";
import { requestReset, completeReset } from "../login/actions";
import { useT } from "@/lib/i18n";

/**
 * Two steps on one page, and the identifier is typed once.
 *
 * ONE SCREEN RATHER THAN TWO ROUTES, because the second step needs the first
 * step's identifier and a route boundary would mean either carrying it in a URL
 * or asking for it again. Asking twice is how somebody types a different number
 * the second time and gets a refusal they cannot explain.
 *
 * THE CODE FIELD IS NOT REVEALED BY WHETHER AN ACCOUNT EXISTS. It appears
 * because a request was made, not because one was found — the server reports
 * the same thing either way, and showing this step conditionally would put the
 * enumeration oracle back in the UI after the server had carefully avoided it.
 */
export function ForgotForm({
  className,
  initialIdentifier = "",
}: {
  className?: string;
  initialIdentifier?: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState<"ask" | "code">("ask");
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sentTo, setSentTo] = useState<{ channel: "EMAIL" | "PHONE"; hint: string } | null>(null);

  function send(event?: React.FormEvent) {
    event?.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await requestReset({ identifier });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      setSentTo({ channel: result.channel ?? "EMAIL", hint: result.hint ?? "" });
      setStep("code");
    });
  }

  function finish(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await completeReset({ identifier, code, password });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      toast({
        tone: "ok",
        title: t("forgot.passwordChanged"),
        description: t("forgot.passwordChangedBody"),
      });
      router.push(result.redirectTo ?? "/login");
      router.refresh();
    });
  }

  if (step === "code") {
    return (
      <form onSubmit={finish} className={cn("space-y-4", className)} noValidate>
        <div className="rounded-[--radius-md] border border-border bg-surface-muted p-4">
          <div className="mb-2 grid size-10 place-items-center rounded-full bg-accent-soft text-accent-strong">
            <PaperPlaneTiltIcon weight="duotone" className="size-5" />
          </div>
          {/*
            "IF AN ACCOUNT EXISTS" IS NOT HEDGING, it is the whole sentence. The
            server does not tell this page whether one was found, and the hint
            below is the last four digits of what the READER typed — never of
            anything we hold.
          */}
          {/* ⚠ ONE SENTENCE WITH A PLACEHOLDER, not a clause with a bolded
              fragment spliced into the middle of it. The English version put
              "If an account exists for" before the address and ", a six-digit
              code is on its way" after — an order neither Hindi nor Marathi
              uses. */}
          <p className="text-sm leading-relaxed text-fg">
            {t("forgot.codeSent", {
              who:
                sentTo?.channel === "PHONE" && sentTo.hint
                  ? t("forgot.numberEnding", { digits: sentTo.hint })
                  : identifier,
            })}
          </p>
        </div>

        {errors._form && (
          <p
            role="alert"
            className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
          >
            {errors._form}
          </p>
        )}

        <TextField
          label={t("forgot.theCode")}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          placeholder={t("forgot.codePlaceholder")}
          value={code}
          error={errors.code}
          onChange={(e) => setCode(e.target.value)}
        />

        <TextField
          label={t("forgot.newPassword")}
          type="password"
          autoComplete="new-password"
          required
          value={password}
          error={errors.password}
          onChange={(e) => setPassword(e.target.value)}
          hint={t("forgot.newPasswordHint")}
        />

        <Button type="submit" block size="lg" loading={pending} icon={<LockKeyIcon weight="bold" />}>
          {t("forgot.setNewPassword")}
        </Button>

        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <button
            type="button"
            onClick={() => {
              setStep("ask");
              setCode("");
              setErrors({});
            }}
            className="font-medium text-fg-muted underline underline-offset-4 hover:text-fg"
          >
            {t("forgot.useDifferent")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => send()}
            className="font-medium text-accent-strong underline underline-offset-4 disabled:opacity-50"
          >
            {t("forgot.sendAnother")}
          </button>
        </div>
      </form>
    );
  }

  const kind = identifierKind(identifier);

  return (
    <form onSubmit={send} className={cn("space-y-4", className)} noValidate>
      {errors._form && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      <TextField
        label={t("forgot.identifierLabel")}
        // Not type="email" or type="tel": one box takes both, and either
        // built-in validation would refuse half of what is valid here.
        type="text"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        autoFocus
        placeholder={t("forgot.identifierPlaceholder")}
        value={identifier}
        error={errors.identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        hint={
          identifier.trim().length === 0
            ? t("forgot.hintEmpty")
            : kind === "PHONE"
              ? t("forgot.hintPhone")
              : kind === "EMAIL"
                ? t("forgot.hintEmail")
                : /* A pupil's handle has no address and no number attached to
                     it, so there is nowhere to send a code. Said here rather
                     than after they press the button and nothing arrives. */
                  t("forgot.hintHandle")
        }
      />

      <Button
        type="submit"
        block
        size="lg"
        loading={pending}
        disabled={identifier.trim().length === 0}
        icon={<PaperPlaneTiltIcon weight="bold" />}
      >
        {t("forgot.sendMeCode")}
      </Button>
    </form>
  );
}
