import type { Metadata } from "next";
import Link from "next/link";
import { CompassIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.notFound") };
}

/**
 * NOT FOUND INSIDE THE APP (A3-states-2, 5 Oct 2026). A stale or mistyped id
 * under a signed-in page — and any refusal a page's render meets, which
 * AccessError now hands Next as its not-found interrupt — lands here, inside
 * the person's own shell and menu, in their language, with the way back to
 * their home. The root not-found.tsx stays for a path that matches nothing.
 * Same words, and no detail about why: "not here" and "not yours" read alike.
 */
export default async function AppNotFound() {
  const [t, session] = await Promise.all([getT(), getSession()]);
  const home = session?.role ? ROLE_HOME[session.role] : "/";
  return (
    <div className="mx-auto grid max-w-md place-items-center py-12 text-center">
      <CompassIcon weight="duotone" aria-hidden className="size-14 text-accent" />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-fg">{t("notFound.title")}</h1>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t("notFound.body")}</p>
      <Button asChild className="mt-6">
        <Link href={home}>{t("notFound.home")}</Link>
      </Button>
    </div>
  );
}
