"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileIcon, FilePdfIcon, ImageIcon, PaperclipIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatBytes, type Attachment } from "@/lib/json";
import { attachToAssignment, attachToSubmission, detach } from "@/app/(app)/attachments/actions";

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
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function upload(files: FileList) {
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
        setError(result.error ?? "Could not attach that.");
        return;
      }
      toast({
        tone: "ok",
        title: files.length === 1 ? "File attached" : `${files.length} files attached`,
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
              className="flex items-center gap-2.5 rounded-[--radius-md] border border-border bg-surface p-2.5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-[--radius-sm] bg-surface-muted text-fg-muted">
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
                  aria-label={`Remove ${attachment.name}`}
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
                          ? { tone: "neutral", title: "Removed" }
                          : { tone: "danger", title: "Could not remove it", description: result.error },
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
            {attachments.length === 0 ? "Attach a file" : "Attach another"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.length) upload(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-fg-subtle">
            Images or PDFs, up to 5 MB each, 5 files in total.
          </p>
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
