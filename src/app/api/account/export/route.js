import { getAppContext } from "../../../../lib/app-context";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { supabase, membership, establishment } = await getAppContext({ allowRestricted: true });
  if (membership.role !== "owner") {
    return Response.json({ error: "A exportação completa é restrita ao proprietário." }, { status: 403 });
  }

  const { data, error } = await supabase.rpc("export_current_establishment_data");
  if (error || !data) {
    return Response.json({ error: "Não foi possível preparar a cópia dos dados." }, { status: 500 });
  }

  const date = new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const slug = String(establishment.slug || "estabelecimento").replace(/[^a-z0-9-]/g, "");

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="marc-dados-${slug}-${date}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
