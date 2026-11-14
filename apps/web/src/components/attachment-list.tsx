"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { FileIcon, FilePdfIcon, ImageIcon, PaperclipIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatBytes, type Attachment } from "@/lib/json";
import { attachToAssignment, attachToSubmission, detach } from "@/app/(app)/attachments/actions";
import { useT } from "@/lib/i18n";
import { ACTION_BODY_LIMIT_MB, ACTION_FILES_MAX_BYTES } from "@/lib/action-body-limit";

/**
 * Attachment strip with upload.
 *
 * The same component serves teachers (on an assignment) and students (on their
 * own submission); which server action runs is decided by `target`, and each of
 * those re-checks permission independently. The component never decides who may
 * do what — it only decides what to render.
 */
export function AttachmentList({
  target,
  assignmentId,
  recordId,
  attachments,
  canEdit,
  className,
}: {
  target: "assignment" | "submission";
  /** Needed to upload; the record may not exist yet for a submission. */
  assignmentId: string;
  /** Needed to detach; null when nothing has been uploaded yet. */
  recordId: string | null;
  attachments: Attachment[];
  canEdit: boolean;
  className?: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function upload(files: FileList) {
    // The files travel inside one server action, which Next refuses above its body limit before the action runs, with
    // nothing said about size (TA-134): the total is checked here and refused in words.
    if (Array.from(files).reduce((sum, f) => sum + f.size, 0) > ACTION_FILES_MAX_BYTES) {
      setError(t("ui.filesTooBigTogether", { size: ACTION_BODY_LIMIT_MB }));
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.append("assignmentId", assignmentId);
    for (const file of Array.from(files)) formData.append("files", file);

    startTransition(async () => {
      const result =
        target === "assignment"
          ? await attachToAssignment(formData)
          : await attachToSubmission(formData);

      if (!result.ok) {
        setError(result.error ?? t("ui.couldNotAttach"));
        return;
      }
      toast({
        tone: "ok",
        title: files.length === 1 ? t("ui.fileAttached") : t("ui.filesAttached", { count: files.length }),
      });
      router.refresh();
    });
  }

  if (attachments.length === 0 && !canEdit) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {attachments.length > 0 && (
        <ul className="space-y-1.5">
          {attachments.map((attachment) => (
            <li
              key={attachment.fileId}
              className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-border bg-surface p-2.5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-surface-muted text-fg-muted">
                <KindIcon mime={attachment.mime} />
              </span>

              <a
                href={`/api/files/${attachment.fileId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1"
              >
                <span className="block truncate text-sm font-medium text-fg hover:underline">
                  {attachment.name}
                </span>
                <span className="block text-xs text-fg-muted">
                  {formatBytes(attachment.size)}
                </span>
              </a>

              {canEdit && recordId && (
                <button
                  type="button"
                  disabled={pending}
                  aria-label={t("ui.removeFile", { name: attachment.name })}
                  className="tap grid shrink-0 place-items-center rounded-full text-fg-subtle hover:text-danger disabled:opacity-50"
                  onClick={() =>
                    startTransition(async () => {
                      const result = await detach({
                        target,
                        id: recordId,
                        fileId: attachment.fileId,
                      });
                      toast(
                        result.ok
                          ? { tone: "neutral", title: t("ui.removed") }
                          : { tone: "danger", title: t("ui.couldNotRemove"), description: result.error },
                      );
                      router.refresh();
                    })
                  }
                >
                  <XIcon weight="bold" className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}

      {canEdit && (
        <>
          <Button
            size="sm"
            variant="ghost"
            loading={pending}
            icon={<PaperclipIcon weight="bold" />}
            onClick={() => inputRef.current?.click()}
          >
            {attachments.length === 0 ? t("ui.attachFile") : t("ui.attachAnother")}
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            className="sr-only"
            // The button above names and opens it; the input itself stays out of the tab order and the tree (axe `label`).
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              if (e.target.files?.length) upload(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-fg-subtle">{t("ui.attachHint")}</p>
        </>
      )}
    </div>
  );
}

function KindIcon({ mime }: { mime: string }) {
  if (mime === "application/pdf") return <FilePdfIcon className="size-5" />;
  if (mime.startsWith("image/")) return <ImageIcon className="size-5" />;
  return <FileIcon className="size-5" />;
}
