import type { Metadata } from "next";
import { readExpertInvite } from "@/lib/experts";
import { AcceptForm } from "./form";
import { getT } from "@/lib/i18n/server";

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
  const { token } = await params;
  const state = await readExpertInvite(token);

  if (!state.ok) {
    return (
      <main className="mx-auto max-w-md px-5 py-16 text-center">
        <h1 className="text-xl font-bold text-fg">That invitation cannot be used</h1>
        <p className="mt-2 text-sm text-fg-muted">
          It may have expired, or already been used. Ask whoever sent it for a new link.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-fg">Join EduLink as an expert</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Tell schools what you do. Your profile is reviewed before any school can see or book you.
      </p>
      <AcceptForm token={token} suggestedName={state.name} suggestedEmail={state.email} />
    </main>
  );
}
