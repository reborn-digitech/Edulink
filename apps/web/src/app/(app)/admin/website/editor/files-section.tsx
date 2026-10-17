"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FilePdfIcon } from "@phosphor-icons/react";
import type { SiteConfig } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { formatBytes } from "@/lib/json";
import { draftFileUses, fileUseText, SITE_FACILITY_NAME, type SITE_FILE_USE_KEY } from "@/lib/site-content";
import { deleteSiteFileAction } from "../actions";
import type { EditorFile } from "./types";

/**
 * THE FILES PANEL (website-three, 17 October 2026): every picture and PDF uploaded for the site, newest first, with the
 * count against the most a site keeps, and where each is used — read from the draft the editor holds now (so a picture
 * just taken off a page shows as free before the save) and from the live site as the server said at the page's load. An
 * unused file can be deleted after a confirm; the server refuses, naming where, while the saved draft or the live site
 * still uses it. A picture of a post is the post's and is not listed here.
 */
export function FilesSection({ draft, files, max, when, onDeleted }: { draft: SiteConfig; files: EditorFile[]; max: number; when: (iso: string) => string; onDeleted: (fileId: string) => void }) {
  const t = useT();
  const uses = useMemo(() => draftFileUses(draft, (code) => t(SITE_FACILITY_NAME[code])), [draft, t]);
  return (
    <Card data-testid="site-files">
      <CardHeader title={t("siteThree.filesTitle")} description={t("siteThree.filesIntro")} />
      <CardBody className="space-y-4">
        <p className="text-sm font-medium text-fg" data-testid="site-files-count">
          {t("siteThree.filesCount", { count: files.length, max })}
        </p>
        {files.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("siteThree.filesNone")}</p>
        ) : (
          <ul className="space-y-3">
            {files.map((f) => {
              const used = [...(uses.get(f.fileId) ?? []), ...(f.usedBy ?? []).filter((u) => u.use === "LIVE")];
              return <FileRow key={f.fileId} file={f} used={used} when={when} onDeleted={onDeleted} />;
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function FileRow({ file, used, when, onDeleted }: { file: EditorFile; used: { use: keyof typeof SITE_FILE_USE_KEY; label: string }[]; when: (iso: string) => string; onDeleted: (fileId: string) => void }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const remove = () => {
    if (!window.confirm(t("siteThree.fileDeleteConfirm", { name: file.name || file.fileId }))) return;
    start(async () => {
      const r = await deleteSiteFileAction(file.fileId);
      if (!r.ok) {
        setError(r.error ?? t("common.tryAgain"));
        return;
      }
      setError(null);
      onDeleted(file.fileId);
      toast({ tone: "ok", title: t("siteThree.fileDeleted") });
      router.refresh();
    });
  };
  return (
    <li className="grid gap-3 rounded-[var(--radius-md)] border border-border p-3 sm:grid-cols-[5rem_minmax(0,1fr)]" data-site-file={file.fileId}>
      {file.kind === "IMAGE" ? (
        // eslint-disable-next-line @next/next/no-img-element -- a stored file through the file route, sized by ?w
        <img src={`/api/files/${encodeURIComponent(file.fileId)}?w=320`} alt="" className="aspect-square w-20 rounded-[var(--radius-sm)] object-cover" />
      ) : (
        <span className="flex aspect-square w-20 items-center justify-center rounded-[var(--radius-sm)] bg-surface-muted" aria-hidden="true">
          <FilePdfIcon className="size-8 text-fg-muted" />
        </span>
      )}
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-semibold text-fg">{file.name || file.fileId}</p>
        <p className="text-xs text-fg-muted">{[file.kind === "PDF" ? t("siteThree.kindPdf") : t("siteThree.kindPicture"), formatBytes(file.size), t("siteThree.uploadedAt", { when: when(file.createdAt) })].join(" · ")}</p>
        {used.length ? (
          <p className="text-sm text-fg">
            {t("siteThree.usedOn", { where: used.map((u) => fileUseText(t, u)).join(", ") })}
          </p>
        ) : (
          <Badge tone="outline">{t("siteThree.unused")}</Badge>
        )}
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="pt-1">
          <Button type="button" size="sm" variant="secondary" loading={pending} disabled={used.length > 0} onClick={remove}>
            {t("siteThree.fileDelete")}
          </Button>
          {used.length ? <span className="ml-2 text-xs text-fg-muted">{t("siteThree.fileInUseHint")}</span> : null}
        </div>
      </div>
    </li>
  );
}
