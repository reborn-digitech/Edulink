import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon, IdentificationCardIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { idCheckView } from "@/lib/id-card";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("collegeDesks.idCheckTitle") };
}

/**
 * WHERE AN IDENTITY CARD'S QR LEADS (A3-S-6, audit of 5 Oct 2026). The card
 * encoded `/id-check?c=…` from the day it was built and the page did not exist,
 * so every scan was a 404. OUTSIDE EVERY SHELL, like /verify: a gate guard or a
 * bus driver scans with a phone's camera, which opens a browser that may be
 * signed in to nothing. Signed out, the page asks for the school's staff to
 * sign in and come back here; a family or student is told the check is the
 * staff's; a member of staff at the card's school sees what the check door
 * (GET /api/v1/id-cards/check) answers — the name and class the school holds
 * now and whether the student is still on the roll — and nothing more. Another
 * school's card, or a changed one, reads "not found". Counted per person with
 * the door (CODE_LOOKUPS).
 */
export default async function IdCheckPage({ searchParams }: { searchParams: Promise<{ c?: string | string[] }> }) {
  const t = await getT();
  const { c } = await searchParams;
  const code = typeof c === "string" ? c.slice(0, 80) : "";
  const view = await idCheckView(await getSession(), code);
  const here = code ? `/id-check?c=${encodeURIComponent(code)}` : "/id-check";

  return (
    <div className="flex min-h-safe flex-col justify-center bg-bg px-4 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="mb-8 inline-block" aria-label={t("common.homeLink")}>
          <Wordmark />
        </Link>
        <IdentificationCardIcon weight="duotone" className="size-9 text-accent-strong" aria-hidden="true" />
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg">{t("collegeDesks.idCheckTitle")}</h1>

        {view.state === "signIn" && (
          <>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t("collegeDesks.idCheckSignIn")}</p>
            <div className="mt-6">
              <Button asChild size="sm">
                <Link href={`/login?next=${encodeURIComponent(here)}`}>{t("collegeDesks.idCheckSignInGo")}</Link>
              </Button>
            </div>
          </>
        )}

        {view.state === "staffOnly" && <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t("collegeDesks.idCheckStaffOnly")}</p>}
        {view.state === "noCode" && <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t("collegeDesks.idCheckNoCode")}</p>}
        {view.state === "busy" && (
          <p role="alert" className="mt-1.5 text-sm leading-relaxed text-danger">
            {t("common.tryAgainMoment")}
          </p>
        )}

        {view.state === "result" && !view.check.found && (
          <p role="status" className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-fg">
            <WarningCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
            {t("collegeDesks.idCheckNotFound")}
          </p>
        )}

        {view.state === "result" && view.check.found && (
          <div className="mt-4 space-y-2 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <p className="text-lg font-semibold text-fg">{view.check.name}</p>
            {view.check.group ? <p className="text-sm text-fg-muted">{view.check.group}</p> : null}
            {view.check.schoolName ? <p className="text-sm text-fg-muted">{view.check.schoolName}</p> : null}
            <p role="status" className={`flex items-center gap-2 text-sm font-medium ${view.check.onRoll ? "text-ok" : "text-danger"}`}>
              {view.check.onRoll ? <CheckCircleIcon weight="fill" className="size-4" aria-hidden="true" /> : <WarningCircleIcon weight="fill" className="size-4" aria-hidden="true" />}
              {t(view.check.onRoll ? "collegeDesks.idCheckOnRoll" : "collegeDesks.idCheckLeft")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
