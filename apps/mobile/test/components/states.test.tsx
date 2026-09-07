import { screen, fireEvent } from "@testing-library/react-native";
import { renderApp as render } from "../utils";
import { Button, Empty, Failed, Field, Loading } from "@/components";

/** One render per test: the shared set speaks to a screen reader. */
describe("the shared components", () => {
  it("a button has a role and its label, and presses", async () => {
    const onPress = jest.fn();
    await render(<Button label="Save marks" onPress={onPress} />);
    fireEvent.press(screen.getByRole("button", { name: "Save marks" }));
    expect(onPress).toHaveBeenCalled();
  });

  it("a busy button says so and cannot be pressed", async () => {
    await render(<Button label="Saving" busy onPress={() => {}} />);
    const saving = screen.getByRole("button", { name: "Saving" });
    expect(saving).toBeBusy();
    expect(saving).toBeDisabled();
  });

  it("loading announces itself as a progress bar with words", async () => {
    await render(<Loading />);
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(screen.getByLabelText("Loading…")).toBeTruthy();
  });

  it("an empty state is readable", async () => {
    await render(<Empty title="Nothing yet" body="Come back tomorrow." />);
    expect(screen.getByText("Nothing yet")).toBeTruthy();
    expect(screen.getByText("Come back tomorrow.")).toBeTruthy();
  });

  it("an error is an alert with a retry the screen reader can name", async () => {
    const retry = jest.fn();
    await render(<Failed message="Could not load" onRetry={retry} />);
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalled();
  });

  it("a field is labelled and reads its error", async () => {
    await render(<Field label="Password" value="" onChangeText={() => {}} error="Enter your password." />);
    expect(screen.getByLabelText("Password")).toBeTruthy();
    expect(screen.getByText("Enter your password.")).toBeTruthy();
  });
});
