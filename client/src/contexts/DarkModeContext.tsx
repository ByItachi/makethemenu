import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

export type ThemePreference = "system" | "light" | "dark";

type DarkModeContextType = {
  /** Kullanıcının seçimi: "system" | "light" | "dark" (localStorage'da saklanır). */
  theme: ThemePreference;
  /** Çözümlenmiş tema: system tercihine göre ya da açık seçim. */
  resolvedTheme: "light" | "dark";
  /** Geriye dönük uyumluluk: çözümlenmiş tema karanlık mı? */
  isDarkMode: boolean;
  /** Açık seçim yapar ("light" | "dark" | "system"). */
  setTheme: (theme: ThemePreference) => void;
  /** Açık/koyu arasında geçiş yapar (system'i açık seçime dönüştürür). */
  toggleDarkMode: () => void;
};

const STORAGE_KEY = "theme";
const media = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : undefined;

function readStoredPreference(): ThemePreference {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light" || saved === "system") return saved;
    } catch {
      /* localStorage kapalı olabilir — sistem tercihine düş */
    }
  }
  return "system";
}

function applyToDocument(resolved: "light" | "dark") {
  if (typeof window === "undefined") return;
  const root = window.document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePreference>(readStoredPreference);
  const [systemDark, setSystemDark] = useState<boolean>(() => media()?.matches ?? false);

  // "system" iken işletim sistemi temasını canlı izle (kullanıcı OS'tan değiştirirse anında uyum).
  useEffect(() => {
    const mq = media();
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: "light" | "dark" = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  // Çözümlenen temayı DOM'a uygula. "system" iken localStorage'a yazma gereksiz ama
  // tutarlılık için seçimi aynen saklarız (ilk kurulumda index.html script'iyle aynı kural).
  useEffect(() => {
    applyToDocument(resolvedTheme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* yazılamazsa sessiz geç — tema yine de bu oturumda uygulanır */
    }
  }, [theme, resolvedTheme]);

  const setTheme = useCallback((next: ThemePreference) => setThemeState(next), []);

  const toggleDarkMode = useCallback(() => {
    setThemeState((prev) => {
      const resolved = prev === "system" ? (media()?.matches ?? false ? "dark" : "light") : prev;
      return resolved === "dark" ? "light" : "dark";
    });
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, isDarkMode: resolvedTheme === "dark", setTheme, toggleDarkMode }),
    [theme, resolvedTheme, setTheme, toggleDarkMode]
  );

  return <DarkModeContext.Provider value={value}>{children}</DarkModeContext.Provider>;
};

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
};
