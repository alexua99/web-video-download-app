import { NextResponse } from "next/server";
import { AppError, LimitError, UrlError, YtDlpError } from "@/lib/errors";
import type { ErrorCode, Locale } from "@/lib/i18n";
import { parseLocale, translate } from "@/lib/i18n";

const DEFAULT_CORS_ORIGINS = [
  "https://alex-video-download.netlify.app",
  "http://localhost:3000",
];

function allowedOrigins() {
  const extra = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [...DEFAULT_CORS_ORIGINS, ...extra];
}

export function allowedOrigin(request?: Request) {
  if (!request) return null;
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (allowedOrigins().includes(origin)) return origin;
  try {
    const host = new URL(origin).hostname;
    if (host.endsWith(".netlify.app") || host.endsWith(".up.railway.app")) {
      return origin;
    }
  } catch {
    return null;
  }
  return null;
}

export function corsHeaders(request?: Request): Record<string, string> {
  const origin = allowedOrigin(request);
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept-Language",
    "Access-Control-Expose-Headers":
      "Content-Disposition, X-Filename, Retry-After",
    Vary: "Origin",
  };
}

export function corsPreflight(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

export function jsonError(
  error: unknown,
  locale: Locale,
  fallback: ErrorCode,
  request?: Request,
) {
  if (error instanceof LimitError) {
    const headers: Record<string, string> = {
      ...corsHeaders(request),
    };
    if (error.retryAfter) {
      headers["Retry-After"] = String(error.retryAfter);
    }

    return NextResponse.json(
      { error: translate(locale, error.code), code: error.code },
      { status: error.status, headers },
    );
  }

  if (error instanceof YtDlpError && error.code === "rate_limited") {
    return NextResponse.json(
      { error: translate(locale, error.code), code: error.code },
      {
        status: 429,
        headers: {
          ...corsHeaders(request),
          "Retry-After": "60",
        },
      },
    );
  }

  if (error instanceof UrlError || error instanceof YtDlpError) {
    return NextResponse.json(
      { error: translate(locale, error.code), code: error.code },
      { status: error instanceof UrlError ? 400 : 422, headers: corsHeaders(request) },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: translate(locale, error.code), code: error.code },
      { status: 500, headers: corsHeaders(request) },
    );
  }

  return NextResponse.json(
    { error: translate(locale, fallback), code: fallback },
    { status: 500, headers: corsHeaders(request) },
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
