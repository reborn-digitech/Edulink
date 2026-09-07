import { Inbox } from "@/screens/teacher/messages";
import { useRole } from "@/lib/session";

export default function Route() {
  const role = useRole();
  void role;
  return <Inbox />;
}
