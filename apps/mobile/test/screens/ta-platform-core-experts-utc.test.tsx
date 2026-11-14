/**
 * TA-277 (testing analysis of 13 November 2026): an expert's window is stored, offered and printed in UTC on the web
 * and on the expert's own screen, and the school's phone list printed it in the device's zone, five and a half hours
 * from the web's list on a phone on India's clock. The list now prints it in UTC.
 */
import { screen } from "@testing-library/react-native";
import { Experts } from "@/screens/shared/experts";
import { json, mountStaff } from "./staff-harness";

// A phone on India's clock. Node reads TZ when a date is next formatted, which is at render, after this line.
process.env.TZ = "Asia/Kolkata";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const EXPERTS = {
  specialisms: ["Maths"],
  experts: [
    {
      id: "e1",
      name: "ZZ Expert",
      headline: "ZZ Careers adviser",
      bio: "Fifteen years in engineering.",
      organisation: "ZZ Org",
      specialisms: ["Maths"],
      verified: true,
      offering: "BOTH",
      mentorCapacity: 3,
      mentoringOpen: true,
      openSlots: [{ id: "czz00000000000000000slot1", startsAt: "2030-01-10T09:30:00.000Z", endsAt: "2030-01-10T10:30:00.000Z", note: null }],
    },
  ],
  bookings: [{ id: "b1", topic: "ZZ Talk", status: "CONFIRMED", startsAt: "2030-01-12T09:30:00.000Z", endsAt: "2030-01-12T10:30:00.000Z", expertName: "ZZ Booked", schoolName: "ZZ School", unread: 0 }],
};

describe("TA-277: the school's expert list on a phone on India's clock", () => {
  it("TA-277: prints an open window and a booking at the UTC hour the web prints, not the device's", async () => {
    await mountStaff(<Experts />, "TEACHER", { "GET /api/v1/staff/experts": () => json(EXPERTS) });
    await screen.findByText("ZZ Careers adviser");
    // 09:30–10:30 UTC is 15:00–16:00 on India's clock.
    expect(screen.getByText(/9:30.*10:30/)).toBeTruthy();
    expect(screen.queryByText(/3:00.*4:00/)).toBeNull();
    expect(screen.getByText(/ZZ Talk · .*9:30/)).toBeTruthy();
  });
});
