/**
 * The form batch of the testing analysis of 13 November 2026 (mobile-core):
 *
 * TA-165 with the typing language on Hindi or Marathi a password box showed its letters in clear and changed them;
 * TA-236 on an iPhone a form's error was not tied to its box and VoiceOver never said it;
 * TA-359 an answer the screen's schema could not read was shown as zod's JSON issue list with a useless Retry.
 */
import { useState, type ComponentProps, type ReactElement } from "react";
import { AccessibilityInfo } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { z } from "zod";
import { renderApp } from "../utils";
import { Failed, Field } from "@/components";
import { shouldRetry } from "@/lib/query";
import { TypingProvider } from "@/lib/typing";

function Box(props: Partial<ComponentProps<typeof Field>>) {
  const [v, setV] = useState("");
  return <Field label="Box" value={v} onChangeText={setV} {...props} />;
}

/** The person's keyboard language is Hindi, as when they last wrote to a teacher. */
const inHindi = (ui: ReactElement) => renderApp(<TypingProvider initial="hi">{ui}</TypingProvider>);

describe("a box whose letters are not words is typed as it is (TA-165)", () => {
  it("TA-165: a password box in Hindi keeps what is typed, shows no preview and draws no chip", async () => {
    await inHindi(<Box secureTextEntry />);
    const box = screen.getByLabelText("Box");
    await fireEvent(box, "focus");
    await fireEvent.changeText(box, "namaste");
    expect(screen.queryByTestId("typing-hint")).toBeNull();
    await fireEvent.changeText(box, "namaste-");
    expect(screen.getByLabelText("Box")).toHaveDisplayValue("namaste-");
    expect(screen.queryByTestId("typing-switch")).toBeNull();
  });

  it("TA-165: a link, an e-mail address and a code in capitals are left alone; a plain box still converts", async () => {
    await inHindi(
      <>
        <Box label="Link" keyboardType="url" />
        <Box label="Email" keyboardType="email-address" />
        <Box label="Code" autoCapitalize="characters" />
        <Box label="Words" />
      </>,
    );
    await fireEvent.changeText(screen.getByLabelText("Link"), "https:");
    expect(screen.getByLabelText("Link")).toHaveDisplayValue("https:");
    await fireEvent.changeText(screen.getByLabelText("Email"), "asha.");
    expect(screen.getByLabelText("Email")).toHaveDisplayValue("asha.");
    await fireEvent.changeText(screen.getByLabelText("Code"), "ZZAB-");
    expect(screen.getByLabelText("Code")).toHaveDisplayValue("ZZAB-");
    await fireEvent.changeText(screen.getByLabelText("Words"), "namaste ");
    expect(screen.getByLabelText("Words")).toHaveDisplayValue("नमस्ते ");
  });
});

describe("a form's error is tied to its box on an iPhone (TA-236)", () => {
  it("TA-236: the error becomes the box's hint and is announced when it appears", async () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility");
    const view = await renderApp(<Field label="Password" hint="At least eight letters" value="" onChangeText={() => {}} secureTextEntry />);
    expect(screen.getByLabelText("Password").props.accessibilityHint).toBe("At least eight letters");
    expect(announce).not.toHaveBeenCalledWith("That password is not right.");
    await view.rerender(<Field label="Password" hint="At least eight letters" error="That password is not right." value="" onChangeText={() => {}} secureTextEntry />);
    expect(screen.getByLabelText("Password").props.accessibilityHint).toBe("That password is not right.");
    expect(announce).toHaveBeenCalledWith("That password is not right.");
    announce.mockRestore();
  });
});

describe("an answer the screen cannot read is said as a sentence (TA-359)", () => {
  const unreadable = () => {
    const parsed = z.object({ dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), kind: z.enum(["EXAM", "HOLIDAY"]) }).safeParse({ dateKey: "13-11-2026", kind: "COMPETITION" });
    if (parsed.success) throw new Error("expected a parse failure");
    return parsed.error;
  };

  it("TA-359: the card says the app may need an update, holds no zod code, and offers no Retry", async () => {
    const retry = jest.fn();
    await renderApp(<Failed error={unreadable()} onRetry={retry} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("This screen could not read the server's answer. The app may need an update.");
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/invalid_|"code"/);
    expect(screen.queryByRole("button", { name: /Retry|Try again/ })).toBeNull();
    expect(retry).not.toHaveBeenCalled();
  });

  it("TA-359: the query layer does not ask again for an answer it cannot read", () => {
    expect(shouldRetry(0, unreadable())).toBe(false);
    expect(shouldRetry(0, new Error("flicker"))).toBe(true);
  });
});
