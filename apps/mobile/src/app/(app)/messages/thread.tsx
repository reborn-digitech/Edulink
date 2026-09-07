import { Thread } from "@/screens/teacher/thread";
import { useRole } from "@/lib/session";

export default function Route() {
  const role = useRole();
  void role;
  return <Thread />;
}
