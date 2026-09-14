import { Downloader } from "@/components/Downloader";

export default function Home() {
  return (
    <div className="page-shell">
      <div className="aurora" aria-hidden />
      <div className="grain" aria-hidden />

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="logo-mark">▶</span>
          <span className="font-[family-name:var(--font-display)] text-lg tracking-tight text-white">
            Клип
          </span>
        </div>
        <p className="hidden text-sm text-white/45 sm:block">
          Локальный загрузчик · без аккаунта
        </p>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pb-20 pt-8 sm:pt-16">
        <div className="mb-10 max-w-2xl text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.28em] text-fuchsia-200/70">
            YouTube · TikTok · Instagram
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-white sm:text-6xl">
            Скачай любое видео
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-white/60 sm:text-lg">
            Вставьте ссылку — приложение само найдёт ролик, покажет превью
            и сохранит файл на компьютер.
          </p>
        </div>

        <Downloader />
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-8 text-center text-xs leading-relaxed text-white/35">
        Скачивайте только то, на что у вас есть права. Instagram иногда
        требует файл cookies.txt в корне проекта.
      </footer>
    </div>
  );
}
