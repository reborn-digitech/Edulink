import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { enquiryThreadSchema } from "@edulink/contracts";
import { EnquiryDetail } from "@/screens/shared/enquiry-detail";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ID = "eq1";
const PATH = `/api/v1/shared/enquiries/${ID}`;
const REPLY = `${PATH}/reply`;
const CLOSE = `/api/v1/community/enquiries/${ID}/close`;
const THREAD = enquiryThreadSchema.parse({
  id: ID,
  kind: "ADMISSION",
  status: "OPEN",
  schoolId: "s1",
  schoolName: "ZZ School",
  subject: "",
  side: "school",
  fromName: "ZZ Parent",
  createdAt: "2026-09-06T09:00:00.000Z",
  messages: [
    { id: "m1", body: "Is there a place in Year 4?", mine: false, authorName: "ZZ Parent", createdAt: "2026-09-06T09:00:00.000Z" },
    { id: "m2", body: "Yes — come and see us.", mine: true, authorName: "ZZ Office", createdAt: "2026-09-06T10:00:00.000Z" },
  ],
});

beforeEach(() => {
  mockRouter.push.mockReset();
  mockRouter.params = { enquiryId: ID };
});

describe("an enquiry thread", () => {
  it("loads the one in the route, named after the school and who asked, both sides shown", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<EnquiryDetail />, "ADMIN", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(THREAD));
    await screen.findByText("Is there a place in Year 4?");
    expect(screen.getByText("Admission — ZZ School")).toBeTruthy();
    expect(screen.getAllByText("ZZ Parent").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Open")).toBeTruthy();
    expect(screen.getByText("You")).toBeTruthy();
    expect(screen.getByText("Yes — come and see us.")).toBeTruthy();
    expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(1);
  });

  it("replies through the reply endpoint, clears the box and re-reads", async () => {
    const { calls } = await mountStaff(<EnquiryDetail />, "ADMIN", { [`GET ${PATH}`]: () => json(THREAD), [`POST ${REPLY}`]: () => json({ enquiryId: ID }) });
    await fireEvent.changeText(await screen.findByLabelText("Write a reply"), "Friday at ten?");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Sent");
    expect(calls().find((c) => c.line === `POST ${REPLY}`)?.body).toEqual({ body: "Friday at ten?" });
    expect(screen.getByLabelText("Write a reply")).toHaveDisplayValue("");
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("the school closes it here: asked first, cancellable, then closed and re-read", async () => {
    const { calls } = await mountStaff(<EnquiryDetail />, "ADMIN", { [`GET ${PATH}`]: () => json(THREAD), [`POST ${CLOSE}`]: () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Close enquiry" }));
    // The first press only asks: a red button and a cancel take its place.
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(calls().some((c) => c.line === `POST ${CLOSE}`)).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Close enquiry" }));
    await fireEvent.press(screen.getByRole("button", { name: "Close enquiry" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${CLOSE}`)).toBe(true));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("a refused close is the server's sentence", async () => {
    await mountStaff(<EnquiryDetail />, "TEACHER", { [`GET ${PATH}`]: () => json(THREAD), [`POST ${CLOSE}`]: refused("ZZ only the school closes an enquiry", 403) });
    await fireEvent.press(await screen.findByRole("button", { name: "Close enquiry" }));
    await fireEvent.press(screen.getByRole("button", { name: "Close enquiry" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ only the school closes an enquiry");
  });

  it("the opener's side has no close button, and an empty reply is refused on the device", async () => {
    const { calls } = await mountStaff(<EnquiryDetail />, "PARENT", { [`GET ${PATH}`]: () => json({ ...THREAD, side: "opener" }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Send" }));
    expect(screen.getByText("Write something first.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Close enquiry" })).toBeNull();
    expect(calls().some((c) => c.line === `POST ${REPLY}`)).toBe(false);
  });

  it("a closed enquiry has no reply box and no close; an empty one leads back to the list", async () => {
    await mountStaff(<EnquiryDetail />, "ADMIN", { [`GET ${PATH}`]: () => json({ ...THREAD, status: "CLOSED", messages: [] }) });
    await screen.findByText("This enquiry is closed. Nobody can reply now.");
    expect(screen.getByText("No messages yet")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Close enquiry" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Enquiries" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/enquiries");
  });

  it("a refused reply is the server's sentence with a retry", async () => {
    await mountStaff(<EnquiryDetail />, "ADMIN", { [`GET ${PATH}`]: () => json(THREAD), [`POST ${REPLY}`]: refused("ZZ this enquiry is closed", 409) });
    await fireEvent.changeText(await screen.findByLabelText("Write a reply"), "Hello");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ this enquiry is closed");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("a refused enquiry is an alert with a retry; no id is an error", async () => {
    const { calls } = await mountStaff(<EnquiryDetail />, "ADMIN", { [`GET ${PATH}`]: refused("ZZ not yours", 404) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not yours");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
    mockRouter.params = {};
    await mountStaff(<EnquiryDetail />, "ADMIN", {});
    expect(screen.getAllByRole("alert").at(-1)).toHaveTextContent(/That link did not work/);
  });
});
