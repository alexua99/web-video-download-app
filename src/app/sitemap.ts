import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  return locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    lastModified,
    changeFrequency: "weekly",
    priority: locale === "uk" ? 1 : 0.9,
    alternates: {
      languages: {
        en: `${siteUrl}/en`,
        uk: `${siteUrl}/uk`,
      },
    },
  }));
}
