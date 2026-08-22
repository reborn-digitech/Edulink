import type { Metadata } from "next";
import { CheckCircleIcon, ClipboardTextIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { getStudentWork } from "@/lib/grading";
import { getSession } from "@/lib/session";
import { formatMilli } from "@/lib/validation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { TabBar } from "@/components/ui/tabs";
import { SubmitPanel } from "../work/submit-panel";
import { AttachmentList } from "@/components/attachment-list";
import { getT, getRelativeTime } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("nav.assignments") };
}

const TABS = ["todo", "handed", "marked"] as const;
type Tab = (typeof TABS)[number];

/**
 * ONE PLACE FOR "WHAT DO I OWE". The old My work (hand things in) and Grades
 * (see marks) pages answered the same question from two ends with two rules
 * for what counted as upcoming; this page has one rule — see getStudentWork
 * — and three tabs: to do, handed in, marked. Exam marks and report cards
 * are the other question, and live on Exams.
 */
export default async function StudentAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireRole("STUDENT");
  const session = (await getSession())!;
  const t = await getT();
  const when = await getRelativeTime();
  const { tab: rawTab } = await searchParams;
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "todo";
  const { todo, handedIn, marked } = await getStudentWork(session);

  const list = tab === "todo" ? todo : tab === "handed" ? handedIn : marked;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("nav.assignments")}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {todo.length === 0
            ? t("student.nothingToDo")
            : todo.length === 1
              ? t("student.thingsToDoOne")
              : t("student.thingsToDoMany", { count: todo.length })}
        </p>
      </div>

      <TabBar
        ariaLabel={t("nav.assignments")}
        current={tab}
        tabs={[
          { key: "todo", href: "/student/assignments", label: t("assignments.tabTodo"), count: todo.length },
          { key: "handed", href: "/student/assignments?tab=handed", label: t("assignments.tabHanded"), count: handedIn.length },
          { key: "marked", href: "/student/assignments?tab=marked", label: t("assignments.tabMarked"), count: marked.length },
        ]}
      />

      {list.length === 0 ? (
        <EmptyState
          tone={tab === "todo" ? "celebrate" : "neutral"}
          icon={
            tab === "todo" ? (
              <CheckCircleIcon weight="duotone" className="size-8" />
            ) : (
              <ClipboardTextIcon weight="duotone" className="size-8" />
            )
          }
          title={
            tab === "todo"
              ? t("student.nothingDue")
              : tab === "handed"
                ? t("assignments.nothingHanded")
                : t("assignments.nothingMarked")
          }
          description={
            tab === "todo"
              ? t("student.workEmpty")
              : tab === "handed"
                ? t("assignments.nothingHandedBody")
                : t("assignments.nothingMarkedBody")
          }
        />
      ) : tab === "marked" ? (
        <Card>
          <ul className="divide-y divide-border px-4">
            {marked.map((item) => {
              const percent =
                item.scoreMilli !== null && item.pointsMilli
                  ? Math.round((item.scoreMilli * 100) / item.pointsMilli)
                  : null;
              return (
                <li key={item.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-fg">{item.title}</span>
                      <span className="block text-xs text-fg-muted">
                        {item.className}
                        {item.category ? ` · ${item.category}` : ""}
                      </span>
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
        </Card>
      ) : (
        <ul className="space-y-2">
          {list.map((item) => (
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
                      {item.pointsMilli ? ` · ${formatMilli(item.pointsMilli)} ${t("assignments.points")}` : ""}
                    </p>
                    {item.body && (
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                        {item.body}
                      </p>
                    )}
                    {item.attachments.length > 0 && (
                      <div className="mt-2.5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                          {t("student.fromTeacher")}
                        </p>
                        <AttachmentList
                          className="mt-1"
                          target="assignment"
                          assignmentId={item.id}
                          recordId={item.id}
                          attachments={item.attachments}
                          canEdit={false}
                        />
                      </div>
                    )}
                    <div className="mt-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                        {t("student.yourFiles")}
                      </p>
                      <AttachmentList
                        className="mt-1"
                        target="submission"
                        assignmentId={item.id}
                        recordId={item.submissionId}
                        attachments={item.submissionAttachments}
                        canEdit
                      />
                    </div>
                    <SubmitPanel
                      assignmentId={item.id}
                      title={item.title}
                      submittedAt={item.submittedAt}
                      existingBody={item.submissionBody}
                    />
                  </div>
                  {/* Gentle: "3 days late", never a red OVERDUE stamp. (§6) */}
                  <Badge tone={item.overdue ? "warn" : "neutral"} size="sm">
                    {item.dueAt ? when(item.dueAt) : t("student.noDate")}
                  </Badge>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
