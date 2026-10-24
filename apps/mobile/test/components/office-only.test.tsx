import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { OfficeOnly } from "@/components/office-only";
import { me, mountStaff } from "../screens/staff-harness";

/**
 * QA-70 (QA campaign of 24 October 2026): an office path opened by another role sends that person to their own screen
 * where they have one, and otherwise says the page is the office's, with the way home; never "Wrong role" and a Try
 * again that cannot succeed. The office and the head see the screen.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
const redirected: string[] = [];
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
  Redirect: ({ href }: { href: string }) => {
    redirected.push(href);
    return null;
  },
}));

beforeEach(() => {
  redirected.length = 0;
  mockRouter.replace.mockClear();
});

const office = <Text>ZZ the office board</Text>;

describe("an office screen opened by another role", () => {
  it("is the office's and the head's as before", async () => {
    for (const role of ["ADMIN", "PRINCIPAL"] as const) {
      await mountStaff(<OfficeOnly own={{ TEACHER: "/(app)/my-covers" }}>{office}</OfficeOnly>, role, {}, { me: me(role) });
      expect(await screen.findByText("ZZ the office board")).toBeTruthy();
    }
  });

  it("sends a teacher to their own covers and a guardian to their own applications", async () => {
    await mountStaff(<OfficeOnly own={{ PARENT: "/(app)/my-applications" }}>{office}</OfficeOnly>, "PARENT", {}, { me: { ...me("PARENT"), active: { schoolId: null, role: "PARENT", membershipId: null }, contexts: [{ schoolId: null, schoolName: null, role: "PARENT" }] } });
    await waitFor(() => expect(redirected).toContain("/(app)/my-applications"));
    await mountStaff(<OfficeOnly own={{ TEACHER: "/(app)/my-covers" }}>{office}</OfficeOnly>, "TEACHER", {}, { me: me("TEACHER") });
    await waitFor(() => expect(redirected).toContain("/(app)/my-covers"));
    expect(screen.queryByText("ZZ the office board")).toBeNull();
  });

  it("tells anyone else the page is the office's, with the way home", async () => {
    await mountStaff(<OfficeOnly>{office}</OfficeOnly>, "STUDENT", {}, { me: me("STUDENT") });
    expect(await screen.findByText("This page is the office’s")).toBeTruthy();
    expect(screen.queryByText("ZZ the office board")).toBeNull();
    expect(screen.queryByText("Wrong role for this action")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Back to the start" }));
    expect(mockRouter.replace).toHaveBeenCalledWith("/(app)");
  });
});
