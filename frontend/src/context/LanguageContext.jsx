import React, { createContext, useContext, useState } from "react";
import { translations } from "../utils/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("kiosk_lang") || "TH";
  });

  const setLanguage = (lang) => {
    const validLang = lang === "EN" ? "EN" : "TH";
    setLanguageState(validLang);
    localStorage.setItem("kiosk_lang", validLang);
  };

  const t = translations[language] || translations.TH;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
