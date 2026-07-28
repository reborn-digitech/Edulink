import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRightIcon,
  GraduationCapIcon,
  HandHeartIcon,
  TicketIcon,
} from "@phosphor-icons/react/ssr";
import { Wordmark } from "@/components/brand";
import { Card } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Join your school",
  description: "Join EduLink with a code from your school, or link to your child.",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ first?: string }>;
}) {
  const session = await getSession();
  const { first } = await searchParams;

  // Already signed in with somewhere to be? Don't make them pick again.
  if (session?.role) redirect(ROLE_HOME[session.role]);

  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
          <Link href="/" aria-label="EduLink home">
            <Wordmark size={26} />
          </Link>
          {!session && (
            <Link href="/login" className="text-sm font-medium text-fg-muted hover:text-fg">
              Log in
            </Link>
          )}
        </div>
      </header>

      <main id="main" className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-fg">
          {first === "1" ? "Almost there" : "Let's get you in"}
        </h1>
        <p className="mt-2 text-fg-muted">
          {first === "1"
            ? "Your account is ready — now connect it to a school or a child."
            : "Pick the one that sounds like you."}
        </p>

        <div className="mt-8 space-y-3">
          <JoinOption
            href="/join/student"
            role="student"
            icon={<GraduationCapIcon weight="duotone" className="size-8" />}
            title="I'm a student"
            body="You need the code your teacher gave you."
          />
          <JoinOption
            href="/join/parent"
            role="parent"
            icon={<HandHeartIcon weight="duotone" className="size-8" />}
            title="I'm a parent or guardian"
            body="Link to your child and see their day."
          />
          <JoinOption
            href="/login"
            role="teacher"
            icon={<TicketIcon weight="duotone" className="size-8" />}
            title="I was sent an invitation"
            body="Open the link in your email — it signs you straight in."
          />
        </div>

        <p className="mt-8 text-center text-sm text-fg-muted">
          Setting up a whole school?{" "}
          <Link
            href="/register"
            className="font-semibold text-accent-strong underline underline-offset-4"
          >
            Register it here
          </Link>
        </p>
      </main>
    </div>
  );
}

function JoinOption({
  href,
  role,
  icon,
  title,
  body,
}: {
  href: string;
  role: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card interactive data-role={role} className="overflow-hidden">
      <Link href={href} className="flex items-center gap-4 p-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-[--radius-md] bg-accent-soft text-accent-strong">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold text-fg">{title}</span>
          <span className="block text-sm text-fg-muted">{body}</span>
        </span>
        <ArrowRightIcon weight="bold" className="size-5 shrink-0 text-fg-subtle" aria-hidden="true" />
      </Link>
    </Card>
  );
}
