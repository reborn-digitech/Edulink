import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { StaffMessaging } from "@/screens/staff/messaging";
import { audienceFor, MessagingNew } from "@/screens/staff/messaging-new";
import { MessagingBroadcast } from "@/screens/staff/messaging-broadcast";
import { audienceLabel, messageCaption, purposeLabel, skipLabel, statusLabel } from "@/screens/shared/messaging";
import { gated, json, mountStaff, refused } from "./staff-harness";

/** The router is the harness's, so a test can read where a row went; the report screen reads its id from the params. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const BID = "czz00000000000000000bc01";
const CREATED = "czz00000000000000000bc02";

const BROADCAST = {
  id: BID,
  title: "ZZ Sports day",
  body: "Sports day is on Friday; come in white.",
  channels: ["TEXT"],
  audience: { kind: "CLASS", classId: "c1" },
  recipients: 3,
  queued: 0,
  sent: 1,
  delivered: 1,
  failed: 1,
  skipped: 1,
  status: "DONE",
  createdAt: "2026-09-10T05:00:00.000Z",
  doneAt: "2026-09-10T05:01:00.000Z",
  author: "ZZ Office",
};

const MESSAGE = (over: Partial<typeof BASE>) => ({ ...BASE, ...over });
const BASE = {
  id: "m1",
  userId: "u2",
  name: "ZZ Parent" as string | null,
  to: "+919876543210",
  channel: "WHATSAPP",
  status: "DELIVERED",
  skipReason: null as string | null,
  error: null as string | null,
  segments: 1,
  createdAt: "2026-09-10T05:00:00.000Z",
  sentAt: "2026-09-10T05:00:10.000Z",
  deliveredAt: "2026-09-10T05:00:30.000Z",
  templateKey: "circular",
  purpose: "broadcast",
};

const OVERVIEW = {
  settings: { smsEnabled: true, whatsappEnabled: false, monthlyCap: 500, events: { absence: true, feeReminders: true, feeReceipts: false, circulars: true, incidents: true } },
  transports: { sms: "devbox", whatsapp: "off", problems: ["ZZ set TWILIO_WHATSAPP_FROM"] },
  month: { sent: 42, delivered: 40, failed: 1, skipped: 3, segments: 57, cap: 500 },
  skippedByReason: { "no-phone": 2, "opted-out": 1 },
  templates: [
    { key: "absence", label: "ZZ Missing school", event: "absence", smsIds: { en: "1107ZZ" }, whatsappIds: {}, text: { en: "ZZ {child}", hi: "ZZ {child}", mr: "ZZ {child}" } },
    { key: "circular", label: "ZZ Notice", event: "circulars", smsIds: {}, whatsappIds: {}, text: { en: "ZZ {notice}", hi: "ZZ {notice}", mr: "ZZ {notice}" } },
  ],
  recent: [BROADCAST],
  recentMessages: [MESSAGE({ id: "m2", name: "ZZ Rao", purpose: "fees:overdue", channel: "SMS", status: "SKIPPED", skipReason: "cap-monthly" }), MESSAGE({ id: "m3", name: null, purpose: "absence", channel: "SMS", status: "FAILED", error: "ZZ 30003 unreachable" })],
  parentsWithPhone: 38,
  parentsTotal: 40,
  classes: [
    { id: "c1", name: "ZZ 5A", gradeLevel: "5" },
    { id: "c2", name: "ZZ 6B", gradeLevel: "6" },
  ],
  grades: ["5", "6"],
};

const DETAIL = {
  broadcast: BROADCAST,
  messages: [BASE, MESSAGE({ id: "m4", name: "ZZ Shah", to: "+919800000001", channel: "SMS", status: "FAILED", error: "ZZ 30003 unreachable" }), MESSAGE({ id: "m5", name: "ZZ Nair", to: "", channel: "SMS", status: "SKIPPED", skipReason: "no-phone" })],
};

const withToast = (ui: React.ReactElement) => <ToastProvider>{ui}</ToastProvider>;

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.params = {};
});

describe("the words for the ledger's codes", () => {
  const t = ((key: string, vars?: Record<string, string | number>) => (vars ? `${key} ${JSON.stringify(vars)}` : key)) as never;
  it("map every code the server writes, and pass an unknown one through", () => {
    expect(statusLabel(t, "delivered")).toBe("messaging.statusDelivered");
    expect(statusLabel(t, "ZZ_NEW")).toBe("ZZ_NEW");
    expect(skipLabel(t, "no-phone")).toBe("messaging.skipNoPhone");
    expect(purposeLabel(t, "fees:dueSoon")).toBe("messaging.purposeFeesDueSoon");
    expect(purposeLabel(t, "test")).toBe("messaging.purposeTest");
    expect(audienceLabel(t, { kind: "ALL_PARENTS" })).toBe("messaging.audienceAll");
    expect(audienceLabel(t, { kind: "CLASS", classId: "c1" }, [{ id: "c1", name: "ZZ 5A" }])).toBe("messaging.audienceClass · ZZ 5A");
    expect(audienceLabel(t, { kind: "CLASS", classId: "c9" })).toBe("messaging.audienceClass");
    expect(audienceLabel(t, { kind: "GRADE", gradeLevel: "7" })).toBe("messaging.audienceGrade · 7");
    expect(audienceLabel(t, { kind: "OVERDUE_FEES" })).toBe("messaging.audienceOverdue");
    expect(audienceLabel(t, { kind: "PEOPLE", userIds: ["a", "b"] })).toBe("messaging.audiencePeople · 2");
    expect(messageCaption(t, { to: "+91", channel: "SMS", status: "FAILED", skipReason: null, error: "ZZ boom" }, true)).toBe("+91 · messaging.channelSms · messaging.statusFailed · ZZ boom");
    expect(messageCaption(t, { to: "+91", channel: "WHATSAPP", status: "SKIPPED", skipReason: "opted-out", error: null })).toBe("messaging.channelWhatsapp · messaging.statusSkipped · messaging.skipOptedOut");
  });

  it("builds the audience the server documents, or nothing while a class or grade is still to be chosen", () => {
    expect(audienceFor("ALL_PARENTS", null, null)).toEqual({ kind: "ALL_PARENTS" });
    expect(audienceFor("OVERDUE_FEES", "c1", "5")).toEqual({ kind: "OVERDUE_FEES" });
    expect(audienceFor("CLASS", null, null)).toBeNull();
    expect(audienceFor("CLASS", "c1", null)).toEqual({ kind: "CLASS", classId: "c1" });
    expect(audienceFor("GRADE", null, null)).toBeNull();
    expect(audienceFor("GRADE", null, "5")).toEqual({ kind: "GRADE", gradeLevel: "5" });
  });
});

describe("the messaging overview", () => {
  it("loads, then shows the month's figures, the switches, the server's senders, the notices and the automatic texts", async () => {
    const gate = gated();
    await mountStaff(withToast(<StaffMessaging />), "ADMIN", { "GET /api/v1/messaging/overview": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(OVERVIEW));
    expect(await screen.findByLabelText("Sent this month: 42")).toBeTruthy();
    expect(screen.getByLabelText("Delivered: 40")).toBeTruthy();
    expect(screen.getByLabelText("Failed: 1")).toBeTruthy();
    expect(screen.getByLabelText("Not sent: 3")).toBeTruthy();
    expect(screen.getByLabelText("SMS segments used · of 500 this month: 57")).toBeTruthy();
    expect(screen.getByLabelText("Guardians with a number · of 40: 38")).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Send SMS" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Send WhatsApp" })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: "Fee receipts" })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: "Missing school lately" })).toBeChecked();
    expect(screen.getByText("test mode — messages go to /dev/mailbox")).toBeTruthy();
    expect(screen.getByText("not configured")).toBeTruthy();
    expect(screen.getByText("ZZ set TWILIO_WHATSAPP_FROM")).toBeTruthy();
    // The notice, with its audience named from the classes list, and its counts.
    expect(screen.getByText("ZZ Sports day")).toBeTruthy();
    expect(screen.getByText(/One class · ZZ 5A · Sent 1 · Delivered 1 · Failed 1 · Not sent 1/)).toBeTruthy();
    // The automatic texts: the purpose in words, the reason it stopped.
    expect(screen.getByText("ZZ Rao · Fee overdue")).toBeTruthy();
    expect(screen.getByText(/SMS · Not sent · monthly cap reached/)).toBeTruthy();
    expect(screen.getByText("+919876543210 · Attendance")).toBeTruthy();
    expect(screen.getByText(/SMS · Failed · ZZ 30003 unreachable/)).toBeTruthy();
    // Templates: which have ids.
    expect(screen.getByText(/Missing school lately · DLT ids: en · WhatsApp ids: none yet/)).toBeTruthy();
    expect(screen.getByText(/Notices from the office · DLT ids: none yet · WhatsApp ids: none yet/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Sports day,/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/messaging-broadcast", params: { broadcastId: BID } });
    await fireEvent.press(screen.getByRole("button", { name: "New notice" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messaging-new");
  });

  it("a switch posts just that setting; the cap is saved on its own button and refused when it is not a number", async () => {
    const { calls } = await mountStaff(withToast(<StaffMessaging />), "ADMIN", { "GET /api/v1/messaging/overview": () => json(OVERVIEW), "POST /api/v1/messaging/settings": () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("switch", { name: "Send WhatsApp" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/messaging/settings").map((c) => c.body)).toEqual([{ whatsappEnabled: true }]));
    expect(await screen.findByText("Saved.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("switch", { name: "Fee receipts" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/messaging/settings").map((c) => c.body).at(-1)).toEqual({ events: { feeReceipts: true } }));
    // The overview is read again after each save.
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/messaging/overview").length).toBeGreaterThanOrEqual(3));
    const save = () => screen.getByRole("button", { name: "Save" });
    expect(save()).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Monthly cap (messages)"), "abc");
    expect(screen.getByText("The monthly cap must be a whole number between 0 and 1,000,000.")).toBeTruthy();
    expect(save()).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Monthly cap (messages)"), "750");
    await fireEvent.press(save());
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/messaging/settings").map((c) => c.body).at(-1)).toEqual({ monthlyCap: 750 }));
  });

  it("a refused save is said, and the switch stays as the server has it", async () => {
    await mountStaff(withToast(<StaffMessaging />), "ADMIN", { "GET /api/v1/messaging/overview": () => json(OVERVIEW), "POST /api/v1/messaging/settings": refused("ZZ not now.", 422) });
    await fireEvent.press(await screen.findByRole("switch", { name: "Send WhatsApp" }));
    expect(await screen.findByText("ZZ not now.")).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Send WhatsApp" })).not.toBeChecked();
  });

  it("the test button texts the office and says which channel took it, or why nothing went", async () => {
    let answers = 0;
    const { calls } = await mountStaff(withToast(<StaffMessaging />), "ADMIN", {
      "GET /api/v1/messaging/overview": () => json(OVERVIEW),
      "POST /api/v1/messaging/test": () => json(++answers === 1 ? { id: "m9", status: "QUEUED", channel: "SMS", skipReason: null } : { id: "m10", status: "SKIPPED", channel: null, skipReason: "no-phone" }),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Send a test to me" }));
    expect(await screen.findByText("Sent by SMS. Check your phone.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Send a test to me" }));
    expect(await screen.findByText("Not sent: no mobile number.")).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/messaging/test").length).toBe(2);
  });

  it("the head's empty lists open the same page on the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(withToast(<StaffMessaging />), "PRINCIPAL", { "GET /api/v1/messaging/overview": () => json({ ...OVERVIEW, recent: [], recentMessages: [] }) });
    const doors = await screen.findAllByRole("button", { name: "Texts & WhatsApp · Opens on the web" });
    expect(doors).toHaveLength(2);
    await fireEvent.press(doors[0]!);
    expect(open).toHaveBeenCalledWith(expect.stringContaining("/admin/messaging"));
    expect(screen.queryByRole("button", { name: "New notice" })).toBeNull();
    open.mockRestore();
  });

  it("the head reads: every switch is disabled, and there is no test, no cap and no new notice", async () => {
    await mountStaff(withToast(<StaffMessaging />), "PRINCIPAL", { "GET /api/v1/messaging/overview": () => json(OVERVIEW) });
    expect(await screen.findByLabelText("Sent this month: 42")).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Send SMS" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Fee reminders" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Send a test to me" })).toBeNull();
    expect(screen.queryByRole("button", { name: "New notice" })).toBeNull();
    expect(screen.queryByLabelText("Monthly cap (messages)")).toBeNull();
    expect(screen.getByRole("button", { name: /^ZZ Sports day,/ })).toBeTruthy();
  });

  it("nothing sent yet says so; a refusal is an alert with a retry", async () => {
    await mountStaff(withToast(<StaffMessaging />), "ADMIN", { "GET /api/v1/messaging/overview": () => json({ ...OVERVIEW, recent: [], recentMessages: [], transports: { sms: "twilio", whatsapp: "twilio", problems: [] } }) });
    expect(await screen.findByText("No notices yet.")).toBeTruthy();
    expect(screen.getByText("No automatic texts yet.")).toBeTruthy();
    expect(screen.getAllByText("live, through Twilio")).toHaveLength(2);
    // The empty lists' doors: the office writes a notice; the automatic texts' history is the web page. The test button stays the transport card's alone.
    expect(screen.getAllByRole("button", { name: "New notice" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Send a test to me" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Texts & WhatsApp · Opens on the web" })).toHaveLength(1);
    await mountStaff(withToast(<StaffMessaging />), "ADMIN", { "GET /api/v1/messaging/overview": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("a new notice", () => {
  it("checks reach for the chosen audience, then sends and opens the report", async () => {
    const { calls } = await mountStaff(withToast(<MessagingNew />), "ADMIN", {
      "GET /api/v1/messaging/overview": () => json(OVERVIEW),
      "POST /api/v1/messaging/broadcasts/preview": () => json({ recipients: 24, withPhone: 22, whatsapp: 15, sms: 7, unreachable: 2, estimatedSegments: 14 }),
      "POST /api/v1/messaging/broadcasts": () => json({ broadcastId: CREATED, recipients: 24, queued: 22, skipped: 2, pushed: 0 }, 201),
    });
    await screen.findByLabelText("Label (for your records)");
    // Nothing goes to the server while the words are missing.
    await fireEvent.press(screen.getByRole("button", { name: "Check reach" }));
    expect(screen.getByText("The notice needs between 5 and 300 characters.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("The notice"), "Sports day is on Friday; come in white.");
    expect(screen.getByText("39/300")).toBeTruthy();
    // A class must be chosen before the server is asked.
    await fireEvent.press(screen.getByRole("radio", { name: "One class" }));
    await fireEvent.press(screen.getByRole("button", { name: "Check reach" }));
    // The chip group's own label, and the refusal under it.
    expect(screen.getAllByText("Choose a class")).toHaveLength(2);
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.press(await screen.findByRole("radio", { name: "ZZ 5A · 5" }));
    await fireEvent.press(screen.getByRole("button", { name: "Check reach" }));
    expect(await screen.findByText("24 guardians")).toBeTruthy();
    expect(screen.getByText("15 by WhatsApp")).toBeTruthy();
    expect(screen.getByText("7 by SMS, about 14 segments")).toBeTruthy();
    expect(screen.getByText("2 cannot be texted")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/messaging/broadcasts/preview")?.body).toEqual({ audience: { kind: "CLASS", classId: "c1" }, body: "Sports day is on Friday; come in white." });
    // Sending needs a label and at least one channel.
    await fireEvent.press(screen.getByRole("switch", { name: "Text (WhatsApp or SMS)" }));
    await fireEvent.press(screen.getByRole("button", { name: "Send now" }));
    expect(screen.getByText("Give the notice a label for your own records.")).toBeTruthy();
    expect(screen.getByText("Choose at least one way to send it.")).toBeTruthy();
    expect(calls().some((c) => c.line === "POST /api/v1/messaging/broadcasts")).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Label (for your records)"), "ZZ Sports day");
    await fireEvent.press(screen.getByRole("switch", { name: "Text (WhatsApp or SMS)" }));
    await fireEvent.press(screen.getByRole("switch", { name: "App notification" }));
    await fireEvent.press(screen.getByRole("button", { name: "Send now" }));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/messaging-broadcast", params: { broadcastId: CREATED } }));
    expect(calls().find((c) => c.line === "POST /api/v1/messaging/broadcasts")?.body).toEqual({ title: "ZZ Sports day", body: "Sports day is on Friday; come in white.", audience: { kind: "CLASS", classId: "c1" }, channels: ["TEXT", "PUSH"] });
    expect(await screen.findByText("Sent to 22 families; 2 could not be texted.")).toBeTruthy();
  });

  it("a grade is chosen from the grades the overview lists; the server's refusal lands under the field it named", async () => {
    const { calls } = await mountStaff(withToast(<MessagingNew />), "ADMIN", {
      "GET /api/v1/messaging/overview": () => json(OVERVIEW),
      "POST /api/v1/messaging/broadcasts/preview": () => json({ error: "Nobody in that audience has an active guardian.", code: "BAD_REQUEST", issues: { audience: "Nobody in that audience has an active guardian." } }, 422),
    });
    await fireEvent.changeText(await screen.findByLabelText("The notice"), "ZZ a note for grade six");
    await fireEvent.press(screen.getByRole("radio", { name: "One grade" }));
    await fireEvent.press(await screen.findByRole("radio", { name: "6" }));
    await fireEvent.press(screen.getByRole("button", { name: "Check reach" }));
    expect(await screen.findByText("Nobody in that audience has an active guardian.")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(calls().find((c) => c.line === "POST /api/v1/messaging/broadcasts/preview")?.body).toEqual({ audience: { kind: "GRADE", gradeLevel: "6" }, body: "ZZ a note for grade six" });
  });

  it("a refusal that names no field is said above the buttons", async () => {
    await mountStaff(withToast(<MessagingNew />), "ADMIN", { "GET /api/v1/messaging/overview": () => json(OVERVIEW), "POST /api/v1/messaging/broadcasts/preview": refused("ZZ not now.", 503) });
    await fireEvent.changeText(await screen.findByLabelText("The notice"), "ZZ a note for everyone");
    await fireEvent.press(screen.getByRole("button", { name: "Check reach" }));
    expect(await screen.findByText("ZZ not now.")).toBeTruthy();
  });

  it("the head is told it is the office's, and nothing is fetched", async () => {
    const { calls } = await mountStaff(withToast(<MessagingNew />), "PRINCIPAL", {});
    expect(await screen.findByText("Only the school office can do that.")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/messaging/overview")).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Texts & WhatsApp" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messaging");
  });
});

describe("a notice's report", () => {
  it("lists every family with the channel, the state and the reason; the office queues the failed ones again", async () => {
    mockRouter.params = { broadcastId: BID };
    const { calls } = await mountStaff(withToast(<MessagingBroadcast />), "ADMIN", {
      [`GET /api/v1/messaging/broadcasts/${BID}`]: () => json(DETAIL),
      [`POST /api/v1/messaging/broadcasts/${BID}/resend`]: () => json({ requeued: 1 }),
    });
    expect(await screen.findByText("Notice · ZZ Sports day")).toBeTruthy();
    expect(screen.getByText(/One class · By ZZ Office/)).toBeTruthy();
    expect(screen.getByLabelText("Recipients: 3")).toBeTruthy();
    expect(screen.getByLabelText("Failed: 1")).toBeTruthy();
    expect(screen.getByText("Sports day is on Friday; come in white.")).toBeTruthy();
    expect(screen.getByText("ZZ Parent")).toBeTruthy();
    expect(screen.getByText("+919876543210 · WhatsApp · Delivered")).toBeTruthy();
    expect(screen.getByText("+919800000001 · SMS · Failed · ZZ 30003 unreachable")).toBeTruthy();
    expect(screen.getByText("SMS · Not sent · no mobile number")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Try the failed ones again" }));
    expect(await screen.findByText("1 queued again.")).toBeTruthy();
    expect(calls().some((c) => c.line === `POST /api/v1/messaging/broadcasts/${BID}/resend`)).toBe(true);
    await waitFor(() => expect(calls().filter((c) => c.line === `GET /api/v1/messaging/broadcasts/${BID}`).length).toBe(2));
  });

  it("the head reads without the resend; a notice with nothing failed has none either", async () => {
    mockRouter.params = { broadcastId: BID };
    await mountStaff(withToast(<MessagingBroadcast />), "PRINCIPAL", { [`GET /api/v1/messaging/broadcasts/${BID}`]: () => json(DETAIL) });
    expect(await screen.findByText("ZZ Parent")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Try the failed ones again" })).toBeNull();
    await mountStaff(withToast(<MessagingBroadcast />), "ADMIN", { [`GET /api/v1/messaging/broadcasts/${BID}`]: () => json({ ...DETAIL, broadcast: { ...BROADCAST, failed: 0 }, messages: [] }) });
    expect(await screen.findByText("Nobody was texted.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Try the failed ones again" })).toBeNull();
  });

  it("without an id, offers the overview; a refusal is an alert with a retry", async () => {
    await mountStaff(withToast(<MessagingBroadcast />), "ADMIN", {});
    expect(await screen.findByText("That was not found.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Texts & WhatsApp" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messaging");
    mockRouter.params = { broadcastId: BID };
    await mountStaff(withToast(<MessagingBroadcast />), "ADMIN", { [`GET /api/v1/messaging/broadcasts/${BID}`]: refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
