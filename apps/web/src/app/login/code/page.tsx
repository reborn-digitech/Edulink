import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { LanguageSwitch } from "@/components/language-switch";
import { getSession } from "@/lib/session";
import { getT } from "@/lib/i18n/server";
import { TWO_FACTOR_COOKIE } from "@/lib/two-factor";
import { CodeForm } from "./form";
import { WhoSignsIn } from "../who-signs-in";
import { homeFor } from "@/lib/role-home";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("totp.stepTitle") };
}

/**
 * The second step of signing in, for a person with two-step sign-in on.
 *
 * Reached only with the challenge cookie the first step set (a password, a
 * sign-in link or SSO); without it there is nothing to answer, and the login
 * page is where to start. Already signed in, the home page is.
 */
export default async function LoginCodePage() {
  const session = await getSession();
  if (session?.role) redirect(await homeFor(session.role, session.schoolId));
  const jar = await cookies();
  if (!jar.get(TWO_FACTOR_COOKIE)?.value) redirect("/login?step=expired");
  const t = await getT();

  return (
    <div className="grid min-h-safe bg-bg lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-block" aria-label={t("common.homeLink")}>
            <Wordmark />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{t("totp.stepTitle")}</h1>
          <p className="mt-1.5 text-sm text-fg-muted">{t("totp.stepBody")}</p>
          <div className="mt-7">
            <CodeForm />
          </div>
          <div className="mt-8 flex justify-center border-t border-border pt-6">
            <LanguageSwitch />
          </div>
        </div>
      </div>
      <WhoSignsIn t={t} />
    </div>
  );
}
