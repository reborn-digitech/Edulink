"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { ArrowRightIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { joinWithMyAccount, lookupCode } from "../actions";
import type { CodeLookup } from "@/lib/join";
import { useT } from "@/lib/i18n";

/** Same shaping as the sign-up wizard: 5+4 for a school, 3+4 for a class. */
function formatCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 3) return clean;
  if (clean.length > 7) return `${clean.slice(0, 5)}-${clean.slice(5, 9)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
}

/**
 * The code flow for somebody who ALREADY HAS AN ACCOUNT: two steps, not
 * four. Check the code, then "Join Class 5 as Aanya" — no name, no avatar,
 * no password, because all three already exist on the account that is
 * signed in, and that account is the one whose record must carry on. The
 * press files a request, and the page it lands on is where they wait.
 */
export function ExistingAccountJoinFlow({ name }: { name: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [found, setFound] = useState<Extract<CodeLookup, { ok: true }> | null>(null);
  const [checking, setChecking] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  async function checkCode() {
    setChecking(true);
    setErrors({});
    try {
      const result = await lookupCode(code);
      if (!result.ok) {
        setErrors({ code: result.error });
        setFound(null);
      } else {
        setFound(result);
      }
    } finally {
      setChecking(false);
    }
  }

  function join() {
    setErrors({});
    startTransition(async () => {
      const result = await joinWithMyAccount(code);
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      toast({
        tone: "ok",
        title: t("joinRequests.joinFiledTitle"),
        description:
          found?.kind === "class"
            ? t("joinRequests.joinFiledClass", { className: found.className, school: found.schoolName })
            : found
              ? t("joinRequests.joinFiledSchool", { school: found.schoolName })
              : undefined,
      });
      router.push(result.redirectTo ?? "/join/waiting");
      router.refresh();
    });
  }

  return (
    <div>
      {errors._form && (
        <p
          role="alert"
          className="mb-5 rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold tracking-tight text-fg outline-none">
        {t("join.whatsYourCode")}
      </h1>
      <p className="mt-2 text-fg-muted">{t("join.signedInAsBody", { name })}</p>

      <div className="mt-6">
        <label htmlFor="join-code" className="sr-only">
          {t("join.codeLabel")}
        </label>
        <input
          id="join-code"
          value={code}
          onChange={(e) => {
            setCode(formatCode(e.target.value));
            setFound(null);
            setErrors({});
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void checkCode();
            }
          }}
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder={t("join.codePlaceholder")}
          aria-invalid={Boolean(errors.code) || undefined}
          className={cn(
            "w-full rounded-[var(--radius-lg)] border-2 bg-surface px-4 py-5 text-center",
            "font-mono text-3xl font-bold tracking-[0.2em] uppercase text-fg",
            "outline-none placeholder:text-fg-subtle placeholder:tracking-[0.2em]",
            errors.code ? "border-danger" : found ? "border-ok" : "border-border focus:border-accent",
          )}
        />
        {errors.code && (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            {errors.code}
          </p>
        )}
      </div>

      {found ? (
        <>
          <div className="mt-4 flex items-center gap-3 rounded-[var(--radius-lg)] border-2 border-ok bg-ok-soft p-4 animate-pop">
            <CheckCircleIcon weight="fill" className="size-7 shrink-0 text-ok" />
            <div className="min-w-0">
              <p className="font-bold text-fg">{found.schoolName}</p>
              <p className="text-sm text-fg-muted">
                {found.kind === "class" ? t("join.classIs", { name: found.className }) : t("join.wholeSchool")}
              </p>
            </div>
          </div>
          <Button block size="lg" className="mt-6" loading={pending} onClick={join} iconRight={<ArrowRightIcon weight="bold" />}>
            {found.kind === "class"
              ? t("join.joinClassAs", { className: found.className, name })
              : t("join.joinSchoolAs", { school: found.schoolName, name })}
          </Button>
          <p className="mt-3 text-center text-xs text-fg-muted">{t("join.sameAccountNote")}</p>
        </>
      ) : (
        <Button
          block
          size="lg"
          variant="secondary"
          className="mt-4"
          loading={checking}
          disabled={code.replace(/[^A-Z0-9]/g, "").length < 4}
          onClick={checkCode}
        >
          {t("join.checkMyCode")}
        </Button>
      )}
    </div>
  );
}
