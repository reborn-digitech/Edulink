import { fireEvent, screen } from "@testing-library/react-native";
import { ConsoleHome, consolesFor } from "@/screens/shared/console-home";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params, usePathname: () => "/" }));

const operator = (contexts = [] as ReturnType<typeof me>["contexts"]) => ({
  ...me("TEACHER"),
  user: { ...me("TEACHER").user, name: "ZZ Platform Operator", isSuperuser: true, isAppAdmin: true },
  active: { schoolId: null, role: null, membershipId: null },
  contexts,
});

const OVERVIEW = { counts: { live: 1, removed: 0, noAdmin: 0, appAdmins: 1, expertsWaiting: 0 }, schools: [], jobs: [] };

describe("the console home for a person with no school role", () => {
  it("knows which consoles the flags open", () => {
    expect(consolesFor(operator() as never)).toEqual(["operator", "appadmin"]);
    expect(consolesFor({ ...me("TEACHER"), user: { ...me("TEACHER").user, isSuperuser: false, isAppAdmin: true } } as never)).toEqual(["appadmin"]);
  });

  it("at no school: the operator's console is the whole app", async () => {
    await mountStaff(<ConsoleHome me={operator() as never} />, "TEACHER", { "GET /api/v1/operator/overview": () => json(OVERVIEW) }, { me: operator() });
    expect(await screen.findByText("ZZ Platform Operator")).toBeTruthy();
    expect(screen.queryByText("Where would you like to go?")).toBeNull();
  });

  it("also at a school: the picker first, a console row opens the console, and there is a way back to the picker", async () => {
    const withSchool = operator(me("TEACHER").contexts);
    await mountStaff(<ConsoleHome me={withSchool as never} />, "TEACHER", { "GET /api/v1/operator/overview": () => json(OVERVIEW) }, { me: withSchool });
    expect(await screen.findByText("Where would you like to go?")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Server administration, Server" }));
    expect(await screen.findByText("ZZ Platform Operator")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Where would you like to go?" }));
    expect(await screen.findByText("ZZ School")).toBeTruthy();
  });
});
