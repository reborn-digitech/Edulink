import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { bodyOf, calls, child, ID, ME_PARENT, mockRouter, pending, refused, renderFamily, press } from "./family-helpers";
import { ParentSettings } from "@/screens/family/settings";
import { API_BASE } from "@/lib/api";

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
    expect(screen.getByRole("switch", { name: "Push notifications" }).props.value).toBe(true);
    expect(screen.getByRole("switch", { name: "Email" }).props.value).toBe(false);
    await fireEvent(screen.getByRole("switch", { name: "Email" }), "valueChange", true);
    await fireEvent(screen.getByRole("switch", { name: "Use quiet hours" }), "valueChange", true);
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

  it("linking another child is the web's; the rest of the account is More", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: () => SETTINGS });
    await press(await screen.findByRole("button", { name: "Link another" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/parent/link`);
    await press(screen.getByRole("button", { name: "Open" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/more");
    open.mockRestore();
  });

  it("with no child linked, the door is linking one", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: () => ({ ...SETTINGS, children: [] }) });
    expect(await screen.findByText("Link to your child")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Link to my child" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/parent/link`);
    open.mockRestore();
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
