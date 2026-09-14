"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export function LanguageSwitch() {
  const { locale, t } = useLanguage();

  return (
    <div className="lang-switch" role="group" aria-label={t.language}>
      <Link
        href="/en"
        hrefLang="en"
        aria-current={locale === "en" ? "page" : undefined}
      >
        EN
      </Link>
      <Link
        href="/uk"
        hrefLang="uk"
        aria-current={locale === "uk" ? "page" : undefined}
      >
        UA
      </Link>
    </div>
  );
}
