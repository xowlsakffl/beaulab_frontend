"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemeContextType = { theme: Theme; toggleTheme: () => void };

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "beaulab.theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey) as Theme | null;
    setTheme(savedTheme || defaultTheme);
    setIsInitialized(true);
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    if (!isInitialized) return;

    localStorage.setItem(storageKey, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [isInitialized, storageKey, theme]);

  const toggleTheme = () => setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
