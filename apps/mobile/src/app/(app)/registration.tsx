import { BackTo } from "@/components/back-to";
import { RegistrationScreen } from "@/screens/academics/registration";

/** Not a tab: "‹ Back" above the title. A student's course registration for the term (the college's academics, 4 Oct 2026). */
export default function Route() {
  return (
    <BackTo fallback="/(app)/more">
      <RegistrationScreen />
    </BackTo>
  );
}
