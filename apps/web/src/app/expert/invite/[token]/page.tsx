import type { Metadata } from "next";
import { readExpertInvite } from "@/lib/experts";
import { applicationForInvite } from "@/lib/expert-applications"; // expert-registration (15 Oct 2026)
import { AcceptForm } from "./form";
import { getT } from "@/lib/i18n/server";
import Link from "next/link";
import { LinkBreakIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
  title: t("meta.expertInvite"),
  robots: { index: false, follow: false },
};
}

/**
 * Accepting an expert invitation.
 *
 * EVERY REFUSAL READS THE SAME. A forged token, an expired one and one already
 * used all produce the identical message — the same rule the pupil invite flow
 * follows, because a link that says "expired" confirms to whoever is holding it
 * that the link was once real.
 */
export default async function ExpertInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const t = await getT();
  const { token } = await params;
  const state = await readExpertInvite(token);

  if (!state.ok) {
    return (
      <main className="mx-auto max-w-md px-5 py-16">
        <EmptyState
          heading="h1"
          icon={<LinkBreakIcon weight="duotone" className="size-8" />}
          title={t("expert.inviteInvalid")}
          description={t("expert.inviteInvalidBody")}
          action={
            <Button asChild variant="secondary">
              <Link href="/login">{t("expert.inviteInvalidCta")}</Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-fg">{t("expert.joinTitle")}</h1>
      <p className="mt-2 text-sm text-fg-muted">{t("expert.joinBody")}</p>
      {/* expert-registration (15 Oct 2026): an invitation from an approved application brings the headline the applicant wrote. */}
      <AcceptForm token={token} suggestedName={state.name} suggestedEmail={state.email} suggestedHeadline={(await applicationForInvite(state.inviteId))?.headline ?? null} />
    </main>
  );
}
