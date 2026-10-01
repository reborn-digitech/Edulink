import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Search, searchPath } from "@/screens/shared/search";
import { json, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/search", useLocalSearchParams: () => mockRouter.params }));

const hit = (kind: "people" | "posts" | "messages" | "papers" | "pages", id: string, title: string, href: string, phoneRoute: string | null, subtitle: string | null = null) => ({ kind, id, title, subtitle, href, phoneRoute });

const results = {
  q: "asha",
  people: [hit("people", "m1", "Asha Patil", "/people/m1", "/(app)/classes/detail?classId=c1", "Pupil · Class 5A")],
  posts: [hit("posts", "p1", "Asha wins the quiz", "/bulletin/p1", "/(app)/post?postId=p1", "ZZ Head")],
  messages: [],
  papers: [hit("papers", "k1", "Term 1", "/report-cards/k1", "/(app)/report-cards?classId=c1", "Asha Patil · Class 5A")],
  pages: [hit("pages", "/teacher/assignments", "Assignments", "/teacher/assignments", null), hit("pages", "/teacher/nowhere", "Nowhere", "/teacher/nowhere", null)],
};

describe("the Search screen", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("asks the server once the box holds two letters, draws the groups, and a row opens its screen", async () => {
    const { calls } = await mountStaff(<Search />, "TEACHER", {
      "GET /api/v1/search": ({ url }) => json({ ...results, q: url.searchParams.get("q") }),
    });
    // The floor, and the debounce: one letter sends nothing, and a word typed
    // letter by letter is one request for the whole word.
    expect(await screen.findByText("Type at least two letters.")).toBeTruthy();
    const box = screen.getByLabelText("Search the school");
    for (const typed of ["a", "as", "ash", "asha"]) await fireEvent.changeText(box, typed);
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${searchPath("asha")}`)).toBe(true));
    expect(calls().filter((c) => c.line.startsWith("GET /api/v1/search")).map((c) => c.line)).toEqual([`GET ${searchPath("asha")}`]);
    expect(await screen.findByText("People · 1")).toBeTruthy();
    expect(screen.getByText("Posts · 1")).toBeTruthy();
    expect(screen.getByText("Papers · 1")).toBeTruthy();
    expect(screen.getByText("Pages · 2")).toBeTruthy();
    // An empty group is not drawn.
    expect(screen.queryByText(/^Messages/)).toBeNull();

    // A row goes where the server said.
    await fireEvent.press(screen.getByRole("button", { name: "Asha Patil, Pupil · Class 5A" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/classes/detail?classId=c1");
    await fireEvent.press(screen.getByRole("button", { name: "Asha wins the quiz, ZZ Head" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/post?postId=p1");

    // A page names no screen: its web path is mapped the way a notification's is.
    await fireEvent.press(screen.getByRole("button", { name: "Assignments" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/assignments" });
    // One the phone has no screen for opens on the web.
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await fireEvent.press(screen.getByRole("button", { name: "Nowhere" }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/teacher\/nowhere$/));
    open.mockRestore();
  });

  it("says when nothing matches, and when the search could not run", async () => {
    await mountStaff(<Search />, "PARENT", {
      "GET /api/v1/search": ({ url }) => (url.searchParams.get("q") === "zzz" ? json({ q: "zzz", people: [], posts: [], messages: [], papers: [], pages: [] }) : json({ error: "The search could not run.", code: "SERVER" }, 500)),
    });
    await fireEvent.changeText(await screen.findByLabelText("Search the school"), "zzz");
    expect(await screen.findByText("Nothing matches “zzz”.")).toBeTruthy();
    expect(screen.getByText("Try another spelling, or a shorter word.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Search the school"), "boom");
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("The search could not run.")).toBeTruthy();
  });
});
