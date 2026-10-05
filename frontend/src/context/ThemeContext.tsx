import React, { createContext, useContext, useEffect, useState } from "react";

export type FontSizeScale = "normal" | "large" | "xlarge";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  fontSize: FontSizeScale;
  setFontSize: (size: FontSizeScale) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
  fontSize: "normal",
  setFontSize: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fairness-auditor-theme");
      if (stored) return stored === "dark";
      // Default to dark mode for enterprise cybersecurity aesthetic
      return true;
    }
    return true;
  });

  const [fontSize, setFontSize] = useState<FontSizeScale>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("aequitas_font_size") as FontSizeScale;
      if (stored === "normal" || stored === "large" || stored === "xlarge") {
        return stored;
      }
    }
    return "normal";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("fairness-auditor-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("fairness-auditor-theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("font-scale-normal", "font-scale-large", "font-scale-xlarge");
    root.classList.add(`font-scale-${fontSize}`);
    localStorage.setItem("aequitas_font_size", fontSize);
  }, [fontSize]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
