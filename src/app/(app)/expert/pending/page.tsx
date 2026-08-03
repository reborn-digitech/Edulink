import type { Metadata } from "next";
import { HourglassIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = { title: "Awaiting review" };

/**
 * Where an unpublished expert lands.
 *
 * Accepting an invitation creates an account, not a listing. Saying so plainly
 * is the point of this page — an expert who signs up and then finds an empty
 * app assumes it is broken.
 */
export default async function ExpertPendingPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-lg py-10">
      <EmptyState
        icon={<HourglassIcon weight="duotone" className="size-8" />}
        title="Your profile is being reviewed"
        description="Your account is set up. Schools cannot see or book you until someone at EduLink has checked your profile — you will not need to do anything else."
      />
    </div>
  );
}
