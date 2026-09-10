import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { teachingRemarkPeopleSchema, teachingStartRemarkSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { RemarkNew } from "@/screens/shared/remark-new";
import { gated, json, mountStaff, refused } from "./staff-harness";
import { ID } from "./teacher-support";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const TM1 = "czz0000000000000000tm1";
const PATH = "/api/v1/teaching/remarks";
const TEACHER = teachingRemarkPeopleSchema.parse({
  role: "TEACHER",
  selfOnly: false,
  students: [
    { membershipId: ID.pupil1, name: "ZZ Asha", fullName: "ZZ Asha Rao", avatarKey: null, className: "ZZ 5A", guardianCount: 2 },
    { membershipId: ID.pupil2, name: "ZZ Bhavesh", fullName: "ZZ Bhavesh Patil", avatarKey: null, className: "ZZ 5B", guardianCount: 0 },
  ],
  pupils: [],
});
const teacherOf = { membershipId: TM1, name: "ZZ Teacher", title: "Maths", avatarKey: null, classes: ["ZZ 5A"], lead: true };
const PARENT = teachingRemarkPeopleSchema.parse({
  role: "PARENT",
  selfOnly: false,
  students: [],
  pupils: [
    { membershipId: ID.pupil1, name: "ZZ Asha", teachers: [teacherOf] },
    { membershipId: ID.pupil2, name: "ZZ Bhavesh", teachers: [] },
  ],
});
const PUPIL = teachingRemarkPeopleSchema.parse({ role: "STUDENT", selfOnly: true, students: [], pupils: [{ membershipId: "m1", name: "", teachers: [teacherOf] }] });

const compose = () => (
  <ToastProvider>
    <RemarkNew />
  </ToastProvider>
);

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.params = {};
});

describe("writing to a family about a pupil", () => {
  it("loads the teacher's pupils; nothing is sent until the form is whole; sending opens the thread", async () => {
    const gate = gated();
    const { calls } = await mountStaff(compose(), "TEACHER", { [`GET ${PATH}`]: gate.answer, [`POST ${PATH}`]: () => json({ threadId: ID.thread1 }, 201) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(TEACHER));
    await screen.findByRole("radio", { name: "ZZ Asha Rao, ZZ 5A" });
    expect(screen.getByText("New message")).toBeTruthy();
    expect(screen.getByText(/^This goes to the student and their guardians\./)).toBeTruthy();
    expect(screen.getByText("No guardian")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("Choose a student.")).toBeTruthy();
    expect(screen.getByText("Give it a short subject.")).toBeTruthy();
    expect(screen.getByText("Write your message.")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST ${PATH}`)).toHaveLength(0);

    // A pupil with nobody at home: told before a word is written.
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Bhavesh Patil, ZZ 5B" }));
    expect(screen.getByText(/^ZZ Bhavesh Patil has no guardian linked yet, so nobody will receive this\./)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Choose another pupil" }));
    await fireEvent.changeText(screen.getByLabelText("Search students"), "asha");
    expect(screen.queryByRole("radio", { name: /ZZ Bhavesh/ })).toBeNull();
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Asha Rao, ZZ 5A" }));
    expect(screen.queryByText(/has no guardian linked yet/)).toBeNull();

    await fireEvent.press(screen.getByRole("radio", { name: "Homework check-in" }));
    expect(screen.getByLabelText("Subject")).toHaveDisplayValue("Homework check-in");
    await fireEvent.changeText(screen.getByLabelText("Message"), "ZZ All caught up this week.");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/messages/thread", params: { threadId: ID.thread1 } }));
    expect(screen.getByText("Message sent")).toBeTruthy();
    expect(teachingStartRemarkSchema.parse(calls().find((c) => c.line === `POST ${PATH}`)!.body)).toEqual({ studentMembershipId: ID.pupil1, subject: "Homework check-in", body: "ZZ All caught up this week." });
  });

  it("from a class page the pupil is already chosen", async () => {
    mockRouter.params = { membershipId: ID.pupil2 };
    await mountStaff(compose(), "TEACHER", { [`GET ${PATH}`]: () => json(TEACHER) });
    expect(await screen.findByRole("radio", { name: "ZZ Bhavesh Patil, ZZ 5B" })).toBeChecked();
    expect(screen.queryByRole("radio", { name: /ZZ Asha/ })).toBeNull();
    expect(screen.getByText(/^ZZ Bhavesh Patil has no guardian linked yet/)).toBeTruthy();
  });

  it("a guardian picks a child, then one of that child's teachers, and is told who reads it", async () => {
    const { calls } = await mountStaff(compose(), "PARENT", { [`GET ${PATH}`]: () => json(PARENT), [`POST ${PATH}`]: () => json({ threadId: ID.thread1 }, 201) });
    await screen.findByText("Message a teacher");
    expect(screen.getByText(/^This is one conversation between you, the teacher and your child\./)).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Bhavesh" }));
    expect(screen.getByText("No teachers to write to yet — that appears once they are on a class roll.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Asha" }));
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Teacher · class teacher, Maths · ZZ 5A" }));
    await fireEvent.changeText(screen.getByLabelText("Subject"), "ZZ A question");
    await fireEvent.changeText(screen.getByLabelText("Your message"), "ZZ About the homework.");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/messages/thread", params: { threadId: ID.thread1 } }));
    expect(calls().find((c) => c.line === `POST ${PATH}`)?.body).toEqual({ studentMembershipId: ID.pupil1, teacherMembershipId: TM1, subject: "ZZ A question", body: "ZZ About the homework." });
  });

  it("a pupil writes to their own teacher and never names themselves", async () => {
    const { calls } = await mountStaff(compose(), "STUDENT", { [`GET ${PATH}`]: () => json(PUPIL), [`POST ${PATH}`]: () => json({ threadId: ID.thread1 }, 201) });
    await fireEvent.press(await screen.findByRole("radio", { name: /^ZZ Teacher/ }));
    expect(screen.queryByText("Which child?")).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Subject"), "ZZ Help please");
    await fireEvent.changeText(screen.getByLabelText("Your message"), "ZZ I missed the lesson.");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${PATH}`)).toBe(true));
    expect(calls().find((c) => c.line === `POST ${PATH}`)?.body).toEqual({ teacherMembershipId: TM1, subject: "ZZ Help please", body: "ZZ I missed the lesson." });
  });

  it("a teacher with no pupils is told so, and the door is back to today", async () => {
    await mountStaff(compose(), "TEACHER", { [`GET ${PATH}`]: () => json({ ...TEACHER, students: [] }) });
    await screen.findByText("No students to message yet");
    await fireEvent.press(screen.getByRole("button", { name: "Back to today" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)");
  });

  it("a refused send and a refused load are alerts with a retry", async () => {
    mockRouter.params = { membershipId: ID.pupil1 };
    const { calls } = await mountStaff(compose(), "TEACHER", { [`GET ${PATH}`]: () => json(TEACHER), [`POST ${PATH}`]: refused("ZZ not your pupil", 403) });
    await fireEvent.changeText(await screen.findByLabelText("Subject"), "ZZ A quick update");
    await fireEvent.changeText(screen.getByLabelText("Message"), "ZZ Hello.");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not your pupil");
    expect(mockRouter.push).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${PATH}`)).toHaveLength(2));

    const load = await mountStaff(compose(), "TEACHER", { [`GET ${PATH}`]: refused("ZZ inbox closed") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ inbox closed");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(load.calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });
});
