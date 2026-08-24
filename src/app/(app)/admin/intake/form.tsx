"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  DownloadSimpleIcon,
  UploadSimpleIcon,
  UserPlusIcon,
  WarningIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { parseIntakeCsv, toCsv } from "@/lib/csv";
import { formatDateKey } from "@/lib/dates";
import { runIntake, type IntakeState } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import type { IntakeOutcome } from "@/lib/intake";
import { FIRST_SIGNIN_TTL_DAYS } from "@/lib/first-signin-constants";

const EXAMPLE =
  "name,date of birth,class,guardian email,guardian name,relation,student code\n" +
  "Aarav Patel,14/06/2019,Class 1,rekha.patel@example.com,Rekha Patel,parent,\n" +
  "Meera Joshi,02/11/2019,Class 1,sunil.joshi@example.com,Sunil Joshi,parent,\n" +
  // A TRANSFER row: the code from the previous school's leaving certificate
  // links the child's existing account instead of minting a second one.
  "Gita Kale,13/03/2013,Class 8,,,,STU-7K2M-9QDX";

/**
 * The admission list, previewed by the same parser the server runs, so what
 * the office sees before pressing Admit is what happens. The result is a
 * table, not a toast: each child's student code and handle is something
 * the office will be asked for, and it is offered as a download because a
 * list of thirty codes is not a thing anyone copies off a screen.
 */
