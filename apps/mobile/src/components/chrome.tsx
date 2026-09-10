import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { haptics } from "@/lib/haptics";
import { Text } from "./text";
import { Icon } from "./icon";

/* ------------------------------------------------------------------------- */
/* Back: every screen that is not a tab says where "back" goes                */
/* ------------------------------------------------------------------------- */

/**
 * A screen reached from More, from a row or from a notification is not in
 * the tab bar, and before this nothing on it led back: the web target drew
 * no header and iOS has no swipe-back inside a tab navigator. The route file
 * wraps such a screen in <BackTo> (components/back-to.tsx, which is where
 * the router is imported — Screen itself stays free of it so a screen can be
 * rendered alone in a test); Screen reads this context and draws the button.
 */
export type Back = { onBack: () => void };
export const BackCtx = createContext<Back | null>(null);

export function useBack(): Back | null {
  return useContext(BackCtx);
}

/* ------------------------------------------------------------------------- */
/* Toast: a sentence that says a thing happened, then goes                    */
/* ------------------------------------------------------------------------- */

type ToastTone = "ok" | "danger" | "info";
type Toast = { id: number; message: string; tone: ToastTone };
type ToastApi = { show: (message: string, tone?: ToastTone) => void };

const ToastCtx = createContext<ToastApi | null>(null);
const NOOP: ToastApi = { show: () => {} };

/** "Saved", "Sent", "Could not send": said aloud (polite live region), shown for a few seconds above the tab bar, with the matching haptic. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((message: string, tone: ToastTone = "ok") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    if (tone === "ok") haptics.success();
    else if (tone === "danger") haptics.error();
    AccessibilityInfo.announceForAccessibility?.(message);
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const api = useMemo(() => ({ show }), [show]);
  return (
    <ToastCtx.Provider value={api}>
      {children}
      {toast ? <ToastView key={toast.id} toast={toast} /> : null}
    </ToastCtx.Provider>
  );
}

/** Outside a provider (a screen rendered alone in a test) it does nothing rather than throw. */
export function useToast(): ToastApi {
  return useContext(ToastCtx) ?? NOOP;
}

function ToastView({ toast }: { toast: Toast }) {
  const th = useTheme();
  // The context, not the hook: outside a SafeAreaProvider (a screen alone in a test) the hook throws; this reads zero.
  const insets = useContext(SafeAreaInsetsContext) ?? { bottom: 0 };
  const bg = { ok: th.fg, danger: th.danger, info: th.accentStrong }[toast.tone];
  const icon = { ok: "checkCircle", danger: "warningCircle", info: "info" }[toast.tone];
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: th.space[4], right: th.space[4], bottom: insets.bottom + 72, alignItems: "center" }}>
      <View
        accessible
        accessibilityRole="alert"
        accessibilityLabel={toast.message}
        accessibilityLiveRegion="polite"
        style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], backgroundColor: bg, borderRadius: th.radius.lg, paddingHorizontal: th.space[4], paddingVertical: th.space[3], maxWidth: 480 }}
      >
        <Icon name={icon} size={20} color={th.bg} weight="fill" />
        <Text variant="sm" bold style={{ color: th.bg, flexShrink: 1 }}>
          {toast.message}
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------------- */
/* Skeleton: the shape of what is coming                                     */
/* ------------------------------------------------------------------------- */

/** A grey block that breathes while data loads; still when the person asks for reduced motion, and in tests. */
export function Bone({ width = "100%", height = 14, radius }: { width?: number | `${number}%`; height?: number; radius?: number }) {
  const th = useTheme();
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (process.env.NODE_ENV === "test") return;
    let loop: Animated.CompositeAnimation | null = null;
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (!alive || reduced) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
          ]),
        );
        loop.start();
      })
      .catch(() => {});
    return () => {
      alive = false;
      loop?.stop();
    };
  }, [opacity]);
  return <Animated.View style={{ width, height, borderRadius: radius ?? th.radius.sm, backgroundColor: th.surfaceMuted, opacity }} />;
}
