"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { removeGatewayAction, saveGatewayAction } from "./actions";

/**
 * The school's own Razorpay keys. The two secrets go in as password fields
 * and are sealed on the server; the page shows the key id and nothing
 * else afterwards. Without a sealing key on the server the form is not
 * drawn at all — the page says why instead.
 */
export function GatewayForm({ hasGateway }: { hasGateway: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!hasGateway);
  const [keyId, setKeyId] = useState("");
  const [secret, setSecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [mode, setMode] = useState<"TEST" | "LIVE">("TEST");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^rzp_(test|live)_[A-Za-z0-9]{6,40}$/.test(keyId.trim())) return setError(t("fees.refuseKeyId"));
    if (secret.trim().length < 8 || webhookSecret.trim().length < 8) return setError(t("fees.refuseSecrets"));
    startTransition(async () => {
      const result = await saveGatewayAction({ keyId: keyId.trim(), secret: secret.trim(), webhookSecret: webhookSecret.trim(), mode });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("fees.settingsSaved") });
      setKeyId("");
      setSecret("");
      setWebhookSecret("");
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removeGatewayAction();
      if (!result.ok) {
        toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: t("fees.gatewayOff") });
      setEditing(true);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setEditing(true)} disabled={pending}>
          {t("common.edit")}
        </Button>
        <Button variant="danger" loading={pending} onClick={remove}>
          {t("fees.gatewayRemove")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("fees.gatewayKeyId")} required autoComplete="off" value={keyId} onChange={(e) => setKeyId(e.target.value)} />
        <SelectField label={t("fees.gatewayMode")} value={mode} onChange={(e) => setMode(e.target.value as "TEST" | "LIVE")}>
          <option value="TEST">{t("fees.gatewayTest")}</option>
          <option value="LIVE">{t("fees.gatewayLive")}</option>
        </SelectField>
        <TextField label={t("fees.gatewaySecret")} required type="password" autoComplete="new-password" value={secret} onChange={(e) => setSecret(e.target.value)} />
        <TextField label={t("fees.gatewayWebhookSecret")} required type="password" autoComplete="new-password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending}>
          {t("fees.gatewaySave")}
        </Button>
        {hasGateway && (
          <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
            {t("common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
