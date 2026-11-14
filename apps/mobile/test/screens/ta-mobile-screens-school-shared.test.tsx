/**
 * Shared screens of the testing analysis of 13 November 2026, batch mobile-screens-school:
 * TA-020 (the counsellor route's sentence cut at 280 characters), TA-327 (the raw key
 * role.exam_controller), TA-356 (forms that keep their last state on the next visit),
 * TA-357 (a recovery code behind a number pad) and TA-358 (a seat price that is not a number).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { accountPostOptionsSchema, gigProviderSchema, roleSchema } from "@edulink/contracts";
import { dictionaryFor, translatorFor } from "@edulink/i18n";
import { ToastProvider } from "@/components";
import { ViduraSheet } from "@/screens/shared/vidura";
import { More } from "@/screens/shared/more";
import { ReportProblem } from "@/screens/shared/report-problem";
import { PostCompose } from "@/screens/family/post-compose";
import { ProviderSessions } from "@/screens/shared/provider-sessions";
import { TwoFactorStep } from "@/screens/auth/two-factor-step";
import { TwoStepCard } from "@/screens/shared/two-step-card";
import { authorTag } from "@/screens/alumni/tag";
import { roleLabel } from "@/screens/staff/shared";
import { renderApp } from "../utils";
import { EARNINGS, GATE, PAYOUT } from "./gig-fixtures";
import { json, me, mountStaff, type Answer } from "./staff-harness";
import { callsTo, fakeApi, json as tJson, tap, typeInto } from "./teacher-support";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
/** The callbacks screens gave useFocusEffect: `mockFocus.fire()` is the navigator bringing the screen to the front again. */
const mockFocus = (() => {
  const callbacks = new Set<() => void>();
  return {
    add: (cb: () => void) => {
      callbacks.add(cb);
      return () => {
        callbacks.delete(cb);
      };
    },
    fire: () => {
      for (const cb of [...callbacks]) cb();
    },
  };
})();
jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react") as typeof import("react");
  return {
    useRouter: () => mockRouter,
    usePathname: () => "/",
    useLocalSearchParams: () => mockRouter.params,
    useFocusEffect: (cb: () => void) => React.useEffect(() => mockFocus.add(cb), [cb]),
  };
});
jest.mock("@/lib/pick-file", () => ({ pickAndUpload: jest.fn(), PickError: class PickError extends Error {} }));
jest.mock("expo-image", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { Image: (props: object) => React.createElement(View, { ...props, testID: "expo-image" }) };
});

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.params = {};
});

/* ---------------------------------------------------------------- TA-020 */

