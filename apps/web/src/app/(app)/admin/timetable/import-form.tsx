"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { CheckCircleIcon, UploadSimpleIcon, WarningIcon, XCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { readSpreadsheet, SPREADSHEET_ACCEPT } from "@/lib/spreadsheet-client";
import { actionError } from "@/lib/action-error";
import { useLocale, useT } from "@/lib/i18n";
import { weekdayName } from "@/lib/school-day";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { TimetableImportPreview } from "@/lib/timetable";
import { previewImport, runImport } from "./actions";
import { fieldClass } from "@/components/ui/field-class";

const EXAMPLE = "day,period,class,subject,teacher,room\nMonday,1,Class 5 A,Maths,rao@example.com,12\nMonday,2,Class 5 A,English,Mrs Khan,12";

/**
 * The whole timetable at once, from the spreadsheet the school already has.
 * Previewed by the server's own resolver — the one the write re-runs — so
 * what the office sees against each line is what will happen: a lesson
 * placed, a lesson placed without its teacher (with why), or a line that
 * cannot be placed at all.
 */
export function ImportForm() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<TimetableImportPreview | null>(null);

  async function readFile(file: File) {
    if (file.size > 2 * 1024 * 1024) return setError(t("invites.fileTooBig"));
    const content = await readSpreadsheet(file);
    if (content === null) return setError(t("invites.fileUnreadable"));
    setText(content);
    setPreview(null);
    setError(null);
  }

  function check(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!text.trim()) return;
    startTransition(async () => {
      const result = await previewImport(text);
      if (!result.ok || !result.preview) return setError(actionError(t, result, "common.tryAgain"));
      setPreview(result.preview);
    });
  }

  function write() {
    setError(null);
    startTransition(async () => {
      const result = await runImport(text);
      if (!result.ok || !result.result) return setError(actionError(t, result, "common.tryAgain"));
      const r = result.result;
      toast({
        tone: r.written > 0 ? "ok" : "warn",
        title: r.written > 0 ? t("officeBulk.timetableWritten", { count: r.written, classes: r.classes }) : t("officeBulk.timetableNothingToWrite"),
        description: r.unstaffed > 0 ? t("officeBulk.timetableWrittenUnstaffed", { count: r.unstaffed }) : undefined,
      });
      setText("");
      setPreview(null);
      router.refresh();
    });
  }

  const unstaffed = preview ? preview.rows.filter((r) => !r.teacherMembershipId).length : 0;
  const replaces = preview ? preview.rows.filter((r) => r.replaces).length : 0;

  return (
    <form onSubmit={check} noValidate className="space-y-4" data-testid="timetable-import">
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="timetable-sheet" className="block text-sm font-medium text-fg">
            {t("officeBulk.timetableImportLabel")}
          </label>
          <Button type="button" size="sm" variant="ghost" icon={<UploadSimpleIcon weight="bold" />} onClick={() => fileRef.current?.click()}>
            {t("invites.uploadCsv")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept={SPREADSHEET_ACCEPT}
            aria-label={t("invites.uploadCsv")}
            className="sr-only"
            // Opened by the Upload button beside it: no tab stop of its own that nothing shows focus on (TA-506).
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void readFile(file);
              e.target.value = "";
            }}
          />
        </div>
        <textarea
          id="timetable-sheet"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPreview(null);
          }}
          rows={8}
          placeholder={EXAMPLE}
          className={fieldClass("mt-1.5 font-mono leading-relaxed text-sm")}
        />
        <p className="mt-1 text-xs text-fg-muted">{t("officeBulk.timetableImportColumns")}</p>
      </div>

      {preview && (
        <div className="space-y-2.5 rounded-[var(--radius-md)] border border-border bg-surface-muted p-3.5" data-testid="timetable-import-preview">
          <p className="text-sm font-semibold text-fg">
            {t("officeBulk.timetableReady", { count: preview.rows.length })}
            {replaces > 0 && <span className="text-fg-muted"> · {t("officeBulk.timetableReplaces", { count: replaces })}</span>}
            {unstaffed > 0 && <span className="text-warn"> · {t("officeBulk.timetableWithoutTeacher", { count: unstaffed })}</span>}
            {preview.problems.length > 0 && <span className="text-danger"> · {t("invites.needALook", { count: preview.problems.length })}</span>}
          </p>
          {preview.rows.length > 0 && (
            <ul className="space-y-1">
              {preview.rows.slice(0, 12).map((row) => (
                <li key={row.line} className="flex items-center gap-2 text-xs">
                  {row.teacherIssueKey ? <WarningIcon weight="fill" className="size-3.5 shrink-0 text-warn" /> : <CheckCircleIcon weight="fill" className="size-3.5 shrink-0 text-ok" />}
                  <span className="font-mono text-fg-muted">{t("invites.line", { line: row.line })}</span>
                  <span className="truncate text-fg">
                    {weekdayName(row.weekday, locale)} · {row.periodName} · {row.className} · {row.subject}
                    {row.teacherName ? ` · ${row.teacherName}` : ""}
                  </span>
                  <span className="ml-auto shrink-0 text-fg-muted">
                    {row.teacherIssueKey ? `${t(row.teacherIssueKey as TranslationKey, row.teacherIssueVars)} · ${t("officeBulk.timetableNoTeacherNote")}` : row.replaces ? t("officeBulk.timetableReplacesNote") : ""}
                  </span>
                </li>
              ))}
              {preview.rows.length > 12 && <li className="text-xs text-fg-muted">{t("invites.andMore", { count: preview.rows.length - 12 })}</li>}
            </ul>
          )}
          {preview.problems.length > 0 && (
            <ul className="space-y-1">
              {preview.problems.slice(0, 8).map((problem) => (
                <li key={`${problem.line}-${problem.reasonKey}`} className="flex items-center gap-2 text-xs">
                  <XCircleIcon weight="fill" className="size-3.5 shrink-0 text-danger" />
                  <span className="font-mono text-fg-muted">{t("invites.line", { line: problem.line })}</span>
                  <span className="truncate text-fg">{problem.value || t("invites.blankRow")}</span>
                  <span className="ml-auto shrink-0 text-fg-muted">{t(problem.reasonKey as TranslationKey, problem.reasonVars)}</span>
                </li>
              ))}
              {preview.problems.length > 8 && <li className="text-xs text-fg-muted">{t("invites.andMore", { count: preview.problems.length - 8 })}</li>}
            </ul>
          )}
          {preview.rows.length === 0 && <Badge tone="warn">{t("officeBulk.timetableNothingToWrite")}</Badge>}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="secondary" loading={pending && !preview} disabled={!text.trim()}>
          {t("officeBulk.timetablePreview")}
        </Button>
        {preview && preview.rows.length > 0 && (
          <Button type="button" loading={pending} onClick={write}>
            {preview.rows.length === 1 ? t("officeBulk.timetableWriteOne") : t("officeBulk.timetableWriteMany", { count: preview.rows.length })}
          </Button>
        )}
      </div>
    </form>
  );
}
