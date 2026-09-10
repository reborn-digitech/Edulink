import { Platform, StyleSheet } from "react-native";
import { screen } from "@testing-library/react-native";
import { renderApp } from "../utils";
import { TabLabel } from "@/components";

/**
 * The bar's label shrinks to fit instead of ending in "…" — large text on
 * Android is what made "Assignments" overflow a fifth of the bar — and keeps
 * everything tabBarLabelStyle used to carry, since a function label bypasses it.
 */
describe("TabLabel", () => {
  const os = Platform.OS;
  afterEach(() => {
    Platform.OS = os;
    jest.restoreAllMocks();
  });

  it("shrinks to fit on one line, to no less than 70 %, in the size and weight the layout picks", async () => {
    await renderApp(
      <TabLabel color="#123456" position="below-icon" size={11}>
        Assignments
      </TabLabel>,
    );
    const label = screen.getByText("Assignments");
    expect(label.props.numberOfLines).toBe(1);
    expect(label.props.adjustsFontSizeToFit).toBe(true);
    expect(label.props.minimumFontScale).toBe(0.7);
    const style = StyleSheet.flatten(label.props.style);
    expect(style).toMatchObject({ color: "#123456", fontSize: 11, fontWeight: "600", textAlign: "center", maxWidth: "120%" });
    // The library pads each pressable 5 pt; below the icon the label takes it back.
    expect(style.marginHorizontal).toBeLessThan(0);
  });

  it("beside the icon, on a wide screen, keeps the library's spacing, in tokens", async () => {
    await renderApp(
      <TabLabel color="#123456" position="beside-icon" size={12}>
        Attendance
      </TabLabel>,
    );
    const style = StyleSheet.flatten(screen.getByText("Attendance").props.style);
    expect(style).toMatchObject({ fontSize: 12, lineHeight: 24, marginStart: 4, marginEnd: 12 });
    expect(style.marginHorizontal).toBeUndefined();
  });

  it("follows the person's text size on Android, and leaves it to the large content viewer on iOS 13+", async () => {
    Platform.OS = "android";
    const { unmount } = await renderApp(
      <TabLabel color="#123456" position="below-icon" size={12}>
        Messages
      </TabLabel>,
    );
    expect(screen.getByText("Messages").props.allowFontScaling).toBe(true);
    expect(screen.getByText("Messages").props.maxFontSizeMultiplier).toBe(2);
    unmount();

    Platform.OS = "ios";
    jest.spyOn(Platform, "Version", "get").mockReturnValue("17.4");
    await renderApp(
      <TabLabel color="#123456" position="below-icon" size={12}>
        Messages
      </TabLabel>,
    );
    expect(screen.getByText("Messages").props.allowFontScaling).toBe(false);
  });
});
