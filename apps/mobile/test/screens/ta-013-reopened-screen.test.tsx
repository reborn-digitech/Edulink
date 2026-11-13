/**
 * TA-013 (testing analysis of 13 November 2026): a screen opened again for another pupil, class,
 * paper or child keeps the first one: a teacher's message goes to the wrong family and marks to
 * the wrong paper.
 *
 * Every signed-in route is a screen of one Tabs navigator (src/app/(app)/_layout.tsx), and the
 * navigator keeps a visited screen mounted: going to it again with other params does not mount
 * it again, it hands the mounted screen new params. The screens below read their param once, in
 * a useState initialiser (shared/remark-new.tsx ComposeForm, teacher/marks.tsx, family/agenda.tsx),
 * so the second visit shows and acts on the first visit's pupil, paper or child. The remark form
 * also keeps its subject and text after a send.
 *
 * The router here is what the navigator does to a mounted screen: `mockNav.open(params)` replaces
 * the route's params and every reader of useLocalSearchParams is drawn again; nothing is mounted
 * twice. Each case renders the ROUTE (src/app/(app)/…), so a fix may sit in the route file (a key
 * on the screen) or in the screen (a key on the inner form, or the asked-versus-last-asked
 * pattern family/exams.tsx already has). A fix made in the navigator itself (getId on the
 * Tabs.Screen) is out of this mock's sight.
 */
import { Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { marksBatchSchema, marksGridSchema, staffExamsSchema, teachingRemarkPeopleSchema, teachingStartRemarkSchema, type MarksBatch, type TeachingStartRemarkBody } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import RemarkNewRoute from "@/app/(app)/remark-new";
import MarksRoute from "@/app/(app)/marks";
import AgendaRoute from "@/app/(app)/agenda";
import { __setOutboxStore, memoryOutbox } from "@/lib/outbox";
import { __setReplayFetch, __stopOutboxRunner } from "@/lib/outbox-runner";
import { json, mountStaff } from "./staff-harness";
import { ID } from "./teacher-support";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
/** The route's params, as the navigator holds them for a screen that stays mounted. */
const mockNav = (() => {
  let params: Record<string, string> = {};
  const readers = new Set<() => void>();
  return {
    read: () => params,
    subscribe: (reader: () => void) => {
      readers.add(reader);
      return () => {
        readers.delete(reader);
      };
    },
    /** The app is sent to the screen with these params: the first time mounts it, a later time finds it mounted. */
    open: (next: Record<string, string>) => {
      params = next;
      for (const reader of [...readers]) reader();
    },
  };
})();
jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react") as typeof import("react");
  return { useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => React.useSyncExternalStore(mockNav.subscribe, mockNav.read) };
});

/**
 * Mounted beside each route and reading the route's params as the screens do: what it shows is
 * what every mounted reader was handed, so a red case below is the screen's and not this router's.
 */
function AskedFor() {
  return <Text testID="zz-asked-for">{JSON.stringify(useLocalSearchParams())}</Text>;
}

/** The second visit: new params for the mounted screen, then whatever it reads because of them. */
async function openAgainWith(params: Record<string, string>): Promise<void> {
  await act(async () => {
    mockNav.open(params);
  });
  expect(screen.getByTestId("zz-asked-for")).toHaveTextContent(JSON.stringify(params));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull());
}

beforeEach(() => {
  mockRouter.push.mockClear();
  __stopOutboxRunner();
  __setOutboxStore(memoryOutbox());
});
afterEach(() => {
  __stopOutboxRunner();
  __setReplayFetch(null);
  __setOutboxStore(null);
});

