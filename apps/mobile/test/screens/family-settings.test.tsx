import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as Sharing from "expo-sharing";
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
    // The school's texts are on unless the guardian has said otherwise: the server's copy carries no answer yet.
    expect(screen.getByRole("switch", { name: "Text messages (SMS)" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "WhatsApp" })).toBeChecked();
    await fireEvent.press(screen.getByRole("switch", { name: "Email" }));
    await fireEvent.press(screen.getByRole("switch", { name: "WhatsApp" }));
    await fireEvent.press(screen.getByRole("switch", { name: "Use quiet hours" }));
    expect(screen.getByLabelText("From").props.value).toBe("21:00");
    await fireEvent.changeText(screen.getByLabelText("Until"), "06:30");
    await press(screen.getByRole("button", { name: "Save notification settings" }));
    await waitFor(() => expect(calls(fetch, PATH).filter((c) => c.init?.method === "POST")).toHaveLength(1));
    expect(bodyOf(calls(fetch, PATH).find((c) => c.init?.method === "POST")!)).toEqual({ channels: { push: true, email: true, sms: true, whatsapp: false }, quietHours: { start: "21:00", end: "06:30" } });
    expect(await screen.findByText("Saved")).toBeTruthy();
  });

  it("a guardian who switched WhatsApp off sees it off", async () => {
    await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: () => ({ ...SETTINGS, channels: { ...SETTINGS.channels, sms: true, whatsapp: false } }) });
    expect(await screen.findByRole("switch", { name: "WhatsApp" })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: "Text messages (SMS)" })).toBeChecked();
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
    // The assistant's card (Phase C) reads its own door; answered here so the one alert on the screen is the save's.
    await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: (init) => (init?.method === "POST" ? refused(422, "ZZ not saved")(init, new URL("http://api.test/")) : SETTINGS), "/api/v1/family/assistant": () => ({ children: [] }) });
    await press(await screen.findByRole("button", { name: "Save notification settings" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not saved");
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("downloads one child's data as a JSON file to the share sheet, one button per child", async () => {
    (Sharing.shareAsync as jest.Mock).mockClear();
    const doc = new TextEncoder().encode(JSON.stringify({ format: "relay-person-export" }));
    const { fetch } = await renderFamily(<ParentSettings />, ME_PARENT, {
      [PATH]: () => ({ ...SETTINGS, children: [child(ID.child, "ZZ Asha"), child(ID.child2, "ZZ Bhavesh")] }),
      "/api/v1/family/export": () => new Response(doc, { status: 200, headers: { "content-type": "application/json; charset=utf-8" } }),
    });
    expect(await screen.findByText("Download my data")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download for ZZ Bhavesh" })).toBeTruthy();
    await press(screen.getByRole("button", { name: "Download for ZZ Asha" }));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalled());
    expect(calls(fetch, "/api/v1/family/export").map((c) => c.url.search)).toEqual([`?student=${ID.child}`]);
    expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringMatching(/relay-export-ZZ Asha\.json$/), expect.objectContaining({ mimeType: "application/json" }));
  });
});

describe("removing a child from the account", () => {
  const LINK = `/api/v1/family/children/${ID.child}/link`;
  const TWO = { ...SETTINGS, children: [child(ID.child, "ZZ Asha"), child(ID.child2, "ZZ Bela", { relation: "SCHOOL" })] };

  it("offers Remove on a family link only, and the button waits for the child's name typed back", async () => {
    const { fetch } = await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: () => TWO });
    await screen.findByText("ZZ Asha");
    expect(screen.getAllByRole("button", { name: /^Remove: / })).toHaveLength(1);
    await press(screen.getByRole("button", { name: "Remove: ZZ Asha" }));
    expect(screen.getByText("Remove this child from my account")).toBeTruthy();
    expect(screen.getByText(/^You will stop seeing ZZ Asha's register/)).toBeTruthy();
    const confirm = screen.getByRole("button", { name: "Remove ZZ Asha from my account" });
    expect(confirm).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Type ZZ Asha to confirm"), "Asha");
    expect(screen.getByRole("button", { name: "Remove ZZ Asha from my account" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Type ZZ Asha to confirm"), "zz asha ");
    expect(screen.getByRole("button", { name: "Remove ZZ Asha from my account" })).not.toBeDisabled();
    await press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Remove this child from my account")).toBeNull();
    expect(calls(fetch, LINK)).toHaveLength(0);
  });

  it("sends one DELETE with the confirmation; with a child left the list is re-read, with none the link page is next", async () => {
    const { fetch } = await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: () => TWO, [LINK]: () => ({ ok: true, schoolStandsIn: true, remaining: 1 }) });
    await press(await screen.findByRole("button", { name: "Remove: ZZ Asha" }));
    await fireEvent.changeText(screen.getByLabelText("Type ZZ Asha to confirm"), "ZZ Asha");
    await press(screen.getByRole("button", { name: "Remove ZZ Asha from my account" }));
    await waitFor(() => expect(calls(fetch, LINK).map((c) => c.init?.method)).toEqual(["DELETE"]));
    expect(bodyOf(calls(fetch, LINK)[0]!)).toEqual({ confirm: true });
    await waitFor(() => expect(calls(fetch, PATH).length).toBeGreaterThan(1));
    expect(mockRouter.replace).not.toHaveBeenCalled();

    mockRouter.replace.mockClear();
    const second = await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: () => SETTINGS, [LINK]: () => ({ ok: true, schoolStandsIn: false, remaining: 0 }) });
    await press(await screen.findByRole("button", { name: "Remove: ZZ Asha" }));
    await fireEvent.changeText(screen.getByLabelText("Type ZZ Asha to confirm"), "ZZ Asha");
    await press(screen.getByRole("button", { name: "Remove ZZ Asha from my account" }));
    await waitFor(() => expect(calls(second.fetch, LINK)).toHaveLength(1));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/(app)/link-child"));
  });

  it("a refusal is shown under the name, and the form stays open", async () => {
    await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: () => SETTINGS, [LINK]: refused(403, "ZZ nobody can stand in") });
    await press(await screen.findByRole("button", { name: "Remove: ZZ Asha" }));
    await fireEvent.changeText(screen.getByLabelText("Type ZZ Asha to confirm"), "ZZ Asha");
    await press(screen.getByRole("button", { name: "Remove ZZ Asha from my account" }));
    expect(await screen.findByText("ZZ nobody can stand in")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove ZZ Asha from my account" })).toBeTruthy();
  });
});
