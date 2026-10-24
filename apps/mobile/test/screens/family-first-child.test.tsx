import { screen } from "@testing-library/react-native";
import { ChildSwitcher, firstChild } from "@/screens/family/shared";
import { child, ID, ME_PARENT, renderFamily } from "./family-helpers";

/**
 * QA-52 (QA campaign of 24 October 2026): a pupil who moved schools is two children, the school they left first.
 * With none chosen, the phone opens on the one still enrolled, as the server's family doors do (pickChild).
 */
describe("the child a family screen opens on", () => {
  const left = child(ID.child, "ZZ Ishaan", { schoolName: "ZZ Old School", leftAt: "2026-04-30T00:00:00.000Z" });
  const now = child(ID.child2, "ZZ Ishaan", { schoolName: "ZZ New School" });

  it("is the first still enrolled, else the first", () => {
    expect(firstChild([left, now])?.studentMembershipId).toBe(ID.child2);
    expect(firstChild([left])?.studentMembershipId).toBe(ID.child);
    expect(firstChild([])).toBeUndefined();
  });

  it("is the one the switcher marks when nothing is chosen, and a choice wins", async () => {
    await renderFamily(<ChildSwitcher pupils={[left, now] as never} selectedId={null} onSelect={() => {}} />, ME_PARENT, {});
    expect(screen.getByRole("button", { name: "ZZ Ishaan, ZZ New School" }).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByRole("button", { name: "ZZ Ishaan, ZZ Old School" }).props.accessibilityState).toMatchObject({ selected: false });
    await renderFamily(<ChildSwitcher pupils={[left, now] as never} selectedId={ID.child} onSelect={() => {}} />, ME_PARENT, {});
    expect(screen.getByRole("button", { name: "ZZ Ishaan, ZZ Old School" }).props.accessibilityState).toMatchObject({ selected: true });
  });
});
