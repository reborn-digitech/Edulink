import { StaffRoster } from "@/screens/staff/staff";
import { useRole } from "@/lib/session";

export default function Route() {
  const role = useRole();
  void role;
  return <StaffRoster />;
}
