/**
 * TA-072 on the phone (testing analysis of 13 November 2026): the server now holds a survey's totals until
 * it closes, so an open survey with many answers comes back suppressed; the phone said "Hidden below five
 * answers." for it, which was not the reason. It now says the totals wait for the close, and keeps the
 * five-answer sentence for a closed survey with too few answers.
 */
import { fireEvent, screen } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { SurveysDeskScreen } from "@/screens/iqac/surveys";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const atCollege = (role: RoleCode) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules: ["ACADEMICS", "IQAC"], institutionKind: "COLLEGE" });
const survey = (id: string, over: Record<string, unknown> = {}) => ({ id, kind: "SSS", title: `ZZ Survey ${id}`, opensOn: "2026-10-01", closesOn: "2026-10-31", offeringId: null, status: "OPEN", responses: 12, anonymous: true, atrPublishedAt: null, ...over });
const hidden = (s: ReturnType<typeof survey>) => json({ survey: s, questions: [{ code: "Q01", label: "ZZ The syllabus was covered", mean: null, counts: [0, 0, 0, 0, 0] }], overall: null, suppressed: true, atr: null });

describe("TA-072: the phone's sentence for a survey whose totals are held", () => {
  it("TA-072: an open survey with twelve answers says the results wait for the close; a closed one with three says five answers", async () => {
    const open = survey("s1");
    const few = survey("s2", { status: "CLOSED", responses: 3 });
    await mountStaff(<SurveysDeskScreen />, "IQAC", {
      "GET /api/v1/iqac/surveys": () => json({ items: [open, few], canEdit: false }),
      "GET /api/v1/iqac/surveys/s1": () => hidden(open),
      "GET /api/v1/iqac/surveys/s2": () => hidden(few),
    }, { me: atCollege("IQAC") });
    await fireEvent.press(await screen.findByText("ZZ Survey s1"));
    expect(await screen.findByText("Hidden until the survey closes.")).toBeTruthy();
    expect(screen.queryByText("Hidden below five answers.")).toBeNull();
    await fireEvent.press(screen.getByText("ZZ Survey s2"));
    expect(await screen.findByText("Hidden below five answers.")).toBeTruthy();
  });
});
