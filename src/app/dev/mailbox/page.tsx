import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dev mailbox", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Development-only outbox viewer.
 *
 * Hard-gated on NODE_ENV: this page lists sign-in links and invitation tokens
 * in plain text, so it must be impossible to reach in production even if the
 * route is deployed by accident.
 */
export default async function MailboxPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const emails = await db.outboundEmail.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Badge tone="warn">Development only</Badge>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-fg">Mailbox</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Every email EduLink would have sent. Set <code>EMAIL_TRANSPORT</code> to a real transport
          to deliver them for real.
        </p>
      </div>

      {emails.length === 0 ? (
        <EmptyState
          title="No emails yet"
          description="Register a school or request a sign-in link and it will appear here."
          action={
            <Link href="/register" className="font-semibold text-accent-strong underline underline-offset-4">
              Register a school
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {emails.map((email) => {
            // Pull the actionable link out so it is one click, not a copy-paste
            // hunt through the HTML body.
            const link = /https?:\/\/[^\s"<]+/.exec(email.text)?.[0];
            return (
              <li key={email.id}>
                <Card>
                  <CardHeader
                    title={email.subject}
                    description={`To ${email.to} · ${email.createdAt.toLocaleString()}`}
                    action={email.purpose ? <Badge tone="accent" size="sm">{email.purpose}</Badge> : null}
                  />
                  <CardBody>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-[--radius-sm] bg-surface-muted p-3 text-xs leading-relaxed text-fg-muted">
                      {email.text}
                    </pre>
                    {link && (
                      <Link
                        href={link}
                        className="mt-3 inline-flex min-h-11 items-center rounded-[--radius-md] bg-accent px-4 font-semibold text-accent-fg"
                      >
                        Open the link
                      </Link>
                    )}
                  </CardBody>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
