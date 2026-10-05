"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { setMyPublicProfile } from "@/lib/faculty-profile";

/** My public page's one form (5 Oct 2026): publish, refresh or take down; back to /faculty/profile with ?ok= or ?error=. */
export async function setPublicProfileAction(formData: FormData): Promise<void> {
  const t = await getT();
  try {
    await setMyPublicProfile(await requireApiUser(), String(formData.get("publish") ?? "") === "1");
  } catch (error) {
    if (error instanceof AccessError) redirect(`/faculty/profile?error=${encodeURIComponent(t(error.key, error.vars))}`);
    throw error;
  }
  revalidatePath("/faculty/profile");
  redirect(`/faculty/profile?ok=${encodeURIComponent(t("collegeDesks.profileSaved"))}`);
}
