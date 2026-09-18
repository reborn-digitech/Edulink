import { screen } from "@testing-library/react-native";
import { appReportBodySchema } from "@edulink/contracts";
import { ReportProblem } from "@/screens/shared/report-problem";
import { renderApp } from "../utils";
import { callsTo, fakeApi, json, offline, refusal, tap, typeInto } from "./teacher-support";

const mockRouter = { push: jest.fn(), replace: jest.fn(), params: { from: "/more" } as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ATTACH = "We attach: Test, iOS, Relay 0.1.0 (1), and the screen you came from (/more). Nothing else.";

describe("report a problem", () => {
  beforeEach(() => {
    mockRouter.replace.mockReset();
    mockRouter.params = { from: "/more" };
  });

  it("shows exactly what will be attached, and refuses an empty message before asking the server", async () => {
    const fetch = fakeApi({ "/api/v1/app/report": () => json({ reportId: "r1", reference: "APP-7K3M2Q" }) });
    await renderApp(<ReportProblem />);
    expect(screen.getByRole("header", { name: "Report a problem" })).toBeTruthy();
    expect(screen.getByText(ATTACH)).toBeTruthy();
    await tap(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("Say what happened, in a sentence or two.")).toBeTruthy();
    expect(callsTo(fetch, "/api/v1/app/report")).toHaveLength(0);
  });

  it("sends the message with the screen and the device, and shows the reference with a door back", async () => {
    const fetch = fakeApi({ "/api/v1/app/report": () => json({ reportId: "r1", reference: "APP-7K3M2Q" }) });
    await renderApp(<ReportProblem />);
    await typeInto(screen.getByLabelText("What happened"), "ZZ the register would not save twice");
    await tap(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Sent. Your reference is APP-7K3M2Q — quote it if the school asks.");
    const post = callsTo(fetch, "/api/v1/app/report").find((c) => c.method === "POST")!;
    expect(appReportBodySchema.parse(post.body)).toEqual({
      kind: "PROBLEM",
      message: "ZZ the register would not save twice",
      screen: "/more",
      device: { platform: "ios", os: "iOS", model: "Test", appVersion: "0.1.0", build: "1" },
    });
    expect(post.headers.Authorization).toBe("Bearer t");
    await tap(screen.getByRole("button", { name: "Back to More" }));
    expect(mockRouter.replace).toHaveBeenCalledWith("/(app)/more");
  });

  it("without a screen to name, says so rather than hiding it", async () => {
    mockRouter.params = {};
    fakeApi({});
    await renderApp(<ReportProblem />);
    expect(screen.getByText("We attach: Test, iOS, Relay 0.1.0 (1), and the screen you came from (not recorded). Nothing else.")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    const fetch = fakeApi({ "/api/v1/app/report": () => refusal("ZZ too many reports today", 429) });
    await renderApp(<ReportProblem />);
    await typeInto(screen.getByLabelText("What happened"), "ZZ something");
    await tap(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ too many reports today");
    await tap(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("alert");
    expect(callsTo(fetch, "/api/v1/app/report")).toHaveLength(2);
  });

  it("offline, says it could not be sent and keeps the words; nothing is queued", async () => {
    let online = false;
    const fetch = fakeApi({ "/api/v1/app/report": () => (online ? json({ reportId: "r2", reference: "APP-AB12CD" }) : offline()) });
    await renderApp(<ReportProblem />);
    await typeInto(screen.getByLabelText("What happened"), "ZZ written on the train");
    await tap(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("It could not be sent — you look offline. Your words are kept here; try again when you are connected.");
    expect(screen.getByLabelText("What happened")).toHaveDisplayValue("ZZ written on the train");
    online = true;
    await tap(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("Sent. Your reference is APP-AB12CD — quote it if the school asks.");
    const posts = callsTo(fetch, "/api/v1/app/report");
    expect(posts).toHaveLength(2);
    expect(posts[1]!.body).toMatchObject({ message: "ZZ written on the train" });
  });
});
