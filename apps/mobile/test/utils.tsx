import { render, type RenderOptions } from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";

/** Render inside the app's providers, so labels are words and not keys. */
export function renderApp(ui: ReactElement, options?: RenderOptions) {
  const wrapper = ({ children }: { children: ReactNode }) => <I18nProvider initial="en">{children}</I18nProvider>;
  return render(ui, { wrapper, ...options });
}
