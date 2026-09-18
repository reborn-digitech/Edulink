"use client";

import { useRouter } from "next/navigation";
import { DateField } from "@/components/ui/field";
import { useT } from "@/lib/i18n";

/**
 * Any day, typed or picked: the board's URL carries the day, so the field
 * just moves the page. Unlike the staff register there is no ceiling at
 * today — tomorrow's cover is planned the evening before.
 */
export function DayPicker({ dateKey }: { dateKey: string }) {
  const t = useT();
  const router = useRouter();
  return (
    <DateField
      label={t("staffAttendance.date")}
      value={dateKey}
      className="w-full sm:w-64"
      onChange={(e) => {
        const next = e.target.value;
        if (!next || next === dateKey) return;
        router.push(`/admin/substitutions?date=${next}`);
      }}
    />
  );
}
