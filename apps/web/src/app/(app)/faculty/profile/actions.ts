"use server";

import { requireApiUser } from "@/lib/tenancy";
import { setMyPublicProfile } from "@/lib/faculty-profile";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";

/** My public page's one form (5 Oct 2026): publish, refresh or take down; answers in place on /faculty/profile (A3-journeys-27). */
export async function setPublicProfileAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      await setMyPublicProfile(await requireApiUser(), String(formData.get("publish") ?? "") === "1");
      return "collegeDesks.profileSaved";
    },
    { revalidate: ["/faculty/profile"] },
  );
}
