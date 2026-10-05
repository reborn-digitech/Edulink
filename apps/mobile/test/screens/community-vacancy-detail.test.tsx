import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { communityVacancySchema } from "@edulink/contracts";
import { VacancyDetail } from "@/screens/shared/vacancy-detail";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ID = "czz0000000000000posting01";
const SCHOOL = "czz000000000000000school2";
const PATH = `/api/v1/community/vacancies/${ID}`;
const ASK = "/api/v1/shared/enquiries";
const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
const POSTING = communityVacancySchema.parse({
  id: ID,
  title: "ZZ Physics teacher",
  body: "ZZ Come and teach physics to grades 9 and 10.",
  subjects: ["Physics", "Maths"],
  employmentType: "FULL_TIME",
  status: "OPEN",
  createdAt: hourAgo,
  schoolId: SCHOOL,
  schoolName: "ZZ Riverside",
  city: "Nashik",
  region: "Maharashtra",
  logoPath: null,
  ours: false,
  canEnquire: true,
  contactName: null,
  enquiryCount: null,
  myEnquiryId: null,
  enquiries: [],
});
/** The same post as the school that put it up reads it: closed now, with what it drew. */
const OURS = communityVacancySchema.parse({
  ...POSTING,
  status: "CLOSED",
  ours: true,
  canEnquire: false,
  contactName: "ZZ Head",
  enquiryCount: 2,
  enquiries: [
    { id: "eq1", fromName: "ZZ Candidate", status: "OPEN", lastMessageAt: hourAgo, lastMessagePreview: "ZZ I teach physics.", unread: true },
    { id: "eq2", fromName: "ZZ Applicant", status: "CLOSED", lastMessageAt: hourAgo, lastMessagePreview: "ZZ Thank you.", unread: false },
  ],
});

beforeEach(() => {
  mockRouter.push.mockReset();
  mockRouter.params = { postingId: ID };
});

describe("one vacancy", () => {
  it("loads the post in the route: what it is, where, the words, and the school behind it", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<VacancyDetail />, "TEACHER", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(POSTING));
    await screen.findByText("ZZ Physics teacher");
    expect(screen.getByText("ZZ Riverside · Nashik · Maharashtra · Full-time · Posted 1 hour ago")).toBeTruthy();
    expect(screen.getByText("ZZ Come and teach physics to grades 9 and 10.")).toBeTruthy();
    expect(screen.getByText("Physics")).toBeTruthy();
    expect(screen.getByText("Interested?")).toBeTruthy();
    expect(screen.queryByText("Enquiries")).toBeNull();
    expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(1);
    await fireEvent.press(screen.getByRole("button", { name: "View school profile, ZZ Riverside" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/school", params: { schoolId: SCHOOL } });
  });

  it("a teacher of another school asks the hiring team; the post then points at the conversation", async () => {
    let asked = false;
    const { calls } = await mountStaff(<VacancyDetail />, "TEACHER", {
      [`GET ${PATH}`]: () => json(asked ? { ...POSTING, myEnquiryId: "czz000000000000enquiry002" } : POSTING),
      [`POST ${ASK}`]: () => {
        asked = true;
        return json({ enquiryId: "czz000000000000enquiry002" }, 201);
      },
    });
    await fireEvent.changeText(await screen.findByLabelText("Write a message…"), " I have taught physics for six years. ");
    await fireEvent.press(screen.getByRole("button", { name: "Contact the hiring team" }));
    expect(await screen.findByText("Your conversation about this vacancy")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${ASK}`)?.body).toEqual({ schoolId: SCHOOL, kind: "JOB", jobPostingId: ID, body: "I have taught physics for six years." });
    await fireEvent.press(screen.getByRole("button", { name: "Open the conversation" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/enquiries/detail", params: { enquiryId: "czz000000000000enquiry002" } });
  });

  it("a refused enquiry is the server's sentence under the box", async () => {
    await mountStaff(<VacancyDetail />, "TEACHER", { [`GET ${PATH}`]: () => json(POSTING), [`POST ${ASK}`]: refused("This vacancy is no longer open.", 422) });
    await fireEvent.changeText(await screen.findByLabelText("Write a message…"), "Hello");
    await fireEvent.press(screen.getByRole("button", { name: "Contact the hiring team" }));
    expect(await screen.findByText("This vacancy is no longer open.")).toBeTruthy();
    expect(screen.getByLabelText("Write a message…")).toHaveDisplayValue("Hello");
  });

  it("the poster sees it is closed, its contact and the enquiries it drew, each one opening", async () => {
    await mountStaff(<VacancyDetail />, "ADMIN", { [`GET ${PATH}`]: () => json(OURS) });
    await screen.findByText("ZZ Physics teacher");
    expect(screen.getByText("This vacancy is closed.")).toBeTruthy();
    expect(screen.getByText("Your school")).toBeTruthy();
    expect(screen.getByText("2 enquiries · Contact: ZZ Head")).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
    expect(screen.queryByText("Interested?")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Candidate, / }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/enquiries/detail", params: { enquiryId: "eq1" } });
  });

  it("a poster with nothing drawn yet is told so", async () => {
    await mountStaff(<VacancyDetail />, "PRINCIPAL", { [`GET ${PATH}`]: () => json({ ...OURS, status: "OPEN", enquiryCount: 0, enquiries: [] }) });
    expect(await screen.findByText("No enquiries yet · Contact: ZZ Head")).toBeTruthy();
    expect(screen.queryByText("This vacancy is closed.")).toBeNull();
  });

  it("a refusal is an alert with a retry; no id is an error that asks nothing", async () => {
    const { calls } = await mountStaff(<VacancyDetail />, "TEACHER", { [`GET ${PATH}`]: refused("ZZ no such vacancy", 503) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ no such vacancy");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
    mockRouter.params = {};
    const second = await mountStaff(<VacancyDetail />, "TEACHER", {});
    expect(screen.getAllByRole("alert").at(-1)).toHaveTextContent(/That link did not work/);
    expect(second.calls().some((c) => c.line.startsWith("GET /api/v1/community"))).toBe(false);
  });
});
