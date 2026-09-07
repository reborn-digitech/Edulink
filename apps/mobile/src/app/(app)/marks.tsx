import { MarksGrid } from "@/screens/teacher/marks";
import { useRole } from "@/lib/session";

export default function Route() {
  const role = useRole();
  void role;
  return <MarksGrid />;
}
