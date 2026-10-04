/**
 * A fresh install, told apart from a restart (PH-5, campaign 2026-10-04).
 * The iOS keychain outlives deleting the app, so a reinstall on the same
 * iPhone would start signed in as the last person. A file in the app's
 * document directory does not outlive it: missing means this is the first
 * launch since the install, and the session clears what the keychain kept.
 */
import { File, Paths } from "expo-file-system";

const MARKER = "edulink-installed";

/** True once per install: the marker was missing and is now written. */
export async function claimFreshInstall(): Promise<boolean> {
  try {
    const marker = new File(Paths.document, MARKER);
    if (marker.exists) return false;
    marker.write("1");
    return true;
  } catch {
    // A document directory that cannot be read or written: treat the
    // launch as a restart rather than signing the person out every time.
    return false;
  }
}
