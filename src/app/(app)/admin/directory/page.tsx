import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { readOwnProfileSettings, listContactCandidates } from "@/lib/school-profile";
import { getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { DirectoryForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("explore.directoryTitle") };
}

/** The admin's side of the directory: the profile, the contact, the switch. */
export default async function AdminDirectoryPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const [settings, freshCandidates] = await Promise.all([
    readOwnProfileSettings(ctx),
    listContactCandidates(ctx),
  ]);
  // The named contact stays selectable even when the fresh list no longer
  // carries their membership (deduped to a sibling one, or role changed):
  // otherwise the select silently shows "Not named" over a set contact.
  const candidates =
    settings.admissionsContactMembershipId &&
    settings.contactName &&
    !freshCandidates.some((c) => c.membershipId === settings.admissionsContactMembershipId)
      ? [
          {
            membershipId: settings.admissionsContactMembershipId,
            name: settings.contactName,
            role: "",
          },
          ...freshCandidates,
        ]
      : freshCandidates;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {t("explore.directoryTitle")}
          </h1>
          <Badge tone={settings.published ? "ok" : "neutral"} size="sm">
            {settings.published ? t("explore.publishedBadge") : t("explore.unpublishedBadge")}
          </Badge>
        </div>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">{t("explore.directoryBody")}</p>
        {settings.published && (
          <p className="mt-1 text-sm">
            <Link href={`/explore/${ctx.schoolId}`} className="font-medium text-accent hover:underline">
              {t("explore.title")} →
            </Link>
          </p>
        )}
      </div>

      <DirectoryForm
        initialAbout={settings.about}
        initialContactId={settings.admissionsContactMembershipId}
        contactStillValid={settings.contactStillValid}
        published={settings.published}
        candidates={candidates}
      />
    </div>
  );
}
