"use client";

import { useRouter } from "next/navigation";
import { DateField } from "@/components/ui/field";
import { useT } from "@/lib/i18n";

/**
 * Any day up to today, typed or picked: the register's URL carries the day,
 * so the field just moves the page. The arrows beside it are plain links.
 */
export function DayPicker({ dateKey, today, month }: { dateKey: string; today: string; month?: string }) {
  const t = useT();
  const router = useRouter();
  return (
    <DateField
      label={t("staffAttendance.date")}
      value={dateKey}
      max={today}
      className="w-full sm:w-64"
      onChange={(e) => {
        const next = e.target.value;
        if (!next || next > today || next === dateKey) return;
        router.push(`/admin/staff-attendance?date=${next}${month ? `&month=${month}` : ""}`);
      }}
    />
  );
}
