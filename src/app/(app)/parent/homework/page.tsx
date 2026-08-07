import type { Metadata } from "next";
import { ClipboardTextIcon, CheckCircleIcon, WarningIcon, ClockIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { childWork } from "@/lib/grading";
import { formatInZone } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { ChildSwitcher } from "../child-switcher";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("diary.title") };
}

/**
 * The paper diary, retired: what the child has been set, whether it went in,
 * whether it was late, and what came back. Read-only on purpose — homework is
 * between the child and the teacher; the diary keeps the family in the loop
 * without putting a parent's hands on the child's work.
 */
export default async function ParentHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const session = await requireParent();
  const t = await getT();
  const { child: requested } = await searchParams;

  const { children } = await listContexts(session.user.id);
  const selectedId =
    requested && children.some((c) => c.studentMembershipId === requested)
      ? requested
      : children[0]!.studentMembershipId;

  const { childName, upcoming, past } = await childWork(session.user.id, selectedId);

  return (
    <div className="space-y-5">
      {children.length > 1 && (
        <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/homework" />
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("diary.headline", { name: childName })}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">{t("diary.intro")}</p>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          icon={<ClipboardTextIcon weight="duotone" className="size-8" />}
          title={t("diary.emptyTitle")}
          description={t("diary.emptyBody", { name: childName })}
        />
      ) : (
        <>
          <Card>
            <CardHeader
              icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
              title={t("diary.openTitle")}
            />
            <CardBody className="p-0">
              {upcoming.length === 0 ? (
                <p className="px-5 py-5 text-sm text-fg-muted">{t("diary.openEmpty")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {upcoming.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-fg">{item.title}</p>
                        <p className="text-xs text-fg-muted">
                          {item.className}
                          {item.category ? ` · ${item.category}` : ""}
                          {item.dueAt
                            ? ` · ${t("diary.due")} ${formatInZone(item.dueAt, "UTC", { dateStyle: "medium" })}`
                            : ""}
                        </p>
                      </div>
                      {item.submittedAt ? (
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
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={<CheckCircleIcon weight="duotone" className="size-5" />}
              title={t("diary.markedTitle")}
            />
            <CardBody className="p-0">
              {past.length === 0 ? (
                <p className="px-5 py-5 text-sm text-fg-muted">{t("diary.markedEmpty")}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {past.map((item) => (
                    <li key={item.id} className="px-5 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-fg">{item.title}</p>
                        <span className="text-sm font-semibold tabular-nums text-fg">
                          {item.scoreMilli === null ? "—" : (item.scoreMilli / 1000).toFixed(0)}
                          {item.pointsMilli ? ` / ${(item.pointsMilli / 1000).toFixed(0)}` : ""}
                        </span>
                      </div>
                      <p className="text-xs text-fg-muted">
                        {item.className}
                        {item.category ? ` · ${item.category}` : ""}
                      </p>
                      {item.comment && (
                        <p className="mt-1 text-sm leading-relaxed text-fg-muted">“{item.comment}”</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
