import { useState } from "react";
import { View } from "react-native";
import Svg, { Circle, G, Image as SvgImage, Path, Rect, Text as SvgText } from "react-native-svg";
import { mapView } from "@edulink/contracts";
import { Button, Text } from "@/components";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

type LatLng = { lat: number; lng: number };
export type MapStop = LatLng & { id: string; label: string; mine?: boolean; passed?: boolean };
export type MapBus = LatLng & { id: string; label: string; stale?: boolean };

const W = 640;
const H = 360;

/**
 * The web's BusMap (components/transport/bus-map.tsx) on the phone: the same
 * frame, the same OpenStreetMap tiles placed by the same arithmetic
 * (@edulink/contracts mapView), drawn with react-native-svg. The route's
 * stops in order, the bus's track and the bus itself, two zoom buttons and
 * the attribution OpenStreetMap asks for. Stops and the bus, never a child.
 */
export function TransportMap({ stops = [], buses = [], track = [] }: { stops?: MapStop[]; buses?: MapBus[]; track?: LatLng[] }) {
  const t = useT();
  const th = useTheme();
  const [zoomDelta, setZoomDelta] = useState(0);
  const points: LatLng[] = [...stops, ...buses];
  if (points.length === 0) {
    return (
      <Text tone="muted" variant="sm">
        {t("transport.mapNoPoints")}
      </Text>
    );
  }
  const view = mapView(points, W, H, zoomDelta);
  const path = (list: LatLng[]) => list.map((p, i) => `${i === 0 ? "M" : "L"}${view.place(p).x.toFixed(1)},${view.place(p).y.toFixed(1)}`).join(" ");
  return (
    <View style={{ gap: th.space[2] }}>
      <View style={{ borderRadius: th.radius.md, overflow: "hidden", borderWidth: 1, borderColor: th.border, backgroundColor: th.surfaceMuted, aspectRatio: W / H }} accessible accessibilityRole="image" accessibilityLabel={t("transport.mapAria")} testID="transport-map">
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
          {view.tiles.map((tile) => (
            <SvgImage key={tile.key} href={{ uri: tile.url }} x={tile.x} y={tile.y} width={256} height={256} />
          ))}
          {stops.length > 1 ? <Path d={path(stops)} fill="none" stroke={th.accent} strokeWidth={3} strokeDasharray="6 5" opacity={0.7} /> : null}
          {track.length > 1 ? <Path d={path(track)} fill="none" stroke={th.info} strokeWidth={4} strokeLinecap="round" opacity={0.85} /> : null}
          {stops.map((s, i) => {
            const p = view.place(s);
            return (
              <G key={s.id}>
                <Circle cx={p.x} cy={p.y} r={s.mine ? 12 : 9} fill={s.mine ? th.accent : s.passed ? th.fgMuted : th.surface} stroke={th.accent} strokeWidth={3} />
                <SvgText x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fontWeight="700" fill={s.mine || s.passed ? th.surface : th.accent}>
                  {String(i + 1)}
                </SvgText>
              </G>
            );
          })}
          {buses.map((b) => {
            const p = view.place(b);
            return (
              <G key={b.id} opacity={b.stale ? 0.55 : 1}>
                <Rect x={p.x - 16} y={p.y - 12} width={32} height={24} rx={6} fill={th.warn} stroke={th.surface} strokeWidth={2} />
                <Rect x={p.x - 10} y={p.y - 6} width={20} height={7} rx={1.5} fill={th.surface} opacity={0.9} />
                <Circle cx={p.x - 8} cy={p.y + 8} r={3} fill={th.fg} />
                <Circle cx={p.x + 8} cy={p.y + 8} r={3} fill={th.fg} />
                <SvgText x={p.x} y={p.y + 28} textAnchor="middle" fontSize={11} fontWeight="700" fill={th.fg} stroke={th.surface} strokeWidth={0.5}>
                  {b.label}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: th.space[2] }}>
        <Text variant="xs" tone="muted">
          {t("transport.mapAttribution")}
        </Text>
        <View style={{ flexDirection: "row", gap: th.space[2] }}>
          <Button label={t("transport.mapZoomOut")} variant="secondary" onPress={() => setZoomDelta((z) => Math.max(z - 1, -6))} />
          <Button label={t("transport.mapZoomIn")} variant="secondary" onPress={() => setZoomDelta((z) => Math.min(z + 1, 4))} />
        </View>
      </View>
    </View>
  );
}
