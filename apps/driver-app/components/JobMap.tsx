import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import { Ionicons } from "@expo/vector-icons";
import { DEFAULT_ZOOM, MIAMI_CENTER, mapStyleFor } from "@porter/shared";
import { Colors } from "@/constants/theme";

export type MapPin = {
  id: string;
  coord: [number, number];
  kind: "pickup" | "dropoff" | "job";
  onPress?: () => void;
};

type Props = {
  pins?: MapPin[];
  route?: [number, number][];
  /** Center when there is nothing to fit (usually the porter's position). */
  center?: [number, number] | null;
  /** Fit the camera to these points instead of centering. */
  fit?: [number, number][];
  showPuck?: boolean;
  style?: StyleProp<ViewStyle>;
};

const PIN_STYLE = {
  pickup: { icon: "arrow-up-circle" as const, color: Colors.steel },
  dropoff: { icon: "flag" as const, color: Colors.gold },
  job: { icon: "cube" as const, color: Colors.steel },
};

function bounds(points: [number, number][]) {
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return {
    ne: [Math.max(...lngs), Math.max(...lats)] as [number, number],
    sw: [Math.min(...lngs), Math.min(...lats)] as [number, number],
  };
}

export function JobMap({ pins = [], route, center, fit, showPuck = true, style }: Props) {
  const fitPoints = fit?.filter(Boolean) ?? [];
  const canFit = fitPoints.length >= 2;

  return (
    <View style={[styles.wrap, style]}>
      <MapboxGL.MapView
        style={StyleSheet.absoluteFill}
        styleURL={mapStyleFor(true)}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}
      >
        {canFit ? (
          <MapboxGL.Camera
            bounds={bounds(fitPoints)}
            padding={{ paddingTop: 70, paddingBottom: 70, paddingLeft: 50, paddingRight: 50 }}
            animationDuration={600}
          />
        ) : (
          <MapboxGL.Camera
            centerCoordinate={center ?? fitPoints[0] ?? MIAMI_CENTER}
            zoomLevel={DEFAULT_ZOOM - 1.5}
            animationDuration={600}
          />
        )}

        {route && route.length >= 2 && (
          <MapboxGL.ShapeSource
            id="route"
            shape={{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route } }}
          >
            <MapboxGL.LineLayer
              id="route-line"
              style={{ lineColor: Colors.steel, lineWidth: 4, lineCap: "round", lineJoin: "round" }}
            />
          </MapboxGL.ShapeSource>
        )}

        {pins.map((pin) => {
          const s = PIN_STYLE[pin.kind];
          return (
            <MapboxGL.MarkerView key={pin.id} coordinate={pin.coord} allowOverlap>
              <Pressable style={[styles.pin, { borderColor: s.color }]} onPress={pin.onPress} disabled={!pin.onPress}>
                <Ionicons name={s.icon} size={16} color={s.color} />
              </Pressable>
            </MapboxGL.MarkerView>
          );
        })}

        {showPuck && <MapboxGL.LocationPuck puckBearingEnabled puckBearing="heading" />}
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden", backgroundColor: Colors.navy },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bgDeep,
  },
});
