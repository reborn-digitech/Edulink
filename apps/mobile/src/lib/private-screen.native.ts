/**
 * The phone refuses screenshots and screen recording while a private screen
 * (marks, report cards) is up. Native only: the web twin beside this file is
 * a no-op, because expo-screen-capture throws on the web target.
 */
import { usePreventScreenCapture } from "expo-screen-capture";

export function usePrivateScreen(): void {
  usePreventScreenCapture();
}
