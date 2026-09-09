import { useRole } from "@/lib/session";
import { TeacherHome } from "@/screens/teacher/home";
import { ParentHome } from "@/screens/family/parent-home";
import { StudentHome } from "@/screens/family/student-home";
import { PrincipalHome } from "@/screens/staff/principal-home";
import { AdminHome } from "@/screens/staff/admin-home";
import { ExpertHome } from "@/screens/expert/home";

/** The home tab: each role's "today", "overview", "dashboard" or "bookings" — the same page the web opens first. */
export default function Home() {
  const role = useRole();
  if (role === "TEACHER") return <TeacherHome />;
  if (role === "PARENT") return <ParentHome />;
  if (role === "STUDENT") return <StudentHome />;
  if (role === "PRINCIPAL") return <PrincipalHome />;
  if (role === "ADMIN") return <AdminHome />;
  if (role === "EXPERT") return <ExpertHome />;
  return null;
}
