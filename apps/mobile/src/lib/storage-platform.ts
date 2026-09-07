import type { KeyStore } from "./storage";

/** The web target and the test runner: no secure enclave; localStorage stands in. */
export function platformKeyStore(): KeyStore | null {
  return null;
}
