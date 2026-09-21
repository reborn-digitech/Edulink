import { screen } from "@testing-library/react-native";
import { ME_PARENT, mockRouter, pending, press, refused, renderFamily } from "./family-helpers";
import { FamilyApplications } from "@/screens/family/applications";
import { A1, A2, A3, row } from "./admissions-fixtures";

const PATH = "/api/v1/family/applications";

describe("the guardian's applications", () => {
  it("is loading while the list is on its way", async () => {
    await renderFamily(<FamilyApplications />, ME_PARENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("lists each with the school, the stage and the next step, for a guardian with no child linked, and opens one", async () => {
    const { fetch } = await renderFamily(<FamilyApplications />, ME_PARENT, {
      [PATH]: () => ({
        items: [
          row(A1, { documentsMissing: 1 }),
          row(A2, { childName: "ZZ Meera", serial: "ADM/2026-27/0002", status: "OFFERED", testBooked: true }),
          row(A3, { childName: "ZZ Dev", serial: "ADM/2026-27/0003", gradeApplied: "2", testBooked: true }),
        ],
      }),
    });
    expect(await screen.findByText("ZZ Kabir")).toBeTruthy();
    expect(screen.getByText("ZZ Hillside · ZZ Admissions 2026-27 · Grade 1 · Attach the documents the school asks for.")).toBeTruthy();
    expect(screen.getByText("ZZ Hillside · ZZ Admissions 2026-27 · Grade 1 · The school has offered a place — answer the offer.")).toBeTruthy();
    expect(screen.getByText("ZZ Hillside · ZZ Admissions 2026-27 · Grade 2 · Waiting for the school.")).toBeTruthy();
    expect(screen.getAllByText("Submitted")).toHaveLength(2);
    expect(screen.getByText("Offered")).toBeTruthy();
    // No child is asked for: the list is the account's, not a child's.
    expect(fetch.mock.calls.some((c) => String(c[0]).includes("/api/v1/family/children"))).toBe(false);
    await press(screen.getByRole("button", { name: /^ZZ Meera/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/my-application", params: { id: A2 } });
  });

  it("names the sitting to book, the seat once admitted, and nothing once settled", async () => {
    await renderFamily(<FamilyApplications />, ME_PARENT, {
      [PATH]: () => ({ items: [row(A1), row(A2, { childName: "ZZ Meera", status: "ADMITTED" }), row(A3, { childName: "ZZ Dev", status: "WITHDRAWN" })] }),
    });
    expect(await screen.findByText(/Book an entrance-test sitting\.$/)).toBeTruthy();
    expect(screen.getByText(/Admitted\. The child's school pages are yours now\.$/)).toBeTruthy();
    expect(screen.getByText(/Nothing more to do\.$/)).toBeTruthy();
  });

  it("with none, the door is the directory", async () => {
    await renderFamily(<FamilyApplications />, ME_PARENT, { [PATH]: () => ({ items: [] }) });
    expect(await screen.findByText("No applications yet")).toBeTruthy();
    expect(screen.getByText("Find a school in the directory and apply from its page.")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Explore schools" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/explore");
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<FamilyApplications />, ME_PARENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
