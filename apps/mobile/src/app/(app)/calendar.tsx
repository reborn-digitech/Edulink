import { StaffCalendar } from "@/screens/staff/calendar";
import { useRole } from "@/lib/session";

export default function Route() {
  const role = useRole();
  void role;
  return <StaffCalendar />;
}
