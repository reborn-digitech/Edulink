import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { TeacherContributions } from "@/screens/teacher/contributions";
import { gated, json, mountStaff, refused } from "./staff-harness";
import { MINE } from "./gig-fixtures";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PATH = "/api/v1/gigs/questions";
describe("a teacher's questions for the bank", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("loads, then says the rule, where the teacher stands and what each question earned", async () => {
    const gate = gated();
    await mountStaff(<TeacherContributions />, "TEACHER", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(MINE()));
    expect(await screen.findByText("Your first 20 questions added to the bank are unpaid. After that each one added earns ₹10, for up to 200 a month.")).toBeTruthy();
    expect(screen.getByLabelText("In the bank: 21")).toBeTruthy();
    expect(screen.getByLabelText("Paid this month: 1 / 200")).toBeTruthy();
    expect(screen.getByLabelText("Earned, not yet paid: ₹10")).toBeTruthy();
    expect(screen.getByText("Sent today: 2 of 20. Waiting to be read: 1 of 50.")).toBeTruthy();
    expect(screen.getByText("Waiting to be read")).toBeTruthy();
    expect(screen.getByText("Class 3 · ZZ Shapes · Unpaid: one of your first 20")).toBeTruthy();
    expect(screen.getByText("Class 3 · ZZ Shapes · ₹10, to be paid")).toBeTruthy();
  });

  it("opens a question and the form for a new one", async () => {
    await mountStaff(<TeacherContributions />, "TEACHER", { [`GET ${PATH}`]: () => json(MINE()) });
    await fireEvent.press(await screen.findByRole("button", { name: /ZZ How many sides has a triangle\?/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/contribution", params: { id: "q1" } });
    await fireEvent.press(screen.getByRole("button", { name: "Write a question" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/contribution");
  });

  it("saves where the teacher is paid, and shows a refusal", async () => {
    let refuse = false;
    const { calls } = await mountStaff(<TeacherContributions />, "TEACHER", {
      [`GET ${PATH}`]: () => json(MINE({ payee: null, contributions: [] })),
      "POST /api/v1/gigs/payee": (req) => (refuse ? refused("ZZ That does not look like a UPI id (name@bank).", 422)(req) : json({ payee: { upiId: "zz.new@zzbank", payeeName: "ZZ Teacher" } })),
    });
    expect(await screen.findByText("You have not written a question yet.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("UPI id"), "zz.new@zzbank");
    await fireEvent.changeText(screen.getByLabelText("Name on the account"), "ZZ Teacher");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Saved.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/gigs/payee")?.body).toEqual({ upiId: "zz.new@zzbank", payeeName: "ZZ Teacher" });
    refuse = true;
    await fireEvent.changeText(screen.getByLabelText("UPI id"), "not a upi");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ That does not look like a UPI id (name@bank).");
    await waitFor(() => expect(screen.queryByText("Saved.")).toBeNull());
  });

  it("a list that cannot be read is an alert with a retry", async () => {
    await mountStaff(<TeacherContributions />, "TEACHER", { [`GET ${PATH}`]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
