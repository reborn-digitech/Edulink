import { Linking } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { ChooseContext } from "@/components/choose-context";
import { API_BASE } from "@/lib/api";
import { json, me, mountStaff } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }), useLocalSearchParams: () => ({}) }));

const noRole = (extra: Record<string, unknown> = {}, contexts = me("TEACHER").contexts) => ({
  ...me("TEACHER"),
  user: { ...me("TEACHER").user, ...extra },
  active: { schoolId: null, role: null, membershipId: null },
  contexts,
});

describe("signed in with no active role", () => {
  it("part of no school: says so, and the door is the web's join page", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<ChooseContext />, "TEACHER", {}, { me: noRole({}, []) });
    expect(await screen.findByText("You are not part of a school yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Join with a code" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/join`);
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
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
