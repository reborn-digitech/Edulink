import { screen } from "@testing-library/react-native";
import { ID, ME_PARENT, ME_STUDENT, mockRouter, pending, refused, renderFamily, press } from "./family-helpers";
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

describe("the family's certificates", () => {
  it("is loading while the list is on its way", async () => {
    await renderFamily(<FamilyCertificates />, ME_PARENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("lists each with its serial and date, names the child when there are two, marks a revoked one, and opens one", async () => {
    await renderFamily(<FamilyCertificates />, ME_PARENT, { [PATH]: () => LIST });
    expect(await screen.findByText("ZZ Bonafide Certificate")).toBeTruthy();
    expect(screen.getByText(/^ZZ Asha · BC\/2026-27\/0003 · Issued .*2026$/)).toBeTruthy();
    expect(screen.getByText(/^ZZ Bela · TC\/2026-27\/0001 · Issued .*2026$/)).toBeTruthy();
    expect(screen.getAllByText("Revoked")).toHaveLength(1);
    await press(screen.getByRole("button", { name: /^ZZ Bonafide Certificate/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/certificate", params: { id: CERT } });
  });

  it("a pupil's own list does not repeat their name", async () => {
    await renderFamily(<FamilyCertificates />, ME_STUDENT, { [PATH]: () => ({ items: [LIST.items[0]] }) });
    expect(await screen.findByText(/^BC\/2026-27\/0003 · Issued /)).toBeTruthy();
    expect(screen.queryByText("Revoked")).toBeNull();
  });

  it("with nothing issued, says so with the way home", async () => {
    await renderFamily(<FamilyCertificates />, ME_PARENT, { [PATH]: () => ({ items: [] }) });
    expect(await screen.findByText("No certificates yet")).toBeTruthy();
    expect(screen.getByText("When the school issues a bonafide, a study or a transfer certificate, it appears here with a PDF to download.")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Overview" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)");
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<FamilyCertificates />, ME_PARENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
