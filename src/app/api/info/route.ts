import { NextResponse } from "next/server";
import { detectPlatform, extractUrl, UrlError } from "@/lib/platforms";
import { getVideoInfo, YtDlpError } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    const url = extractUrl(body.url ?? "");
    const platform = detectPlatform(url);
    const info = await getVideoInfo(url);

    return NextResponse.json({ platform, ...info });
  } catch (error) {
    const message =
      error instanceof UrlError || error instanceof YtDlpError
        ? error.message
        : "Не удалось получить информацию о видео.";

    const status =
      error instanceof UrlError
        ? 400
        : error instanceof YtDlpError
          ? 422
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
