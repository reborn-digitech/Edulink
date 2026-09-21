import { screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { bodyOf, calls, child, ID, ME_PARENT, ME_STUDENT, mockRouter, pending, refused, renderFamily, press, type } from "./family-helpers";
import { FamilyCertificates } from "@/screens/family/certificates";

const CERT = "czz00000000000000000cert1";
const CERT2 = "czz00000000000000000cert2";
const LIST = {
  items: [
    { id: CERT, kind: "BONAFIDE", locale: "en", serial: "BC/2026-27/0003", title: "ZZ Bonafide Certificate", studentMembershipId: ID.child, studentName: "ZZ Asha", issuedAt: "2026-09-15T05:00:00.000Z", revokedAt: null },
    { id: CERT2, kind: "TC", locale: "mr", serial: "TC/2026-27/0001", title: "ZZ शाळा सोडल्याचा दाखला", studentMembershipId: ID.child2, studentName: "ZZ Bela", issuedAt: "2026-09-01T05:00:00.000Z", revokedAt: "2026-09-10T05:00:00.000Z" },
  ],
};
const PATH = "/api/v1/family/certificates";
const REQUESTS = "/api/v1/family/certificate-requests";
const CHILDREN_PATH = "/api/v1/family/children";
const REQ1 = "czz000000000000000000req1";
const REQ2 = "czz000000000000000000req2";
const REQ3 = "czz000000000000000000req3";
const request = (id: string, status: string, extra: Record<string, unknown> = {}) => ({
  id,
  studentMembershipId: ID.child,
  studentName: "ZZ Asha",
  className: "ZZ 5A",
  kind: "BONAFIDE",
  purpose: "ZZ bus pass",
  status,
  requestedByName: "ZZ Parent",
  certificateId: null,
  serial: null,
  declineReason: null,
  decidedAt: null,
  createdAt: "2026-09-12T05:00:00.000Z",
  ...extra,
});
const REQUEST_VIEW = { items: [request(REQ1, "PENDING"), request(REQ2, "ISSUED", { kind: "STUDY", certificateId: CERT, serial: "SC/2026-27/0002", decidedAt: "2026-09-14T05:00:00.000Z" }), request(REQ3, "DECLINED", { kind: "CHARACTER", declineReason: "ZZ fees due", decidedAt: "2026-09-14T05:00:00.000Z" })], kinds: ["BONAFIDE", "STUDY", "CHARACTER"] };
const noRequests = () => ({ items: [], kinds: ["BONAFIDE"] });
const compose = () => (
  <ToastProvider>
    <FamilyCertificates />
  </ToastProvider>
);

describe("the family's certificates", () => {
  it("is loading while the list is on its way", async () => {
    await renderFamily(<FamilyCertificates />, ME_PARENT, { [PATH]: pending, [REQUESTS]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("lists each with its serial and date, names the child when there are two, marks a revoked one, and opens one", async () => {
    await renderFamily(<FamilyCertificates />, ME_PARENT, { [PATH]: () => LIST, [REQUESTS]: noRequests });
    expect(await screen.findByText("ZZ Bonafide Certificate")).toBeTruthy();
    expect(screen.getByText(/^ZZ Asha · BC\/2026-27\/0003 · Issued .*2026$/)).toBeTruthy();
    expect(screen.getByText(/^ZZ Bela · TC\/2026-27\/0001 · Issued .*2026$/)).toBeTruthy();
    expect(screen.getAllByText("Revoked")).toHaveLength(1);
    await press(screen.getByRole("button", { name: /^ZZ Bonafide Certificate/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/certificate", params: { id: CERT } });
  });

  it("a pupil's own list does not repeat their name", async () => {
    await renderFamily(<FamilyCertificates />, ME_STUDENT, { [PATH]: () => ({ items: [LIST.items[0]] }), [REQUESTS]: noRequests });
    expect(await screen.findByText(/^BC\/2026-27\/0003 · Issued /)).toBeTruthy();
    expect(screen.queryByText("Revoked")).toBeNull();
  });

  it("with nothing issued, says so with the way home", async () => {
    await renderFamily(<FamilyCertificates />, ME_PARENT, { [PATH]: () => ({ items: [] }), [REQUESTS]: noRequests });
    expect(await screen.findByText("No certificates yet")).toBeTruthy();
    expect(screen.getByText("When the school issues a bonafide, a study or a transfer certificate, it appears here with a PDF to download.")).toBeTruthy();
    // The requests' empty state carries the same door, so two of them.
    await press(screen.getAllByRole("button", { name: "Overview" })[0]!);
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)");
    expect(screen.getByText("No requests yet")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<FamilyCertificates />, ME_PARENT, { [PATH]: refused(500, "ZZ broke"), [REQUESTS]: noRequests });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("asking for a certificate", () => {
  const posts = (fetch: jest.Mock) => calls(fetch, REQUESTS).filter((c) => c.init?.method === "POST");
  const answering = (view: object) => (init: RequestInit | undefined) => (init?.method === "POST" ? request(REQ1, "PENDING") : view);

  it("offers the kinds the school has a format for, each in its own words, and refuses to send without a kind or a purpose", async () => {
    const { fetch } = await renderFamily(compose(), ME_STUDENT, { [PATH]: () => ({ items: [] }), [REQUESTS]: answering(REQUEST_VIEW) });
    expect(await screen.findByText("Ask for a certificate")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Bonafide certificate" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Study certificate" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Character certificate" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Transfer certificate" })).toBeNull();
    await press(screen.getByRole("button", { name: "Send the request" }));
    expect(screen.getAllByText("This is required.").length).toBeGreaterThanOrEqual(1);
    expect(posts(fetch)).toHaveLength(0);
  });

  it("a pupil's ask posts the kind and the purpose with no child, then says the office has been told", async () => {
    const { fetch } = await renderFamily(compose(), ME_STUDENT, { [PATH]: () => ({ items: [] }), [REQUESTS]: answering(REQUEST_VIEW) });
    await screen.findByText("Ask for a certificate");
    await press(screen.getByRole("radio", { name: "Bonafide certificate" }));
    await type(screen.getByLabelText("What it is for"), "  ZZ bus pass ");
    await press(screen.getByRole("button", { name: "Send the request" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(posts(fetch)[0]!.url.searchParams.get("childId")).toBeNull();
    expect(bodyOf(posts(fetch)[0]!)).toEqual({ kind: "BONAFIDE", purpose: "ZZ bus pass" });
    expect(await screen.findByText("Request sent. The office has been told.")).toBeTruthy();
  });

  it("a guardian asks for the chosen child, with the child on the query for the list and the ask", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, {
      [PATH]: () => ({ items: [] }),
      [CHILDREN_PATH]: () => ({ children: [child(ID.child, "ZZ Asha"), child(ID.child2, "ZZ Bela")] }),
      [REQUESTS]: answering(REQUEST_VIEW),
    });
    await screen.findByText("Ask for a certificate");
    await waitFor(() => expect(calls(fetch, REQUESTS).some((c) => c.url.searchParams.get("childId") === ID.child)).toBe(true));
    await press(screen.getByRole("button", { name: "ZZ Bela, ZZ School" }));
    await waitFor(() => expect(calls(fetch, REQUESTS).some((c) => c.url.searchParams.get("childId") === ID.child2)).toBe(true));
    await press(screen.getByRole("radio", { name: "Study certificate" }));
    await type(screen.getByLabelText("What it is for"), "ZZ scholarship");
    await press(screen.getByRole("button", { name: "Send the request" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(posts(fetch)[0]!.url.searchParams.get("childId")).toBe(ID.child2);
    expect(bodyOf(posts(fetch)[0]!)).toEqual({ kind: "STUDY", purpose: "ZZ scholarship" });
  });

  it("with no format set up, says so and offers nothing to send", async () => {
    await renderFamily(compose(), ME_STUDENT, { [PATH]: () => ({ items: [] }), [REQUESTS]: () => ({ items: [], kinds: [] }) });
    expect(await screen.findByText("The school has not set up any certificate formats yet.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Send the request" })).toBeNull();
  });

  it("a refused ask is an alert above the form, which stays", async () => {
    await renderFamily(compose(), ME_STUDENT, { [PATH]: () => ({ items: [] }), [REQUESTS]: (init, url) => (init?.method === "POST" ? refused(422, "ZZ not that kind")(init, url) : REQUEST_VIEW) });
    await screen.findByText("Ask for a certificate");
    await press(screen.getByRole("radio", { name: "Bonafide certificate" }));
    await type(screen.getByLabelText("What it is for"), "ZZ bus pass");
    await press(screen.getByRole("button", { name: "Send the request" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not that kind");
    expect(screen.getByRole("button", { name: "Send the request" })).toBeTruthy();
  });
});

describe("the family's requests", () => {
  it("lists each with its kind, purpose, date and where it stands: the serial and the door once issued, the reason once declined", async () => {
    await renderFamily(compose(), ME_STUDENT, { [PATH]: () => ({ items: [] }), [REQUESTS]: () => REQUEST_VIEW });
    expect(await screen.findByText("Your requests")).toBeTruthy();
    expect(screen.getAllByText("ZZ bus pass")).toHaveLength(3);
    expect(screen.getAllByText(/^Asked .*2026$/)).toHaveLength(3);
    expect(screen.getByText("Waiting for the office")).toBeTruthy();
    expect(screen.getByText("Issued")).toBeTruthy();
    expect(screen.getByText("Declined")).toBeTruthy();
    expect(screen.getByText("Issued as SC/2026-27/0002")).toBeTruthy();
    expect(screen.getByText("Declined: ZZ fees due")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Open the certificate" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/certificate", params: { id: CERT } });
    // Only the pending one can be taken back.
    expect(screen.getAllByRole("button", { name: "Take it back" })).toHaveLength(1);
  });

  it("a pending one is taken back after a confirmation, and not on a change of mind", async () => {
    const { fetch } = await renderFamily(compose(), ME_STUDENT, { [PATH]: () => ({ items: [] }), [REQUESTS]: (init, url) => (init?.method === "POST" && url.pathname.endsWith("/cancel") ? request(REQ1, "CANCELLED") : REQUEST_VIEW), [`${REQUESTS}/${REQ1}/cancel`]: () => request(REQ1, "CANCELLED") });
    await screen.findByText("Your requests");
    await press(screen.getByRole("button", { name: "Take it back" }));
    expect(screen.getByText("Take back the request for Bonafide certificate?")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Keep" }));
    expect(screen.queryByText("Take back the request for Bonafide certificate?")).toBeNull();
    expect(calls(fetch, `${REQUESTS}/${REQ1}/cancel`)).toHaveLength(0);
    await press(screen.getByRole("button", { name: "Take it back" }));
    // The confirmation replaces the button with its own, the only one left by that name.
    await press(screen.getByRole("button", { name: "Take it back" }));
    await waitFor(() => expect(calls(fetch, `${REQUESTS}/${REQ1}/cancel`)).toHaveLength(1));
    expect(calls(fetch, `${REQUESTS}/${REQ1}/cancel`)[0]!.init?.method).toBe("POST");
    expect(await screen.findByText("Request taken back.")).toBeTruthy();
  });

  it("with none yet, says so with a door", async () => {
    await renderFamily(compose(), ME_STUDENT, { [PATH]: () => ({ items: [] }), [REQUESTS]: noRequests });
    expect(await screen.findByText("No requests yet")).toBeTruthy();
    expect(screen.getByText("Ask for a bonafide, a study or a character certificate and the office will issue it from your record.")).toBeTruthy();
  });
});
