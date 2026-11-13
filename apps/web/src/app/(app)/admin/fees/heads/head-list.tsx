"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { FEE_HEAD_KINDS, type FeeHeadKind } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { HEAD_KIND_KEY } from "../labels";
import { retireHeadAction, saveHeadAction } from "./actions";
import { TableScroll } from "@/components/ui/table-scroll";

export type HeadRow = { id: string; name: string; code: string; kind: FeeHeadKind; sortOrder: number; retired: boolean; inUse: boolean };

type Draft = { id?: string; name: string; code: string; kind: FeeHeadKind; sortOrder: string };
const blank = (): Draft => ({ name: "", code: "", kind: "TUITION", sortOrder: "" });

/**
 * The fee heads, with one inline form that is either "add" or "edit" — a
 * head is four fields, and a page per head would be a door to a sentence.
 * Retiring keeps the head on every structure line it is already on; only
 * the picker loses it.
 */
export function HeadList({ heads }: { heads: HeadRow[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft | null>(heads.length === 0 ? blank() : null);
  const [error, setError] = useState<string | null>(null);

  function edit(head: HeadRow) {
    setError(null);
    setDraft({ id: head.id, name: head.name, code: head.code, kind: head.kind, sortOrder: String(head.sortOrder) });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setError(null);
    if (draft.name.trim().length < 2) {
      setError(t("fees.refuseHeadName"));
      return;
    }
    if (draft.code.trim().length < 2) {
      setError(t("fees.refuseHeadCode"));
      return;
    }
    const sortOrder = draft.sortOrder.trim() === "" ? undefined : Number.parseInt(draft.sortOrder, 10);
    startTransition(async () => {
      const result = await saveHeadAction({ id: draft.id, name: draft.name.trim(), code: draft.code.trim(), kind: draft.kind, sortOrder: Number.isFinite(sortOrder) ? sortOrder : undefined });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("fees.settingsSaved") });
      setDraft(null);
      router.refresh();
    });
  }

  function retire(head: HeadRow) {
    startTransition(async () => {
      const result = await retireHeadAction(head.id, head.retired);
      if (!result.ok) {
        toast({ tone: "danger", title: actionError(t, result, "common.tryAgain") });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {heads.length === 0 ? (
        <p className="py-4 text-center text-sm text-fg-muted">{t("fees.headsEmpty")}</p>
      ) : (
        <TableScroll>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">{t("fees.headName")}</th>
                <th className="py-2 pr-3 font-medium">{t("fees.headCode")}</th>
                <th className="py-2 pr-3 font-medium">{t("fees.headKind")}</th>
                <th className="py-2 pr-3 text-right font-medium">{t("fees.headOrder")}</th>
                <th className="py-2 text-right font-medium">
                  <span className="sr-only">{t("common.edit")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {heads.map((head) => (
                <tr key={head.id} className={head.retired ? "text-fg-muted" : ""}>
                  <td className="py-2.5 pr-3">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-fg">{head.name}</span>
                      {head.retired && <Badge tone="neutral" size="sm">{t("fees.headRetired")}</Badge>}
                      {head.inUse && <Badge tone="info" size="sm">{t("fees.headInUse")}</Badge>}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-xs">{head.code}</td>
                  <td className="py-2.5 pr-3">{t(HEAD_KIND_KEY[head.kind] ?? "fees.headKindOther")}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{head.sortOrder}</td>
                  <td className="py-2.5 text-right">
                    <span className="flex justify-end gap-1">
                      {!head.retired && (
                        <Button size="sm" variant="ghost" onClick={() => edit(head)} disabled={pending}>
                          {t("common.edit")}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => retire(head)} disabled={pending}>
                        {head.retired ? t("fees.headRestore") : t("fees.headRetire")}
                      </Button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      )}

      {draft ? (
        <form onSubmit={submit} noValidate className="space-y-4 rounded-[var(--radius-md)] border border-border bg-surface-muted p-4">
          {error && (
            <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t("fees.headName")} required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <TextField label={t("fees.headCode")} required maxLength={8} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} />
            <SelectField label={t("fees.headKind")} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as FeeHeadKind })}>
              {FEE_HEAD_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {t(HEAD_KIND_KEY[kind]!)}
                </option>
              ))}
            </SelectField>
            <TextField label={t("fees.headOrder")} type="number" inputMode="numeric" min={0} max={999} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })} placeholder={t("common.optional")} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={pending}>
              {t("fees.headSave")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDraft(null)} disabled={pending}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" icon={<PlusIcon weight="bold" />} onClick={() => { setError(null); setDraft(blank()); }}>
          {t("fees.headAdd")}
        </Button>
      )}
    </div>
  );
}
