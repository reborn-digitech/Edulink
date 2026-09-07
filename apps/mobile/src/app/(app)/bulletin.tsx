import { FamilyBulletin } from "@/screens/family/bulletin";
import { useRole } from "@/lib/session";

export default function Route() {
  const role = useRole();
  void role;
  return <FamilyBulletin />;
}
