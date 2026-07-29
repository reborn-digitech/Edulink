"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { dismissReports, removeContent } from "@/lib/safety";

export type SafetyResult = { ok: boolean; error?: string };

export async function takeDown(input: {
  targetType: "POST" | "COMMENT";
  targetId: string;
  note: string;
}): Promise<SafetyResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please log in again." };

  try {
    await removeContent(session, input);
    revalidatePath("/admin/safety");
    revalidatePath("/bulletin");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[takeDown]", error);
    return { ok: false, error: "Something went wrong." };
  }
}

export async function dismiss(input: {
  targetType: "POST" | "COMMENT" | "USER";
  targetId: string;
  note: string;
}): Promise<SafetyResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Please log in again." };

  try {
    await dismissReports(session, input);
    revalidatePath("/admin/safety");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[dismiss]", error);
    return { ok: false, error: "Something went wrong." };
  }
}
