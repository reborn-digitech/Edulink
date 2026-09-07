import { FamilyExams } from "@/screens/family/exams";
import { useRole } from "@/lib/session";

export default function Route() {
  const role = useRole();
  void role;
  return <FamilyExams />;
}