export function IntakeForm({
  classNames,
  today,
  className,
}: {
  classNames: string[];
  today: string;
  className?: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<IntakeState | null>(null);

  const preview = useMemo(() => (text.trim() ? parseIntakeCsv(text, today) : null), [text, today]);
  const known = useMemo(() => new Set(classNames.map((n) => n.trim().toLowerCase())), [classNames]);

  async function readFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setError(t("invites.fileTooBig"));
      return;
    }
    setText(await file.text());
    setError(null);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const outcome = await runIntake({ csv: text });
      if (!outcome.ok) {
        setError(outcome.errorKey ? t(outcome.errorKey, outcome.errorVars) : actionError(t, outcome, "common.somethingWrong"));
        setState(outcome.problems.length > 0 ? outcome : null);
        return;
      }
      setState(outcome);
      router.refresh();
      if (outcome.result && outcome.result.admitted > 0) {
        toast({
          tone: "ok",
          title:
            outcome.result.admitted === 1
              ? t("intake.admittedOne")
              : t("intake.admittedMany", { count: outcome.result.admitted }),
        });
      }
    });
  }

  function download(outcomes: IntakeOutcome[]) {
    const rows = outcomes.map((o) => ({
      line: o.line,
      name: o.name,
      outcome: t(`intake.${o.status}` as const),
      reason: o.reasonKey ? t(o.reasonKey) : "",
      class: o.className ?? "",
      "student code": o.studentCode ?? "",
      "sign-in handle": o.handle ?? "",
      "sign-in code": o.firstSignInCode ?? "",
      guardian: o.guardian ? t(guardianKey(o.guardian)) : "",
    }));
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admitted-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (state?.ok && state.result) {
    const { result } = state;
    const admitted = result.outcomes.filter((o) => o.status === "admitted");
    const others = result.outcomes.filter((o) => o.status !== "admitted");
    return (
      <div className={cn("space-y-4", className)}>
        <div className="rounded-[--radius-lg] border border-border bg-surface p-6 text-center">
          {result.admitted > 0 ? (
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-ok-soft text-ok animate-confetti">
              <CheckCircleIcon weight="fill" className="size-10" />
            </div>
          ) : (
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-warn-soft text-warn">
              <WarningIcon weight="fill" className="size-10" />
            </div>
          )}
          <h2 className="text-xl font-bold text-fg">
            {result.admitted === 1 ? t("intake.admittedOne") : t("intake.admittedMany", { count: result.admitted })}
          </h2>
          {result.guardiansInvited > 0 && (
            <p className="mt-1 text-sm font-medium text-fg">{result.guardiansInvited === 1 ? t("intake.guardiansInvitedOne") : t("intake.guardiansInvited", { count: result.guardiansInvited })}</p>
          )}
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">{t("intake.doneBody")}</p>
          {admitted.some((o) => o.firstSignInCode) && (
            <p className="mx-auto mt-1 max-w-md text-sm font-medium text-warn">{t("firstSignin.intakeNote", { days: FIRST_SIGNIN_TTL_DAYS })}</p>
          )}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button block variant="secondary" icon={<DownloadSimpleIcon weight="bold" />} onClick={() => download(result.outcomes)}>
              {t("intake.downloadResult")}
            </Button>
            <Button
              block
              variant="secondary"
              onClick={() => {
                setState(null);
                setText("");
              }}
            >
              {t("intake.admitMore")}
            </Button>
            <Button block onClick={() => router.push("/admin/people?role=STUDENT")}>
              {t("intake.seePeople")}
            </Button>
          </div>
        </div>

        {admitted.length > 0 && (
          <div className="overflow-x-auto rounded-[--radius-lg] border border-border bg-surface">
            <table className="w-full text-sm" data-testid="intake-admitted">
              <thead className="bg-surface-muted text-left text-xs uppercase tracking-wide text-fg-muted">
                <tr>
                  <th className="px-3 py-2">{t("intake.colName")}</th>
                  <th className="px-3 py-2">{t("intake.colClass")}</th>
                  <th className="px-3 py-2">{t("intake.colStudentCode")}</th>
                  <th className="px-3 py-2">{t("intake.colHandle")}</th>
                  <th className="px-3 py-2">{t("firstSignin.colCode")}</th>
                  <th className="px-3 py-2">{t("intake.colGuardian")}</th>
                </tr>
              </thead>
              <tbody>
                {admitted.map((o) => (
                  <tr key={o.line} className="border-t border-border">
                    <td className="px-3 py-2 font-medium text-fg">
                      {o.name}
                      {o.linked && (
                        <span className="ml-2 align-middle"><Badge tone="info" size="sm">{t("intake.linkedBadge")}</Badge></span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-fg-muted">{o.className ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-fg">{o.studentCode}</td>
                    <td className="px-3 py-2 font-mono text-fg-muted">{o.handle ?? "—"}</td>
                    <td className="px-3 py-2 font-mono font-semibold tracking-wider text-fg">{o.firstSignInCode ?? "—"}</td>
                    <td className="px-3 py-2">
                      {o.guardian === "invited" ? (
                        <Badge tone="ok" size="sm">{t("intake.guardianInvited")}</Badge>
                      ) : o.guardian === "notSent" ? (
                        <span className="text-xs text-warn">
                          {t("intake.guardianNotSent")}
                          {o.guardianReasonKey ? ` · ${t(o.guardianReasonKey)}` : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-fg-subtle">{t("intake.guardianNone")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(others.length > 0 || state.problems.length > 0) && (
          <div className="rounded-[--radius-lg] border border-warn/40 bg-warn-soft p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-warn">
              <WarningIcon weight="fill" className="size-4" />
              {t("invites.notSent", { count: others.length + state.problems.length })}
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs">
              {state.problems.map((problem) => (
                <li key={`p-${problem.line}`} className="flex gap-2">
                  <span className="shrink-0 font-mono text-fg-muted">{t("invites.line", { line: problem.line })}</span>
                  <span className="truncate font-medium text-fg">{problem.value || t("invites.blankRow")}</span>
                  <span className="ml-auto shrink-0 text-fg-muted">{t(problem.reasonKey, problem.reasonVars)}</span>
                </li>
              ))}
              {others.map((o) => (
                <li key={`o-${o.line}`} className="flex gap-2">
                  <span className="shrink-0 font-mono text-fg-muted">{t("invites.line", { line: o.line })}</span>
                  <span className="truncate font-medium text-fg">{o.name}</span>
                  <span className="ml-auto shrink-0 text-fg-muted">{o.reasonKey ? t(o.reasonKey) : t(`intake.${o.status}` as const)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const unknownClasses = preview
    ? preview.valid.filter((r) => r.className && !known.has(r.className.toLowerCase()))
    : [];

  return (
    <form onSubmit={submit} className={cn("space-y-5", className)} noValidate>
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="intake-list" className="block text-sm font-medium text-fg">
            {t("intake.list")}
          </label>
          <Button type="button" size="sm" variant="ghost" icon={<UploadSimpleIcon weight="bold" />} onClick={() => fileRef.current?.click()}>
            {t("invites.uploadCsv")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void readFile(file);
              e.target.value = "";
            }}
          />
        </div>
        <textarea
          id="intake-list"
          data-testid="intake-list"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={EXAMPLE}
          className="mt-1.5 w-full rounded-[--radius-md] border border-border bg-surface p-3.5 font-mono text-sm leading-relaxed outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/40"
        />
        <p className="mt-1 text-xs text-fg-muted">{t("intake.columnsHelp")}</p>
      </div>

      {preview && (
        <div className="rounded-[--radius-md] border border-border bg-surface-muted p-3.5" data-testid="intake-preview">
          <p className="text-sm font-semibold text-fg">
            {t("intake.readyToAdmit", { count: preview.valid.length })}
            {preview.problems.length > 0 && (
              <span className="text-warn"> · {t("invites.needALook", { count: preview.problems.length })}</span>
            )}
          </p>
          {preview.valid.length > 0 && (
            <p className="mt-1 text-xs text-fg-muted">
              {t("intake.recognisedColumns", {
                columns: [
                  t("intake.colName"),
                  preview.recognised.birthdate && t("intake.colDob"),
                  preview.recognised.className && t("intake.colClass"),
                  preview.recognised.guardianEmail && t("intake.colGuardianEmail"),
                  preview.recognised.pupilEmail && t("intake.colPupilEmail"),
                ].filter(Boolean).join(", "),
              })}
              {" · "}
              {t("intake.withGuardian", { count: preview.valid.filter((r) => r.guardianEmail).length })}
              {" · "}
              {t("intake.withoutDob", { count: preview.valid.filter((r) => !r.birthdateKey).length })}
              {" · "}
              {t("intake.withoutClass", { count: preview.valid.filter((r) => !r.className).length })}
            </p>
          )}

          {preview.valid.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {preview.valid.slice(0, 8).map((row) => (
                <li key={row.line} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-fg">
                  {row.name}
                  {row.birthdateKey ? <span className="text-fg-muted"> · {formatDateKey(row.birthdateKey, { dateStyle: "medium" })}</span> : null}
                </li>
              ))}
              {preview.valid.length > 8 && (
                <li className="px-2.5 py-1 text-xs text-fg-muted">{t("invites.andMore", { count: preview.valid.length - 8 })}</li>
              )}
            </ul>
          )}

          {unknownClasses.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {unknownClasses.slice(0, 5).map((row) => (
                <li key={row.line} className="flex items-center gap-2 text-xs">
                  <WarningIcon weight="fill" className="size-3.5 shrink-0 text-warn" />
                  <span className="font-mono text-fg-muted">{t("invites.line", { line: row.line })}</span>
                  <span className="truncate text-fg">{row.className}</span>
                  <span className="ml-auto shrink-0 text-fg-muted">{t("intake.unknownClass")}</span>
                </li>
              ))}
            </ul>
          )}

          {preview.problems.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {preview.problems.slice(0, 5).map((problem) => (
                <li key={`${problem.line}-${problem.value}`} className="flex items-center gap-2 text-xs">
                  <XCircleIcon weight="fill" className="size-3.5 shrink-0 text-danger" />
                  <span className="font-mono text-fg-muted">{t("invites.line", { line: problem.line })}</span>
                  <span className="truncate text-fg">{problem.value || t("invites.blankRow")}</span>
                  <span className="ml-auto shrink-0 text-fg-muted">{t(problem.reasonKey, problem.reasonVars)}</span>
                </li>
              ))}
              {preview.problems.length > 5 && (
                <li className="text-xs text-fg-muted">{t("invites.andMore", { count: preview.problems.length - 5 })}</li>
              )}
            </ul>
          )}
        </div>
      )}

      <Button
        type="submit"
        block
        size="lg"
        loading={pending}
        disabled={!preview || preview.valid.length === 0}
        icon={<UserPlusIcon weight="bold" />}
      >
        {pending
          ? t("intake.admitting")
          : preview?.valid.length === 1
            ? t("intake.admitOne")
            : t("intake.admitMany", { count: preview?.valid.length ?? 0 })}
      </Button>
    </form>
  );
}

function guardianKey(g: NonNullable<IntakeOutcome["guardian"]>) {
  return g === "invited" ? "intake.guardianInvited" : g === "notSent" ? "intake.guardianNotSent" : "intake.guardianNone";
}
