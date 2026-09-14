import { AppShell } from "@/components/AppShell";
import { LanguageProvider } from "@/components/LanguageProvider";

export default function Home() {
  return (
    <LanguageProvider>
      <AppShell />
    </LanguageProvider>
  );
}
