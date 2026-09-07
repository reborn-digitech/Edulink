"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, DeviceMobileIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { formatPhone, normalisePhone } from "@/lib/phone";
import { sendMobileCode, confirmMobile, clearMobile } from "./actions";

/**
 * The number this account signs in with, and gets a reset code on.
 *
 * TWO STEPS, BECAUSE THE NUMBER IS A CREDENTIAL DESTINATION. Typing it is a
 * claim; the code coming back is the proof. Nothing is stored in between — see
 * `startPhoneChange` — so a mistyped digit costs one text to a stranger and
 * then nothing, rather than pointing this person's reset codes at them forever.
 *
 * SHOWS THE NORMALISED FORM AS THEY TYPE. `98765 43210` reading back as
 * `+91 98765 43210` in front of somebody is the cheapest way to say what will
 * be stored — and it is the number they will later type into a login box, on a
 * phone, from memory.
 */
export function MobileForm({
  current,
  confirmed,
}: {
  current: string | null;
  confirmed: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState<"idle" | "code">("idle");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [hint, setHint] = useState("");
  const [error, setError] = useState<string | null>(null);

  const normalised = normalisePhone(value);

  function send(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await sendMobileCode(value);
      if (!result.ok) {
        setError(result.error ?? t("account.didNotSend"));
        return;
      }
      setHint(result.hint ?? "");
      setStep("code");
    });
  }

  function confirm(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await confirmMobile(code);
      if (!result.ok) {
        setError(result.error ?? t("account.didNotWork"));
        return;
      }
      toast({
        tone: "ok",
        title: t("account.mobileConfirmedTitle"),
        description: t("account.mobileConfirmedBody"),
      });
      setStep("idle");
      setValue("");
      setCode("");
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await clearMobile();
      toast({ tone: "ok", title: t("account.mobileRemoved") });
      setValue("");
      router.refresh();
    });
  }

  /* ------------------------------------------------------ waiting for a code */
  if (step === "code") {
    return (
      <form onSubmit={confirm} className="space-y-3" noValidate>
        <p className="rounded-[--radius-md] border border-border bg-surface-muted px-3 py-2.5 text-sm leading-relaxed text-fg">
          {/* One sentence with a placeholder — see the matching note in
              `EmailForm`. */}
          {t("account.mobileCodeSent", { digits: hint })}
          {/* Said plainly: nothing has changed yet, so a wrong number costs
              nothing but one text. */}
          <span className="mt-1 block text-xs text-fg-muted">
            {t("account.unchangedUntilCode")}
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
      {current && (
        <p className="flex flex-wrap items-center gap-2 rounded-[--radius-md] border border-border bg-surface-muted px-3 py-2.5 text-sm">
          <CheckCircleIcon weight="fill" className="size-4 shrink-0 text-ok" />
          <span className="font-medium text-fg">{formatPhone(current)}</span>
          <span className="text-xs text-fg-muted">
            {confirmed ? t("account.confirmedFlag") : t("account.notConfirmedFlag")}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto"
            disabled={pending}
            onClick={remove}
          >
            {t("common.remove")}
          </Button>
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

      <TextField
        // Always what it is, never "Change it" — see the matching note in
        // `EmailForm`. Two forms in one card make a bare "Change it" ambiguous.
        label={t("account.mobileNumber")}
        type="text"
        inputMode="tel"
        autoComplete="tel"
        placeholder="98765 43210"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        hint={
          value.trim().length === 0
            ? t("account.mobileHintEmpty")
            : normalised
              ? t("account.mobileHintNamed", { phone: formatPhone(normalised) })
              : t("account.mobileHintInvalid")
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {/* Names its channel — see the matching note in `EmailForm`. */}
        <Button type="submit" size="sm" loading={pending} disabled={!normalised}>
          {t("account.textMeCode")}
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <DeviceMobileIcon className="size-3.5" />
          {t("account.nothingSavedUntilCode")}
        </p>
      </div>
    </form>
  );
}
