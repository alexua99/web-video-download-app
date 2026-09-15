import { NextResponse, type NextRequest } from "next/server";
import { localeFromRequest } from "@/lib/api";
import { translate } from "@/lib/i18n";
import { isLocale } from "@/lib/seo";
import { LIMITS } from "@/lib/protect";

function withLocaleHeader(request: NextRequest) {
  const segment = request.nextUrl.pathname.split("/")[1] ?? "";
  const locale = isLocale(segment)
    ? segment
    : localeFromRequest(request, "uk");
  const headers = new Headers(request.headers);
  headers.set("x-locale", locale);
  return NextResponse.next({ request: { headers } });
}

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      const origin = request.headers.get("origin") ?? "*";
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Accept-Language",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        },
      });
    }

    if (request.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed", code: "generic" },
        { status: 405, headers: { Allow: "POST" } },
      );
    }

    const locale = localeFromRequest(request, "uk");
    const length = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(length) && length > LIMITS.maxBodyBytes) {
      return NextResponse.json(
        {
          error: translate(locale, "payload_too_large"),
          code: "payload_too_large",
        },
        { status: 413 },
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType && !contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { error: translate(locale, "parse_link"), code: "parse_link" },
        { status: 415 },
      );
    }

    return withLocaleHeader(request);
  }

  return withLocaleHeader(request);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
