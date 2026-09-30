import { useState } from "react";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderApp } from "../utils";
import { Field } from "@/components";

/**
 * The keyboard's language on the phone (lib/typing.tsx, components/field.tsx):
 * the web's typing switch, as a chip beside a field's label.
 */
function Two() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  return (
    <>
      <Field label="Name" value={a} onChangeText={setA} />
      <Field label="Town" value={b} onChangeText={setB} />
    </>
  );
}

function Own() {
  const [v, setV] = useState("");
  return <Field label="Marathi" typing="mr" value={v} onChangeText={setV} />;
}

const LABELS = { name: "Name", town: "Town", mr: "Marathi" } as const;

describe("what the keyboard writes", () => {
  it("in English nothing changes and there is no chip until the box has focus", async () => {
    await renderApp(<Two />);
    expect(screen.queryByTestId("typing-switch")).toBeNull();
    const name = screen.getByLabelText("Name");
    await fireEvent(name, "focus");
    expect(screen.getByRole("button", { name: "Typing in English; press to change" })).toBeTruthy();
    await fireEvent.changeText(name, "namaste ");
    expect(screen.getByLabelText(LABELS.name)).toHaveDisplayValue("namaste ");
  });

  it("pressed to Hindi, the choice is every box's: a word becomes Devanagari as it ends, with its preview while it is typed", async () => {
    await renderApp(<Two />);
    const name = screen.getByLabelText("Name");
    await fireEvent(name, "focus");
    await fireEvent(screen.getByTestId("typing-switch"), "press");
    // Every box shows the chip now that the choice is not English, both saying Hindi.
    expect(screen.getAllByRole("button", { name: "Typing in Hindi; press to change" })).toHaveLength(2);
    await fireEvent.changeText(name, "namaste");
    expect(screen.getByTestId("typing-hint")).toHaveTextContent("namaste → नमस्ते");
    await fireEvent.changeText(name, "namaste ");
    expect(screen.getByLabelText(LABELS.name)).toHaveDisplayValue("नमस्ते ");
    expect(screen.queryByTestId("typing-hint")).toBeNull();
    // A number and Devanagari already typed are left alone.
    await fireEvent.changeText(name, "नमस्ते 2026 ");
    expect(screen.getByLabelText(LABELS.name)).toHaveDisplayValue("नमस्ते 2026 ");
    // The other box, never focused, follows the choice.
    const town = screen.getByLabelText("Town");
    await fireEvent.changeText(town, "pune.");
    expect(screen.getByLabelText(LABELS.town)).toHaveDisplayValue("पुने.");
  });

  it("a box with a language of its own starts there, and its chip cycles that box alone", async () => {
    await renderApp(
      <>
        <Own />
        <Two />
      </>,
    );
    const mr = screen.getByLabelText("Marathi");
    expect(screen.getByRole("button", { name: "Typing in Marathi; press to change" })).toBeTruthy();
    await fireEvent.changeText(mr, "shaaLaa ");
    expect(screen.getByLabelText(LABELS.mr)).toHaveDisplayValue("शाळा ");
    // Past English (mr → en) the same letters stay letters; the plain boxes never left English.
    await fireEvent(mr, "focus");
    await fireEvent(screen.getByRole("button", { name: "Typing in Marathi; press to change" }), "press");
    expect(screen.getByRole("button", { name: "Typing in English; press to change" })).toBeTruthy();
    await fireEvent.changeText(mr, "शाळा shaaLaa ");
    expect(screen.getByLabelText(LABELS.mr)).toHaveDisplayValue("शाळा shaaLaa ");
    const name = screen.getByLabelText("Name");
    await fireEvent(name, "focus");
    expect(screen.getAllByRole("button", { name: "Typing in English; press to change" })).toHaveLength(2);
  });
});
