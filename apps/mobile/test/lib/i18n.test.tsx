import { renderHook, act, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { I18nProvider, useLocale, useT } from "@/lib/i18n";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";

describe("i18n on the phone", () => {
  it("defaults to the device language, folds English under a gap, and keeps a choice on the device", async () => {
    const store = memoryStore();
    __setKeyStore(store);
    const wrapper = ({ children }: { children: ReactNode }) => <I18nProvider>{children}</I18nProvider>;
    const { result } = await renderHook(() => ({ t: useT(), ...useLocale() }), { wrapper });
    expect(result.current.locale).toBe("en");
    expect(result.current.t("login.title")).toBe("Log in");
    await act(async () => result.current.setLocale("hi"));
    await waitFor(() => expect(result.current.locale).toBe("hi"));
    expect(result.current.t("login.title")).not.toBe("Log in");
    expect(result.current.t("login.title").length).toBeGreaterThan(0);
    expect(await store.get(KEYS.locale)).toBe("hi");
  });

  it("a saved choice wins over the device language on the next start", async () => {
    const store = memoryStore({ [KEYS.locale]: "mr" });
    __setKeyStore(store);
    const wrapper = ({ children }: { children: ReactNode }) => <I18nProvider>{children}</I18nProvider>;
    const { result } = await renderHook(() => useLocale(), { wrapper });
    await waitFor(() => expect(result.current.locale).toBe("mr"));
  });
});
