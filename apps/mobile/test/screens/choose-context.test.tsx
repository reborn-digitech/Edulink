import { Linking } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { ChooseContext } from "@/components/choose-context";
import { json, me, mountStaff } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }), useLocalSearchParams: () => ({}) }));

const noRole = (extra: Record<string, unknown> = {}, contexts = me("TEACHER").contexts) => ({
  ...me("TEACHER"),
  user: { ...me("TEACHER").user, ...extra },
  active: { schoolId: null, role: null, membershipId: null },
  contexts,
});

describe("signed in with no active role", () => {
  it("part of no school: says so, and the code is taken right here — no door to the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<ChooseContext />, "TEACHER", {}, { me: noRole({}, []) });
    expect(await screen.findByText("You are not part of a school yet")).toBeTruthy();
    expect(screen.getByLabelText("School or class code")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Check my code" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Join with a code" })).toBeNull();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it("a school to choose: one tap binds the session; an operator also sees the server door", async () => {
    const onConsole = jest.fn();
    const { calls } = await mountStaff(<ChooseContext consoles={["operator"]} onConsole={onConsole} />, "TEACHER", { "POST /api/v1/me/context": () => json(me("TEACHER")) }, { me: noRole({ isSuperuser: true }) });
    expect(await screen.findByText("Where would you like to go?")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Server administration, Server" }));
    expect(onConsole).toHaveBeenCalledWith("operator");
    await fireEvent.press(screen.getByRole("button", { name: "ZZ School, Teacher" }));
    expect(calls().find((c) => c.line === "POST /api/v1/me/context")?.body).toEqual({ schoolId: "s1", role: "TEACHER" });
  });
});
