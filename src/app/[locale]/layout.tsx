import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";
import { getSiteUrl, isLocale, seo } from "@/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};

  const locale: Locale = raw;
  const copy = seo[locale];
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/${locale}`;
  const language = locale === "uk" ? "uk-UA" : "en_US";

  return {
    title: {
      default: copy.title,
      template: `%s | ${locale === "uk" ? "Кліп" : "Clip"}`,
    },
    description: copy.description,
    keywords: [...copy.keywords],
    alternates: {
      canonical,
      languages: {
        en: `${siteUrl}/en`,
        uk: `${siteUrl}/uk`,
        "x-default": `${siteUrl}/en`,
      },
    },
    openGraph: {
      type: "website",
      locale: language,
      alternateLocale: locale === "uk" ? ["en_US"] : ["uk_UA"],
      url: canonical,
      siteName: locale === "uk" ? "Кліп" : "Clip",
      title: copy.ogTitle,
      description: copy.description,
    },
    twitter: {
      card: "summary_large_image",
      title: copy.ogTitle,
      description: copy.description,
    },
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return children;
}
