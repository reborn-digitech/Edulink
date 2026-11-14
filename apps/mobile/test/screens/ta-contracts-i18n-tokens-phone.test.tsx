import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { Translate } from "@edulink/i18n";
import { calls, child, HEADER, ID, ME_PARENT, renderFamily, SUMMARY, press } from "./family-helpers";
import { FamilyAttendance } from "@/screens/family/attendance";
import { ParentSettings } from "@/screens/family/settings";
import { dateProblem } from "@/screens/shared/pupil-record";

/**
 * The phone refuses a day or a time that does not exist before anything is sent: findings TA-113, TA-420, TA-546
 * and TA-329 of the testing analysis of 13 November 2026. The screens tested only the pattern (YYYY-MM-DD, H:MM),
 * so 2026-11-31, 2027-02-30 and 24:00 were sent, and the server kept them.
 */
const NOTES_PATH = `/api/v1/family/students/${ID.child}/absence-notes`;
const MONTH = {
  children: [child(ID.child, "ZZ Asha")],
  child: HEADER,
  month: "2026-09",
  thisMonth: "2026-09",
  previousMonth: "2026-08",
  nextMonth: null,
  summary: SUMMARY,
  days: [{ dateKey: "2026-09-04", status: "PRESENT", note: null, teachingDay: true }],
};
const LIST = { studentMembershipId: ID.child, childName: "ZZ Asha", today: "2026-09-07", notes: [] };
const SETTINGS_PATH = "/api/v1/family/settings";
const SETTINGS = { channels: { push: true, email: false }, quietHours: { start: "21:00", end: "07:00" }, children: [child(ID.child, "ZZ Asha")] };

describe("days and times that exist, on the phone", () => {
  it("TA-420: the pupil record's and the certificate's day check refuses 2027-02-30 and 2026-04-31, and takes 2028-02-29", () => {
    const t = ((key: string) => key) as unknown as Translate;
    expect(dateProblem(t, "2027-02-30")).toBe("refusal.useRealDateForm");
    expect(dateProblem(t, "2026-04-31")).toBe("refusal.useRealDateForm");
    expect(dateProblem(t, "2026-13-01")).toBe("refusal.useRealDateForm");
    expect(dateProblem(t, "2028-02-29")).toBeUndefined();
    expect(dateProblem(t, "")).toBeUndefined();
  });

  it("TA-546: an absence note for 2026-11-31 is refused under the field and nothing is sent", async () => {
    const { fetch } = await renderFamily(<FamilyAttendance />, ME_PARENT, { "/api/v1/family/attendance": () => MONTH, [NOTES_PATH]: () => LIST });
    expect(await screen.findByText("No day away ahead")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Day away"), "2026-11-31");
    await press(screen.getAllByRole("button", { name: "Tell the school" })[1]!);
    expect(await screen.findByText("Use a real date in YYYY-MM-DD form.")).toBeTruthy();
    expect(calls(fetch, NOTES_PATH).filter((c) => c.init?.method === "POST")).toHaveLength(0);
  });

  it("TA-329: quiet hours until 24:00 or from 25:99 are refused under the field and the save is shut", async () => {
    const { fetch } = await renderFamily(<ParentSettings />, ME_PARENT, { [SETTINGS_PATH]: () => SETTINGS });
    await fireEvent.changeText(await screen.findByLabelText("Until"), "24:00");
    expect(screen.getByText("Use HH:MM.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save notification settings" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Until"), "07:00");
    await fireEvent.changeText(screen.getByLabelText("From"), "25:99");
    expect(screen.getByText("Use HH:MM.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save notification settings" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("From"), "21:30");
    await waitFor(() => expect(screen.getByRole("button", { name: "Save notification settings" })).not.toBeDisabled());
    expect(calls(fetch, SETTINGS_PATH).filter((c) => c.init?.method === "POST")).toHaveLength(0);
  });
});
