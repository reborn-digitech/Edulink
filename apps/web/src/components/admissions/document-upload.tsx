"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { ArrowSquareOutIcon, PaperclipIcon } from "@phosphor-icons/react";
import type { ApplicationView } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DOCUMENT_TYPES, MAX_FILE_BYTES } from "@/components/ui/file-picker";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { formatDate } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import { formatBytes } from "@/lib/json";
import { uploadDocumentAction } from "@/app/(app)/parent/applications/actions";

type CycleDocument = ApplicationView["cycle"]["documents"][number];
type Attached = ApplicationView["documents"][number];

/**
 * The documents a cycle asks for, one row each: what is attached, when, and
 * a way to attach or replace it while the application is live and the
 * office has not yet checked them. Shared by the family's page and the
 * office's, because the office attaches a walk-in family's papers the same
 * way; the action decides whose hand is on the file. The size and type are
 * checked here only so a person is told before five megabytes go over a
 * school's connection — the server sniffs the bytes and decides.
 */
export function DocumentList({
  applicationId,
  documents,
  attached,
  missing,
  canUpload,
  verifiedAt,
}: {
  applicationId: string;
  documents: CycleDocument[];
  attached: Attached[];
  missing: string[];
  canUpload: boolean;
  verifiedAt: string | null;
}) {
  const t = useT();
  const nameOf = (key: string) =>
    documents.find((d) => d.key === key)?.name ?? key;
  // A file attached under a key the cycle has since dropped still shows: it is the family's paper.
  const orphaned = attached.filter(
    (a) => !documents.some((d) => d.key === a.key),
  );

  return (
    <div className="space-y-3">
      {verifiedAt ? (
        <p className="text-sm font-medium text-ok">
          {t("admissions.verifiedOn", {
            date: formatDate(new Date(verifiedAt)),
          })}
        </p>
      ) : missing.length > 0 ? (
        <p className="text-sm text-warn">
          {t("admissions.documentsMissing", {
            names: missing.map(nameOf).join(", "),
          })}
        </p>
      ) : documents.length > 0 ? (
        <p className="text-sm text-fg-muted">
          {t("admissions.documentsComplete")}
        </p>
      ) : null}
      <ul
        className="divide-y divide-border"
        data-testid="application-documents"
      >
        {documents.map((doc) => (
          <DocumentRow
            key={doc.key}
            applicationId={applicationId}
            doc={doc}
            file={attached.find((a) => a.key === doc.key) ?? null}
            canUpload={canUpload}
          />
        ))}
        {orphaned.map((file) => (
          <DocumentRow
            key={file.key}
            applicationId={applicationId}
            doc={{ key: file.key, name: file.key, required: false }}
            file={file}
            canUpload={false}
          />
        ))}
      </ul>
      {canUpload && (
        <p className="text-xs text-fg-muted">{t("admissions.documentsHint")}</p>
      )}
    </div>
  );
}

function DocumentRow({
  applicationId,
  doc,
  file,
  canUpload,
}: {
  applicationId: string;
  doc: CycleDocument;
  file: Attached | null;
  canUpload: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function send(picked: File | undefined) {
    if (!picked) return;
    setError(null);
    if (picked.size > MAX_FILE_BYTES) {
      setError(t("ui.biggerThan5MB", { name: picked.name }));
      return;
    }
    const body = new FormData();
    body.set("key", doc.key);
    body.set("file", picked);
    startTransition(async () => {
      const result = await uploadDocumentAction(applicationId, body);
      if (!result.ok) {
        setError(actionError(t, result, "ui.couldNotAttach"));
        return;
      }
      toast({ tone: "ok", title: t("admissions.attached") });
      router.refresh();
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1 basis-56">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-fg">{doc.name}</span>
          {doc.required ? (
            <Badge tone="warn" size="sm">
              {t("admissions.required")}
            </Badge>
          ) : (
            <Badge tone="neutral" size="sm">
              {t("admissions.optional")}
            </Badge>
          )}
        </p>
        {file ? (
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-fg-muted">
            <span className="truncate">{file.name}</span>
            <span>{formatBytes(file.size)}</span>
            <span>
              {t("admissions.uploadedOn", {
                date: formatDate(new Date(file.uploadedAt)),
              })}
            </span>
            <a
              href={`/api/files/${encodeURIComponent(file.fileId)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
            >
              {t("admissions.open")}
              <ArrowSquareOutIcon className="size-3.5" aria-hidden="true" />
            </a>
          </p>
        ) : null}
        {error && (
          <p role="alert" className="mt-1 text-xs font-medium text-danger">
            {error}
          </p>
        )}
      </div>
      {canUpload && (
        <span className="shrink-0">
          <Button
            type="button"
            variant={file ? "ghost" : "secondary"}
            size="sm"
            loading={pending}
            icon={<PaperclipIcon weight="bold" />}
            onClick={() => inputRef.current?.click()}
            data-testid={`attach-${doc.key}`}
          >
            {file ? t("admissions.replace") : t("admissions.upload")}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={DOCUMENT_TYPES}
            aria-label={[
              file ? t("admissions.replace") : t("admissions.upload"),
              doc.name,
            ].join(": ")}
            className="sr-only"
            onChange={(e) => {
              send(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </span>
      )}
    </li>
  );
}
