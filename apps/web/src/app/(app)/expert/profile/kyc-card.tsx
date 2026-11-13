"use client";

import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { IdentificationCardIcon } from "@phosphor-icons/react";
import { expertKycSchema, uploadResultSchema, EXPERT_KYC_MAX_DOCUMENTS, type ExpertKyc } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TextAreaField } from "@/components/ui/field";
import { FilePicker, DOCUMENT_TYPES } from "@/components/ui/file-picker";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import { formatBytes } from "@/lib/json";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const STATUS_KEY: Record<ExpertKyc["status"], TranslationKey> = { NONE: "expert.kycStatusNONE", SUBMITTED: "expert.kycStatusSUBMITTED", VERIFIED: "expert.kycStatusVERIFIED", REJECTED: "expert.kycStatusREJECTED" };
const STATUS_TONE: Record<ExpertKyc["status"], "neutral" | "warn" | "ok" | "danger"> = { NONE: "neutral", SUBMITTED: "warn", VERIFIED: "ok", REJECTED: "danger" };

/** A refusal's sentence from the API envelope, or the fallback. */
async function refusalText(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string; issues?: Record<string, string> } | null;
  const issue = body?.issues ? Object.values(body.issues)[0] : undefined;
  return issue ?? body?.error ?? fallback;
}

/**
 * The expert's identity papers: where they stand, and the way to send them.
 * The files go through POST /api/v1/uploads one by one (the ticket pipeline:
 * an id the server will accept only from the person who uploaded it) and the
 * ids go to POST /api/v1/expert/kyc with a note. A verified expert has
 * nothing to send and sees the standing alone.
 */
export function KycCard({ initial }: { initial: ExpertKyc }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [kyc, setKyc] = useState(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [fileError, setFileError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (files.length === 0) {
      setError(t("expert.kycChooseFirst"));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const documentIds: string[] = [];
      for (const file of files) {
        const body = new FormData();
        body.set("file", file);
        const uploaded = await fetch("/api/v1/uploads", { method: "POST", body });
        if (!uploaded.ok) throw new Error(await refusalText(uploaded, t("expert.kycDidNotSend")));
        documentIds.push(uploadResultSchema.parse(await uploaded.json()).fileId);
      }
      const sent = await fetch("/api/v1/expert/kyc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentIds, note }) });
      if (!sent.ok) throw new Error(await refusalText(sent, t("expert.kycDidNotSend")));
      setKyc(expertKycSchema.parse(await sent.json()));
      setFiles([]);
      setNote("");
      toast({ tone: "ok", title: t("expert.kycSent") });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("expert.kycDidNotSend"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card data-testid="expert-kyc">
      <CardHeader icon={<IdentificationCardIcon weight="duotone" className="size-5" />} title={t("expert.kycTitle")} description={t("expert.kycBody")} />
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[kyc.status]} size="sm">
            {t(STATUS_KEY[kyc.status])}
          </Badge>
          {kyc.submittedAt && <span className="text-xs text-fg-muted">{t("expert.kycSubmittedOn", { date: formatDate(new Date(kyc.submittedAt)) })}</span>}
          {kyc.decidedAt && <span className="text-xs text-fg-muted">{t("expert.kycDecidedOn", { date: formatDate(new Date(kyc.decidedAt)) })}</span>}
        </div>
        {kyc.note && kyc.status !== "SUBMITTED" && <p className="text-sm text-fg">{t("expert.kycOperatorNote", { note: kyc.note })}</p>}
        {kyc.documents.length > 0 && (
          <ul className="space-y-1 text-sm text-fg-muted">
            {kyc.documents.map((d, i) => (
              <li key={d.fileId} className="flex flex-wrap items-center gap-2">
                <a href={`/api/files/${encodeURIComponent(d.fileId)}`} target="_blank" rel="noreferrer noopener" className="font-medium text-accent hover:underline">
                  {t("expert.kycOpenDocument", { n: i + 1 })}
                </a>
                <span>{d.mime}</span>
                <span>{formatBytes(d.size)}</span>
              </li>
            ))}
          </ul>
        )}
        {kyc.canSubmit && (
          <div className="space-y-3">
            <FilePicker
              idPrefix="kyc"
              files={files}
              max={EXPERT_KYC_MAX_DOCUMENTS}
              accept={DOCUMENT_TYPES}
              label={t("expert.kycDocuments")}
              hint={t("expert.kycDocumentCount", { count: files.length, max: EXPERT_KYC_MAX_DOCUMENTS })}
              error={fileError}
              onChange={(next, problem) => {
                setFiles(next);
                setFileError(problem);
              }}
            />
            <TextAreaField label={t("expert.kycYourNote")} hint={t("expert.kycYourNoteHint")} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} />
            {error && (
              <p role="alert" className="text-sm font-medium text-danger">
                {error}
              </p>
            )}
            <Button type="button" loading={busy} onClick={() => void send()} data-testid="kyc-send">
              {kyc.status === "NONE" ? t("expert.kycSend") : t("expert.kycResend")}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
