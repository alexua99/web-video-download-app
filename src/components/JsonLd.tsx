import type { Locale } from "@/lib/i18n";
import { getSiteUrl, seo } from "@/lib/seo";

export function JsonLd({ locale }: { locale: Locale }) {
  const copy = seo[locale];
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/${locale}`;
  const brand = locale === "uk" ? "Кліп" : "Clip";

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: brand,
        inLanguage: locale === "uk" ? "uk-UA" : "en",
      },
      {
        "@type": "WebApplication",
        "@id": `${pageUrl}/#app`,
        name: brand,
        url: pageUrl,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Web",
        inLanguage: locale === "uk" ? "uk-UA" : "en",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description: copy.description,
        featureList: copy.features.map((item) => item.name),
      },
      {
        "@type": "HowTo",
        name: copy.howTitle,
        step: copy.howSteps.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: step.name,
          text: step.text,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: copy.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
