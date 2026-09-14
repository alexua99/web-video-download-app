"use client";

import { createContext, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { messages, type Locale, type Messages } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const value = useMemo(
    () => ({
      locale,
      setLocale: (next: Locale) => {
        router.push(`/${next}`);
      },
      t: messages[locale],
    }),
    [locale, router],
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
