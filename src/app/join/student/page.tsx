import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { Wordmark } from "@/components/brand";
import { StudentJoinFlow } from "./flow";
import { ExistingAccountJoinFlow } from "./existing-flow";
import { getSession } from "@/lib/session";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.joinWithCode") };
}

export default async function StudentJoinPage() {
  const t = await getT();
  // Somebody already signed in joins ON THAT ACCOUNT — a transferring pupil,
  // or one a parent set up — instead of being walked into a second identity.
  // Staff and parents are refused by the action with a sentence, not by a
  // redirect that would hide the door.
  const session = await getSession();

  return (
    <div data-role="student" className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
          <Link href="/" aria-label={t("common.homeLink")}>
            <Wordmark size={26} />
          </Link>
          <Link
            href="/join"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
          >
            <ArrowLeftIcon weight="bold" className="size-4" />
            {t("common.back")}
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-lg px-4 py-8 sm:py-12">
        {session ? (
          <ExistingAccountJoinFlow name={session.user.preferredName ?? session.user.name} />
        ) : (
          <StudentJoinFlow />
        )}
      </main>
    </div>
  );
}
