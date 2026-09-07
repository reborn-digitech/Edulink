import { FamilyMeetings } from "@/screens/family/meetings";
import { useRole } from "@/lib/session";

export default function Route() {
  const role = useRole();
  void role;
  return <FamilyMeetings />;
}
