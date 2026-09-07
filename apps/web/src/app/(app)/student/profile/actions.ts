"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { AVATAR_PRESETS } from "@/components/ui/avatar";
import { audit } from "@/lib/audit";
import { setOwnBirthdate } from "@/lib/birthdate";

export type ProfileState = { ok: boolean; errors: Record<string, string> };

/**
 * A student — or, since the teacher profile page reuses this same form — a
 * teacher editing their own profile.
 *
 * Scoped to the signed-in user, so there is no id to forge. The avatar is
 * validated against the known preset list rather than stored as free text —
 * otherwise `avatarKey` becomes an unsanitised string that renders into the
 * page on every screen the person appears on.
 *
 * The legal `name` is deliberately NOT editable here: it is what the register
 * and the school's records use, so changing it belongs with the office.
 */
export async function saveProfile(input: {
  preferredName: string;
  bio: string;
  avatarKey: string;
  birthdate?: string;
}): Promise<ProfileState> {
  const session = await getSession();
  if (!session) return { ok: false, errors: { _form: (await getT())("common.logInAgain") } };
  if (session.role !== "STUDENT" && session.role !== "TEACHER") {
    return { ok: false, errors: { _form: (await getT())("student.onlyStudentEdits") } };
  }

  const errors: Record<string, string> = {};

  const preferredName = input.preferredName.trim();
  if (preferredName.length > 60) errors.preferredName = "That is a bit long — 60 characters max.";

  const bio = input.bio.trim();
  if (bio.length > 600) errors.bio = "Keep it under 600 characters.";

  if (!AVATAR_PRESETS.includes(input.avatarKey)) {
    errors.avatarKey = "Pick one of the avatars.";
  }

  // The date of birth has its own rule (birthdate.ts): staff always, a pupil
  // only while nobody is linked to them. Saved only when it changed.
  if (typeof input.birthdate === "string") {
    const current = await db.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { birthdate: true } });
    const before = current.birthdate?.toISOString().slice(0, 10) ?? "";
    if (input.birthdate !== before) {
      if (input.birthdate === "") {
        errors.birthdate = (await getT())("invite.useRealDate");
      } else {
        const result = await setOwnBirthdate(session, input.birthdate);
        if (!result.ok) errors.birthdate = (await getT())(result.errorKey);
      }
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  await db.user.update({
    where: { id: session.user.id },
    data: {
      preferredName: preferredName || null,
      bio: bio || null,
      avatarKey: input.avatarKey,
    },
  });

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "profile.update",
    targetType: "User",
    targetId: session.user.id,
  });

  revalidatePath("/student/profile");
  revalidatePath("/student");
  revalidatePath("/teacher/profile");
  return { ok: true, errors: {} };
}
