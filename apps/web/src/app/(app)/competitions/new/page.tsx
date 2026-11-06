import { redirect } from "next/navigation";
import { requireRole } from "@/lib/tenancy";

/**
 * decision 0007 (6 Nov 2026): a school's competition is added as a calendar event, so the separate "Post a
 * competition" page sends the office to the calendar, where the competition's fields sit beside the dates. The
 * phone's older door (POST /api/v1/contest/competitions) still makes a draft, which gets its calendar row when
 * published with a start date.
 */
export default async function NewCompetitionPage() {
  await requireRole("ADMIN");
  redirect("/admin/calendar");
}
