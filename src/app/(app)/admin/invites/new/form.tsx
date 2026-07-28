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
import { createInvites, type CreateInvitesState } from "../actions";
import { ROLE_META, SCHOOL_ROLES, type SchoolRole } from "@/lib/constants";

/**
 * Bulk invite composer.
 *
 * The live preview runs the SAME parser the server uses, so what the admin sees
 * before pressing send is what will actually happen — rather than a hopeful
 * client-side guess that disagrees with the result page.
 */
export function InviteForm({
  initialRole,
  classes,
  schoolCode,
  className,
}: {
  initialRole: SchoolRole;
  classes: { id: string; name: string }[];
  schoolCode: string;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [role, setRole] = useState<SchoolRole>(initialRole);
  const [classId, setClassId] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateInvitesState | null>(null);

  const preview = useMemo(() => (text.trim() ? parseInviteCsv(text) : null), [text]);

  async function readFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setError("That file is larger than 2 MB. Split it into smaller batches.");
      return;
    }
    const content = await file.text();
    setText(content);
    setError(null);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const outcome = await createInvites({ role, csv: text, classId: classId || undefined });
      if (!outcome.ok) {
        setError(outcome.error ?? "Something went wrong.");
        setResult(outcome.problems.length > 0 ? outcome : null);
        return;
      }
      setResult(outcome);
      router.refresh();
      if (outcome.sent > 0) {
        toast({
          tone: "ok",
          title: `${outcome.sent} invitation${outcome.sent === 1 ? "" : "s"} sent`,
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
        <div className="rounded-[--radius-lg] border border-border bg-surface p-6 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-ok-soft text-ok animate-confetti">
            <CheckCircleIcon weight="fill" className="size-10" />
          </div>
          <h2 className="text-xl font-bold text-fg">
            {sent.length} invitation{sent.length === 1 ? "" : "s"} on the way
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-fg-muted">
            They will get an email with a one-click link. Nothing to install, nothing to
            remember.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              block
              variant="secondary"
              onClick={() => {
                setResult(null);
                setText("");
              }}
            >
              Invite more
            </Button>
            <Button block onClick={() => router.push("/admin/invites")}>
              See all invitations
            </Button>
          </div>
        </div>

        {/* Everything that did NOT go through, stated plainly. */}
        {(skipped.length > 0 || failed.length > 0 || result.problems.length > 0) && (
          <div className="rounded-[--radius-lg] border border-warn/40 bg-warn-soft p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-warn">
              <WarningIcon weight="fill" className="size-4" />
              {skipped.length + failed.length + result.problems.length} not sent
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs">
              {result.problems.map((problem) => (
                <li key={`p-${problem.line}`} className="flex gap-2">
                  <span className="shrink-0 font-mono text-fg-muted">line {problem.line}</span>
                  <span className="truncate font-medium text-fg">{problem.value}</span>
                  <span className="ml-auto shrink-0 text-fg-muted">{problem.reason}</span>
                </li>
              ))}
              {[...skipped, ...failed].map((outcome) => (
                <li key={`o-${outcome.email}`} className="flex gap-2">
                  <span className="truncate font-medium text-fg">{outcome.email}</span>
                  <span className="ml-auto shrink-0 text-fg-muted">{outcome.reason}</span>
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
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <SelectField
        label="Invite them as"
        value={role}
        onChange={(e) => setRole(e.target.value as SchoolRole)}
      >
        {SCHOOL_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_META[r].label}
          </option>
        ))}
      </SelectField>

      {classes.length > 0 && (
        <SelectField
          label={role === "STUDENT" ? "Add to class" : "Assign to class"}
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          hint="Optional — they can also join later with the class code."
        >
          <option value="">No class</option>
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
            Emails
          </label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            icon={<UploadSimpleIcon weight="bold" />}
            onClick={() => fileRef.current?.click()}
          >
            Upload CSV
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
          id="invite-list"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={"name,email,subjects\nPriya Raman,priya@school.org,Maths;Science\nTom Fielding,tom@school.org,English"}
          className="mt-1.5 w-full rounded-[--radius-md] border border-border bg-surface p-3.5 font-mono text-sm leading-relaxed outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/40"
        />
        <p className="mt-1 text-xs text-fg-muted">
          A header row is optional. Just one email per line works too.
        </p>
      </div>

      {/* Live preview from the real parser. */}
      {preview && (
        <div className="rounded-[--radius-md] border border-border bg-surface-muted p-3.5">
          <p className="text-sm font-semibold text-fg">
            {preview.valid.length} ready to invite
            {preview.problems.length > 0 && (
              <span className="text-warn"> · {preview.problems.length} need a look</span>
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
                  and {preview.valid.length - 8} more
                </li>
              )}
            </ul>
          )}

          {preview.problems.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {preview.problems.slice(0, 5).map((problem) => (
                <li key={`${problem.line}-${problem.value}`} className="flex items-center gap-2 text-xs">
                  <XCircleIcon weight="fill" className="size-3.5 shrink-0 text-danger" />
                  <span className="font-mono text-fg-muted">line {problem.line}</span>
                  <span className="truncate text-fg">{problem.value}</span>
                  <span className="ml-auto shrink-0 text-fg-muted">{problem.reason}</span>
                </li>
              ))}
              {preview.problems.length > 5 && (
                <li className="text-xs text-fg-muted">
                  and {preview.problems.length - 5} more
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
          ? "Sending…"
          : preview?.valid.length
            ? `Send ${preview.valid.length} invitation${preview.valid.length === 1 ? "" : "s"}`
            : "Send invitations"}
      </Button>

      <p className="rounded-[--radius-md] bg-surface-muted p-3.5 text-xs leading-relaxed text-fg-muted">
        Prefer not to email? Anyone can join with your school code{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 font-semibold text-fg">{schoolCode}</code>{" "}
        — you approve them from the invitations page.
      </p>
    </form>
  );
}
