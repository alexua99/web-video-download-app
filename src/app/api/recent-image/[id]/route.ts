import { readFile } from "node:fs/promises";
import { corsHeaders } from "@/lib/api";
import { thumbFile } from "@/lib/recent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const file = thumbFile(id);
  if (!file) {
    return new Response(null, { status: 404, headers: corsHeaders(request) });
  }

  try {
    const bytes = await readFile(file);
    return new Response(bytes, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
        ...corsHeaders(request),
      },
    });
  } catch {
    return new Response(null, { status: 404, headers: corsHeaders(request) });
  }
}
