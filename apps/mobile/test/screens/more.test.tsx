import { Linking } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { More } from "@/screens/shared/more";
import { API_BASE } from "@/lib/api";
import { mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/more", useLocalSearchParams: () => mockRouter.params }));

describe("the More sheet", () => {
  beforeEach(() => mockRouter.push.mockClear());

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

  it("an entry the phone does not carry says so and opens the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<More />, "ADMIN", {});
    await fireEvent.press(await screen.findByRole("button", { name: "Invites, Open on the web" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/admin/invites/new`);
    open.mockRestore();
  });

  it("an expert has the profile and the account, and no school groups", async () => {
    await mountStaff(<More />, "EXPERT", {});
    expect(await screen.findByRole("button", { name: "Profile" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Account, Open on the web" })).toBeTruthy();
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
