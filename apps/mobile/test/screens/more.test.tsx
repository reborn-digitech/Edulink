import { Linking } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { More } from "@/screens/shared/more";
import { mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/more", useLocalSearchParams: () => mockRouter.params }));

describe("the More sheet", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("leads with the person — their avatar and name, which open their account", async () => {
    await mountStaff(<More />, "TEACHER", {});
    await fireEvent.press(await screen.findByRole("button", { name: "ZZ Head, Account" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/account");
  });

  it("lists a teacher's sections in the web's groups, and a row opens its screen", async () => {
    await mountStaff(<More />, "TEACHER", {});
    expect(await screen.findByText("Day to day")).toBeTruthy();
    expect(screen.getByText("School life")).toBeTruthy();
    expect(screen.getByText("Running things")).toBeTruthy();
    expect(screen.getByText("ZZ Head · Teacher · ZZ School")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Social Media" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/bulletin");
    await fireEvent.press(screen.getByRole("button", { name: "Me" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/profile");
    // The bar's own tabs are not repeated.
    expect(screen.queryByRole("button", { name: "Classes" })).toBeNull();
  });

  it("the office's invites and directory open in the app now, not on the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<More />, "ADMIN", {});
    await fireEvent.press(await screen.findByRole("button", { name: "Invites" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/invites");
    await fireEvent.press(screen.getByRole("button", { name: "Directory" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/directory-profile");
    expect(screen.queryByText("Open on the web")).toBeNull();
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it("an expert has the profile and the account, and no school groups", async () => {
    await mountStaff(<More />, "EXPERT", {});
    expect(await screen.findByRole("button", { name: "Profile" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Account" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/account");
    expect(screen.queryByText("School life")).toBeNull();
  });

  it("notifications, report a problem and sign out are there for everyone", async () => {
    await mountStaff(<More />, "PARENT", {});
    await fireEvent.press(await screen.findByRole("button", { name: "Notifications" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/notifications");
    await fireEvent.press(screen.getByRole("button", { name: "Report a problem" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/report", params: { from: "/more" } });
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });
});
