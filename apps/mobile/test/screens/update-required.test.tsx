import { screen, fireEvent } from "@testing-library/react-native";
import { Linking, Platform } from "react-native";
import { API_BASE } from "@/lib/api";
import { UpdateRequired } from "@/screens/shared/update-required";
import { renderApp } from "../utils";

/** The update screen on its own, no router and no root layout: what it says, and where its one button goes. */
const POLICY = { minimum: { ios: "0.2.0", android: "0.2.0" }, latest: { ios: "0.3.0", android: "0.3.1" }, storeUrls: { ios: "https://apps.apple.com/app/id1", android: "https://play.google.com/store/apps/details?id=zz" }, message: null };

describe("the update screen", () => {
  const os = Platform.OS;
  let open: jest.SpyInstance;
  beforeEach(() => {
    open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });
  afterEach(() => {
    Platform.OS = os;
    open.mockRestore();
  });

  it("names the version and opens the store for this phone", async () => {
    await renderApp(<UpdateRequired policy={POLICY} />);
    expect(screen.getByRole("header", { name: "EduLink needs an update" })).toBeTruthy();
    expect(screen.getByText("The version on this phone (0.1.0) is older than the school's systems now support. Install the latest version (0.3.0) to carry on.")).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Update EduLink" }));
    expect(open).toHaveBeenCalledWith("https://apps.apple.com/app/id1");
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("an Android phone goes to Play and hears its own latest version", async () => {
    Platform.OS = "android";
    await renderApp(<UpdateRequired policy={POLICY} />);
    expect(screen.getByText(/Install the latest version \(0\.3\.1\)/)).toBeTruthy();
    fireEvent.press(screen.getByRole("button", { name: "Update EduLink" }));
    expect(open).toHaveBeenCalledWith("https://play.google.com/store/apps/details?id=zz");
  });

  it("says the operator's sentence when there is one", async () => {
    await renderApp(<UpdateRequired policy={{ ...POLICY, message: "ZZ: the marks format changed on 8 September; older versions cannot save." }} />);
    expect(screen.getByText("ZZ: the marks format changed on 8 September; older versions cannot save.")).toBeTruthy();
    expect(screen.queryByText(/older than the school's systems/)).toBeNull();
  });

  it("falls back to the web when the store has no listing", async () => {
    await renderApp(<UpdateRequired policy={{ ...POLICY, storeUrls: { ios: null, android: null } }} />);
    expect(screen.getByText("The app store is not available on this phone yet, so EduLink opens in the browser instead.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Update EduLink" })).toBeNull();
    fireEvent.press(screen.getByRole("button", { name: "Open on the web" }));
    expect(open).toHaveBeenCalledWith(API_BASE);
  });
});
