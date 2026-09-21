"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SealCheckIcon } from "@phosphor-icons/react";
import type { CertificateKind } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { issueAction } from "../actions";

type PupilOption = { id: string; name: string; code: string | null; className: string | null };
type TemplateOption = { id: string; name: string; kind: CertificateKind };

/**
 * The issue form. The pupil and the template are in the URL — changing
 * either reloads the page so the server can say what the record lacks for
 * that pupil — and the purpose, remark and leaving date are this form's
 * own. Issue lands on the document, numbered and frozen.
 */
export function IssueForm({ pupils, templates, selectedId, templateId, query }: { pupils: PupilOption[]; templates: TemplateOption[]; selectedId: string; templateId: string; query: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [purpose, setPurpose] = useState("");
  const [remark, setRemark] = useState("");
  const [leftOn, setLeftOn] = useState("");
  const [error, setError] = useState<string | null>(null);

  const template = templates.find((x) => x.id === templateId) ?? null;
  const leaving = template?.kind === "TC" || template?.kind === "NIRGAM";

  function relocate(next: { membershipId?: string; templateId?: string }) {
    const params = new URLSearchParams();
    const membershipId = next.membershipId ?? selectedId;
    const tpl = next.templateId ?? templateId;
    if (membershipId) params.set("membershipId", membershipId);
    if (tpl) params.set("templateId", tpl);
    if (query) params.set("q", query);
    router.replace(`/admin/certificates/issue?${params.toString()}`);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!selectedId || !templateId) {
      setError(t("common.checkTheForm"));
      return;
    }
    startTransition(async () => {
      const result = await issueAction({
        templateId,
        studentMembershipId: selectedId,
        ...(purpose.trim() ? { purpose: purpose.trim().slice(0, 200) } : {}),
        ...(remark.trim() ? { remark: remark.trim().slice(0, 400) } : {}),
        ...(leaving && leftOn ? { leftOn } : {}),
      });
      if (!result.ok || !result.id) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("certificates.issuedDone", { serial: result.serial ?? "" }) });
      router.push(`/certificates/${result.id}?from=${encodeURIComponent("/admin/certificates/issued")}`);
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4" data-testid="issue-form">
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label={t("certificates.pupil")} required value={selectedId} onChange={(e) => relocate({ membershipId: e.target.value })} data-testid="issue-pupil">
          <option value="">—</option>
          {pupils.map((p) => (
            <option key={p.id} value={p.id}>
              {[p.name, p.className, p.code].filter(Boolean).join(" · ")}
            </option>
          ))}
        </SelectField>
        <SelectField label={t("certificates.template")} required value={templateId} onChange={(e) => relocate({ templateId: e.target.value })} data-testid="issue-template">
          {templates.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </SelectField>
      </div>
      <TextField label={t("certificates.purpose")} hint={t("certificates.purposeHint")} value={purpose} maxLength={200} autoComplete="off" onChange={(e) => setPurpose(e.target.value)} />
      <TextAreaField label={t("certificates.remark")} rows={2} value={remark} maxLength={400} onChange={(e) => setRemark(e.target.value)} />
      {leaving && <DateField label={t("certificates.leftOn")} hint={t("certificates.leftOnHint")} value={leftOn} onChange={(e) => setLeftOn(e.target.value)} className="max-w-xs" />}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pending} disabled={!selectedId || !templateId} icon={<SealCheckIcon weight="bold" />} data-testid="issue-submit">
          {t("certificates.issue")}
        </Button>
      </div>
    </form>
  );
}
