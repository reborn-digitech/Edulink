"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, EnvelopeSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { sendEmailCode, confirmEmail } from "./actions";

/**
 * The address this account signs in with, and gets a reset code at.
 *
 * ⚠ UNTIL THIS EXISTED THERE WAS NO WAY TO CHANGE ONE. An address arrived when
 * the account was created and stayed forever, so a family that moved email
 * provider had an account whose password reset went somewhere they could not
 * read — which is an account they cannot recover. The route was a merge or a
 * phone call to the school.
 *
 * DELIBERATELY THE SAME TWO STEPS AS `MobileForm`, down to the sentence under
 * the button. Typing is a claim; the code coming back is the proof; nothing is
 * stored in between. Somebody who has already changed their number should
 * recognise this screen rather than have to read it.
 *
 * THE PUPIL CASE IS DIFFERENT AND SAYS SO. A child who joined with a class code
 * has a login handle in the address column — `amara.k4f9@edulink.local` — which
 * is not an address and cannot receive anything. For them this is not "change
 * your email" but "add one", and adding it replaces the handle they have been
 * typing, which is worth saying out loud before they do it.
 */
export function EmailForm({
  current,
  confirmed,
  isHandle,
  loginName,
}: {
  current: string | null;
  confirmed: boolean;
  /** True when `current` is a class-code handle rather than a real address. */
  isHandle: boolean;
  /** The handle without its domain — what the child actually types to sign in. */
  loginName: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState<"idle" | "code">("idle");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  // The current password, asked for once per change: a live session is not
  // proof of the person, and this is where reset codes will go.
  const [password, setPassword] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function send(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await sendEmailCode(value, password);
      if (!result.ok) {
        setError(result.error ?? t("account.didNotSend"));
        return;
      }
      setSentTo(result.sentTo ?? value.trim().toLowerCase());
      setStep("code");
    });
  }

  function confirm(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await confirmEmail(code);
      if (!result.ok) {
        setError(result.error ?? t("account.didNotWork"));
        return;
      }
      toast({
        tone: "ok",
        title: t("account.emailConfirmedTitle"),
        description: t("account.emailConfirmedBody"),
      });
      setStep("idle");
      setValue("");
      setCode("");
      setPassword("");
      router.refresh();
    });
  }

  /* ------------------------------------------------------ waiting for a code */
  if (step === "code") {
    return (
      <form onSubmit={confirm} className="space-y-3" noValidate>
        <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 py-2.5 text-sm leading-relaxed text-fg">
          {/* One sentence with a placeholder, not fragments around a <strong> —
              Hindi and Marathi put the address elsewhere in the sentence. */}
          {t("account.emailCodeSent", { email: sentTo })}
          {/* Said plainly: nothing has moved yet, so a mistyped address costs
              one email to a stranger and then nothing. */}
          <span className="mt-1 block text-xs text-fg-muted">
            {t("account.unchangedUntilCode")}
          </span>
        </p>

        {error && (
          <p
            role="alert"
            className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
          >
            {error}
          </p>
        )}

        <TextField
          label={t("account.theCode")}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" loading={pending} disabled={code.trim().length === 0}>
            {t("common.confirm")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setStep("idle");
              setCode("");
              setError(null);
            }}
          >
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    );
  }

  /* ------------------------------------------------------------------ normal */
  return (
    <form onSubmit={send} className="space-y-3" noValidate>
      {current && !isHandle && (
        <p className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 py-2.5 text-sm">
          {confirmed ? (
            <CheckCircleIcon weight="fill" className="size-4 shrink-0 text-ok" />
          ) : (
            <WarningCircleIcon weight="fill" className="size-4 shrink-0 text-warn" />
          )}
          <span className="min-w-0 break-all font-medium text-fg">{current}</span>
          <span className="text-xs text-fg-muted">
            {confirmed ? t("account.confirmedFlag") : t("account.notConfirmedFlag")}
          </span>
        </p>
      )}

      {isHandle && (
        // The one state where the account has no address at all. Saying what
        // they lose — the name they have been typing — before they change it.
        <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 py-2.5 text-sm leading-relaxed text-fg">
          {/* Whole sentence with a placeholder; the <code> styling on the name
              went with the fragments, the way bold did on the invitation. */}
          {t("account.signInWithLoginName", { name: loginName })}
          <span className="mt-1 block text-xs text-fg-muted">
            {t("account.addEmailExplainer")}
          </span>
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      {/*
        The label always says WHAT it is, never "Change it". With two of these
        forms stacked in one card, a field labelled "Change it" does not say
        change what — and the current value is already shown above it.
      */}
      <TextField
        label={t("account.emailAddress")}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={t("join.genericEmailPlaceholder")}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        hint={
          value.trim().length === 0
            ? t("account.emailHintEmpty")
            : t("account.emailHintNamed", { email: value.trim().toLowerCase() })
        }
      />

      <TextField
        label={t("account.currentPassword")}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint={t("account.currentPasswordHint")}
      />

      <div className="flex flex-wrap items-center gap-2">
        {/*
          NAMES ITS CHANNEL, because this card now holds two of these forms. A
          walkthrough put two identical green "Send me a code" buttons a
          centimetre apart, one under an address and one under a number, and
          neither said which was which. Saying "Email" and "Text" costs a word
          and removes the question.
        */}
        <Button type="submit" size="sm" loading={pending} disabled={value.trim().length === 0 || password.length === 0}>
          {t("account.emailMeCode")}
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <EnvelopeSimpleIcon className="size-3.5" />
          {t("account.nothingChangesUntilCode")}
        </p>
      </div>
    </form>
  );
}
