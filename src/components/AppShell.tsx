"use client";

import { Downloader } from "@/components/Downloader";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/components/LanguageProvider";
import Link from "next/link";

export function AppShell({ children }: { children?: React.ReactNode }) {
  const { t } = useLanguage();

  return (
    <div className="page-shell">
      <div className="aurora" aria-hidden />
      <div className="grain" aria-hidden />

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-4">
          <p className="hidden text-sm text-white/45 sm:block">{t.tagline}</p>
          <LanguageSwitch />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pb-10 pt-8 sm:pt-16">
        <div className="mb-10 max-w-3xl text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.28em] text-fuchsia-200/70">
            YouTube · TikTok · Instagram
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-white sm:text-6xl">
            {t.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/60 sm:text-lg">
            {t.subtitle}
          </p>
        </div>

        <Downloader />
        {children}
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-8 text-center text-xs leading-relaxed text-white/35">
        <p>{t.footer}</p>
        <nav className="mt-3 flex justify-center gap-4" aria-label={t.language}>
          <Link href="/en" hrefLang="en">
            English
          </Link>
          <Link href="/uk" hrefLang="uk">
            Українська
          </Link>
        </nav>
      </footer>
    </div>
  );
}
