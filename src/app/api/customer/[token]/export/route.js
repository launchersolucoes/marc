import { createClient } from "../../../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token || "")) {
    return Response.json({ error: "Acesso inválido." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_customer_portal_export", { raw_token: token });
  if (error || !data) {
    return Response.json({ error: "Este acesso não está mais disponível." }, { status: 404 });
  }

  const date = new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="marc-meus-dados-${date}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
