import { ReviewDesk } from "@/screens/staff/reviews";
import { useRole } from "@/lib/session";

export default function Route() {
  const role = useRole();
  void role;
  return <ReviewDesk />;
}
