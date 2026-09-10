import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Directory } from "@/screens/shared/directory";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const person = (userId: string, role: string, name: string, extra: Record<string, unknown> = {}) => ({ userId, membershipId: `m-${userId}`, name, avatarKey: null, role, detail: null, ...extra });
const PEOPLE = {
  schoolId: "s1",
  schools: [],
  people: [person("u-head", "PRINCIPAL", "ZZ Head"), person("u-pupil", "STUDENT", "ZZ Pupil", { detail: "ZZ 5A" }), person("u-mum", "PARENT", "ZZ Mum", { membershipId: null, detail: "ZZ Pupil's mother" })],
};
const PATH = "GET /api/v1/shared/people";
const OPEN = "POST /api/v1/shared/conversations";

describe("who to write to", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("loads, then groups everyone by what they are; a name opens the room with them", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<Directory />, "TEACHER", { [PATH]: gate.answer, [OPEN]: () => json({ conversationId: "c1", created: true }) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(PEOPLE));
    await screen.findByText("ZZ Pupil");
    expect(screen.getByRole("header", { name: "Staff · 1" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Pupils · 1" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Parents · 1" })).toBeTruthy();
    expect(screen.getByText("Student · ZZ 5A")).toBeTruthy();
    expect(screen.getByText("Parent · ZZ Pupil's mother")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "ZZ Pupil, Student · ZZ 5A" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/shared/conversations")).toBe(true));
    expect(calls().find((c) => c.line === "POST /api/v1/shared/conversations")?.body).toEqual({ schoolId: "s1", userId: "u-pupil" });
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/messages/room", params: { conversationId: "c1" } }));
    await fireEvent.press(screen.getByRole("button", { name: /^About a pupil/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/remark-new", params: {} });
  });

  it("a group narrows the list on the phone; a search asks the API", async () => {
    const { calls } = await mountStaff(<Directory />, "ADMIN", { [PATH]: () => json(PEOPLE) });
    await screen.findByText("ZZ Head");
    await fireEvent.press(screen.getByRole("radio", { name: "Pupils" }));
    expect(screen.queryByText("ZZ Head")).toBeNull();
    expect(screen.getByText("ZZ Pupil")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Search people by name"), "mum");
    await fireEvent(screen.getByLabelText("Search people by name"), "submitEditing");
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/shared/people?q=mum")).toBe(true));
  });

  it("with nobody to write to, says so, and the door is Messages", async () => {
    await mountStaff(<Directory />, "STUDENT", { [PATH]: () => json({ ...PEOPLE, people: [] }) });
    expect(await screen.findByText("Nobody to write to yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Messages" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messages");
  });

  it("a refused room is an alert", async () => {
    await mountStaff(<Directory />, "TEACHER", { [PATH]: () => json(PEOPLE), [OPEN]: refused("ZZ not allowed", 403) });
    await fireEvent.press(await screen.findByRole("button", { name: "ZZ Head, Principal" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not allowed");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<Directory />, "TEACHER", { [PATH]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/shared/people")).length).toBe(2));
  });
});
