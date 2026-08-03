"use server";

import { revalidatePath } from "next/cache";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { addSlot, removeSlot } from "@/lib/experts";

type Result = { ok: boolean; error?: string };

async function run(work: () => Promise<void>): Promise<Result> {
  try {
    await work();
    revalidatePath("/expert/availability");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[expert-availability]", error);
    return { ok: false, error: "Something went wrong." };
  }
}

export async function offer(startsAt: string, endsAt: string, note: string): Promise<Result> {
  return run(async () =>
    addSlot(await requireApiUser(), {
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      note,
    }),
  );
}

export async function withdraw(slotId: string): Promise<Result> {
  return run(async () => removeSlot(await requireApiUser(), slotId));
}
