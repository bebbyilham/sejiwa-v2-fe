"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ConfigProvider, App, theme as antdTheme } from "antd";

type ThemeType = "light" | "dark";

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeType>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from localStorage
    const savedTheme = localStorage.getItem("sejiwa_theme") as ThemeType;
    if (savedTheme) {
      setTimeout(() => {
        setThemeMode(savedTheme);
        setMounted(true);
      }, 0);
      document.body.className = savedTheme === "dark" ? "dark-theme" : "light-theme";
    } else {
      setTimeout(() => {
        setMounted(true);
      }, 0);
      document.body.className = "light-theme";
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = themeMode === "light" ? "dark" : "light";
    setThemeMode(nextTheme);
    localStorage.setItem("sejiwa_theme", nextTheme);
    document.body.className = nextTheme === "dark" ? "dark-theme" : "light-theme";
  };

  // Prevent hydration mismatch by rendering a light fallback until client-side hydration is complete
  const activeTheme = mounted ? themeMode : "light";

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, toggleTheme }}>
      <ConfigProvider
        theme={{
          algorithm: activeTheme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: activeTheme === "dark" ? "#38bdf8" : "#096dd9",
            colorSuccess: "#52c41a",
            colorWarning: "#faad14",
            colorError: "#cf1322",
            borderRadius: 12,
            // Custom translucent backgrounds matching our CSS glass variables
            colorBgContainer: activeTheme === "dark" ? "rgba(26, 26, 26, 0.55)" : "rgba(255, 255, 255, 0.45)",
            colorBorderSecondary: activeTheme === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.6)",
          },
          components: {
            Card: {
              colorBgContainer: activeTheme === "dark" ? "rgba(26, 26, 26, 0.55)" : "rgba(255, 255, 255, 0.45)",
            },
            Layout: {
              headerBg: "transparent",
              bodyBg: "transparent",
            }
          }
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
