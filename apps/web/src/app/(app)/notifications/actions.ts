"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * Notification read state.
 *
 * Every mutation is scoped by `userId` from the session, so an id belonging to
 * someone else matches zero rows rather than erroring — the same shape as the
 * rest of the app's writes.
 */

export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };

  await db.notification.updateMany({
    where: { id, userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
  return { ok: true };
}

export async function markAllRead(): Promise<{ ok: boolean; count: number }> {
  const session = await getSession();
  if (!session) return { ok: false, count: 0 };

  const result = await db.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
  return { ok: true, count: result.count };
}

/**
 * Clears notifications the user has already read.
 *
 * Deliberately never touches unread ones: "clear" should not be able to make a
 * message about a child vanish before anyone saw it.
 */
export async function clearRead(): Promise<{ ok: boolean; count: number }> {
  const session = await getSession();
  if (!session) return { ok: false, count: 0 };

  const result = await db.notification.deleteMany({
    where: { userId: session.user.id, readAt: { not: null } },
  });

  revalidatePath("/notifications");
  return { ok: true, count: result.count };
}
