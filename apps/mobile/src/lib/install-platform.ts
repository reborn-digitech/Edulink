/** The web target: localStorage has no install to outlive, so no launch is a fresh install. */
export async function claimFreshInstall(): Promise<boolean> {
  return false;
}
