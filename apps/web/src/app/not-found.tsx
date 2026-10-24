import type { Metadata } from "next";
import Link from "next/link";
import { CompassIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

/* Without this, the tab wore the LANDING PAGE's title — a missing page
   announcing the product tagline. A 404 names itself like every other page. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.notFound") };
}

/**
 * The page for a path that leads nowhere — a mistyped URL, an archived thing,
 * a link from an old message. The framework's bare white default looked like
 * the app had crashed; this one looks like the app, says what happened in the
 * reader's language, and offers the one useful move. Deliberately no detail
 * about WHY: "not found" is also what a thing you may not see answers, and
 * the two must stay indistinguishable.
 */
export default async function NotFound() {
  const t = await getT();
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-bg p-6">
      <div className="w-full max-w-sm text-center">
        <CompassIcon weight="duotone" className="mx-auto size-14 text-accent" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-fg">{t("notFound.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t("notFound.body")}</p>
        <Button asChild className="mt-6">
          <Link href="/">{t("notFound.home")}</Link>
        </Button>
      </div>
    </main>
  );
}
