"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { markWelcomed } from "@/lib/student-welcome";

/** The pupil put their welcome away: it is not shown again, on this device or another. */
export async function dismissWelcome(): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };
  await markWelcomed(session);
  revalidatePath("/student");
  return { ok: true };
}
