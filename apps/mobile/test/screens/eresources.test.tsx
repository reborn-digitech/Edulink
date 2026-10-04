import { Linking } from "react-native";
import { screen, userEvent, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { EResourcesScreen } from "@/screens/library/e-resources";
import { MyLibraryScreen } from "@/screens/library/mine";
import { json, me, mountStaff, refused } from "./staff-harness";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

/** /api/v1/me for a role at a college with these modules on. */
const atCollege = (role: RoleCode, modules: string[]) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules, institutionKind: "COLLEGE" });
const NLIST = "czz00000000000000000eres1";
const item = (id: string, name: string, kind = "NLIST") => ({ id, name, url: `https://example.org/${id}`, kind, clicks: 0, active: true });

describe("a college's e-resources on the phone (G-3)", () => {
  beforeEach(() => mockPush.mockClear());

  it("lists the resources and opens one through the app, then hands the link to the browser", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mountStaff(
      <EResourcesScreen />,
      "FACULTY",
      {
        "GET /api/v1/library/eresources": () => json({ items: [item(NLIST, "ZZ N-LIST"), item("czz00000000000000000eres2", "ZZ DELNET", "DELNET")] }),
        [`POST /api/v1/library/eresources/${NLIST}/open`]: () => json({ url: "https://nlist.example.org/", clicks: 4 }),
      },
      { me: atCollege("FACULTY", ["ACADEMICS", "LIBRARY"]) },
    );
    expect(await screen.findByText("ZZ N-LIST")).toBeTruthy();
    expect(screen.getByText("DELNET")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "Open ZZ N-LIST in a new tab" }));
    await waitFor(() => expect(open).toHaveBeenCalledWith("https://nlist.example.org/"));
    expect(calls().some((c) => c.line === `POST /api/v1/library/eresources/${NLIST}/open`)).toBe(true);
    open.mockRestore();
  });

  it("does not follow a link that is not https, and shows a refusal from the door", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(
      <EResourcesScreen />,
      "HOD",
      {
        "GET /api/v1/library/eresources": () => json({ items: [item(NLIST, "ZZ N-LIST"), item("czz00000000000000000eres2", "ZZ Retired")] }),
        [`POST /api/v1/library/eresources/${NLIST}/open`]: () => json({ url: "http://nlist.example.org/", clicks: 1 }),
        "POST /api/v1/library/eresources/czz00000000000000000eres2/open": refused("ZZ not here", 404),
      },
      { me: atCollege("HOD", ["ACADEMICS", "LIBRARY"]) },
    );
    await userEvent.setup().press(await screen.findByRole("button", { name: "Open ZZ N-LIST in a new tab" }));
    expect(await screen.findByText("The link must start with https://.")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "Open ZZ Retired in a new tab" }));
    expect(await screen.findByText("ZZ not here")).toBeTruthy();
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it("says when the library lists none, with the way to More", async () => {
    await mountStaff(<EResourcesScreen />, "STUDENT", { "GET /api/v1/library/eresources": () => json({ items: [] }) }, { me: atCollege("STUDENT", ["ACADEMICS", "LIBRARY"]) });
    expect(await screen.findByText("The library has not listed any e-resources yet.")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "More" }));
    expect(mockPush).toHaveBeenCalledWith("/(app)/more");
  });

  it("says the library is off at a college that has not switched it on", async () => {
    await mountStaff(<EResourcesScreen />, "FACULTY", {}, { me: atCollege("FACULTY", ["ACADEMICS"]) });
    expect(await screen.findByText(/has not switched on/)).toBeTruthy();
  });

  it("shows the door's failure with a retry", async () => {
    await mountStaff(<EResourcesScreen />, "FACULTY", { "GET /api/v1/library/eresources": refused("ZZ broke", 500) }, { me: atCollege("FACULTY", ["ACADEMICS", "LIBRARY"]) });
    expect(await screen.findByText("ZZ broke")).toBeTruthy();
  });

  const libraryAnswers = { "GET /api/v1/library/mine": () => json({ membershipId: "m1", name: "ZZ S", limit: 4, loans: [], fines: [], reservations: [] }), "GET /api/v1/library/titles": () => json({ items: [], nextCursor: null }) };

  it("is a button on a college student's library screen", async () => {
    await mountStaff(<MyLibraryScreen />, "STUDENT", libraryAnswers, { me: atCollege("STUDENT", ["ACADEMICS", "LIBRARY"]) });
    await userEvent.setup().press(await screen.findByRole("button", { name: "E-resources" }));
    expect(mockPush).toHaveBeenCalledWith("/(app)/e-resources");
  });

  it("is not on a school pupil's library screen", async () => {
    await mountStaff(<MyLibraryScreen />, "STUDENT", libraryAnswers, { me: { ...me("STUDENT"), modules: ["LIBRARY"] } });
    expect(await screen.findByText("Library")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "E-resources" })).toBeNull();
  });
});
