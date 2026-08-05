import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SealCheckIcon, UserIcon } from "@phosphor-icons/react/ssr";
import { requireExpert, AccessError } from "@/lib/tenancy";
import { getOwnProfile } from "@/lib/experts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profile" };

/**
 * The expert's own profile.
 *
 * This link has been in the side rail and the ⌘K palette since experts existed,
 * and until now it went to a 404 — the app's own navigation pointing at nothing.
 *
 * STANDING IS SHOWN, NEVER EDITED. "Published" decides whether any school can
 * find this person and "verified" says a human has checked who they are; both
 * belong to whoever runs the server. Showing them read-only answers the question
 * an unpublished expert actually has — "why is nobody booking me?" — which an
 * empty bookings page does not.
 */
export default async function ExpertProfilePage() {
  const session = await requireExpert();

  let profile;
  try {
    profile = await getOwnProfile(session);
  } catch (error) {
    // An EXPERT session with no ExpertProfile row should not exist, but a 500
    // is the wrong way to find out. Same answer the other pages give.
    if (error instanceof AccessError) notFound();
    throw error;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Your profile</h1>
        <p className="mt-1 text-sm text-fg-muted">
          What a school reads before booking an hour of your time.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={profile.published ? "ok" : "warn"} size="sm">
          {profile.published ? "Listed" : "Not listed yet"}
        </Badge>
        {profile.verified && (
          <Badge tone="accent" size="sm">
            <SealCheckIcon weight="fill" className="mr-1 inline size-3" />
            Verified
          </Badge>
        )}
        <p className="text-xs text-fg-muted">
          {profile.published
            ? "Schools can find you and book your times."
            : "Nobody can see you yet. Whoever runs EduLink lists a profile once they have checked it."}
        </p>
      </div>

      <Card>
        <CardHeader
          icon={<UserIcon weight="duotone" className="size-5" />}
          title="About you"
          description="Saved as soon as you press the button — there is no draft"
        />
        <CardBody>
          <ProfileForm
            headline={profile.headline}
            bio={profile.bio}
            organisation={profile.organisation}
            specialisms={profile.specialisms}
            timezone={profile.timezone}
        offering={profile.offering}
        mentorCapacity={profile.mentorCapacity}
          />
        </CardBody>
      </Card>
    </div>
  );
}
