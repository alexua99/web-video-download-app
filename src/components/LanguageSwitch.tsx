"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitch() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="lang-switch" role="group" aria-label={t.language}>
      <LangButton
        code="en"
        label="EN"
        active={locale === "en"}
        onSelect={setLocale}
      />
      <LangButton
        code="uk"
        label="UA"
        active={locale === "uk"}
        onSelect={setLocale}
      />
    </div>
  );
}

function LangButton({
  code,
  label,
  active,
  onSelect,
}: {
  code: Locale;
  label: string;
  active: boolean;
  onSelect: (locale: Locale) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(code)}
    >
      {label}
    </button>
  );
}
