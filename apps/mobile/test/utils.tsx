import { render, type RenderOptions } from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";

/**
 * Requests a screen makes while it mounts are answered only after render()
 * has returned to the test. Every screen test asserts the loading state
 * first, and the fake API answering as a microtask made that a race the
 * runner lost under load (CI run 34151980679: "Unable to find an element
 * with role: progressbar"). The fake fetches await this before answering;
 * the hold is released on a timer scheduled once render is done, so the
 * test's next synchronous line always sees the screen still loading, and
 * a findBy* after it sees the data. Requests made later pass straight through,
 * and so does /api/v1/me: the session must be known when render returns, as
 * it was before the hold, so that every query a role enables starts during
 * the mount and lands in the same batch as the rest of the screen's data.
 */
let hold: Promise<void> | null = null;
export function untilRendered(): Promise<void> {
  return hold ?? Promise.resolve();
}

/** Render inside the app's providers, so labels are words and not keys. */
export async function renderApp(ui: ReactElement, options?: RenderOptions) {
  const wrapper = ({ children }: { children: ReactNode }) => <I18nProvider initial="en">{children}</I18nProvider>;
  let release: () => void = () => {};
  hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    return await render(ui, { wrapper, ...options });
  } finally {
    hold = null;
    setTimeout(release, 0);
  }
}
