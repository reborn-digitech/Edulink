import type { Metadata } from "next";
import { ChildLeftBanner } from "../child-left";
import { ClipboardTextIcon, CheckCircleIcon, WarningIcon, ClockIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { childWork } from "@/lib/grading";
import { formatMilli } from "@/lib/validation";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { TabBar } from "@/components/ui/tabs";
import { ChildSwitcher } from "../child-switcher";
import { getT, getRelativeTime } from "@/lib/i18n/server";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("nav.assignments") };
}

const TABS = ["todo", "handed", "marked"] as const;
type Tab = (typeof TABS)[number];

/**
 * The homework diary and the grades page, folded into one Assignments page
 * with the same three tabs the child sees — to do, handed in, marked — built
 * by the same rule (childWork). Read-only on purpose: homework is between the
 * child and the teacher; this keeps the family in the loop without putting a
 * parent's hands on the child's work.
 */
export default async function ParentAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string; tab?: string; q?: string; class?: string }>;
}) {
  const session = await requireParent();
  const t = await getT();
  const when = await getRelativeTime();
  const { child: requested, tab: rawTab, q, class: rawClass } = await searchParams;
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "todo";

  const { children } = await listContexts(session.user.id);
  const selectedId =
    requested && children.some((c) => c.studentMembershipId === requested)
      ? requested
      : children[0]!.studentMembershipId;

  const { childName, todo, handedIn, marked } = await childWork(session.user.id, selectedId);
  const all = tab === "todo" ? todo : tab === "handed" ? handedIn : marked;
  const classNames = [...new Set([...todo, ...handedIn, ...marked].map((item) => item.className))].sort();
  const classFilter = rawClass && classNames.includes(rawClass) ? rawClass : null;
  const needle = (q ?? "").trim().toLowerCase();
  const list = all.filter(
    (item) => (!classFilter || item.className === classFilter) && (!needle || item.title.toLowerCase().includes(needle)),
  );
  const narrowed = Boolean(classFilter || needle);
  const base = `/parent/assignments?child=${selectedId}`;

  return (
    <div className="space-y-5">
      {children.length > 1 && (
        <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/assignments" />
      )}
      {(() => {
        const sel = children.find((c) => c.studentMembershipId === selectedId);
        return sel?.leftAt ? (
          <ChildLeftBanner child={{ studentMembershipId: sel.studentMembershipId, studentUserId: sel.studentUserId, name: sel.name, schoolName: sel.schoolName, leftAt: sel.leftAt }} />
        ) : null;
      })()}

      <PageHeader title={t("nav.assignments")} description={<>{t("assignments.forChild", { name: childName })} · {t("diary.intro")}</>} />

      <TabBar
        ariaLabel={t("nav.assignments")}
        current={tab}
        tabs={[
          { key: "todo", href: base, label: t("assignments.tabDue"), count: todo.length },
          { key: "handed", href: `${base}&tab=handed`, label: t("assignments.tabHanded"), count: handedIn.length },
          { key: "marked", href: `${base}&tab=marked`, label: t("assignments.tabMarked"), count: marked.length },
        ]}
      />

      {(todo.length + handedIn.length + marked.length > 3 || narrowed) && (
        <DataToolbar
          search={{ value: q ?? "", placeholder: t("assignments.searchPlaceholder"), label: t("common.searchLabel") }}
          facets={
            classNames.length > 1
              ? [{ key: "class", label: t("teacher.classFilter"), value: classFilter ?? "", options: [{ value: "", label: t("teacher.allClasses") }, ...classNames.map((name) => ({ value: name, label: name }))] }]
              : []
          }
          extra={{ child: selectedId, ...(tab === "todo" ? {} : { tab }) }}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
      )}

      {list.length === 0 && narrowed ? (
        <EmptyState title={t("common.noResultsTitle")} description={t("common.noResultsBody")} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<ClipboardTextIcon weight="duotone" className="size-8" />}
          title={
            tab === "todo"
              ? t("diary.openEmpty")
              : tab === "handed"
                ? t("assignments.nothingHanded")
                : t("diary.markedEmpty")
          }
          description={t("diary.emptyBody", { name: childName })}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {list.map((item) => (
              <li key={item.id} className="px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-fg">{item.title}</p>
                    <p className="text-xs text-fg-muted">
                      {item.className}
                      {item.subject ? ` · ${item.subject}` : ""}
                      {item.category ? ` · ${item.category}` : ""}
                      {tab !== "marked" && item.dueAt ? ` · ${t("diary.due")} ${when(item.dueAt)}` : ""}
                    </p>
                  </div>
                  {tab === "marked" ? (
                    <span className="text-sm font-semibold tabular-nums text-fg">
                      {formatMilli(item.scoreMilli)}
                      {item.pointsMilli ? ` / ${formatMilli(item.pointsMilli)}` : ""}
                    </span>
                  ) : item.submittedAt ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-ok">
                      <CheckCircleIcon weight="fill" className="size-3.5" />
                      {t("diary.handedIn")}
                    </span>
                  ) : item.overdue ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
                      <WarningIcon weight="fill" className="size-3.5" />
                      {t("diary.overdue")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted">
                      <ClockIcon weight="fill" className="size-3.5" />
                      {t("diary.notYet")}
                    </span>
                  )}
                </div>
                {tab === "marked" && item.comment && (
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">“{item.comment}”</p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
