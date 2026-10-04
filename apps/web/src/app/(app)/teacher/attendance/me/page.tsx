import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { MyStaffAttendanceView } from "./view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("staffAttendance.myTitle") };
}

/** A teacher's, the head's and the office's own attendance; every other member of staff has it at /account/attendance (view.tsx). */
export default async function MyStaffAttendancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const ctx = await requireRole("TEACHER", "ADMIN", "PRINCIPAL");
  const { month } = await searchParams;
  return <MyStaffAttendanceView ctx={ctx} requestedMonth={month} base="/teacher/attendance/me" />;
}
