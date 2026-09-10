import { useRole, useSession } from "@/lib/session";
import { ConsoleHome } from "@/screens/shared/console-home";
import { TeacherHome } from "@/screens/teacher/home";
import { ParentHome } from "@/screens/family/parent-home";
import { StudentHome } from "@/screens/family/student-home";
import { PrincipalHome } from "@/screens/staff/principal-home";
import { AdminHome } from "@/screens/staff/admin-home";
import { ExpertHome } from "@/screens/expert/home";

/** The home tab: each role's "today", "overview", "dashboard" or "bookings" — the same page the web opens first. */
export default function Home() {
  const role = useRole();
  const session = useSession();
  // No school role: the operator's or the content team's console (the layout gives them a stack).
  if (role === null && session.status === "signed-in") return <ConsoleHome me={session.me} />;
  if (role === "TEACHER") return <TeacherHome />;
  if (role === "PARENT") return <ParentHome />;
  if (role === "STUDENT") return <StudentHome />;
  if (role === "PRINCIPAL") return <PrincipalHome />;
  if (role === "ADMIN") return <AdminHome />;
  if (role === "EXPERT") return <ExpertHome />;
  return null;
}
