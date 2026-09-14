import { NextResponse } from "next/server";
import { AppError, LimitError, UrlError, YtDlpError } from "@/lib/errors";
import type { ErrorCode, Locale } from "@/lib/i18n";
import { parseLocale, translate } from "@/lib/i18n";

export function jsonError(
  error: unknown,
  locale: Locale,
  fallback: ErrorCode,
) {
  if (error instanceof LimitError) {
    const headers: HeadersInit = {};
    if (error.retryAfter) {
      headers["Retry-After"] = String(error.retryAfter);
    }

    return NextResponse.json(
      { error: translate(locale, error.code), code: error.code },
      { status: error.status, headers },
    );
  }

  if (error instanceof UrlError || error instanceof YtDlpError) {
    return NextResponse.json(
      { error: translate(locale, error.code), code: error.code },
      { status: error instanceof UrlError ? 400 : 422 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: translate(locale, error.code), code: error.code },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { error: translate(locale, fallback), code: fallback },
    { status: 500 },
  );
}

export function localeFromBody(body: { locale?: unknown }): Locale {
  return parseLocale(body.locale);
}

export function localeFromRequest(
  request: Request,
  fallback: Locale = "en",
): Locale {
  const header = request.headers.get("accept-language")?.toLowerCase() ?? "";
  if (header.includes("uk")) return "uk";
  if (header.includes("en")) return "en";
  return fallback;
}
