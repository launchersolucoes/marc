export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
};

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    console.error(JSON.stringify({ event: "marc_healthcheck_failed", reason: "configuration_missing" }));
    return Response.json({ status: "degraded" }, { status: 503, headers: responseHeaders });
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: "GET",
      headers: { apikey: publishableKey },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(JSON.stringify({
        event: "marc_healthcheck_failed",
        reason: "supabase_unavailable",
        upstreamStatus: response.status,
      }));
      return Response.json({ status: "degraded" }, { status: 503, headers: responseHeaders });
    }

    return Response.json({ status: "ok" }, { status: 200, headers: responseHeaders });
  } catch (error) {
    console.error(JSON.stringify({
      event: "marc_healthcheck_failed",
      reason: error?.name === "TimeoutError" ? "timeout" : "network_error",
    }));
    return Response.json({ status: "degraded" }, { status: 503, headers: responseHeaders });
  }
}