describe("TA-020: the counsellor route's sentence", () => {
  const AT = "2026-10-10T04:00:00.000Z";
  const CONVERSATION = { id: "zz-c", language: "en", createdAt: AT, lastAt: AT, title: "ZZ", messageCount: 2, expiresAt: "2026-11-09T04:00:00.000Z" };
  const message = (over: Record<string, unknown>) => ({ id: "zz-a", role: "ASSISTANT", text: "ZZ answer", createdAt: AT, citations: [], verdict: "ANSWERED", mode: "HELP", hint: false, helpful: null, chip: null, cut: false, askPerson: null, ...over });
  const answers = (sentence: string, verdict: string): Record<string, Answer> => ({
    "GET /api/v1/assistant": () => json({ available: true, reason: null, help: true, tutor: true, language: "en", dailyCap: 40, usedToday: 0, retentionDays: 30, optOutPath: null, modes: ["USING", "RECORDS", "LEARNING"] }),
    "GET /api/v1/assistant/conversations": () => json({ conversations: [], retentionDays: 30 }),
    "GET /api/v1/assistant/suggestions": () => json({ suggestions: [] }),
    "POST /api/v1/assistant/conversations": () => json(CONVERSATION),
    "POST /api/v1/assistant/conversations/zz-c/messages": () => json({ conversationId: "zz-c", question: message({ id: "zz-q", role: "USER", text: "ZZ q", verdict: null, mode: null }), answer: message({ text: sentence, verdict, mode: null }) }),
  });
  // A school's own helpline of two hundred characters after the route's opening sentences: past the phone's 280.
  const HELPLINE = `ZZ Northgate counsellor Mrs Rao, room 12 beside the library, every school day from 8 in the morning to 4 in the afternoon, or by phone on 020 0000 0000 at any hour; she will listen and keep it private.`;
  const SELF_HARM = `ZZ Please talk to an adult you trust today. You do not have to face this on your own, and asking for help is the brave thing to do. You can reach: ${HELPLINE} Childline: 1098.`;

  it("TA-020: a fixed sentence is drawn whole, with no 'Show the whole answer', so the school's helpline is on screen", async () => {
    expect(SELF_HARM.length).toBeGreaterThan(350);
    await mountStaff(<ViduraSheet visible plan={false} conversationId={null} page={null} onClose={jest.fn()} />, "STUDENT", answers(SELF_HARM, "SELF_HARM"));
    await fireEvent.changeText(await screen.findByLabelText("Your question"), "ZZ q");
    await fireEvent.press(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByText(SELF_HARM)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Show the whole answer" })).toBeNull();
  });

  it("TA-020: the model's own long answer is still cut, with the button", async () => {
    const LONG = `ZZ Every action has an equal and opposite reaction. ${"When you push a wall, the wall pushes you back with the same force. ".repeat(8)}That is the third law.`;
    await mountStaff(<ViduraSheet visible plan={false} conversationId={null} page={null} onClose={jest.fn()} />, "STUDENT", answers(LONG, "ANSWERED"));
    await fireEvent.changeText(await screen.findByLabelText("Your question"), "ZZ q");
    await fireEvent.press(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByRole("button", { name: "Show the whole answer" })).toBeTruthy();
  });
});

/* ---------------------------------------------------------------- TA-327 */

describe("TA-327: an exam controller's role reads as words", () => {
  const t = translatorFor(dictionaryFor("en"));

  it("TA-327: the feed's tag and the shared helper name every role from the dictionary, in en, hi and mr", () => {
    expect(authorTag(t, "EXAM_CONTROLLER")).toBe("Exam controller");
    for (const locale of ["en", "hi", "mr"] as const) {
      const tr = translatorFor(dictionaryFor(locale));
      for (const role of roleSchema.options) expect(roleLabel(tr, role)).not.toMatch(/role\./);
    }
  });

  it("TA-327: More, as the exam controller, says 'Exam controller' and never a key", async () => {
    const ctl = me("EXAM_CONTROLLER");
    await mountStaff(<More />, "EXAM_CONTROLLER", {}, { me: { ...ctl, contexts: [...ctl.contexts, { schoolId: "s2", schoolName: "ZZ Vidya College", role: "EXAM_CONTROLLER" }] } });
    expect(await screen.findByText(/^ZZ Head · Exam controller/)).toBeTruthy();
    expect(screen.queryByText(/role\./)).toBeNull();
  });

  it("TA-327: no screen builds a role's key by hand outside the helper", () => {
    const root = join(__dirname, "../../src");
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.tsx?$/.test(name)) files.push(path);
      }
    };
    walk(root);
    const offenders = files.filter((f) => !f.endsWith(join("lib", "role-label.ts")) && /role\.\$\{/.test(readFileSync(f, "utf8"))).map((f) => relative(root, f));
    expect(offenders).toEqual([]);
  });
});

/* ---------------------------------------------------------------- TA-356 */

