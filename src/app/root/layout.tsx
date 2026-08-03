import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { requireSuperuser } from "@/lib/tenancy";

export const metadata: Metadata = {
  title: { default: "Server administration", template: "%s · EduLink server" },
  robots: { index: false, follow: false },
};

/**
 * The operator's area. Deliberately outside `(app)`.
 *
 * The signed-in shell needs a ROLE, and a role belongs to a school. Whoever runs
 * the server has neither by definition, so putting this inside that layout would
 * mean inventing a fake membership for them — which is exactly the shortcut that
 * turns "operator" into "member of every school".
 *
 * It also looks different on purpose. There is no school branding, no role
 * accent and no bottom bar: this is not a place inside a school, and it should
 * not feel like one.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await requireSuperuser();

  return (
    <div className="min-h-safe bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4">
          <Link href="/root" className="flex min-w-0 items-center gap-2.5">
            <Wordmark size={24} />
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-fg-muted">
              Server
            </span>
          </Link>
          <form action="/api/auth/logout" method="post">
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-4xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
