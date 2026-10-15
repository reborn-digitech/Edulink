"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { removeDomainAction, saveDomainAction, verifyDomainAction } from "./actions";

type Result = { ok: true } | { ok: false; error: string };

/** The one field: the school's own domain, typed as a name (website-builder B, 15 Oct 2026). */
export function DomainForm({ current }: { current: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [domain, setDomain] = useState(current);
  const [error, setError] = useState<string | undefined>(undefined);
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(undefined);
        startTransition(async () => {
          const result: Result = await saveDomainAction(domain);
          if (!result.ok) return void setError(result.error);
          toast({ tone: "ok", title: t("siteDomains.saved") });
          router.refresh();
        });
      }}
    >
      <TextField
        label={t("siteDomains.fieldLabel")}
        hint={t("siteDomains.fieldHint")}
        error={error}
        name="domain"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        inputMode="url"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={300}
        required
        className="min-w-64 flex-1"
        data-testid="site-domain-field"
      />
      <Button type="submit" loading={pending} disabled={!domain.trim() || domain.trim().toLowerCase() === current}>
        {t("siteDomains.save")}
      </Button>
    </form>
  );
}

/** Verify and Remove, for the domain the page shows. */
export function DomainActions({ domain, subdomain }: { domain: string; subdomain: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [which, setWhich] = useState<"verify" | "remove" | null>(null);

  const run = (kind: "verify" | "remove", act: () => Promise<Result>, done: string) => {
    setWhich(kind);
    startTransition(async () => {
      const result = await act();
      setWhich(null);
      if (!result.ok) return void toast({ tone: "danger", title: result.error });
      toast({ tone: "ok", title: done });
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" loading={pending && which === "verify"} disabled={pending} onClick={() => run("verify", () => verifyDomainAction(domain), t("siteDomains.verified"))} data-testid="site-domain-verify">
        {t("siteDomains.verify")}
      </Button>
      <Button
        type="button"
        variant="secondary"
        loading={pending && which === "remove"}
        disabled={pending}
        onClick={() => {
          if (!window.confirm(t("siteDomains.confirmRemove", { domain, subdomain }))) return;
          run("remove", () => removeDomainAction(domain), t("siteDomains.removed"));
        }}
        data-testid="site-domain-remove"
      >
        {t("siteDomains.remove")}
      </Button>
    </div>
  );
}
