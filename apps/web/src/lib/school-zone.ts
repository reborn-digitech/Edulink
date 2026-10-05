import { cache } from "react";
import { db } from "./db";
import { formatInZone, safeTimeZone } from "./dates";

/** The school's time zone, read once per request; a missing or bad stored zone reads as Asia/Kolkata (safeTimeZone). */
export const schoolZone = cache(async (schoolId: string | null | undefined): Promise<string> => {
  if (!schoolId) return safeTimeZone(null);
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } });
  return safeTimeZone(school?.timezone);
});

/**
 * An instant as the app prints one, "05/10/2026, 3:07 PM" in the school's zone. Pages had `toLocaleString()`, which
 * prints in the server's locale and zone (US style on the dev box, A3-journeys-31) and differs from the browser's.
 */
export async function momentFormatter(schoolId: string | null | undefined): Promise<(d: Date | string) => string> {
  const zone = await schoolZone(schoolId);
  return (d) => formatInZone(typeof d === "string" ? new Date(d) : d, zone);
}
