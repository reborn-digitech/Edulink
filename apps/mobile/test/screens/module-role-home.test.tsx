import { Linking } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { ModuleRoleHome } from "@/screens/modules/role-home";
import { More } from "@/screens/shared/more";
import { me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

/** /api/v1/me for a module role at a school with these modules on. */
const meWith = (role: RoleCode, modules: string[]) => ({ ...me(role), modules });

describe("a module role's home (3 Oct 2026)", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("says the module is off when the school has not switched it on, with More as the way on", async () => {
    await mountStaff(<ModuleRoleHome role="DRIVER" />, "DRIVER", {}, { me: meWith("DRIVER", ["ALUMNI"]) });
    expect(await screen.findByText("Transport is not switched on")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "More" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/more");
  });

  it("says the screens are coming once the module is on", async () => {
    await mountStaff(<ModuleRoleHome role="LIBRARIAN" />, "LIBRARIAN", {}, { me: meWith("LIBRARIAN", ["LIBRARY", "ALUMNI"]) });
    expect(await screen.findByText("Library is on its way")).toBeTruthy();
  });

  it("opens an alumnus's feed, their staff to write to, and their record on the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<ModuleRoleHome role="ALUMNUS" />, "ALUMNUS", {}, { me: meWith("ALUMNUS", ["ALUMNI"]) });
    expect(await screen.findByText(/You left ZZ School/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Read the school's feed" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/bulletin");
    await fireEvent.press(screen.getByRole("button", { name: "Write to the school's staff" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messages");
    await fireEvent.press(screen.getByRole("button", { name: "Your school record" }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/record$/));
    open.mockRestore();
  });

  it("hides an alumnus's feed in More while alumni is off, and offers no search to a module role", async () => {
    await mountStaff(<More />, "ALUMNUS", {}, { me: meWith("ALUMNUS", ["ALUMNI"]) });
    expect(await screen.findByRole("button", { name: "Social Media" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Search" })).toBeNull();
  });

  it("…and without it, the feed's row is gone", async () => {
    await mountStaff(<More />, "ALUMNUS", {}, { me: meWith("ALUMNUS", []) });
    expect(await screen.findByRole("button", { name: "Account" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Social Media" })).toBeNull();
  });
});
