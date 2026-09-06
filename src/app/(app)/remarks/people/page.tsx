import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon, MagnifyingGlassIcon, PaperPlaneTiltIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { conversationSchools, peopleToMessage, type Person } from "@/lib/conversations";
import { db } from "@/lib/db";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { ROLE_META, type Role } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { openConversationAction } from "../conversation-actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.newMessage") };
}

const GROUP_KEY: Record<"staff" | "pupils" | "parents", TranslationKey> = {
  staff: "convo.staffGroup",
  pupils: "convo.pupilsGroup",
  parents: "convo.parentsGroup",
};

/**
 * Who to write to. Everyone the caller may reach at the school, by name,
 * grouped by what they are — and only those: the list IS the rule in
 * `mayConverse`, so a pupil sees staff and nothing else, and no page has to
 * explain a greyed-out button.
 *
 * Each row is a two-field form posting the open action, so pressing a name
 * is the whole gesture: no compose step, no subject line. The first message
 * is written in the room.
 */
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; school?: string; error?: string }>;
}) {
  const t = await getT();
  const session = await requireUser();
  const { q, school: requestedSchool, error } = await searchParams;

  const schoolIds = await conversationSchools(session);
  if (schoolIds.length === 0) redirect("/remarks");
  const schoolId = schoolIds.includes(requestedSchool ?? "") ? (requestedSchool as string) : schoolIds[0]!;

  const schools =
    schoolIds.length > 1
      ? await db.school.findMany({ where: { id: { in: schoolIds } }, select: { id: true, name: true }, orderBy: { name: "asc" } })
      : [];

  const people = await peopleToMessage(session, schoolId, q ?? "");
  const groups = ([
    { key: "staff" as const, people: people.filter((p) => p.role === "TEACHER" || p.role === "ADMIN" || p.role === "PRINCIPAL") },
    { key: "pupils" as const, people: people.filter((p) => p.role === "STUDENT") },
    { key: "parents" as const, people: people.filter((p) => p.role === "PARENT") },
  ] satisfies { key: keyof typeof GROUP_KEY; people: Person[] }[]).filter((g) => g.people.length > 0);

  const errorText =
    error === "invalid"
      ? t("convo.errorInvalid")
      : error
        ? t(error as TranslationKey)
        : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/remarks" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("remarks.all")}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t("convo.pickPerson")}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t("convo.rule")}</p>
      </div>

      {errorText && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {errorText}
        </p>
      )}

      <form method="get" role="search" className="space-y-3">
        {schools.length > 1 && (
          <nav aria-label={t("convo.chooseSchool")} className="flex flex-wrap gap-2">
            {schools.map((s) => (
              <Link
                key={s.id}
                href={`/remarks/people?school=${s.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  s.id === schoolId ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted hover:text-fg"
                }`}
              >
                {s.name}
              </Link>
            ))}
          </nav>
        )}
        <input type="hidden" name="school" value={schoolId} />
        <div className="relative">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            autoFocus
            placeholder={t("convo.searchPeople")}
            aria-label={t("convo.searchPeople")}
            className="min-h-12 w-full rounded-[--radius-md] border border-border bg-surface pl-11 pr-4 text-[0.9375rem] outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/40"
          />
        </div>
      </form>

      {groups.length === 0 ? (
        <EmptyState
          icon={<UsersThreeIcon weight="duotone" className="size-8" />}
          title={q ? t("convo.nothingMatches", { query: q }) : t("convo.emptyPeople")}
          description={q ? undefined : t("convo.rule")}
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`group-${group.key}`}>
              <h2 id={`group-${group.key}`} className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                {t(GROUP_KEY[group.key])} · {group.people.length}
              </h2>
              <ul className="divide-y divide-border overflow-hidden rounded-[--radius-lg] border border-border bg-surface">
                {group.people.map((person) => (
                  <li key={person.userId}>
                    <form action={openConversationAction} className="flex items-center gap-3 p-3.5">
                      <input type="hidden" name="schoolId" value={schoolId} />
                      <input type="hidden" name="userId" value={person.userId} />
                      {person.membershipId ? (
                        <Link href={`/people/${person.membershipId}`} className="shrink-0" aria-label={t("person.viewProfile")}>
                          <Avatar avatarKey={person.avatarKey} name={person.name} size="md" />
                        </Link>
                      ) : (
                        <Avatar avatarKey={person.avatarKey} name={person.name} size="md" />
                      )}
                      <span className="min-w-0 flex-1">
                        {person.membershipId ? (
                          <Link href={`/people/${person.membershipId}`} className="block truncate font-semibold text-fg hover:underline">
                            {person.name}
                          </Link>
                        ) : (
                          <span className="block truncate font-semibold text-fg">{person.name}</span>
                        )}
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-fg-muted">
                          <Badge tone="neutral" size="sm">
                            {t(ROLE_META[person.role as Role].labelKey)}
                          </Badge>
                          {person.detail && <span className="truncate">{person.detail}</span>}
                        </span>
                      </span>
                      {/* Icon-only on a phone: the word costs the name its
                          room, and the paper plane is the one icon everybody
                          reads as "send". The label stays for screen readers. */}
                      <button
                        type="submit"
                        aria-label={t("convo.startWith", { name: person.name })}
                        className="inline-flex size-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent text-sm font-semibold text-accent-fg hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:w-auto sm:px-3.5"
                      >
                        <PaperPlaneTiltIcon weight="bold" className="size-4" />
                        <span className="hidden sm:inline">{t("convo.message")}</span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
