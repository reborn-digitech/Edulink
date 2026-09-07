import { Room } from "@/screens/teacher/room";
import { useRole } from "@/lib/session";

export default function Route() {
  const role = useRole();
  void role;
  return <Room />;
}
