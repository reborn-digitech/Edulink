import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { LoginForm } from "./form";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; expired?: string }>;
}) {
  const session = await getSession();
  if (session?.role) redirect(ROLE_HOME[session.role]);

  const { expired } = await searchParams;
  const t = await getT();

  return (
    <div className="grid min-h-safe bg-bg lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-block" aria-label="EduLink home">
            <Wordmark />
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-fg">{t("login.welcome")}</h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            {t("login.subtitlePrefix")}{" "}
            <Link href="/join" className="font-medium text-accent-strong underline underline-offset-4">
              {t("login.joinWithCode")}
            </Link>
            .
          </p>

          {expired === "1" && (
            <p
              role="status"
              className="mt-5 rounded-[--radius-md] border border-warn/30 bg-warn-soft px-4 py-3 text-sm font-medium text-warn"
            >
              {t("login.expired")}
            </p>
          )}

          <LoginForm className="mt-7" />

          <p className="mt-8 text-center text-sm text-fg-muted">
            {t("login.newSchoolPrefix")}{" "}
            <Link href="/register" className="font-semibold text-accent-strong underline underline-offset-4">
              {t("login.registerHere")}
            </Link>
          </p>
        </div>
      </div>

      {/* Decorative panel — hidden on phones where it would just push the form
          below the fold. */}
      <div
        aria-hidden="true"
        className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-[#4f8dfb] to-[#7e22ce] p-12 lg:flex"
      >
        <blockquote className="max-w-md text-white">
          <p className="text-2xl font-semibold leading-snug">
            &ldquo;The register used to eat the first ten minutes of every lesson. Now it is done
            before the class has sat down.&rdquo;
          </p>
          <footer className="mt-4 text-sm text-white/80">A Year 5 teacher</footer>
        </blockquote>
      </div>
    </div>
  );
}
