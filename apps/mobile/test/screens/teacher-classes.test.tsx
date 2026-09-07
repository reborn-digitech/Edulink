import { screen } from "@testing-library/react-native";
import { staffClassesSchema } from "@edulink/contracts";
import { TeacherClasses } from "@/screens/teacher/classes";
import { fakeApi, ID, json, refusal, renderTeacher, resetOutbox, tap } from "./teacher-support";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const CLASSES = staffClassesSchema.parse({
  classes: [
    { id: ID.class1, name: "ZZ 5A", subject: "Maths", room: "Room 3", color: null, students: 24, assignments: 2, registerTaken: false },
    { id: ID.class2, name: "ZZ 5B", subject: null, room: null, color: null, students: 1, assignments: 0, registerTaken: true },
  ],
  students: 25,
});

beforeEach(() => {
  resetOutbox();
  mockRouter.push.mockReset();
});

describe("my classes", () => {
  it("loads, then lists every class with its register state", async () => {
    fakeApi({ "/api/v1/staff/classes": () => json(CLASSES) });
    await renderTeacher(<TeacherClasses />);
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("ZZ 5A");
    expect(screen.getByText("25 students")).toBeTruthy();
    expect(screen.getByText("Maths · Room 3 · 24 students")).toBeTruthy();
    expect(screen.getByText("1 student")).toBeTruthy();
    expect(screen.getByText("Attendance to do")).toBeTruthy();
    expect(screen.getByText("Attendance done")).toBeTruthy();
  });

  it("a row opens the class", async () => {
    fakeApi({ "/api/v1/staff/classes": () => json(CLASSES) });
    await renderTeacher(<TeacherClasses />);
    await tap(await screen.findByRole("button", { name: /ZZ 5A/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/classes/detail", params: { classId: ID.class1 } });
  });

  it("no classes is an empty state with the admin's part in it", async () => {
    fakeApi({ "/api/v1/staff/classes": () => json({ classes: [], students: 0 }) });
    await renderTeacher(<TeacherClasses />);
    await screen.findByText("No classes assigned to you yet");
    expect(screen.getByText(/Ask an admin to add you to a class/)).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    fakeApi({ "/api/v1/staff/classes": () => refusal("ZZ signed out", 403) });
    await renderTeacher(<TeacherClasses />);
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ signed out");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
