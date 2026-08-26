import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser, AccessError } from "@/lib/tenancy";
import { readEnquiry } from "@/lib/enquiries";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import { cn } from "@/lib/cn";
import { ThreadControls } from "./thread-controls";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("enquiries.metaTitle") };
}

/** One conversation, read from whichever side this session stands on. */
export default async function EnquiryThreadPage({
  params,
}: {
  params: Promise<{ enquiryId: string }>;
}) {
  const t = await getT();
  const relative = await getRelativeTime();
  const ctx = await requireUser();
  if (!ctx.role) redirect("/switch");
  const { enquiryId } = await params;

  let thread;
  try {
    thread = await readEnquiry(ctx, enquiryId);
  } catch (error) {
    // "Not yours" answers NOT FOUND, not FORBIDDEN — the page must not
    // confirm the enquiry exists to somebody it does not belong to.
    if (error instanceof AccessError) notFound();
    throw error;
  }

  const title = thread.subject
    ? t("enquiries.threadTitleVacancy", { subject: thread.subject, school: thread.schoolName })
    : t("enquiries.threadTitleAdmission", { school: thread.schoolName });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-fg sm:text-2xl">{title}</h1>
          <Badge tone={thread.status === "OPEN" ? "ok" : "neutral"} size="sm">
            {thread.status === "OPEN" ? t("enquiries.openBadge") : t("enquiries.closedBadge")}
          </Badge>
        </div>
        {thread.side === "school" && (
          <p className="mt-1 text-sm text-fg-muted">{thread.fromName}</p>
        )}
        <p className="mt-1 text-sm">
          <Link href="/enquiries" className="font-medium text-accent hover:underline">
            ← {t("enquiries.title")}
          </Link>
        </p>
      </div>

      <ol className="space-y-3">
        {thread.messages.map((message) => (
          <li key={message.id}>
            <Card
              className={cn(
                message.mine ? "ml-6 border-accent/40" : "mr-6",
              )}
            >
              <CardBody className="space-y-1 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-fg-muted">
                    {message.mine ? t("enquiries.sentByYou") : message.authorName}
                  </span>
                  <span className="text-xs text-fg-muted">{relative(message.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-fg">{message.body}</p>
              </CardBody>
            </Card>
          </li>
        ))}
      </ol>

      {thread.status === "OPEN" ? (
        <ThreadControls enquiryId={thread.id} canClose={thread.side === "school"} />
      ) : (
        <p className="text-sm font-medium text-fg-muted">{t("enquiries.closedNote")}</p>
      )}
    </div>
  );
}
