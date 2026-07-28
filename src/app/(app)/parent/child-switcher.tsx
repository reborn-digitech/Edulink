"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

/**
 * Child selector for parents with more than one child.
 *
 * A horizontal rail rather than a dropdown: with two or three children the
 * options are worth showing at all times, and it stays thumb-reachable. The
 * selection lives in the URL so a parent can bookmark one child directly.
 */
export function ChildSwitcher({
  children,
  selectedId,
}: {
  children: { studentMembershipId: string; name: string; schoolName: string }[];
  selectedId: string;
}) {
  return (
    <nav aria-label="Choose a child">
      <ul className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {children.map((child) => {
          const active = child.studentMembershipId === selectedId;
          return (
            <li key={child.studentMembershipId} className="shrink-0">
              <Link
                href={`/parent?child=${child.studentMembershipId}`}
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
