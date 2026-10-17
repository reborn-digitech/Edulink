"use server";

import { requireApiUser } from "@/lib/tenancy";
import { removeMyPublicPhoto, setMyPublicPhoto, setMyPublicProfile } from "@/lib/faculty-profile";
import { AccessError } from "@/lib/access-error";
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

/**
 * My public photo (website-three, 17 Oct 2026): a picture of me with my own consent tick, for the college website's
 * Faculty page and the public faculty page while the website is live; or removed. Answers in place on /faculty/profile.
 */
export async function setPublicPhotoAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      const file = formData.get("photo");
      if (!(file instanceof File) || file.size === 0) throw new AccessError("refusal.fileEmpty");
      const done = await setMyPublicPhoto(await requireApiUser(), file, formData.get("consent") === "on");
      if (!done.ok) throw new AccessError(done.errorKey, "FORBIDDEN", done.vars);
      return "facultyPhoto.saved";
    },
    { revalidate: ["/faculty/profile"] },
  );
}

export async function removePublicPhotoAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      await removeMyPublicPhoto(await requireApiUser());
      return "facultyPhoto.removed";
    },
    { revalidate: ["/faculty/profile"] },
  );
}