describe("TA-356: forms on a screen the navigator keeps mounted", () => {
  it("TA-356: Report a problem, opened again after a report was sent, offers the box for a new one", async () => {
    mockRouter.params = { from: "/more" };
    const fetch = fakeApi({ "/api/v1/app/report": () => tJson({ reportId: "r1", reference: "APP-7K3M2Q" }) });
    await renderApp(<ReportProblem />);
    await typeInto(screen.getByLabelText("What happened"), "ZZ the first problem");
    await tap(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Sent. Your reference is APP-7K3M2Q — quote it if the school asks.");
    // The person leaves and later comes back to the same mounted screen.
    await act(async () => mockFocus.fire());
    expect(await screen.findByLabelText("What happened")).toHaveDisplayValue("");
    expect(screen.queryByText(/APP-7K3M2Q/)).toBeNull();
    await typeInto(screen.getByLabelText("What happened"), "ZZ a second problem");
    await tap(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(callsTo(fetch, "/api/v1/app/report")).toHaveLength(2));
  });

  it("TA-356: New post, once a post is published, holds nothing of it", async () => {
    const CLASS = "czz0000000000000000class1";
    const PUPIL = accountPostOptionsSchema.parse({ role: "STUDENT", classes: [{ id: CLASS, name: "ZZ Class 5A" }], grades: [], allowSchoolWide: false, reviewedFirst: true });
    await mountStaff(
      <ToastProvider>
        <PostCompose />
      </ToastProvider>,
      "STUDENT",
      { "GET /api/v1/account/post-options": () => json(PUPIL), "POST /api/v1/shared/bulletin": () => json({ postId: "p8", status: "PENDING" }) },
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Learning & Academics" }));
    await fireEvent.changeText(screen.getByLabelText("Title"), "ZZ My volcano");
    await fireEvent.changeText(screen.getByLabelText("What do you want to say?"), "ZZ It erupts with vinegar.");
    await fireEvent.press(screen.getByRole("button", { name: "Send to my teacher" }));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/post", params: { postId: "p8" } }));
    expect(screen.getByLabelText("Title")).toHaveDisplayValue("");
    expect(screen.getByLabelText("What do you want to say?")).toHaveDisplayValue("");
    const chip = screen.getByRole("button", { name: "Learning & Academics" }).props as { accessibilityState?: { selected?: boolean; checked?: boolean } };
    expect(chip.accessibilityState?.selected ?? chip.accessibilityState?.checked ?? false).toBe(false);
  });
});

/* ---------------------------------------------------------------- TA-357 */

describe("TA-357: a recovery code can be typed", () => {
  it("TA-357: the sign-in's two-step code box is not a number pad, since a recovery code has letters", async () => {
    await mountStaff(<TwoFactorStep challenge="zz-challenge" onBack={jest.fn()} />, "ADMIN", {});
    const box = await screen.findByLabelText("The six-digit code from the app");
    expect(box.props.keyboardType).not.toBe("number-pad");
    expect(box.props.autoCapitalize).toBe("characters");
  });

  it("TA-357: turning two-step off, whose hint offers a recovery code, is not a number pad either", async () => {
    await mountStaff(
      <ToastProvider>
        <TwoStepCard />
      </ToastProvider>,
      "ADMIN",
      { "GET /api/v1/account/totp": () => json({ eligible: true, enabled: true, enabledAt: "2026-09-01T00:00:00.000Z", recoveryLeft: 8, available: true }) },
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Turn off" }));
    const box = await screen.findByLabelText("The six-digit code from the app");
    expect(box.props.keyboardType).not.toBe("number-pad");
    expect(box.props.autoCapitalize).toBe("characters");
  });
});

/* ---------------------------------------------------------------- TA-358 */

describe("TA-358: a seat price that is not a plain number", () => {
  const view = gigProviderSchema.parse({ enabled: true, kind: "EXPERT", timeZone: "Asia/Kolkata", duty: { deliveredOneToOnes: 3, heldWorkshops: 1, oneToOnesThisMonth: 1, workshopsThisQuarter: 0, startOneToOnes: 10, startWorkshops: 2, monthlyOneToOnes: 2, quarterlyWorkshops: 1 }, gate: { ...GATE, mentoringOffer: true, canCharge: true }, slots: [] });

  it.each(["1,500", ".", "1.5.0", "abc"])("TA-358: '%s' is refused under the box and nothing is offered free", async (typed) => {
    const { calls } = await mountStaff(<ProviderSessions />, "EXPERT", {
      "GET /api/v1/expert/payout": () => json(PAYOUT()),
      "GET /api/v1/expert/earnings": () => json(EARNINGS()),
      "GET /api/v1/gigs/slots": () => json(view),
      "POST /api/v1/gigs/slots": () => json({ slotId: "s9" }, 201),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Workshop" }));
    await fireEvent.changeText(screen.getByLabelText("What it is about"), "ZZ Build a paper bridge");
    await fireEvent.changeText(screen.getByLabelText("Date"), "2030-11-06");
    await fireEvent.changeText(screen.getByLabelText("Time"), "10:00");
    await fireEvent.changeText(screen.getByLabelText("Price of a seat (₹)"), typed);
    await fireEvent.changeText(screen.getByLabelText("Meeting link"), "https://meet.zz.test/w");
    await fireEvent.press(screen.getByRole("button", { name: "Offer it" }));
    expect((await screen.findAllByText(/^A seat costs between/)).length).toBeGreaterThan(0);
    expect(calls().some((c) => c.line === "POST /api/v1/gigs/slots")).toBe(false);
  });
});