describe("TA-013: the message form opened from one pupil's row, then from another's", () => {
  const PATH = "/api/v1/teaching/remarks";
  const PEOPLE = teachingRemarkPeopleSchema.parse({
    role: "TEACHER",
    selfOnly: false,
    students: [
      { membershipId: ID.pupil1, name: "ZZ Asha", fullName: "ZZ Asha Rao", avatarKey: null, className: "ZZ 5A", guardianCount: 2 },
      { membershipId: ID.pupil2, name: "ZZ Bhavesh", fullName: "ZZ Bhavesh Patil", avatarKey: null, className: "ZZ 5A", guardianCount: 2 },
    ],
    pupils: [],
  });
  const FAMILY_OF: Record<string, string> = { [ID.pupil1]: "ZZ Asha Rao", [ID.pupil2]: "ZZ Bhavesh Patil" };
  /** The pupil the form has chosen, by the radio that is checked. */
  const chosenPupil = () =>
    screen
      .queryAllByRole("radio", { checked: true })
      .map((radio) => String(radio.props.accessibilityLabel))
      .filter((label) => label.startsWith("ZZ Asha") || label.startsWith("ZZ Bhavesh"));
  const boxes = () => ({ subject: screen.getByLabelText("Subject").props.value as string, message: screen.getByLabelText("Message").props.value as string });

  /** From ZZ Asha's row of the class page: the form opens with her chosen, a note is written and sent. */
  async function writeToAshasFamily() {
    mockNav.open({ membershipId: ID.pupil1 });
    const sent: TeachingStartRemarkBody[] = [];
    await mountStaff(
      <ToastProvider>
        <AskedFor />
        <RemarkNewRoute />
      </ToastProvider>,
      "TEACHER",
      {
        [`GET ${PATH}`]: () => json(PEOPLE),
        [`POST ${PATH}`]: ({ init }) => {
          sent.push(teachingStartRemarkSchema.parse(JSON.parse(String(init.body))));
          return json({ threadId: ID.thread1 }, 201);
        },
      },
    );
    await screen.findByRole("radio", { name: "ZZ Asha Rao, ZZ 5A" });
    expect(chosenPupil()).toEqual(["ZZ Asha Rao, ZZ 5A"]);
    await fireEvent.changeText(screen.getByLabelText("Subject"), "ZZ Asha's reading");
    await fireEvent.changeText(screen.getByLabelText("Message"), "ZZ Asha read aloud to the class today.");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/messages/thread", params: { threadId: ID.thread1 } }));
    expect(sent.map((body) => FAMILY_OF[body.studentMembershipId!])).toEqual(["ZZ Asha Rao"]);
    return sent;
  }

  it("has the second pupil chosen", async () => {
    await writeToAshasFamily();
    await openAgainWith({ membershipId: ID.pupil2 });
    expect(chosenPupil()).toEqual(["ZZ Bhavesh Patil, ZZ 5A"]);
  });

  it("does not hold the subject and text of the message sent about the first pupil", async () => {
    await writeToAshasFamily();
    await openAgainWith({ membershipId: ID.pupil2 });
    expect(boxes()).toEqual({ subject: "", message: "" });
  });

  it("sends what is written now to the second pupil's family", async () => {
    const sent = await writeToAshasFamily();
    await openAgainWith({ membershipId: ID.pupil2 });
    // The teacher writes about ZZ Bhavesh over whatever the boxes hold, and presses Send.
    await fireEvent.changeText(screen.getByLabelText("Subject"), "ZZ Bhavesh's homework");
    await fireEvent.changeText(screen.getByLabelText("Message"), "ZZ Bhavesh has not handed in this week's sums.");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(sent).toHaveLength(2));
    expect({ about: sent[1]!.subject, goesToTheFamilyOf: FAMILY_OF[sent[1]!.studentMembershipId!] }).toEqual({ about: "ZZ Bhavesh's homework", goesToTheFamilyOf: "ZZ Bhavesh Patil" });
  });

  it("is clear for the next message once one has been sent", async () => {
    await writeToAshasFamily();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(boxes()).toEqual({ subject: "", message: "" });
  });
});

