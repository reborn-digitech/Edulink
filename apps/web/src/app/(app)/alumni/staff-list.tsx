import { PaperPlaneTiltIcon } from "@phosphor-icons/react/ssr";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ROLE_META } from "@/lib/constants";
import type { StaffPerson } from "@/lib/alumni";
import type { Translate } from "@/lib/i18n/dictionary";
import { openConversationAction } from "../remarks/conversation-actions";

/**
 * Staff an alumnus may write to, each row a two-field form posting the
 * ordinary open-a-room action (conversation-actions.ts): pressing the name's
 * button lands in the room, found or made. Former teachers carry a tag.
 */
export function StaffList({ people, schoolId, t, disabled }: { people: StaffPerson[]; schoolId: string; t: Translate; disabled?: boolean }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      {people.map((person) => (
        <li key={person.userId}>
          <form action={openConversationAction} className="flex items-center gap-3 p-3.5">
            <input type="hidden" name="schoolId" value={schoolId} />
            <input type="hidden" name="userId" value={person.userId} />
            {/* No profile link: a former pupil's pages are their home's, and /people is the school's. */}
            <Avatar avatarKey={person.avatarKey} name={person.name} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-fg">{person.name}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-fg-muted">
                <Badge tone="neutral" size="sm">
                  {t(ROLE_META[person.role].labelKey)}
                </Badge>
                {person.formerTeacher && (
                  <Badge tone="accent" size="sm">
                    {t("alumni.formerTeacherBadge")}
                  </Badge>
                )}
                {person.detail && <span className="truncate">{person.detail}</span>}
              </span>
            </span>
            <button
              type="submit"
              disabled={disabled}
              aria-label={t("alumni.messageTo", { name: person.name })}
              className="inline-flex size-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent text-sm font-semibold text-accent-fg hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 sm:w-auto sm:px-3.5"
            >
              <PaperPlaneTiltIcon weight="bold" className="size-4" />
              <span className="hidden sm:inline">{t("alumni.message")}</span>
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
