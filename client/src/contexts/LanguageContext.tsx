import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { translations, type Language } from "@/lib/translations";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getByPath(obj: any, path: string): unknown {
  return path.split(".").reduce((acc, key) => (acc && typeof acc === "object" ? acc[key] : undefined), obj);
}

/** Kayıtlı tercih yoksa tarayıcı dilinden başlangıç dili seç (SEO/UX: <html lang> ile uyumlu). */
function initialLanguage(): Language {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("language");
      if (saved === "tr" || saved === "en") return saved;
    } catch {
      /* localStorage kapalı olabilir */
    }
    const nav = typeof navigator !== "undefined" ? navigator.language : "";
    return nav && /^en\b/i.test(nav) ? "en" : "tr";
  }
  return "tr";
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang);
    }
  };

  // Dil değişince <html lang> senkronlanır (arama motorları ve ekran okuyucular için).
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useMemo(() => {
    return (path: string) => {
      const value = getByPath(translations[language], path);
      if (typeof value === "string") return value;
      const fallback = getByPath(translations.tr, path);
      return typeof fallback === "string" ? fallback : path;
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
