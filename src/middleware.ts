import { NextResponse, type NextRequest } from "next/server";
import { localeFromRequest } from "@/lib/api";
import { translate } from "@/lib/i18n";
import { LIMITS } from "@/lib/protect";

export function middleware(request: NextRequest) {
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
}

export const config = {
  matcher: "/api/:path*",
};
