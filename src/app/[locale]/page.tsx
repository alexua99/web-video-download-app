import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { JsonLd } from "@/components/JsonLd";
import { LanguageProvider } from "@/components/LanguageProvider";
import { SeoContent } from "@/components/SeoContent";
import { isLocale } from "@/lib/seo";

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <LanguageProvider locale={locale}>
      <AppShell>
        <SeoContent locale={locale} />
      </AppShell>
      <JsonLd locale={locale} />
    </LanguageProvider>
  );
}
