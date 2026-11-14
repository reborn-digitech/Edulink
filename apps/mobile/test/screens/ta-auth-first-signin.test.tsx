import { fireEvent, screen } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createApiClient } from "@edulink/api-client";
import { renderApp } from "../utils";
import { __setApiClient } from "@/lib/api";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { SessionProvider } from "@/lib/session";
import FirstSignIn from "@/app/(auth)/first-signin";
import { json } from "./staff-harness";

/**
 * TA-502 (testing analysis of 13 November 2026, Low, Functional): the first sign-in's button woke at eight
 * characters while the password rule, and now the contract, refuse anything under ten; a pupil typing nine was
 * sent to the server to be refused. The button now waits for ten.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

async function mount() {
  const store = memoryStore({});
  __setKeyStore(store);
  const fetch = jest.fn(async () => json({ error: "Not found", code: "NOT_FOUND" }, 404));
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => store.get(KEYS.token), fetch: fetch as unknown as typeof globalThis.fetch }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  await renderApp(
    <QueryClientProvider client={client}>
      <SessionProvider>
        <FirstSignIn />
      </SessionProvider>
    </QueryClientProvider>,
  );
  return fetch;
}

describe("TA-502: the first sign-in's button waits for the rule's ten characters", () => {
  it("TA-502: disabled at nine characters, enabled at ten", async () => {
    await mount();
    await fireEvent.changeText(screen.getByLabelText("Your handle"), "zz.pupil");
    await fireEvent.changeText(screen.getByLabelText("Your code"), "ABCD-2345");
    await fireEvent.changeText(screen.getByLabelText("Choose a password"), "zzriver77");
    expect(screen.getByRole("button", { name: "Sign in" }).props.accessibilityState?.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Choose a password"), "zzriver771");
    expect(screen.getByRole("button", { name: "Sign in" }).props.accessibilityState?.disabled).toBe(false);
  });
});
