"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatBps, formatPaise, parsePercentBps, parseRupees } from "@edulink/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { FEE_CONCESSION_KINDS, type FeeConcessionKind } from "@/lib/constants";
import { useLocale, useT } from "@/lib/i18n";
import { CONCESSION_KIND_KEY } from "../../labels";
import { grantConcessionAction, revokeConcessionAction } from "./actions";

export type ConcessionRow = { id: string; headId: string | null; headName: string | null; kind: string; value: number; reason: string; grantedBy: string; revoked: boolean };

/**
 * Concessions: a percentage or a fixed amount, on one head or on every
 * head. The value is typed as a percent or in rupees and sent as basis
 * points or paise; the open instalments are recalculated on grant and on
 * revoke, and the paid ones stay exactly as they were.
 */
export function ConcessionsPanel({ studentMembershipId, concessions, heads, office }: { studentMembershipId: string; concessions: ConcessionRow[]; heads: { id: string; name: string }[]; office: boolean }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<FeeConcessionKind>("PERCENT");
  const [value, setValue] = useState("");
  const [headId, setHeadId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = kind === "PERCENT" ? parsePercentBps(value) : parseRupees(value);
    if (parsed === null || parsed <= 0) return setError(kind === "PERCENT" ? t("fees.refusePercent") : t("fees.refuseAmount"));
    if (reason.trim().length < 3) return setError(t("fees.refuseReason"));
    startTransition(async () => {
      const result = await grantConcessionAction({ studentMembershipId, headId: headId || null, kind, value: parsed, reason: reason.trim() });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("fees.concessionDone") });
      setAdding(false);
      setValue("");
      setReason("");
      router.refresh();
    });
  }

  function revoke(id: string) {
    startTransition(async () => {
      const result = await revokeConcessionAction(studentMembershipId, id);
      if (!result.ok) {
        toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
        return;
      }
      router.refresh();
    });
  }

  const describe = (c: ConcessionRow) => (c.kind === "PERCENT" ? formatBps(c.value) : formatPaise(c.value, locale));

  return (
    <div className="space-y-4">
      {concessions.length === 0 ? (
        <p className="py-4 text-center text-sm text-fg-muted">{t("ui.noneShort")}</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {concessions.map((c) => (
            <li key={c.id} className={`flex flex-wrap items-center justify-between gap-2 py-2 ${c.revoked ? "text-fg-muted line-through" : ""}`}>
              <span className="min-w-0 flex-1">
                <span className="font-medium text-fg">
                  {describe(c)} · {c.headName ?? t("fees.allHeads")}
                </span>
                <span className="block text-xs text-fg-muted">
                  {c.reason} · {c.grantedBy}
                </span>
              </span>
              {c.revoked ? (
                <Badge tone="neutral" size="sm">{t("fees.concessionRevoked")}</Badge>
              ) : (
                office && (
                  <Button size="sm" variant="ghost" onClick={() => revoke(c.id)} disabled={pending}>
                    {t("fees.concessionRevoke")}
                  </Button>
                )
              )}
            </li>
          ))}
        </ul>
      )}

      {office &&
        (adding ? (
          <form onSubmit={submit} noValidate className="space-y-3 rounded-[var(--radius-md)] border border-border bg-surface-muted p-3">
            {error && (
              <p role="alert" className="text-sm font-medium text-danger">
                {error}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField label={t("fees.concessionKind")} value={kind} onChange={(e) => setKind(e.target.value as FeeConcessionKind)}>
                {FEE_CONCESSION_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(CONCESSION_KIND_KEY[k]!)}
                  </option>
                ))}
              </SelectField>
              <TextField label={kind === "PERCENT" ? t("fees.concessionValuePercent") : t("fees.concessionValueAmount")} required inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
              <SelectField label={t("fees.concessionHead")} value={headId} onChange={(e) => setHeadId(e.target.value)}>
                <option value="">{t("fees.allHeads")}</option>
                {heads.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </SelectField>
              <TextField label={t("fees.concessionReason")} required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" loading={pending}>
                {t("fees.concessionGo")}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)} disabled={pending}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
            {t("fees.concessionTitle")}
          </Button>
        ))}
    </div>
  );
}
