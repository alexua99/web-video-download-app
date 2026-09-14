"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  messages,
  parseLocale,
  type Locale,
  type Messages,
} from "@/lib/i18n";

const STORAGE_KEY = "clip-locale";
const listeners = new Set<() => void>();

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function emit() {
  listeners.forEach((listener) => listener());
}

function readStoredLocale(): Locale {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "uk") return saved;
  return navigator.language.toLowerCase().startsWith("uk") ? "uk" : "en";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return readStoredLocale();
}

function getServerSnapshot(): Locale {
  return "uk";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, parseLocale(next));
    emit();
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = messages[locale].metaTitle;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: messages[locale],
    }),
    [locale, setLocale],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
