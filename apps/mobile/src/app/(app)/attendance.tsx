import { BackTo } from "@/components/back-to";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRole } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { GenericScreen } from "@/components/generic-screen";
import { Register } from "@/screens/teacher/register";
import { FamilyAttendance } from "@/screens/family/attendance";
import { AdminAttendance } from "@/screens/staff/attendance";
import { AttendanceHistory } from "@/screens/staff/attendance-history";

/**
 * One tab, four readers. A teacher takes the register; a family reads a
 * child's record; the office lands on the school-wide picture (the web's
 * /admin/attendance) and reaches the register and the history from there,
 * by `view`; the head reads the history (the web's /attendance/history).
 */
function RouteInner() {
  const role = useRole();
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string; classId?: string }>();
  if (role === "TEACHER") return <Register />;
  if (role === "PARENT" || role === "STUDENT") return <FamilyAttendance />;
  if (role === "ADMIN") {
    if (params.view === "register" || (params.classId && params.view !== "history")) return <Register />;
    if (params.view === "history") return <AttendanceHistory initialClassId={params.classId ?? null} />;
    return (
      <AdminAttendance
        onOpenRegister={(classId) => router.push({ pathname: "/(app)/attendance", params: { view: "register", classId } } as never)}
        onOpenHistory={() => router.push({ pathname: "/(app)/attendance", params: { view: "history" } } as never)}
      />
    );
  }
  if (role === "PRINCIPAL") return <AttendanceHistory initialClassId={params.classId ?? null} />;
  return <GenericScreen title={t("nav.attendance")} />;
}

/** Not a tab for this role: "‹ Back" above the title. */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more" unlessTab="attendance">
      <RouteInner />
    </BackTo>
  );
}
