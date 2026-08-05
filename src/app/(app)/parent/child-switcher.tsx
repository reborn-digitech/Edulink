"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

/**
 * Child selector for parents with more than one child.
 *
 * A horizontal rail rather than a dropdown: with two or three children the
 * options are worth showing at all times, and it stays thumb-reachable. The
 * selection lives in the URL so a parent can bookmark one child directly.
 *
 * SWITCHING CHILD KEEPS YOU ON THE PAGE YOU ARE ON. `basePath` was hardcoded to
 * `/parent`, so a guardian comparing two children's attendance was thrown back
 * to the overview on every switch and had to navigate in again — and on a page
 * about one child, a control that silently changes the SUBJECT and the TOPIC at
 * once is worse than one that does neither.
 */
export function ChildSwitcher({
  children,
  selectedId,
  basePath = "/parent",
}: {
  children: { studentMembershipId: string; name: string; schoolName: string }[];
  selectedId: string;
  basePath?: string;
}) {
  const t = useT();
  return (
    <nav aria-label={t("parent.chooseChild")}>
      <ul className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {children.map((child) => {
          const active = child.studentMembershipId === selectedId;
          return (
            <li key={child.studentMembershipId} className="shrink-0">
              <Link
                href={`${basePath}?child=${child.studentMembershipId}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 transition-colors",
                  active
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-surface hover:bg-surface-muted",
                )}
              >
                <Avatar avatarKey={null} name={child.name} size="sm" />
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-sm font-semibold",
                      active ? "text-accent-strong" : "text-fg",
                    )}
                  >
                    {child.name}
                  </span>
                  <span className="block truncate text-xs text-fg-muted">{child.schoolName}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
