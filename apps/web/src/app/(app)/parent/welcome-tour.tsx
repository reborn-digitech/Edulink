"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ChecksIcon,
  ClipboardTextIcon,
  BrainIcon,
  CalendarCheckIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/language-switch";
import { useT } from "@/lib/i18n";
import { PARENT_WELCOME_COOKIE } from "@/lib/parent-welcome";

const STORAGE_KEY = "edulink.parentWelcome.v1";

function rememberCookie() {
  const year = 60 * 60 * 24 * 365;
  document.cookie = `${PARENT_WELCOME_COOKIE}=1; Max-Age=${year}; Path=/; SameSite=Lax`;
}

function subscribeToStorage(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/**
 * The guardian's first-run orientation: pick your language FIRST — the reader
 * least likely to be comfortable in English is exactly the one this card is
 * for — then four doors, each named in that language. Dismissal is per device
 * (localStorage): a first-run tour is about this phone in this hand, and a
 * server flag would hide it from the grandmother opening the same account on
 * hers.
 *
 * Rendered only after mount so the server never guesses at localStorage.
 */
/**
 * Rendered only when the page found no dismissal cookie — the server decides
 * (see lib/parent-welcome.ts), so the tour is in the first paint and nothing
 * moves. The localStorage read remains for a guardian who pressed "got it"
 * before the cookie existed: they are hidden after hydration once, and the
 * cookie is written so every later visit is decided on the server like
 * everyone else's. The server snapshot therefore says "not dismissed".
 */
export function WelcomeTour() {
  const t = useT();
  const dismissedBefore = useSyncExternalStore(
    subscribeToStorage,
    () => {
      try {
        return window.localStorage.getItem(STORAGE_KEY) !== null;
      } catch {
        return false; // storage blocked: the cookie is the record now
      }
    },
    () => false,
  );
  const [hiddenNow, setHiddenNow] = useState(false);

  if (dismissedBefore && !hiddenNow) rememberCookie();
  if (dismissedBefore || hiddenNow) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // If it cannot be remembered, hiding it now is still right.
    }
    rememberCookie();
    setHiddenNow(true);
  }

  const doors = [
    { href: "/parent/attendance", icon: ChecksIcon, label: t("welcomeTour.doorAttendance") },
    { href: "/parent/assignments", icon: ClipboardTextIcon, label: t("welcomeTour.doorHomework") },
    { href: "/parent/practice", icon: BrainIcon, label: t("welcomeTour.doorPractice") },
    { href: "/parent/meetings", icon: CalendarCheckIcon, label: t("welcomeTour.doorMeetings") },
  ];

  return (
    <section
      aria-label={t("welcomeTour.title")}
      className="rounded-[--radius-lg] border border-accent/30 bg-accent-soft/40 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-fg">{t("welcomeTour.title")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t("welcomeTour.intro")}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("welcomeTour.dismiss")}
          onClick={dismiss}
          icon={<XIcon weight="bold" />}
        />
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
          {t("welcomeTour.pickLanguage")}
        </p>
        <div className="mt-1.5">
          <LanguageSwitch showLabel />
        </div>
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {doors.map((door) => (
          <li key={door.href}>
            <Link
              href={door.href}
              className="flex items-center gap-2.5 rounded-[--radius-md] border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-fg hover:border-accent"
            >
              <door.icon weight="duotone" className="size-5 shrink-0 text-accent-strong" />
              {door.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <Button size="sm" variant="secondary" onClick={dismiss}>
          {t("welcomeTour.gotIt")}
        </Button>
      </div>
    </section>
  );
}
