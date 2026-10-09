import { corsHeaders } from "@/lib/api";
import { listRecentDownloads } from "@/lib/recent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const items = await listRecentDownloads();
  return Response.json(
    { items },
    {
      headers: {
        "Cache-Control": "no-store",
        ...corsHeaders(request),
      },
    },
  );
}
