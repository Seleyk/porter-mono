import { createContext, useContext, useState, type ReactNode } from "react";
import { Colors, LightColors } from "@/constants/theme";

type ColorPalette = typeof Colors;

const DARK_GRADIENT = ["#143257", "#0A1F3A", "#050B16"] as const;
const LIGHT_GRADIENT = ["#FDFCE8", "#F5EFD8", "#EEE8D0"] as const;

interface ThemeContextValue {
  isDark: boolean;
  colors: ColorPalette;
  bgGradient: readonly string[];
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  colors: Colors,
  bgGradient: DARK_GRADIENT,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const colors = isDark ? Colors : (LightColors as ColorPalette);
  const bgGradient = isDark ? DARK_GRADIENT : LIGHT_GRADIENT;
  const toggleTheme = () => setIsDark((d) => !d);

  return (
    <ThemeContext.Provider value={{ isDark, colors, bgGradient, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColors() {
  return useContext(ThemeContext);
}
