"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DeviceMobileIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { formatPhone, normalisePhone } from "@/lib/phone";
import { saveMobile } from "./actions";

/**
 * The number this account can sign in with, and be sent a reset code on.
 *
 * SHOWS THE NORMALISED FORM BACK, live, as they type. `98765 43210` becoming
 * `+91 98765 43210` in front of somebody is the cheapest possible way to say
 * "this is what we will store" — and the number they will later type into a
 * login box, on a phone, from memory. A field that silently reformats on save
 * teaches nobody anything.
 */
export function MobileForm({ current }: { current: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(current ? formatPhone(current) : "");
  const [error, setError] = useState<string | null>(null);

  const normalised = normalisePhone(value);
  const dirty = (normalised ?? "") !== (current ?? "");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveMobile(value);
      if (!result.ok) {
        setError(result.error ?? "That did not save.");
        return;
      }
      toast({
        tone: "ok",
        title: result.phone ? "Mobile number saved" : "Mobile number removed",
        description: result.phone
          ? "You can sign in with it, and we can send a reset code to it."
          : undefined,
      });
      setValue(result.phone ? formatPhone(result.phone) : "");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      {error && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <TextField
        label="Mobile number"
        type="text"
        inputMode="tel"
        autoComplete="tel"
        placeholder="98765 43210"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        hint={
          value.trim().length === 0
            ? "Optional. Add one and you can sign in with it, and get a reset code by text."
            : normalised
              ? `Saved as ${formatPhone(normalised)}`
              : "That does not look like a mobile number yet."
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" loading={pending} disabled={!dirty || (value.trim().length > 0 && !normalised)}>
          {value.trim().length === 0 && current ? "Remove it" : "Save"}
        </Button>
        {/* Said plainly rather than implied by a missing tick. Anybody can type
            a number they do not hold, and a reset code goes to whatever is
            here — so the person who owns the account should know that nothing
            has confirmed it. */}
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <DeviceMobileIcon className="size-3.5" />
          Not confirmed by code yet — anyone could type any number here.
        </p>
      </div>
    </form>
  );
}
