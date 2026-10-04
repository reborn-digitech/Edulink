import { BackTo } from "@/components/back-to";
import { useRole } from "@/lib/session";
import { FamilyAcademicsScreen } from "@/screens/academics/family";
import { StudentAcademicsScreen } from "@/screens/academics/student";

/** Not a tab: "‹ Back" above the title. A college student's academics, or a guardian's view of a child's attendance (4 Oct 2026). */
export default function Route() {
  const role = useRole();
  return <BackTo fallback="/(app)/more">{role === "PARENT" ? <FamilyAcademicsScreen /> : <StudentAcademicsScreen />}</BackTo>;
}
