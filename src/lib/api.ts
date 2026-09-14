import { NextResponse } from "next/server";
import { AppError, UrlError, YtDlpError } from "@/lib/errors";
import type { ErrorCode, Locale } from "@/lib/i18n";
import { parseLocale, translate } from "@/lib/i18n";

export function jsonError(
  error: unknown,
  locale: Locale,
  fallback: ErrorCode,
) {
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
