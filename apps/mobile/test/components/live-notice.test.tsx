import { act, screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { LiveNotice } from "@/components";
import { renderApp } from "../utils";

/** The one quiet line: shown on a stamp, said once, gone after four seconds, back on a new stamp. */
describe("LiveNotice", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("shows for four seconds per stamp and nothing for null", async () => {
    const said = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
    const view = await renderApp(<LiveNotice stamp={null}>Updated by a colleague.</LiveNotice>);
    expect(screen.queryByText("Updated by a colleague.")).toBeNull();
    await view.rerender(<LiveNotice stamp={1}>Updated by a colleague.</LiveNotice>);
    expect(screen.getByText("Updated by a colleague.")).toBeTruthy();
    expect(said).toHaveBeenCalledWith("Updated by a colleague.");
    await act(async () => jest.advanceTimersByTime(3_900));
    expect(screen.getByText("Updated by a colleague.")).toBeTruthy();
    await act(async () => jest.advanceTimersByTime(200));
    expect(screen.queryByText("Updated by a colleague.")).toBeNull();
    await view.rerender(<LiveNotice stamp={2}>Updated by a colleague.</LiveNotice>);
    expect(screen.getByText("Updated by a colleague.")).toBeTruthy();
    expect(said).toHaveBeenCalledTimes(2);
  });
});
