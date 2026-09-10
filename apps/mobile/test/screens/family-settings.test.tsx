import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { bodyOf, calls, child, ID, ME_PARENT, mockRouter, pending, refused, renderFamily, press } from "./family-helpers";
import { ParentSettings } from "@/screens/family/settings";

const SETTINGS = { channels: { push: true, email: false }, quietHours: null, children: [child(ID.child, "ZZ Asha")] };
const PATH = "/api/v1/family/settings";

describe("a guardian's settings", () => {
  it("is loading while the settings are on their way", async () => {
    await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("shows the channels and the children, and saves the switches with quiet hours", async () => {
    const { fetch } = await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: (init) => (init?.method === "POST" ? { ok: true } : SETTINGS) });
    expect(await screen.findByText("ZZ Asha")).toBeTruthy();
    expect(screen.getByText("One child linked")).toBeTruthy();
    expect(screen.getByText("Linked")).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Push notifications" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Email" })).not.toBeChecked();
    await fireEvent.press(screen.getByRole("switch", { name: "Email" }));
    await fireEvent.press(screen.getByRole("switch", { name: "Use quiet hours" }));
    expect(screen.getByLabelText("From").props.value).toBe("21:00");
    await fireEvent.changeText(screen.getByLabelText("Until"), "06:30");
    await press(screen.getByRole("button", { name: "Save notification settings" }));
    await waitFor(() => expect(calls(fetch, PATH).filter((c) => c.init?.method === "POST")).toHaveLength(1));
    expect(bodyOf(calls(fetch, PATH).find((c) => c.init?.method === "POST")!)).toEqual({ channels: { push: true, email: true }, quietHours: { start: "21:00", end: "06:30" } });
    expect(await screen.findByText("Saved")).toBeTruthy();
  });

  it("a quiet hour that is not a time is refused before it is sent", async () => {
    await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: () => ({ ...SETTINGS, quietHours: { start: "21:00", end: "07:00" } }) });
    await fireEvent.changeText(await screen.findByLabelText("From"), "9pm");
    expect(screen.getByText("Use HH:MM.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save notification settings" })).toBeDisabled();
  });

  it("linking another child opens the app's own screen; the rest of the account is More", async () => {
    await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: () => SETTINGS });
    await press(await screen.findByRole("button", { name: "Link another" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/link-child");
    await press(screen.getByRole("button", { name: "Open" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/more");
  });

  it("with no child linked, the door is linking one", async () => {
    await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: () => ({ ...SETTINGS, children: [] }) });
    expect(await screen.findByText("Link to your child")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Link to my child" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/link-child");
  });

  it("a refused save is an alert", async () => {
    await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: (init) => (init?.method === "POST" ? refused(422, "ZZ not saved")(init, new URL("http://api.test/")) : SETTINGS) });
    await press(await screen.findByRole("button", { name: "Save notification settings" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not saved");
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
