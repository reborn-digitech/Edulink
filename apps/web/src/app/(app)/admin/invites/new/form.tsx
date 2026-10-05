"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  PaperPlaneTiltIcon,
  UploadSimpleIcon,
  WarningIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { parseInviteCsv } from "@/lib/csv";
import { readSpreadsheet, SPREADSHEET_ACCEPT } from "@/lib/spreadsheet-client";
import { createInvites, type CreateInvitesState } from "../actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { ROLE_META, INVITABLE_ROLES, isModuleRole, isTeachingRole, type InvitableRole } from "@/lib/constants";
import { fieldClass } from "@/components/ui/field-class";

/**
 * Bulk invite composer.
 *
 * The live preview runs the SAME parser the server uses, so what the admin sees
 * before pressing send is what will actually happen — rather than a hopeful
 * client-side guess that disagrees with the result page.
 */
export function InviteForm({
  initialRole,
  roles,
  classes,
  schoolCode,
  className,
}: {
  initialRole: InvitableRole;
  /** The roles this institution invites (invitableRolesFor its kind); every invitable role when left out. */
  roles?: readonly InvitableRole[];
  classes: { id: string; name: string }[];
  schoolCode: string;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [role, setRole] = useState<InvitableRole>(initialRole);
  const [classId, setClassId] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateInvitesState | null>(null);

  const preview = useMemo(() => (text.trim() ? parseInviteCsv(text) : null), [text]);

  async function readFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setError(t("invites.fileTooBig"));
      return;
    }
    const content = await readSpreadsheet(file);
    if (content === null) {
      setError(t("invites.fileUnreadable"));
      return;
    }
    setText(content);
    setError(null);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const outcome = await createInvites({ role, csv: text, classId: classId || undefined });
      if (!outcome.ok) {
        setError(
          outcome.errorKey
            ? t(outcome.errorKey, outcome.errorVars)
            : (actionError(t, outcome, "common.somethingWrong")),
        );
        setResult(outcome.problems.length > 0 ? outcome : null);
        return;
      }
      setResult(outcome);
      router.refresh();
      if (outcome.sent > 0) {
        toast({
          tone: "ok",
          title:
            outcome.sent === 1
              ? t("invites.sentOne")
              : t("invites.sentMany", { count: outcome.sent }),
        });
      }
    });
  }

  if (result?.ok) {
    const sent = result.outcomes.filter((o) => o.status === "sent");
    const skipped = result.outcomes.filter((o) => o.status === "skipped");
    const failed = result.outcomes.filter((o) => o.status === "failed");

    return (
      <div className={cn("space-y-4", className)}>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-ok-soft text-ok animate-confetti">
            <CheckCircleIcon weight="fill" className="size-10" />
          </div>
          <h2 className="text-xl font-bold text-fg">
            {sent.length === 1
              ? t("invites.onTheWayOne")
              : t("invites.onTheWayMany", { count: sent.length })}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-fg-muted">{t("invites.onTheWayBody")}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              block
              variant="secondary"
              onClick={() => {
                setResult(null);
                setText("");
              }}
            >
              {t("invites.inviteMore")}
            </Button>
            <Button block onClick={() => router.push("/admin/invites")}>
              {t("invites.seeAll")}
            </Button>
          </div>
        </div>

        {/* Everything that did NOT go through, stated plainly. */}
        {(skipped.length > 0 || failed.length > 0 || result.problems.length > 0) && (
          <div className="rounded-[var(--radius-lg)] border border-warn/40 bg-warn-soft p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-warn">
              <WarningIcon weight="fill" className="size-4" />
              {t("invites.notSent", {
                count: skipped.length + failed.length + result.problems.length,
              })}
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs">
              {result.problems.map((problem) => (
                <li key={`p-${problem.line}`} className="flex gap-2">
                  <span className="shrink-0 font-mono text-fg-muted">
                    {t("invites.line", { line: problem.line })}
                  </span>
                  <span className="truncate font-medium text-fg">
                    {problem.value || t("invites.blankRow")}
                  </span>
                  <span className="ml-auto shrink-0 text-fg-muted">
                    {t(problem.reasonKey, problem.reasonVars)}
                  </span>
                </li>
              ))}
              {[...skipped, ...failed].map((outcome) => (
                <li key={`o-${outcome.email}`} className="flex gap-2">
                  <span className="truncate font-medium text-fg">{outcome.email}</span>
                  <span className="ml-auto shrink-0 text-fg-muted">
                    {outcome.reasonKey ? t(outcome.reasonKey) : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn("space-y-5", className)} noValidate>
      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <SelectField
        label={t("invites.inviteAs")}
        value={role}
        onChange={(e) => setRole(e.target.value as InvitableRole)}
      >
        {(roles ?? INVITABLE_ROLES).map((r) => (
          <option key={r} value={r}>
            {t(ROLE_META[r].labelKey)}
          </option>
        ))}
      </SelectField>

      {classes.length > 0 && !isModuleRole(role) && (role === "STUDENT" || isTeachingRole(role) || role === "ADMIN" || role === "PRINCIPAL") && (
        <SelectField
          label={role === "STUDENT" ? t("invites.addToClass") : t("invites.assignToClass")}
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          hint={t("invites.classHint")}
        >
          <option value="">{t("invites.noClass")}</option>
          {classes.map((klass) => (
            <option key={klass.id} value={klass.id}>
              {klass.name}
            </option>
          ))}
        </SelectField>
      )}

      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="invite-list" className="block text-sm font-medium text-fg">
            {t("invites.emails")}
          </label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            icon={<UploadSimpleIcon weight="bold" />}
            onClick={() => fileRef.current?.click()}
          >
            {t("invites.uploadCsv")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept={SPREADSHEET_ACCEPT}
            className="sr-only"
            // The button above is the control and names it; this input is only what the button opens, so it is out of
            // the tab order and the accessibility tree, as the signature pad's is (axe `label`, critical, 4 Oct 2026).
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
          id="invite-list"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={"name,email,subjects\nPriya Raman,priya@school.org,Maths;Science\nTom Fielding,tom@school.org,English"}
          className={fieldClass("mt-1.5 font-mono leading-relaxed text-sm")}
        />
        <p className="mt-1 text-xs text-fg-muted">{t("invites.headerOptional")}</p>
      </div>

      {/* Live preview from the real parser. */}
      {preview && (
        <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted p-3.5">
          <p className="text-sm font-semibold text-fg">
            {t("invites.readyToInvite", { count: preview.valid.length })}
            {preview.problems.length > 0 && (
              <span className="text-warn">
                {" "}
                · {t("invites.needALook", { count: preview.problems.length })}
              </span>
            )}
          </p>

          {preview.valid.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {preview.valid.slice(0, 8).map((row) => (
                <li
                  key={row.email}
                  className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-fg"
                >
                  {row.name || row.email}
                </li>
              ))}
              {preview.valid.length > 8 && (
                <li className="px-2.5 py-1 text-xs text-fg-muted">
                  {t("invites.andMore", { count: preview.valid.length - 8 })}
                </li>
              )}
            </ul>
          )}

          {preview.problems.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {preview.problems.slice(0, 5).map((problem) => (
                <li key={`${problem.line}-${problem.value}`} className="flex items-center gap-2 text-xs">
                  <XCircleIcon weight="fill" className="size-3.5 shrink-0 text-danger" />
                  <span className="font-mono text-fg-muted">
                    {t("invites.line", { line: problem.line })}
                  </span>
                  <span className="truncate text-fg">
                    {problem.value || t("invites.blankRow")}
                  </span>
                  <span className="ml-auto shrink-0 text-fg-muted">
                    {t(problem.reasonKey, problem.reasonVars)}
                  </span>
                </li>
              ))}
              {preview.problems.length > 5 && (
                <li className="text-xs text-fg-muted">
                  {t("invites.andMore", { count: preview.problems.length - 5 })}
                </li>
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
        icon={<PaperPlaneTiltIcon weight="bold" />}
      >
        {pending
          ? t("invites.sending")
          : preview?.valid.length
            ? preview.valid.length === 1
              ? t("invites.sendOne")
              : t("invites.sendMany", { count: preview.valid.length })
            : t("invites.sendInvitations")}
      </Button>

      <p className="rounded-[var(--radius-md)] bg-surface-muted p-3.5 text-xs leading-relaxed text-fg-muted">
        {t("invites.orShareCodePrefix")}{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 font-semibold text-fg">{schoolCode}</code>{" "}
        {t("invites.orShareCodeSuffix")}
      </p>
    </form>
  );
}
