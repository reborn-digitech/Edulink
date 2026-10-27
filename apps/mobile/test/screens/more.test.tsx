import { Linking } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { More } from "@/screens/shared/more";
import { json, me, mountStaff } from "./staff-harness";
import { __setOutboxStore, enqueue, memoryOutbox, setOutboxOwner } from "@/lib/outbox";
import { keyStore } from "@/lib/storage";

const mockRouter = { push: jest.fn(), replace: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/more", useLocalSearchParams: () => mockRouter.params }));

describe("the More sheet", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("leads with the person — their avatar and name, which open their account", async () => {
    await mountStaff(<More />, "TEACHER", {});
    await fireEvent.press(await screen.findByRole("button", { name: "ZZ Head, Account" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/account");
  });

  it("lists a teacher's sections in the web's groups, and a row opens its screen", async () => {
    await mountStaff(<More />, "TEACHER", {});
    expect(await screen.findByText("Day to day")).toBeTruthy();
    expect(screen.getByText("School life")).toBeTruthy();
    expect(screen.getByText("Running things")).toBeTruthy();
    expect(screen.getByText("ZZ Head · Teacher · ZZ School")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Social Media" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/bulletin");
    await fireEvent.press(screen.getByRole("button", { name: "Me" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/profile");
    // The bar's own tabs are not repeated.
    expect(screen.queryByRole("button", { name: "Classes" })).toBeNull();
  });

  it("the office's invites and directory open in the app now, not on the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<More />, "ADMIN", {});
    await fireEvent.press(await screen.findByRole("button", { name: "Invites" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/invites");
    // The directory listing is under Setup, which starts closed (27 Oct 2026, item 3).
    await fireEvent.press(screen.getByRole("button", { name: "Setup" }));
    await fireEvent.press(screen.getByRole("button", { name: "Directory" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/directory-profile");
    // The office's More still opens two read-only pages on the web (QA-66: council notices, my appointment letters),
    // and neither of these two.
    expect(screen.getAllByText("Open on the web")).toHaveLength(2);
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it("an expert has the profile and the account, and no school groups", async () => {
    await mountStaff(<More />, "EXPERT", {});
    expect(await screen.findByRole("button", { name: "Profile" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Account" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/account");
    expect(screen.queryByText("School life")).toBeNull();
  });

  it("notifications, report a problem and sign out are there for everyone", async () => {
    await mountStaff(<More />, "PARENT", {});
    await fireEvent.press(await screen.findByRole("button", { name: "Notifications" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/notifications");
    await fireEvent.press(screen.getByRole("button", { name: "Report a problem" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/report", params: { from: "/more" } });
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });
});

describe("the More sheet after the campaign of 4 October 2026", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("saves a language chosen here to the account, so the server's refusals come back in it (B-24)", async () => {
    const { calls } = await mountStaff(<More />, "TEACHER", { "POST /api/v1/account/locale": () => json({ ok: true, locale: "mr" }) });
    await fireEvent.press(await screen.findByRole("radio", { name: "Marathi" }));
    expect(calls().filter((c) => c.line === "POST /api/v1/account/locale").map((c) => c.body)).toEqual([{ locale: "mr" }]);
  });

  it("gives a college's faculty member their own check-in and, with payroll on, their payslips (G-1, G-2)", async () => {
    const faculty = { ...me("FACULTY" as never), modules: ["ACADEMICS", "PAYROLL"], institutionKind: "COLLEGE" };
    await mountStaff(<More />, "FACULTY" as never, {}, { me: faculty });
    await fireEvent.press(await screen.findByRole("button", { name: "Staff attendance" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/my-attendance");
    await fireEvent.press(screen.getByRole("button", { name: "My payslips" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/payslips");
  });

  it("gives the registrar of a college the college at a glance and the college's desks on the web (G-4)", async () => {
    const registrar = { ...me("ADMIN"), modules: ["ACADEMICS", "EXAMS"], institutionKind: "COLLEGE" };
    await mountStaff(<More />, "ADMIN", {}, { me: registrar });
    await fireEvent.press(await screen.findByRole("button", { name: "The college" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/college");
    expect(screen.getAllByText("Open on the web").length).toBeGreaterThan(0);
  });

  it("gives a school's office none of the college's entries (G-4)", async () => {
    await mountStaff(<More />, "ADMIN", {});
    await screen.findByRole("button", { name: "Invites" });
    expect(screen.queryByRole("button", { name: "The college" })).toBeNull();
  });

  it("says what waits unsent at the other school beside it, without sending it here (PH-6)", async () => {
    __setOutboxStore(memoryOutbox());
    setOutboxOwner({ userId: "u1", schoolId: "s2", membershipId: "m2" });
    await enqueue({ url: "/api/attendance", method: "POST", body: "{}", tag: "register" });
    setOutboxOwner({ userId: "u1", schoolId: "s1", membershipId: "m1" });
    const two = { ...me("TEACHER"), contexts: [{ schoolId: "s1", schoolName: "ZZ School", role: "TEACHER" }, { schoolId: "s2", schoolName: "ZZ Other School", role: "TEACHER" }] };
    await mountStaff(<More />, "TEACHER", {}, { me: two });
    expect(await screen.findByRole("button", { name: "ZZ Other School, Teacher · 1 waiting to send" })).toBeTruthy();
    // Here, at the first school, nothing waits.
    expect(screen.queryByRole("button", { name: /ZZ School, Teacher · / })).toBeNull();
  });
});

describe("the More sheet in the office's seven groups (27 Oct 2026, item 3)", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("lists the office's pages under the seven groups, Setup closed until opened, and the person's own pages under Me", async () => {
    await mountStaff(<More />, "ADMIN", {}, { me: { ...me("ADMIN"), modules: ["PAYROLL", "INVENTORY"] } });
    for (const name of ["Teaching", "People and records", "Attendance and cover", "Money", "Communication", "Setup"]) expect(await screen.findByRole("button", { name })).toBeTruthy();
    expect(screen.queryByText("Running things")).toBeNull();
    // Me: my payslips, my items and my letters, not among the school's work.
    expect(screen.getByRole("header", { name: "Me" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "My payslips" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/payslips");
    // Setup starts closed: its name says so, and its pages are not drawn until it opens.
    const setup = screen.getByRole("button", { name: "Setup" });
    expect(setup.props.accessibilityState).toEqual({ expanded: false });
    expect(screen.queryByRole("button", { name: "Settings" })).toBeNull();
    await fireEvent.press(setup);
    expect(screen.getByRole("button", { name: "Setup" }).props.accessibilityState).toEqual({ expanded: true });
    await fireEvent.press(screen.getByRole("button", { name: "Settings" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/settings");
  });

  it("closes an open group on a press and keeps the choice for the role", async () => {
    await mountStaff(<More />, "ADMIN", {});
    const money = await screen.findByRole("button", { name: "Money" });
    expect(screen.getByRole("button", { name: "Fees" })).toBeTruthy();
    await fireEvent.press(money);
    expect(screen.queryByRole("button", { name: "Fees" })).toBeNull();
    expect(JSON.parse((await keyStore().get("edulink.more.groups.ADMIN")) ?? "{}")).toMatchObject({ money: false });
  });

  it("keeps the three groups for a teacher, with the profile under Me", async () => {
    await mountStaff(<More />, "TEACHER", {});
    expect(await screen.findByRole("header", { name: "Me" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Me" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Day to day" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Teaching" })).toBeNull();
  });
});
