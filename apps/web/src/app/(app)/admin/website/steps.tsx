"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/cn";
import { publishSiteAction } from "./actions";

/** The six screens in order; the sixth is builder B's. */
export const SITE_STEPS: { href: string; key: TranslationKey }[] = [
  { href: "/admin/website/look", key: "website.stepLook" },
  { href: "/admin/website/about", key: "website.stepAbout" },
  { href: "/admin/website/sections", key: "website.stepSections" },
  { href: "/admin/website/review", key: "website.stepPreview" },
  { href: "/admin/website/publish", key: "website.stepPublish" },
  { href: "/admin/website/domain", key: "website.stepDomain" },
];

/** The progress strip: every screen by number and name, the current one marked; any can be opened. */
export function SiteSteps() {
  const t = useT();
  const path = usePathname();
  const current = SITE_STEPS.findIndex((s) => path === s.href || path.startsWith(`${s.href}/`));
  return (
    <nav aria-label={t("website.stepsLabel")}>
      <ol className="flex flex-wrap gap-2">
        {SITE_STEPS.map((s, i) => {
          const here = i === current;
          const done = current > i;
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={here ? "step" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm",
                  here ? "border-accent bg-accent-soft font-semibold text-accent-strong" : done ? "border-border bg-surface text-fg" : "border-border bg-surface text-fg-muted",
                )}
              >
                <span aria-hidden="true" className={cn("grid size-6 place-items-center rounded-full text-xs font-bold", here ? "bg-accent text-accent-fg" : "bg-surface-muted")}>
                  {i + 1}
                </span>
                {t(s.key)}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Publish the draft as it stands, from any screen, once the site has been published once. */
export function PublishNowButton() {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      loading={pending}
      onClick={() =>
        start(async () => {
          const r = await publishSiteAction();
          if (!r.ok) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
          toast({ tone: "ok", title: t("website.published") });
          router.refresh();
        })
      }
    >
      {t("website.publishChanges")}
    </Button>
  );
}

/** Back and Continue at the foot of a screen: Continue saves (the caller's `onContinue`) and moves on. */
export function StepFooter({ back, pending, continueLabel }: { back: string | null; pending: boolean; continueLabel?: string }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      {back ? (
        <Button asChild variant="secondary">
          <Link href={back}>{t("website.back")}</Link>
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit" loading={pending}>
        {continueLabel ?? t("website.continue")}
      </Button>
    </div>
  );
}
