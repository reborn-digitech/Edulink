"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, EnvelopeSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
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
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState<"idle" | "code">("idle");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function send(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await sendEmailCode(value);
      if (!result.ok) {
        setError(result.error ?? "That did not send.");
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
        setError(result.error ?? "That did not work.");
        return;
      }
      toast({
        tone: "ok",
        title: "Email address confirmed",
        description: "You can sign in with it, and get a reset code at it.",
      });
      setStep("idle");
      setValue("");
      setCode("");
      router.refresh();
    });
  }

  /* ------------------------------------------------------ waiting for a code */
  if (step === "code") {
    return (
      <form onSubmit={confirm} className="space-y-3" noValidate>
        <p className="rounded-[--radius-md] border border-border bg-surface-muted px-3 py-2.5 text-sm leading-relaxed text-fg">
          We sent a code to <strong className="break-all">{sentTo}</strong>. It expires in 10
          minutes.
          {/* Said plainly: nothing has moved yet, so a mistyped address costs
              one email to a stranger and then nothing. */}
          <span className="mt-1 block text-xs text-fg-muted">
            Your account is unchanged until you enter it.
          </span>
        </p>

        {error && (
          <p
            role="alert"
            className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
          >
            {error}
          </p>
        )}

        <TextField
          label="The code"
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
            Confirm
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
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  /* ------------------------------------------------------------------ normal */
  return (
    <form onSubmit={send} className="space-y-3" noValidate>
      {current && !isHandle && (
        <p className="flex flex-wrap items-center gap-2 rounded-[--radius-md] border border-border bg-surface-muted px-3 py-2.5 text-sm">
          {confirmed ? (
            <CheckCircleIcon weight="fill" className="size-4 shrink-0 text-ok" />
          ) : (
            <WarningCircleIcon weight="fill" className="size-4 shrink-0 text-warn" />
          )}
          <span className="min-w-0 break-all font-medium text-fg">{current}</span>
          <span className="text-xs text-fg-muted">
            {confirmed ? "confirmed" : "not confirmed"}
          </span>
        </p>
      )}

      {isHandle && (
        // The one state where the account has no address at all. Saying what
        // they lose — the name they have been typing — before they change it.
        <p className="rounded-[--radius-md] border border-border bg-surface-muted px-3 py-2.5 text-sm leading-relaxed text-fg">
          You sign in with the login name{" "}
          <code className="rounded bg-surface px-1.5 py-0.5 font-semibold">{loginName}</code>.
          <span className="mt-1 block text-xs text-fg-muted">
            Add an email address and you will sign in with that instead, and be able to reset your
            own password. Ask a parent or your teacher if you are not sure.
          </span>
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
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
        label="Email address"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        hint={
          value.trim().length === 0
            ? "We will email a code to check you can read it."
            : `We will email a code to ${value.trim().toLowerCase()} to check it is yours.`
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {/*
          NAMES ITS CHANNEL, because this card now holds two of these forms. A
          walkthrough put two identical green "Send me a code" buttons a
          centimetre apart, one under an address and one under a number, and
          neither said which was which. Saying "Email" and "Text" costs a word
          and removes the question.
        */}
        <Button type="submit" size="sm" loading={pending} disabled={value.trim().length === 0}>
          Email me a code
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <EnvelopeSimpleIcon className="size-3.5" />
          Nothing changes until the code comes back.
        </p>
      </div>
    </form>
  );
}
