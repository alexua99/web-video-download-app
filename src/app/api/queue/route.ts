import { corsHeaders } from "@/lib/api";
import { queueStatus } from "@/lib/protect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return Response.json(queueStatus(), {
    headers: {
      "Cache-Control": "no-store",
      ...corsHeaders(request),
    },
  });
}
