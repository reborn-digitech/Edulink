import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { operatorSchoolCreatedSchema } from "@edulink/contracts";
import { OperatorNewSchool } from "@/screens/operator/new-school";
import { ToastProvider } from "@/components";
import { json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

beforeEach(() => mockRouter.replace.mockClear());

const OPERATOR = {
  user: { id: "u-op", name: "ZZ Operator", preferredName: null, email: "op@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: true, isAppAdmin: false },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};

const CREATED = operatorSchoolCreatedSchema.parse({ ok: true, schoolId: "s9", code: "HILL-7Q2W" });

const mount = (answers: Answers) =>
  mountStaff(
    <ToastProvider>
      <OperatorNewSchool />
    </ToastProvider>,
    "ADMIN",
    answers,
    { me: OPERATOR },
  );

describe("adding a school", () => {
  it("starts in India on India's clock, waits for a name and an email, then creates it and lands on its page", async () => {
    const { calls } = await mount({ "POST /api/v1/operator/schools": () => json(CREATED, 201) });
    expect(await screen.findByText("Creating a school does not give it anybody to run it. Invite an administrator afterwards — that is the next screen.")).toBeTruthy();
    expect(screen.getByLabelText("Country").props.value).toBe("India");
    expect(screen.getByLabelText("Timezone").props.value).toBe("Asia/Kolkata");
    expect(screen.getByRole("button", { name: "Create school" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Name"), " ZZ Hillside ");
    await fireEvent.changeText(screen.getByLabelText("Contact email"), "office@hill.zz.test");
    await fireEvent.changeText(screen.getByLabelText("Lowest grade"), "1");
    await fireEvent.changeText(screen.getByLabelText("Highest grade"), "8");
    await fireEvent.changeText(screen.getByLabelText("City"), "ZZ Pune");
    await fireEvent.press(screen.getByRole("button", { name: "Create school" }));
    await waitFor(() =>
      expect(calls().find((c) => c.line === "POST /api/v1/operator/schools")?.body).toEqual({
        name: "ZZ Hillside",
        contactEmail: "office@hill.zz.test",
        contactPhone: "",
        website: "",
        addressLine: "",
        city: "ZZ Pune",
        region: "",
        postalCode: "",
        country: "India",
        gradeLow: "1",
        gradeHigh: "8",
        timezone: "Asia/Kolkata",
      }),
    );
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/operator-school", params: { schoolId: "s9" } }));
    expect(await screen.findByText("ZZ Hillside created · Join code HILL-7Q2W")).toBeTruthy();
  });

  it("a refusal is the lib's sentence above the button, and nothing moves", async () => {
    await mount({ "POST /api/v1/operator/schools": refused("Give the school a name.", 422) });
    await fireEvent.changeText(await screen.findByLabelText("Name"), "Z");
    await fireEvent.changeText(screen.getByLabelText("Contact email"), "z@zz.test");
    await fireEvent.press(screen.getByRole("button", { name: "Create school" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Give the school a name.");
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
