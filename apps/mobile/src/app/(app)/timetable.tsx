import { FamilyTimetable } from "@/screens/family/timetable";
import { useRole } from "@/lib/session";

export default function Route() {
  const role = useRole();
  void role;
  return <FamilyTimetable />;
}
