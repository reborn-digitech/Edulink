import { useEffect } from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderApp } from "../utils";
import { Empty, Row, Screen, Text, ToastProvider, useToast } from "@/components";
import { BackCtx } from "@/components/chrome";

/**
 * The shared chrome every screen now stands on: "‹ Back" on a screen that is
 * not a tab, toasts that say a thing happened, and rows that look tappable.
 */
describe("back navigation", () => {
  it("a screen outside a BackTo route has no back button", async () => {
    await renderApp(
      <Screen title="ZZ Timetable">
        <Text>body</Text>
      </Screen>,
    );
    expect(screen.getByRole("header")).toHaveTextContent("ZZ Timetable");
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });

  it("a screen its route wraps shows Back above the title, and Back calls the route's handler", async () => {
    const onBack = jest.fn();
    await renderApp(
      <BackCtx.Provider value={{ onBack }}>
        <Screen title="ZZ Class 3A">
          <Text>body</Text>
        </Screen>
      </BackCtx.Provider>,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("the ground of a screen", () => {
  it("in light draws the role's colour washing down behind the title, and in dark does not", async () => {
    const rn = jest.requireActual("react-native") as { useColorScheme: () => string };
    const spy = jest.spyOn(rn, "useColorScheme");
    spy.mockReturnValue("light");
    const light = await renderApp(
      <Screen title="ZZ Today">
        <Text>body</Text>
      </Screen>,
    );
    // Hidden from the screen reader on purpose, so the query has to look past that.
    expect(screen.getByTestId("wash", { includeHiddenElements: true })).toBeTruthy();
    await light.unmount();
    spy.mockReturnValue("dark");
    await renderApp(
      <Screen title="ZZ Today">
        <Text>body</Text>
      </Screen>,
    );
    expect(screen.queryByTestId("wash", { includeHiddenElements: true })).toBeNull();
    spy.mockRestore();
  });
});

function SaysSaved({ message, tone }: { message: string; tone?: "ok" | "danger" | "info" }) {
  const toast = useToast();
  useEffect(() => {
    toast.show(message, tone);
  }, [toast, message, tone]);
  return null;
}

describe("toasts", () => {
  it("show the sentence as an alert a screen reader hears", async () => {
    const { unmount } = await renderApp(
      <ToastProvider>
        <SaysSaved message="ZZ Saved" />
      </ToastProvider>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Saved");
    unmount();
  });

  it("a refusal toast carries the server's sentence", async () => {
    const { unmount } = await renderApp(
      <ToastProvider>
        <SaysSaved message="ZZ Not now." tone="danger" />
      </ToastProvider>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Not now.");
    unmount();
  });

  it("outside a provider, show() does nothing rather than throw", async () => {
    await renderApp(<SaysSaved message="ZZ nobody hears" />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("rows and empty states", () => {
  it("a tappable row with an icon is one named button that fires once", async () => {
    const onPress = jest.fn();
    await renderApp(<Row title="ZZ Social Media" caption="3 new" icon="megaphone" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "ZZ Social Media, 3 new" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("a plain row is not a button", async () => {
    await renderApp(<Row title="ZZ Period 1" caption="08:00" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("ZZ Period 1")).toBeTruthy();
  });

  it("an empty state keeps its words and its door", async () => {
    const onPress = jest.fn();
    await renderApp(<Empty title="ZZ Nothing yet" body="ZZ Come back later." icon="calendar" action={<Row title="ZZ Open calendar" onPress={onPress} />} />);
    expect(screen.getByText("ZZ Nothing yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "ZZ Open calendar" }));
    expect(onPress).toHaveBeenCalled();
  });
});
