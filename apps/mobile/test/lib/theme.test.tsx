import { renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { RoleThemeProvider, useTheme } from "@/lib/theme";
import { accents, canvas, frame, palette } from "@edulink/tokens";

describe("the theme", () => {
  it("is the light palette with the role's accent family", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => <RoleThemeProvider role="TEACHER">{children}</RoleThemeProvider>;
    const { result } = await renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("light");
    expect(result.current.bg).toBe(palette.light.bg);
    expect(result.current.accent).toBe(accents.light.teacher.accent);
    expect(result.current.tap).toBe(48);
  });

  it("in light the ground is the tinted canvas and the frame is dark's navy with dark's accents", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => <RoleThemeProvider role="PARENT">{children}</RoleThemeProvider>;
    const { result } = await renderHook(() => useTheme(), { wrapper });
    expect(result.current.canvas).toBe(canvas.light);
    expect(result.current.canvas).not.toBe(result.current.bg);
    expect(result.current.frame.surface).toBe(frame.light.surface);
    expect(result.current.frame.surface).toBe(palette.dark.surface);
    expect(result.current.frame.accentStrong).toBe(accents.dark.parent.accentStrong);
    expect(result.current.frame.fgMuted).toBe(palette.dark.fgMuted);
    expect(result.current.wash.alpha).toBeGreaterThan(0);
  });

  it("falls back to the teacher family (the web's :root) with no role", async () => {
    const { result } = await renderHook(() => useTheme());
    expect(result.current.accent).toBe(accents.light.teacher.accent);
    expect(result.current.accentSoft).toBe(accents.light.teacher.accentSoft);
  });
});
