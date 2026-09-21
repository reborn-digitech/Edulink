import { Share } from "react-native";
import { fireEvent, screen, waitFor, within } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { Filings, identityFieldList } from "@/screens/staff/filings";
import { json, mountStaff, refused, type Answers } from "./staff-harness";

/** The screen's doors go into the app's own routes; the router is the harness's, so a test can read where it went. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PATH = "/api/v1/office/filings";
const EXPORT = `${PATH}/export`;

const VIEW = {
  identity: { udiseCode: null, board: "MSBSHSE", affiliationNumber: "27.01.001", district: "Pune", block: "Haveli", medium: "Marathi", managementType: null, state: "Maharashtra", city: "Pune", postalCode: "411001" },
  identityMissing: ["udiseCode", "managementType"],
  pupils: { total: 48, ready: 40, missing: { gender: 5, bpl: 8 }, withoutLocalName: 3 },
  staff: { total: 10, ready: 9, missing: { socialCategory: 1 } },
  grades: [
    { gradeLevel: "3", pupils: 20 },
    { gradeLevel: "6", pupils: 28 },
  ],
  academicYearName: "2026-27",
};

const csv = (name: string) => json({ filename: `relay-${name}.csv`, csv: `${name}\nrow\n`, rows: 1 });

const answers = (): Answers => ({
  [`GET ${PATH}`]: () => json(VIEW),
  [`POST ${PATH}/identity`]: async ({ init }) => {
    const body = JSON.parse(String(init.body)) as Record<string, string>;
    return json({ ...VIEW, identity: { ...VIEW.identity, ...body }, identityMissing: [] });
  },
  [`GET ${EXPORT}/udise-students`]: () => csv("udise-students"),
  [`GET ${EXPORT}/udise-enrolment`]: () => csv("udise-enrolment"),
  [`GET ${EXPORT}/udise-teachers`]: () => csv("udise-teachers"),
  [`GET ${EXPORT}/cbse-candidates`]: ({ url }) => csv(`cbse-${url.searchParams.get("grade")}`),
  [`GET ${EXPORT}/msbshse-candidates`]: ({ url }) => csv(`msbshse-${url.searchParams.get("grade")}`),
});

const compose = () => (
  <ToastProvider>
    <Filings />
  </ToastProvider>
);

beforeEach(() => mockRouter.push.mockClear());

describe("the helpers behind the filings", () => {
  it("name the identity fields still blank in the reader's words", () => {
    expect(identityFieldList((k: string) => (k === "filings.udiseCode" ? "UDISE+ code" : k === "filings.board" ? "Board" : k) as never, ["udiseCode", "board"])).toBe("UDISE+ code, Board");
  });
});

describe("the filings for the office", () => {
  it("loads, then shows the identity with what is blank, who is ready, what is missing and the sheets", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(await screen.findByText("Still blank: UDISE+ code, Management")).toBeTruthy();
    expect(calls().some((c) => c.line === `GET ${PATH}`)).toBe(true);
    expect(screen.getByLabelText("UDISE+ code").props.value).toBe("");
    expect(screen.getByLabelText("District").props.value).toBe("Pune");
    expect(screen.getByLabelText("Medium of instruction").props.value).toBe("Marathi");
    expect(screen.getByRole("radio", { name: "Maharashtra State Board (MSBSHSE)" }).props.accessibilityState.checked).toBe(true);
    expect(within(screen.getByLabelText("Management")).getByRole("radio", { name: "Not set" }).props.accessibilityState.checked).toBe(true);
    expect(screen.getByLabelText("Region or state: Pune · Maharashtra · 411001")).toBeTruthy();
    expect(screen.getByText("40 of 48 pupils have every UDISE+ field")).toBeTruthy();
    expect(screen.getByText("9 of 10 teachers have every profile field")).toBeTruthy();
    expect(screen.getByText("3 pupils have no name in the school’s script")).toBeTruthy();
    expect(screen.getByText("Below-poverty-line card")).toBeTruthy();
    expect(screen.getByText("8")).toBeTruthy();
    expect(screen.getByText("Social category")).toBeTruthy();
    expect(screen.getByText("Academic year 2026-27 · Every download is recorded in the safety centre, because each names children.")).toBeTruthy();
    expect(screen.getByText("UDISE+ student sheet")).toBeTruthy();
    expect(screen.getByText("Maharashtra board candidates")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /^Share: / })).toHaveLength(5);
    await fireEvent.press(screen.getByRole("button", { name: "Pupil records" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/pupil-records");
    await fireEvent.press(screen.getByRole("button", { name: "Staff records" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/staff");
  });

  it("saves the identity as a whole — the code typed, the management picked, the rest as they were — and says so", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    await fireEvent.changeText(await screen.findByLabelText("UDISE+ code"), "27010100101");
    await fireEvent.press(within(screen.getByLabelText("Management")).getByRole("radio", { name: "Private unaided" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save: What the portals know the school as" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${PATH}/identity`)).toBe(true));
    expect(calls().find((c) => c.line === `POST ${PATH}/identity`)!.body).toEqual({
      udiseCode: "27010100101",
      board: "MSBSHSE",
      affiliationNumber: "27.01.001",
      district: "Pune",
      block: "Haveli",
      medium: "Marathi",
      managementType: "PRIVATE_UNAIDED",
    });
    expect(await screen.findByText("Saved.")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText(/^Still blank/)).toBeNull());
  });

  it("a code that is not eleven digits is refused before anything is sent; a refused save is an alert above the fields", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", { ...answers(), [`POST ${PATH}/identity`]: refused("ZZ not saved", 422) });
    await fireEvent.changeText(await screen.findByLabelText("UDISE+ code"), "2701010");
    await fireEvent.press(screen.getByRole("button", { name: "Save: What the portals know the school as" }));
    expect(screen.getAllByText("Eleven digits, from the school’s UDISE+ profile.").length).toBeGreaterThanOrEqual(1);
    expect(calls().some((c) => c.line === `POST ${PATH}/identity`)).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("UDISE+ code"), "");
    await fireEvent.press(screen.getByRole("button", { name: "Save: What the portals know the school as" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${PATH}/identity`)).toBe(true));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not saved");
  });

  it("the head reads the identity and the readiness but cannot save or cut a sheet", async () => {
    await mountStaff(compose(), "PRINCIPAL", answers());
    expect(await screen.findByText("Still blank: UDISE+ code, Management")).toBeTruthy();
    expect(screen.getByLabelText("District").props.editable).toBe(false);
    expect(screen.getByRole("radio", { name: "CBSE" }).props.accessibilityState.disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Save: What the portals know the school as" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Share: / })).toBeNull();
    expect(screen.getByText("40 of 48 pupils have every UDISE+ field")).toBeTruthy();
    expect(screen.getByText("UDISE+ teacher profile")).toBeTruthy();
  });

  it("each sheet is fetched from its own path and handed to the share sheet as the file it came as; the board sheets take the grade picked", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    await fireEvent.press(await screen.findByRole("button", { name: "Share: UDISE+ student sheet" }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: "relay-udise-students.csv", message: "udise-students\nrow\n" }));
    expect(calls().some((c) => c.line === `GET ${EXPORT}/udise-students`)).toBe(true);
    await fireEvent.press(screen.getByRole("button", { name: "Share: UDISE+ enrolment tables" }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: "relay-udise-enrolment.csv", message: "udise-enrolment\nrow\n" }));
    await fireEvent.press(screen.getByRole("button", { name: "Share: UDISE+ teacher profile" }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: "relay-udise-teachers.csv", message: "udise-teachers\nrow\n" }));
    // The first grade is picked until another is.
    await fireEvent.press(screen.getByRole("button", { name: "Share: CBSE candidates" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${EXPORT}/cbse-candidates?grade=3`)).toBe(true));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: "relay-cbse-3.csv", message: "cbse-3\nrow\n" }));
    await fireEvent.press(screen.getByRole("radio", { name: "6 (28)" }));
    await fireEvent.press(screen.getByRole("button", { name: "Share: Maharashtra board candidates" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${EXPORT}/msbshse-candidates?grade=6`)).toBe(true));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: "relay-msbshse-6.csv", message: "msbshse-6\nrow\n" }));
    expect(share).toHaveBeenCalledTimes(5);
    share.mockRestore();
  });

  it("a sheet the server refuses is said as a toast", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);
    await mountStaff(compose(), "ADMIN", { ...answers(), [`GET ${EXPORT}/udise-students`]: refused("ZZ no sheet", 409) });
    await fireEvent.press(await screen.findByRole("button", { name: "Share: UDISE+ student sheet" }));
    expect(await screen.findByText("ZZ no sheet")).toBeTruthy();
    expect(share).not.toHaveBeenCalled();
    share.mockRestore();
  });

  it("with no class carrying a grade, the board sheets wait behind a door to the classes; the UDISE+ sheets still cut", async () => {
    await mountStaff(compose(), "ADMIN", { ...answers(), [`GET ${PATH}`]: () => json({ ...VIEW, grades: [], identityMissing: [] }) });
    expect(await screen.findByText("No classes with a grade yet")).toBeTruthy();
    expect(screen.queryByText(/^Still blank/)).toBeNull();
    expect(screen.getAllByRole("button", { name: /^Share: / })).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Share: CBSE candidates" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Classes" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/classes");
  });

  it("a teacher is shown the door to their overview", async () => {
    await mountStaff(compose(), "TEACHER", {});
    await fireEvent.press(await screen.findByRole("button", { name: "Overview" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", { [`GET ${PATH}`]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("alert");
    expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBeGreaterThanOrEqual(2);
  });
});