describe("TA-013: the marks grid opened for one paper, then for another paper of the same class", () => {
  const SCIENCE = "czz00000000000000000s2";
  const PAPER: Record<string, string> = { [ID.slot1]: "Maths", [SCIENCE]: "Science" };
  const NAMES: Record<string, string> = { [ID.pupil1]: "ZZ Asha", [ID.pupil2]: "ZZ Bhavesh" };
  const slot = (id: string, dateKey: string) => ({ id, subject: PAPER[id], dateKey, startMinute: 540, endMinute: 600, maxMarks: 50 });
  const EXAMS = staffExamsSchema.parse({
    classes: [{ id: ID.class1, name: "ZZ 5A", gradeLevel: "5", series: [{ id: ID.series1, name: "Term 1", kind: "UNIT_TEST", publishedAt: null, slots: [slot(ID.slot1, "2026-09-04"), slot(SCIENCE, "2026-09-05")] }] }],
  });
  /** The server's marks: Maths has ZZ Asha's 41, Science has nobody's yet. */
  const HELD: Record<string, Record<string, number>> = { [ID.slot1]: { [ID.pupil1]: 41 }, [SCIENCE]: {} };
  const gridOf = (slotId: string) =>
    marksGridSchema.parse({
      classId: ID.class1,
      slotId,
      grid: { seriesName: "Term 1", subject: PAPER[slotId], maxMarks: 50, assignmentId: null, pupils: [ID.pupil1, ID.pupil2].map((id) => ({ membershipId: id, name: NAMES[id], marks: HELD[slotId]![id] ?? null })) },
      examUnweighted: false,
    });
  const paperOnScreen = () => Object.values(PAPER).filter((subject) => screen.queryByText(`${subject} · Term 1`) !== null);
  const boxes = () => ({ "ZZ Asha": screen.queryByLabelText("ZZ Asha")?.props.value as string | undefined, "ZZ Bhavesh": screen.queryByLabelText("ZZ Bhavesh")?.props.value as string | undefined });

  /** From Exams: the Maths paper of ZZ 5A opens, and a mark is typed for ZZ Bhavesh and not saved. */
  async function openMathsAndTypeAMark() {
    mockNav.open({ classId: ID.class1, slotId: ID.slot1 });
    const gridsRead: string[] = [];
    const saved: MarksBatch[] = [];
    const route = (
      <>
        <AskedFor />
        <MarksRoute />
      </>
    );
    const { fetch } = await mountStaff(route, "TEACHER", {
      "GET /api/v1/staff/exams": () => json(EXAMS),
      "GET /api/v1/staff/exams/grid": ({ url }) => {
        const slotId = url.searchParams.get("slotId")!;
        gridsRead.push(PAPER[slotId]!);
        return json(gridOf(slotId));
      },
      "POST /api/v1/marks": ({ init }) => {
        saved.push(marksBatchSchema.parse(JSON.parse(String(init.body))));
        return json({ saved: 1, cleared: 0 });
      },
    });
    __setReplayFetch(fetch as unknown as typeof globalThis.fetch);
    await screen.findByText("Maths · Term 1");
    await fireEvent.changeText(screen.getByLabelText("ZZ Bhavesh"), "17");
    expect({ gridsRead, paperOnScreen: paperOnScreen(), boxes: boxes() }).toEqual({ gridsRead: ["Maths"], paperOnScreen: ["Maths"], boxes: { "ZZ Asha": "41", "ZZ Bhavesh": "17" } });
    return { gridsRead, saved };
  }

  it("reads and shows the paper asked for, with none of the first paper's marks in its boxes", async () => {
    const { gridsRead } = await openMathsAndTypeAMark();
    await openAgainWith({ classId: ID.class1, slotId: SCIENCE });
    expect({ scienceGridRead: gridsRead.includes("Science"), paperOnScreen: paperOnScreen(), boxes: boxes() }).toEqual({ scienceGridRead: true, paperOnScreen: ["Science"], boxes: { "ZZ Asha": "", "ZZ Bhavesh": "" } });
  });

  it("saves the marks typed now on the paper asked for", async () => {
    const { saved } = await openMathsAndTypeAMark();
    await openAgainWith({ classId: ID.class1, slotId: SCIENCE });
    // The teacher, sent here for Science, types ZZ Asha's Science mark and saves.
    await fireEvent.changeText(await screen.findByLabelText("ZZ Asha"), "33");
    await fireEvent.press(screen.getByRole("button", { name: "Save marks" }));
    await waitFor(() => expect(saved).toHaveLength(1));
    const sheet = saved[0]!;
    expect({ savedOnThePaper: PAPER[sheet.slotId], sheet: sheet.entries.map((e) => `${NAMES[e.membershipId]} ${e.marks ?? "blank"}`).join(", ") }).toEqual({ savedOnThePaper: "Science", sheet: "ZZ Asha 33, ZZ Bhavesh blank" });
  });
});

describe("TA-013: a guardian's agenda opened for one child, then for the other", () => {
  const PATH = "/api/v1/family/agenda";
  const ASHA = "czz0000000000000000child1";
  const BELA = "czz0000000000000000child2";
  const CHILD: Record<string, string> = { [ASHA]: "ZZ Asha", [BELA]: "ZZ Bela" };
  const ME_PARENT = {
    user: { id: "u-parent", name: "ZZ Parent", preferredName: null, email: "p@zz.test", avatarKey: null, isMinor: false, locale: "en" },
    active: { schoolId: null, role: "PARENT", membershipId: null },
    contexts: [{ schoolId: null, schoolName: null, role: "PARENT" }],
  };
  const agendaOf = (studentMembershipId: string) => ({
    children: [ASHA, BELA].map((id) => ({ studentMembershipId: id, name: CHILD[id], schoolName: "ZZ School", leftAt: null })),
    student: { studentMembershipId, name: CHILD[studentMembershipId], schoolName: "ZZ School" },
    fromKey: "2026-10-01",
    toKey: "2026-10-14",
    days: 14,
    timeZone: "Asia/Kolkata",
    rows: [{ id: `exam:${studentMembershipId}`, kind: "EXAM", dateKey: "2026-10-03", at: null, endDateKey: null, title: `${CHILD[studentMembershipId]}'s Mathematics paper`, detail: null, amountPaise: null, href: "/exams" }],
  });
  const whoseDays = () => Object.values(CHILD).filter((name) => screen.queryByText(new RegExp(`The next 14 days for ${name}`)) !== null);

  it("reads and shows the second child's days", async () => {
    mockNav.open({ child: ASHA });
    const agendasRead: string[] = [];
    await mountStaff(
      <>
        <AskedFor />
        <AgendaRoute />
      </>,
      "PARENT",
      {
        [`GET ${PATH}`]: ({ url }) => {
          const asked = url.searchParams.get("student") ?? ASHA;
          agendasRead.push(CHILD[asked]!);
          return json(agendaOf(asked));
        },
      },
      { me: ME_PARENT },
    );
    await screen.findByText(/The next 14 days for ZZ Asha/);
    expect(agendasRead).toEqual(["ZZ Asha"]);
    // On the overview the guardian chooses ZZ Bela and taps Agenda.
    await openAgainWith({ child: BELA });
    expect({ belasAgendaRead: agendasRead.includes("ZZ Bela"), daysOnScreenAre: whoseDays() }).toEqual({ belasAgendaRead: true, daysOnScreenAre: ["ZZ Bela"] });
  });
});
