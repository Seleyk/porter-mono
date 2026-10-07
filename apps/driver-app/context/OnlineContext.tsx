import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Alert } from "react-native";
import { useAuth } from "@/context/AuthContext";
import {
  currentPosition,
  publishLocation,
  requestLocationPermission,
  setOffline,
  watchPosition,
  type Coords,
} from "@/services/location";

interface OnlineContextValue {
  /** Porter has chosen to receive jobs. */
  online: boolean;
  /** Last known device position (null until location is allowed). */
  coords: Coords | null;
  goOnline: () => Promise<void>;
  goOffline: () => Promise<void>;
  /** Keep sharing location while a job is active, even when offline for new work. */
  setTracking: (on: boolean) => void;
}

const OnlineContext = createContext<OnlineContextValue>({
  online: false,
  coords: null,
  goOnline: async () => {},
  goOffline: async () => {},
  setTracking: () => {},
});

export function OnlineProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [online, setOnline] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const stopWatch = useRef<(() => void) | null>(null);
  const onlineRef = useRef(online);
  onlineRef.current = online;

  const sharing = online || tracking;

  // Watch the device position and publish it while online or on a job.
  useEffect(() => {
    if (!sharing || !user) return;
    let cancelled = false;
    requestLocationPermission()
      .then((allowed) =>
        allowed
          ? watchPosition((c) => {
              setCoords(c);
              publishLocation(user.id, c, onlineRef.current).catch(() => {});
            })
          : null,
      )
      .then((stop) => {
        if (!stop) return;
        if (cancelled) stop();
        else stopWatch.current = stop;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      stopWatch.current?.();
      stopWatch.current = null;
    };
  }, [sharing, user?.id]);

  // Signed out: drop local state.
  useEffect(() => {
    if (!user) {
      setOnline(false);
      setTracking(false);
    }
  }, [user]);

  const goOnline = useCallback(async () => {
    if (!user) return;
    const allowed = await requestLocationPermission();
    if (!allowed) {
      Alert.alert(
        "Location needed",
        "Porter needs your location to show nearby jobs. You can allow it in Settings.",
      );
      return;
    }
    try {
      const c = await currentPosition();
      setCoords(c);
      await publishLocation(user.id, c, true);
      setOnline(true);
    } catch (e: any) {
      Alert.alert("Couldn't go online", e.message ?? "Please try again.");
    }
  }, [user]);

  const goOffline = useCallback(async () => {
    setOnline(false);
    if (user) await setOffline(user.id).catch(() => {});
  }, [user]);

  return (
    <OnlineContext.Provider value={{ online, coords, goOnline, goOffline, setTracking }}>
      {children}
    </OnlineContext.Provider>
  );
}

export const useOnline = () => useContext(OnlineContext);
