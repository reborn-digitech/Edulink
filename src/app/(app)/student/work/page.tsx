import type { Metadata } from "next";
import { CheckCircleIcon, ClipboardTextIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { getStudentWork } from "@/lib/grading";
import { getSession } from "@/lib/session";
import { relativeTime } from "@/lib/dates";
import { formatMilli } from "@/lib/validation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = { title: "My work" };

export default async function StudentWorkPage() {
  await requireRole("STUDENT");
  const session = (await getSession())!;
  const { upcoming, past } = await getStudentWork(session);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">My work</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {upcoming.length === 0
            ? "Nothing to do right now"
            : `${upcoming.length} thing${upcoming.length === 1 ? "" : "s"} to do`}
        </p>
      </div>

      {upcoming.length === 0 ? (
        <EmptyState
          tone="celebrate"
          icon={<CheckCircleIcon weight="duotone" className="size-8" />}
          title="You're all caught up"
          description="Nothing is waiting for you. New work shows up here the moment a teacher sets it."
        />
      ) : (
        <ul className="space-y-2">
          {upcoming.map((item) => (
            <li key={item.id}>
              <Card>
                <div className="flex items-start gap-3 p-4">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 h-10 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.classColor ?? "var(--accent)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-fg">{item.title}</p>
                    <p className="text-xs text-fg-muted">
                      {item.className}
                      {item.category ? ` · ${item.category}` : ""}
                      {item.pointsMilli ? ` · ${formatMilli(item.pointsMilli)} points` : ""}
                    </p>
                    {item.body && (
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                        {item.body}
                      </p>
                    )}
                  </div>
                  {/* Gentle: "3 days late", never a red OVERDUE stamp. (§6) */}
                  <Badge tone={item.overdue ? "warn" : "neutral"} size="sm">
                    {item.dueAt ? relativeTime(item.dueAt) : "No date"}
                  </Badge>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <Card>
          <CardHeader
            icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
            title="Marked already"
            description={`${past.length} piece${past.length === 1 ? "" : "s"} of work`}
          />
          <CardBody>
            <ul className="divide-y divide-border">
              {past.map((item) => {
                const percent =
                  item.scoreMilli !== null && item.pointsMilli
                    ? Math.round((item.scoreMilli * 100) / item.pointsMilli)
                    : null;
                return (
                  <li key={item.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-fg">
                          {item.title}
                        </span>
                        <span className="block text-xs text-fg-muted">{item.className}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-bold tabular-nums text-fg">
                          {formatMilli(item.scoreMilli)}
                          {item.pointsMilli ? (
                            <span className="text-fg-muted">/{formatMilli(item.pointsMilli)}</span>
                          ) : null}
                        </span>
                        {percent !== null && (
                          <Badge tone={percent >= 70 ? "ok" : "neutral"} size="sm">
                            {percent}%
                          </Badge>
                        )}
                      </span>
                    </div>
                    {item.comment && (
                      <p className="mt-1.5 rounded-[--radius-sm] bg-surface-muted p-2.5 text-sm italic text-fg-muted">
                        &ldquo;{item.comment}&rdquo;
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
